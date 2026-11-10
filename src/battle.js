// 戰鬥規則（純邏輯，不碰畫面、不碰網路）。
//
// 設計重點（為了連線 PK）：
// 1. 沒有「玩家」和「電腦」之分，只有 0 號方和 1 號方。電腦 AI 只是其中一種出招來源。
// 2. 所有隨機數都從 state.rng 來，同一顆種子＋同樣的選擇 ＝ 完全相同的結果。
// 3. state 是純資料（可以 JSON 存起來），不含函式。
//
// 一回合的流程：雙方各交一個「行動」→ runTurn → 得到一串「事件」交給畫面播放。
// 有人倒下且還有隊友時，state.need 會列出要補人的那一方 → replace。
import { getMultiplier } from './elements.js';
import { MOVES, speciesOf, gradeOf } from './data/index.js';
import { TEXT } from './data/text.js';
import { nextRandom } from './rng.js';

export const fill = (s, vars) => s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
export const pick = (arr, rnd = Math.random) => arr[Math.floor(rnd() * arr.length)];

/** 角色名字標記：⟦方⟧名字。畫面依觀看者換成「野生的」「對手的」或不加。 */
export const tag = (f) => `⟦${f.side}⟧${f.name}`;

/** 依種族值、等級、肉質加成算出能力值 */
export function calcStats(base, level, bonus = 1) {
  const other = (b) => Math.floor(((b * 2 * level) / 100 + 5) * bonus);
  return {
    hp: Math.floor(((base.hp * 2 * level) / 100 + level + 10) * bonus),
    atk: other(base.atk),
    def: other(base.def),
    spd: other(base.spd),
  };
}

/** 從個體做出一個上場用的戰鬥角色。levelOverride：PK 統一等級用 */
export function makeFighter(ind, side, slot, levelOverride) {
  const sp = speciesOf(ind.kind, ind.species);
  const grade = gradeOf(ind.gradeId);
  const level = levelOverride ?? ind.level;
  const moves = ind.moves?.length ? ind.moves : sp.moves;
  const stats = calcStats(sp.base, level, ind.kind === 'animal' ? 1 : grade.statBonus);
  return {
    uid: ind.uid, kind: ind.kind, species: ind.species, name: sp.name, gradeId: grade.id,
    element: ind.kind === 'animal' ? null : sp.element,
    moves: [...moves], pp: moves.map((id) => MOVES[id].pp), level, stats, hp: stats.hp,
    stages: { atk: 0, def: 0, acc: 0 }, status: null, sleepTurns: 0, healsUsed: 0,
    side, slot,
  };
}

/**
 * 建立一場戰鬥。
 * @param mode 'wild' 野生 / 'pvp' 連線
 * @param seed 32 位元整數種子
 * @param teams [[個體...], [個體...]]，每隊第一個先上場
 */
export function createBattle({ mode, seed, teams, level }) {
  return {
    mode,
    rng: seed >>> 0,
    turn: 0,
    sides: teams.map((team, s) => ({ team: team.map((ind, i) => makeFighter(ind, s, i, level)), active: 0 })),
    need: [],
    winner: null, // 0 / 1 / -1（平手）
  };
}

export const active = (state, s) => state.sides[s].team[state.sides[s].active];
export const aliveSlots = (state, s) => state.sides[s].team.flatMap((f, i) => (f.hp > 0 ? [i] : []));
const rnd = (state) => () => nextRandom(state);

/** 招式都用完時用的特殊編號：垂死掙扎 */
export const STRUGGLE = -1;
export const hasPp = (f) => f.pp.some((p) => p > 0);
const firstUsable = (f) => {
  const i = f.pp.findIndex((p) => p > 0);
  return i < 0 ? STRUGGLE : i;
};

const stageMult = (s) => (s >= 0 ? (2 + s) / 2 : 2 / (2 - s));
const accMult = (s) => (s >= 0 ? (3 + s) / 3 : 3 / (3 - s));

export function damageOf(user, target, move, r) {
  const atk = user.stats.atk * stageMult(user.stages.atk);
  const def = target.stats.def * stageMult(target.stages.def);
  const mult = getMultiplier(move.element, target.element);
  const raw = Math.floor((((2 * user.level) / 5 + 2) * move.power * atk) / def / 50) + 2;
  const dmg = Math.max(1, Math.floor(raw * mult * (0.85 + r() * 0.15)));
  return { dmg, mult };
}

