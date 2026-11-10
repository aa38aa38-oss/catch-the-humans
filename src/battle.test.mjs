// 執行：node src/battle.test.mjs
import assert from 'node:assert/strict';
import { createBattle, runTurn, replace, chooseAiAction, active, aliveSlots, gainExp, rollWild } from './battle.js';
import { createCapture, press, update } from './capture.js';
import { ANIMALS, HUMANS, MOVES, GRADES, AREAS, DATA_VERSION } from './data/index.js';
import { ANIMAL_ORDER } from './data/animals.js';
import { createIndividual, toWire, fromWire, defaultMoves, movesLearnedAt, learnableMoves } from './individual.js';
import { MAPS, START, FIRST_RESPAWN } from './data/maps/index.js';
import { synthesize, synthBlock, shipPrice, MAX_BOOST } from './ranch.js';
import { makeFighter } from './battle.js';
import { TILES } from './data/tiles.js';
import { myPresence, checkOpponent, setupBattle, encodeAct, decodeAct, mustChoose, stepActions } from './pvp.js';

// ── 資料完整性（人類增加到 51 隻時，這裡會幫忙抓錯）──
const nos = new Set();
for (const [id, h] of Object.entries(HUMANS)) {
  assert.match(id, /^[A-Z][A-Z0-9_]*$/, `人類 id 格式：${id}`);
  for (const m of h.moves) assert.ok(MOVES[m], `${h.name} 的技能 ${m} 不存在`);
  assert.ok(['FIRE', 'EARTH', 'WIND', 'WATER'].includes(h.element), `${h.name} 的屬性`);
  assert.ok(!nos.has(h.no), `圖鑑編號重複：${h.no}`);
  nos.add(h.no);
  for (const k of ['appear', 'caught', 'escape']) assert.ok(h.lines[k]?.length, `${h.name} 缺少 ${k} 台詞`);
}
for (const [id, m] of Object.entries(MOVES)) assert.ok(Number.isInteger(m.pp) && (m.pp > 0 || id === 'STRUGGLE'), `技能 ${id} 要有 PP`);
for (const sp of [...Object.values(ANIMALS), ...Object.values(HUMANS)]) {
  assert.ok(sp.moves.length >= 1 && sp.moves.length <= 4, `${sp.name} 初始招式 1～4 個`);
  for (const e of sp.learnset ?? []) {
    assert.ok(MOVES[e.move], `${sp.name} 學招表的 ${e.move} 不存在`);
    assert.ok(Number.isInteger(e.level) && e.level >= 2 && e.level <= 50, `${sp.name} 學招等級要在 2～50`);
  }
  for (const m of [...(sp.evolveMoves ?? []), ...(sp.tms ?? [])]) assert.ok(MOVES[m], `${sp.name} 的 ${m} 不存在`);
}
for (const a of Object.values(ANIMALS)) for (const m of a.moves) assert.ok(MOVES[m], `${a.name} 的技能 ${m} 不存在`);
for (const [id, area] of Object.entries(AREAS)) for (const e of area.encounters) assert.ok(HUMANS[e.species], `地區 ${id} 的 ${e.species} 不存在`);
// ── 地圖完整性 ──
const walkable = (m, x, y) => TILES[m.rows[y]?.[x]] && !TILES[m.rows[y][x]].solid && !m.npcs?.some((n) => n.x === x && n.y === y);
for (const [id, m] of Object.entries(MAPS)) {
  const w = m.rows[0].length;
  m.rows.forEach((r, y) => {
    assert.equal(r.length, w, `地圖 ${id} 第 ${y} 列寬度不一致`);
    for (const ch of r) assert.ok(TILES[ch], `地圖 ${id} 有未定義的格子「${ch}」`);
  });
  for (const area of Object.values(m.encounters ?? {})) assert.ok(AREAS[area], `地圖 ${id} 的地區 ${area} 不存在`);
  for (const wp of m.warps ?? []) {
    assert.ok(MAPS[wp.to], `地圖 ${id} 傳送到不存在的地圖 ${wp.to}`);
    assert.ok(walkable(m, wp.x, wp.y), `地圖 ${id} 的傳送點 (${wp.x},${wp.y}) 走不到`);
    assert.ok(walkable(MAPS[wp.to], wp.tx, wp.ty), `地圖 ${id} 傳送到 ${wp.to} (${wp.tx},${wp.ty}) 是牆`);
    assert.ok(!MAPS[wp.to].warps?.some((v) => v.x === wp.tx && v.y === wp.ty), `傳送落點不能又是傳送點（會無限傳送）`);
  }
  for (const n of m.npcs ?? []) assert.ok(TILES[m.rows[n.y][n.x]] && !TILES[m.rows[n.y][n.x]].solid, `地圖 ${id} 的 NPC 站在牆裡`);
}
for (const p of [START, FIRST_RESPAWN]) assert.ok(walkable(MAPS[p.map], p.x, p.y), `起點 / 回復點 ${p.map} (${p.x},${p.y}) 走不到`);
// 每張地圖的每一格可以走的地方，都要能從起點走到（不會有被困住的區域）
{
  const seen = new Set();
  const q = [[START.map, START.x, START.y]];
  while (q.length) {
    const [mid, x, y] = q.pop();
    const key = `${mid},${x},${y}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const m = MAPS[mid];
    const wp = m.warps?.find((v) => v.x === x && v.y === y);
    if (wp) { q.push([wp.to, wp.tx, wp.ty]); continue; }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (walkable(m, x + dx, y + dy)) q.push([mid, x + dx, y + dy]);
  }
  for (const [id, m] of Object.entries(MAPS))
    m.rows.forEach((r, y) => [...r].forEach((_, x) => {
      if (walkable(m, x, y)) assert.ok(seen.has(`${id},${x},${y}`), `地圖 ${id} 的 (${x},${y}) 從起點走不到`);
    }));
}
assert.equal(GRADES.reduce((s, g) => s + g.rate, 0).toFixed(5), '1.00000', '肉質機率總和要是 100%');

const human = (sp, lv = 5, g = 'CHOICE') => createIndividual('human', sp, lv, g);
const animal = (sp, lv = 5) => createIndividual('animal', sp, lv);

// ── 野生戰鬥：隨機打 2000 場，不能當掉、一定分勝負 ──
let turnsTotal = 0;
for (let i = 0; i < 2000; i++) {
  const w = rollWild(Object.values(AREAS)[i % Object.keys(AREAS).length], Math.random, GRADES);
  const st = createBattle({
    mode: 'wild', seed: i,
    teams: [[animal(ANIMAL_ORDER[i % 4]), human('FIREFIGHTER', 4)], [human(w.species, w.level, w.gradeId)]],
  });
  let turns = 0;
  while (st.winner === null && turns < 100) {
    const ev = runTurn(st, [{ type: 'move', index: turns % 4 === 3 ? 1 : 0 }, chooseAiAction(st, 1)]);
    assert.ok(ev.every((e) => e.t !== 'text' || !/\{\w+\}/.test(e.text)), '文字裡不能有沒填的 {變數}');
    if (st.need.length) replace(st, [aliveSlots(st, 0)[0], null]);
    turns++;
  }
  assert.ok(st.winner !== null, '戰鬥 100 回合內要結束');
  turnsTotal += turns;
}
console.log(`野生戰鬥平均 ${(turnsTotal / 2000).toFixed(1)} 回合`);

// ── 換人 ──
{
  const st = createBattle({ mode: 'wild', seed: 1, teams: [[animal('COW'), human('ACE')], [human('THING')]] });
  const ev = runTurn(st, [{ type: 'switch', slot: 1 }, { type: 'move', index: 0 }]);
  assert.equal(ev[0].t, 'switch');
  assert.equal(active(st, 0).species, 'ACE');
  // 不合法的換人（換成自己）會被改成出招
  const ev2 = runTurn(st, [{ type: 'switch', slot: 1 }, { type: 'move', index: 0 }]);
  assert.ok(!ev2.some((e) => e.t === 'switch'));
}

// ── 可重現：同種子、同選擇 → 完全相同 ──
const playOut = (seed) => {
  const st = createBattle({ mode: 'pvp', seed, level: 50, teams: [[animal('PIG'), human('ACE'), human('IRON_FAN')], [animal('SHEEP'), human('THING')]] });
  const log = [];
  for (let t = 0; t < 200 && st.winner === null; t++) {
    log.push(...runTurn(st, [{ type: 'move', index: t % 2 }, { type: 'move', index: 0 }]));
    if (st.need.length) log.push(...replace(st, [aliveSlots(st, 0)[0], aliveSlots(st, 1)[0]]));
  }
  return JSON.stringify({ log, rng: st.rng, hp: st.sides.map((s) => s.team.map((f) => f.hp)) }); // 個體編號每次不同，不比
};
assert.equal(playOut(42), playOut(42), '同一顆種子要算出一樣的結果');
assert.notEqual(playOut(42), playOut(43), '不同種子要有不同結果');

// ── 連線 PK：模擬兩支手機各自計算 ──
{
  const teamA = [animal('CHICKEN', 9), human('ACE', 3, 'A5'), human('FIREFIGHTER', 12)];
  const teamB = [animal('COW', 30), human('THING', 7, 'PRIME'), human('IRON_FAN', 5)];
  const pa = myPresence({ nonce: 'aaa111', team: teamA });
  const pb = myPresence({ nonce: 'zzz999', team: teamB });
  assert.equal(pa.v, DATA_VERSION);
  assert.ok(checkOpponent(pb).ok && checkOpponent(pa).ok);
  assert.equal(checkOpponent({ ...pb, v: 'old' }).reason, 'version');
  assert.equal(checkOpponent({ ...pb, team: [toWire(teamB[1])] }).reason, 'team', '隊伍第一隻一定要是家畜');
  assert.equal(checkOpponent({ ...pb, team: [{ k: 'h', s: 'NOPE' }] }).reason, 'team');
  assert.ok(JSON.stringify(myPresence({ nonce: 'x'.repeat(10), team: teamA, acts: Array(150).fill('m1') })).length < 4096, '狀態要小於 4KB');

  const A = setupBattle(pa, pb);
  const B = setupBattle(pb, pa);
  assert.equal(A.mySide, 0);
  assert.equal(B.mySide, 1);
  assert.ok(A.state.sides.every((s) => s.team.every((f) => f.level === 50)), 'PK 統一 Lv.50');

  // 每一步：需要選的一方隨機選，另一方傳 n；雙方各自套用
  const acts = [[], []];
  const logs = [[], []];
  for (let k = 0; k < 400 && A.state.winner === null; k++) {
    for (const s of [0, 1]) {
      let a = null;
      if (mustChoose(A.state, s)) {
        if (A.state.need.length) a = { type: 'switch', slot: aliveSlots(A.state, s).at(-1) };
        else a = Math.random() < 0.15 ? { type: 'switch', slot: Math.floor(Math.random() * 3) } : { type: 'move', index: Math.floor(Math.random() * 2) };
      }
      acts[s].push(encodeAct(a));
    }
    for (const [i, side] of [A, B].entries()) {
      const raw = [acts[0][k], acts[1][k]];
      const step = stepActions(side.state, raw);
      logs[i].push(...(side.state.need.length ? replace(side.state, step) : runTurn(side.state, step)));
    }
  }
  assert.ok(A.state.winner !== null, 'PK 要能打完');
  assert.equal(JSON.stringify(A.state), JSON.stringify(B.state), '兩支手機的戰況要完全一致');
  assert.equal(JSON.stringify(logs[0]), JSON.stringify(logs[1]));
  assert.deepEqual(decodeAct(encodeAct({ type: 'switch', slot: 3 })), { type: 'switch', slot: 3 });
  console.log(`PK 模擬：${acts[0].length} 步打完，雙方戰況一致`);
}

// ── PP：用一次少一次，用完會改用別招，全用完就垂死掙扎 ──
{
  const pigInd = { ...animal('PIG', 50), moves: ['BODY_SLAM', 'MUD_BATH'] };
  const thingInd = { ...human('THING', 50), moves: ['ROCK_PUNCH', 'STONE_BODY'] };
  const st = createBattle({ mode: 'wild', seed: 7, teams: [[pigInd], [thingInd]] });
  const pig = active(st, 0);
  runTurn(st, [{ type: 'move', index: 1 }, { type: 'move', index: 1 }]);
  assert.equal(pig.pp[1], 9, '滾泥巴 PP 10 → 9');
  pig.pp = [0, 3];
  const ev = runTurn(st, [{ type: 'move', index: 0 }, { type: 'move', index: 1 }]);
  assert.equal(pig.pp[1], 2, 'PP 用完的招式會改用還有 PP 的招式');
  assert.ok(ev.some((e) => e.t === 'text' && e.text.includes('滾泥巴')));
  pig.pp = [0, 0];
  const hp0 = pig.hp;
  const ev2 = runTurn(st, [{ type: 'move', index: 0 }, { type: 'move', index: 1 }]);
  assert.ok(ev2.some((e) => e.t === 'text' && e.text.includes('垂死掙扎')), '全用完要垂死掙扎');
  assert.ok(pig.hp < hp0, '垂死掙扎有反作用力');
  assert.deepEqual(decodeAct(encodeAct({ type: 'move', index: -1 })), { type: 'move', index: -1 });
}

// ── 新招式效果 ──
{
  const mk = (sp, moves, lv = 30, kind = 'animal') => ({ ...createIndividual(kind, sp, lv), moves });
  // 先制：慢的一方用「先有雞」也會先出手
  let st = createBattle({ mode: 'wild', seed: 3, teams: [[mk('CHICKEN', ['CHICKEN_FIRST'])], [mk('ACE', ['FIRE_FIST'], 90, 'human')]] });
  let ev = runTurn(st, [{ type: 'move', index: 0 }, { type: 'move', index: 0 }]);
  assert.ok(ev.find((e) => e.t === 'text').text.includes('先有雞'), '先制招先出手');
  // 吸血
  st = createBattle({ mode: 'wild', seed: 3, teams: [[mk('COW', ['REVERSE_MILKING'])], [mk('THING', ['STONE_BODY'], 30, 'human')]] });
  active(st, 0).hp = 10;
  ev = runTurn(st, [{ type: 'move', index: 0 }, { type: 'move', index: 0 }]);
  assert.ok(active(st, 0).hp > 10 && ev.some((e) => e.t === 'text' && e.text.includes('吸收')), '反向擠奶會回血');
  // 吃飽就睡：回滿、睡兩回合
  st = createBattle({ mode: 'wild', seed: 3, teams: [[mk('PIG', ['EAT_AND_SLEEP'])], [mk('THING', ['STONE_BODY'], 30, 'human')]] });
  active(st, 0).hp = 5;
  runTurn(st, [{ type: 'move', index: 0 }, { type: 'move', index: 0 }]);
  assert.equal(active(st, 0).hp, active(st, 0).stats.hp);
  assert.equal(active(st, 0).status, 'sleep');
  // 必中：命中降到最低也打得到
  st = createBattle({ mode: 'wild', seed: 3, teams: [[mk('SHEEP', ['SCAPEGOAT'])], [mk('THING', ['STONE_BODY'], 30, 'human')]] });
  active(st, 0).stages.acc = -6;
  for (let i = 0; i < 5; i++) assert.ok(!runTurn(st, [{ type: 'move', index: 0 }, { type: 'move', index: 0 }]).some((e) => e.text === '但是沒有打中！'));
  // 飛沙走石最多降 2 次
  st = createBattle({ mode: 'wild', seed: 3, teams: [[mk('PIG', ['MUD_BATH'], 50)], [mk('IRON_FAN', ['SANDSTORM'], 50, 'human')]] });
  for (let i = 0; i < 12; i++) runTurn(st, [{ type: 'move', index: 0 }, { type: 'move', index: 0 }]);
  assert.equal(active(st, 0).stages.acc, -2, '飛沙走石最多降 2 次');
}

// ── 牧場：合成強化、出貨 ──
{
  const main = human('FIREFIGHTER', 10, 'CHOICE');
  const before = makeFighter(main, 0, 0).stats.atk;
  assert.ok(synthBlock(main, [human('ACE'), human('FIREFIGHTER')]), '材料要同種');
  assert.ok(synthBlock(main, [human('FIREFIGHTER')]), '材料不夠');
  assert.equal(synthesize(main, [human('FIREFIGHTER'), human('FIREFIGHTER')]).gradeUp, true);
  assert.equal(main.gradeId, 'PRIME', '冷凍肉 → 溫體牛');
  assert.equal(main.boost, 1);
  assert.ok(makeFighter(main, 0, 0).stats.atk > before, '能力變強');
  assert.equal(makeFighter(main, 0, 0).name, '消防隊員+1');
  synthesize(main, [human('FIREFIGHTER'), human('FIREFIGHTER')]);
  assert.equal(main.gradeId, 'A5');
  assert.equal(synthesize(main, [human('FIREFIGHTER'), human('FIREFIGHTER')]).gradeUp, false, 'A5 不再升');
  main.boost = MAX_BOOST;
  assert.ok(synthBlock(main, [human('FIREFIGHTER'), human('FIREFIGHTER')]), '強化有上限');
  assert.ok(shipPrice(human('ACE', 10, 'A5')) > shipPrice(human('ACE', 10, 'CHOICE')), 'A5 比較貴');
  // 連線時強化次數也會傳過去
  const w = toWire(main);
  assert.equal(fromWire(w, 50).boost, MAX_BOOST);
  assert.equal(fromWire({ ...w, b: 99 }, 50).boost, 0, '不合理的強化次數當作 0');
}

// ── 升級、等級上限 ──
{
  const cow = animal('COW');
  assert.deepEqual(gainExp(cow, 40), [6]);
  const old = animal('COW', 49);
  assert.deepEqual(gainExp(old, 100000), [50], '最高 Lv.50');
  assert.deepEqual(gainExp(old, 100000), []);
  assert.equal(old.exp, 0);
}

// ── 學招（用測試用的學招表）──
{
  const ace = HUMANS.ACE;
  const saved = ace.learnset;
  ace.learnset = [{ level: 8, move: 'WATER_JET' }, { level: 10, move: 'PALM_FAN' }, { level: 12, move: 'ROCK_PUNCH' }];
  assert.deepEqual(movesLearnedAt('human', 'ACE', 10), ['PALM_FAN']);
  assert.deepEqual(defaultMoves('human', 'ACE', 5), ['FIRE_FIST', 'FLAME_RING']);
  assert.deepEqual(defaultMoves('human', 'ACE', 12), ['FLAME_RING', 'WATER_JET', 'PALM_FAN', 'ROCK_PUNCH'], '超過 4 招只留最後學的 4 招');
  assert.ok(learnableMoves('human', 'ACE').has('ROCK_PUNCH'));
  const w = toWire(createIndividual('human', 'ACE', 12));
  assert.ok(fromWire(w, 50), '合法招式可以傳');
  assert.equal(fromWire({ ...w, m: ['LULLABY'] }, 50), null, '學不會的招式不能傳（防作弊）');
  assert.equal(fromWire({ ...w, m: ['FIRE_FIST', 'FIRE_FIST', 'FIRE_FIST', 'FIRE_FIST', 'FIRE_FIST'] }, 50), null, '最多 4 招');
  ace.learnset = saved;
}

// ── 收服：每秒按 7 下 A，看不同血量的成功率 ──
const rateAt = (hpRatio, asleep = false) => {
  let ok = 0;
  for (let i = 0; i < 500; i++) {
    const c = createCapture({ hpRatio, asleep, strength: 1, gradeStruggle: 1 });
    let t = 0;
    while (!c.result) {
      update(c, 1 / 60);
      t += 1 / 60;
      if (Math.floor(t * 7) !== Math.floor((t - 1 / 60) * 7)) press(c);
    }
    if (c.result === 'caught') ok++;
  }
  return ok / 500;
};
const table = [1, 0.6, 0.4, 0.25, 0.1].map((r) => [r, rateAt(r), rateAt(r, true)]);
for (const [r, a, s] of table) console.log(`血量 ${r * 100}%：收服率 ${(a * 100).toFixed(0)}%（睡著 ${(s * 100).toFixed(0)}%）`);
assert.ok(table[0][1] < 0.05, '滿血幾乎抓不到');
assert.ok(table[4][1] > 0.9, '剩 10% 血幾乎一定抓到');
console.log('戰鬥、連線與收服測試全部通過 ✔');