/** 電腦的行動選擇（野生人類用） */
export function chooseAiAction(state, s) {
  const me = active(state, s);
  const foe = active(state, 1 - s);
  const r = rnd(state);
  if (!hasPp(me)) return { type: 'move', index: STRUGGLE };
  const options = me.moves.map((id, index) => {
    const m = MOVES[id];
    const e = m.effect;
    let w = 1;
    if (m.kind === 'attack') w = 2 + (e?.status === 'burn' && foe.status ? -1 : 0);
    if (e?.heal) w = me.hp < me.stats.hp * 0.5 && me.healsUsed < 3 ? 3 : 0; // 每場最多回血 3 次
    if (e?.stat && e.target === 'self') w = me.stages[e.stat] >= 2 ? 0 : 0.8;
    if (me.pp[index] <= 0) w = 0;
    return { index, w };
  });
  const total = options.reduce((sum, o) => sum + o.w, 0);
  let x = r() * total;
  for (const o of options) {
    if (x < o.w) return { type: 'move', index: o.index };
    x -= o.w;
  }
  return { type: 'move', index: firstUsable(me) };
}

function applyEffect(e, user, target, events, r, moveText, vars) {
  const who = e.target === 'self' ? user : target;
  const v = { ...vars, target: tag(who) };
  if (e.heal) {
    if (user.hp >= user.stats.hp) {
      events.push({ t: 'text', text: fill(TEXT.healFull, v) });
      return;
    }
    if (moveText) events.push({ t: 'text', text: fill(moveText, v) });
    user.healsUsed++;
    user.hp = Math.min(user.stats.hp, user.hp + Math.ceil(user.stats.hp * e.heal));
    events.push({ t: 'hp', side: user.side, hp: user.hp });
    events.push({ t: 'text', text: fill(TEXT.heal, v) });
    if (e.rest) {
      // 睡覺回血：異常狀態換成睡著，固定睡 e.rest 回合
      user.status = 'sleep';
      user.sleepTurns = e.rest;
      events.push({ t: 'text', text: fill(TEXT.restSleep, v) });
      events.push({ t: 'status', side: user.side });
    }
    return;
  }
  if (e.stat) {
    const cur = who.stages[e.stat];
    const cap = e.limit ?? 6; // limit：這招最多只能把能力變化疊到幾段
    const next = Math.max(Math.min(cur, -cap), Math.min(Math.max(cur, cap), cur + e.stages));
    if (next === cur) {
      events.push({ t: 'text', text: fill(TEXT.statMax, v) });
      return;
    }
    who.stages[e.stat] = next;
    if (moveText) events.push({ t: 'text', text: fill(moveText, v) });
    events.push({ t: 'text', text: fill(e.stages > 0 ? TEXT.statUp[e.stat] : TEXT.statDown[e.stat], v) });
    return;
  }
  if (e.status) {
    if (who.status) {
      if (who.status === 'sleep' && e.status === 'sleep') events.push({ t: 'text', text: fill(TEXT.alreadyAsleep, v) });
      return;
    }
    who.status = e.status;
    if (e.status === 'sleep') who.sleepTurns = 1 + Math.floor(r() * 3);
    if (moveText) events.push({ t: 'text', text: fill(moveText, v) });
    events.push({ t: 'text', text: fill(pick(TEXT[e.status], r), v) });
    events.push({ t: 'status', side: who.side });
  }
}

/** 一個角色使用一個技能 */
function useMove(state, user, target, moveIndex, events) {
  const r = rnd(state);
  const struggle = moveIndex === STRUGGLE || !(user.pp[moveIndex] > 0);
  const move = MOVES[struggle ? 'STRUGGLE' : user.moves[moveIndex]];
  const vars = { user: tag(user), foe: tag(target) };

  if (user.status === 'sleep') {
    if (user.sleepTurns > 0) {
      user.sleepTurns--;
      events.push({ t: 'text', text: fill(TEXT.asleep, vars) });
      return;
    }
    user.status = null;
    events.push({ t: 'text', text: fill(TEXT.wakeUp, vars) });
    events.push({ t: 'status', side: user.side });
  }

  if (struggle) events.push({ t: 'text', text: fill(move.text, vars) });
  else user.pp[moveIndex]--;
  events.push({ t: 'text', text: fill(TEXT.useMove, { ...vars, move: move.name }) });
  events.push({ t: 'lunge', side: user.side });

  const selfOnly = move.kind === 'status' && move.effect?.target !== 'foe';
  if (!selfOnly && move.accuracy !== null) {
    const hitChance = (move.accuracy / 100) * accMult(user.stages.acc);
    if (r() >= hitChance) {
      events.push({ t: 'text', text: TEXT.miss });
      return;
    }
  }

  if (move.kind === 'status') {
    applyEffect(move.effect, user, target, events, r, move.text, vars);
    return;
  }

  const [lo, hi] = move.hits ?? [1, 1];
  const n = lo + Math.floor(r() * (hi - lo + 1));
  let landed = 0;
  let mult = 1;
  let dealt = 0;
  for (let i = 0; i < n && target.hp > 0; i++) {
    const d = damageOf(user, target, move, r);
    mult = d.mult;
    dealt += Math.min(target.hp, d.dmg);
    target.hp = Math.max(0, target.hp - d.dmg);
    landed++;
    events.push({ t: 'hit', side: target.side, hp: target.hp, mult });
  }
  if (mult > 1) events.push({ t: 'text', text: TEXT.superEffective });
  if (mult < 1) events.push({ t: 'text', text: TEXT.notEffective });
  if (n > 1) events.push({ t: 'text', text: fill(TEXT.hits, { n: landed }) });
  if (move.drain && dealt && user.hp < user.stats.hp) {
    user.hp = Math.min(user.stats.hp, user.hp + Math.max(1, Math.ceil(dealt * move.drain)));
    events.push({ t: 'hp', side: user.side, hp: user.hp });
    events.push({ t: 'text', text: fill(TEXT.drain, vars) });
  }
  if (move.recoil && landed) {
    user.hp = Math.max(0, user.hp - Math.max(1, Math.floor(user.stats.hp * move.recoil)));
    events.push({ t: 'hit', side: user.side, hp: user.hp, mult: 1 });
    events.push({ t: 'text', text: fill(TEXT.recoil, vars) });
  }

  if (move.effect && (move.effect.target === 'self' || target.hp > 0) && user.hp > 0 && r() < (move.effect.chance ?? 1)) {
    applyEffect(move.effect, user, target, events, r, move.text, vars);
  }
}

/** 換人：能力變化清除，異常狀態保留（跟寶可夢一樣） */
function doSwitch(state, s, slot, events) {
  const side = state.sides[s];
  const out = side.team[side.active];
  out.stages = { atk: 0, def: 0, acc: 0 };
  side.active = slot;
  events.push({ t: 'switch', side: s, slot, from: out.slot });
}

const validSwitch = (state, s, slot) =>
  Number.isInteger(slot) && slot !== state.sides[s].active && state.sides[s].team[slot]?.hp > 0;

/** 對手傳來的行動一律檢查，不合法就改成用第一招 */
export function sanitize(state, s, a) {
  if (a?.type === 'switch' && validSwitch(state, s, a.slot)) return a;
  if (a?.type === 'forfeit') return a;
  const f = active(state, s);
  if (a?.type === 'move' && Number.isInteger(a.index) && f.pp[a.index] > 0) return a;
  return { type: 'move', index: firstUsable(f) }; // 用完的招式、不存在的招式 → 第一個還能用的，全用完就垂死掙扎
}

function checkFaints(state, events) {
  for (const s of [0, 1]) {
    const f = active(state, s);
    if (f.hp <= 0 && !f.fainted) {
      f.fainted = true;
      events.push({ t: 'faint', side: s });
    }
  }
  const out = [0, 1].map((s) => aliveSlots(state, s).length === 0);
  if (out[0] && out[1]) state.winner = -1;
  else if (out[0]) state.winner = 1;
  else if (out[1]) state.winner = 0;
  else state.need = [0, 1].filter((s) => active(state, s).hp <= 0);
}

/**
 * 跑一個回合。actions = [0 號方的行動, 1 號方的行動]
 * 行動：{type:'move', index} 用第幾招 / {type:'switch', slot} 換成隊伍第幾隻 / {type:'forfeit'} 投降
 * 回傳事件陣列；結果看 state.winner 與 state.need
 */
export function runTurn(state, actions) {
  const events = [];
  if (state.winner !== null || state.need.length) return events;
  const acts = actions.map((a, s) => sanitize(state, s, a));
  state.turn++;

  const quit = [0, 1].filter((s) => acts[s].type === 'forfeit');
  if (quit.length) {
    state.winner = quit.length === 2 ? -1 : 1 - quit[0];
    events.push({ t: 'forfeit', side: quit[0] });
    return events;
  }

  // 1. 換人優先
  for (const s of [0, 1]) if (acts[s].type === 'switch') doSwitch(state, s, acts[s].slot, events);

  // 2. 先比招式的先制度（priority），再比速度（同速隨機）
  const r = rnd(state);
  const [a, b] = [active(state, 0), active(state, 1)];
  const prio = (s) => {
    const f = active(state, s);
    const i = acts[s].index;
    return acts[s].type === 'move' && f.pp[i] > 0 ? MOVES[f.moves[i]].priority ?? 0 : 0;
  };
  const [pa, pb] = [prio(0), prio(1)];
  const first = pa !== pb ? (pa > pb ? 0 : 1)
    : a.stats.spd > b.stats.spd ? 0 : a.stats.spd < b.stats.spd ? 1 : r() < 0.5 ? 0 : 1;
  for (const s of [first, 1 - first]) {
    if (acts[s].type !== 'move') continue;
    const user = active(state, s);
    const target = active(state, 1 - s);
    if (user.hp <= 0 || target.hp <= 0) continue;
    useMove(state, user, target, acts[s].index, events);
  }

  // 3. 回合結束：燒傷
  for (const s of [0, 1]) {
    const f = active(state, s);
    if (f.status !== 'burn' || f.hp <= 0) continue;
    f.hp = Math.max(0, f.hp - Math.max(1, Math.floor(f.stats.hp / 12)));
    events.push({ t: 'text', text: fill(TEXT.burnTick, { user: tag(f) }) });
    events.push({ t: 'hit', side: s, hp: f.hp, mult: 1 });
  }

  checkFaints(state, events);
  return events;
}

/** 倒下後補人。choices[s] = 要派出的隊伍位置（不需要補人的一方給 null） */
export function replace(state, choices) {
  const events = [];
  for (const s of state.need) {
    const slot = validSwitch(state, s, choices[s]) ? choices[s] : aliveSlots(state, s)[0];
    doSwitch(state, s, slot, events);
  }
  state.need = [];
  return events;
}

// ── 經驗值（只有野生戰鬥用）──
export const expToNext = (level) => level * 8;
export const expReward = (fighter) => fighter.level * 6;

export const LEVEL_CAP = 50;

/** 個體加經驗值，回傳升到的等級清單。到 Lv.50 就不再升級 */
export function gainExp(ind, amount) {
  const ups = [];
  if (ind.level >= LEVEL_CAP) return ups;
  ind.exp += amount;
  while (ind.level < LEVEL_CAP && ind.exp >= expToNext(ind.level)) {
    ind.exp -= expToNext(ind.level);
    ind.level++;
    ups.push(ind.level);
  }
  if (ind.level >= LEVEL_CAP) ind.exp = 0;
  return ups;
}

/** 依地區的出現表，隨機產生一隻野生人類個體（遇敵不需要可重現，用 Math.random） */
export function rollWild(area, rand = Math.random, grades) {
  const total = area.encounters.reduce((sum, e) => sum + e.weight, 0);
  let x = rand() * total;
  let enc = area.encounters[0];
  for (const e of area.encounters) {
    if (x < e.weight) { enc = e; break; }
    x -= e.weight;
  }
  const [lo, hi] = enc.levels;
  const level = lo + Math.floor(rand() * (hi - lo + 1));
  let g = rand();
  let gradeId = grades[0].id;
  for (const gr of grades) {
    if (g < gr.rate) { gradeId = gr.id; break; }
    g -= gr.rate;
  }
  return { species: enc.species, level, gradeId };
}
