// 遊戲流程：標題、選家畜、養殖場、隊伍、野生戰鬥、連線 PK。
// 規則在 battle.js / capture.js / pvp.js，資料在 data/，畫面工具在 ui.js。
import {
  createBattle, runTurn, replace, chooseAiAction, active, aliveSlots, gainExp, expReward, expToNext, calcStats,
  fill, pick, tag, rollWild, hasPp, STRUGGLE, makeFighter,
} from './battle.js';
import { createCapture, press, update, quickChance, QUICK_AFTER } from './capture.js';
import { ANIMALS, HUMANS, GRADES, MOVES, AREAS, gradeOf, DATA_VERSION } from './data/index.js';
import { ANIMAL_ORDER } from './data/animals.js';
import { GENERIC_CAUGHT } from './data/humans.js';
import { TEXT } from './data/text.js';
import { ELEMENT_NAMES } from './elements.js';
import { createIndividual, nameOf, movesLearnedAt, MOVE_SLOTS } from './individual.js';
import { canConnect, openRoom } from './net.js';
import { myPresence, checkOpponent, setupBattle, encodeAct, mustChoose, stepActions } from './pvp.js';
import { randomId } from './rng.js';
import { exportCode, importCode, SAVE_LOCK } from './save.js';
import { setTeamOrder } from './save.js';
import { G, save, load, hasSave, newGame, teamInds, findHuman, findInd, healAll, TEAM_HUMANS } from './save.js';
import { explore, drawWorld, placeAt } from './overworld.js';
import { synthesize, shipPrice, SYNTH_MATERIALS, MAX_BOOST } from './ranch.js';
import { ITEMS, SHOP } from './data/items.js';
import { itemCount, addItem } from './save.js';
import { SIZE, loadArt, ART } from './sprites.js';
import {
  W, H, ctx, C, ELEMENT_COL, GRADE_COL, BIG, FONT, UI, TEXT_X, sleep, ease, tween, loadFont, sfx, waiters, waitKey,
  waitUntil, say, show, clearText, menu, box, text, chip, sprite, hpBar, drawText, drawMenu, ball, TEXT_SPEEDS, getTextSpeed, setTextSpeed,
  panel, copyText,
} from './ui.js';

const pad3 = (n) => String(n).padStart(3, '0');

// ───────── 場景狀態 ─────────
let scene = 'boot';
let B = null; // 戰鬥畫面狀態
let SEL = 0; // 選家畜的游標
let CARD = null; // 圖鑑卡
let LOBBY = null; // 連線大廳
const fx = { flash: 0, stripes: 0, stars: [] };

// 戰鬥畫面：自己這方在下面，對方在上面
const POS = {
  top: { x: 260, y: 2, clip: 112 },
  bottom: { x: 16, y: 80, clip: 192 },
};
const posOf = (s) => (s === B.me ? 'bottom' : 'top');

/** 把 ⟦方⟧名字 換成觀看者看到的稱呼 */
function L(str) {
  return str.replace(/⟦(\d)⟧/g, (m, s) => (Number(s) === B.me ? '' : B.st.mode === 'wild' ? '野生的' : '對手的'));
}

function drawFighter(s, now) {
  const v = B.view[s];
  const f = active(B.st, s);
  if (!v.vis) return;
  const p = POS[posOf(s)];
  const wobble = s !== B.me && B.cap && !B.cap.result ? Math.sin(now / 35) * 3 * B.cap.wave * (0.4 + B.cap.struggle) : 0;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, W, p.clip);
  ctx.clip();
  const sc = v.scale ?? 1;
  const sz = SIZE * 4 * sc;
  const cx = p.x + 56 + v.x + wobble, cy = p.y + 56;
  const flip = posOf(s) === 'top' && f.kind === 'animal';
  if (!v.blink || Math.floor(now / 70) % 2) sprite(f.species, cx - sz / 2, cy - sz / 2 + v.drop * 112, 4 * sc, { flip });
  ctx.restore();
}

function drawInfo(s, now) {
  const f = active(B.st, s);
  const v = B.view[s];
  if (!v.info) return;
  const statusChip = (x, y) => f.status && chip(f.status === 'sleep' ? '睡' : '燒', x, y, f.status === 'sleep' ? '#7a70b0' : '#d05030');
  if (posOf(s) === 'top') {
    box(6, 8, 178, 76);
    text(f.name, 20, 20);
    ctx.font = FONT;
    if (f.element) chip(ELEMENT_NAMES[f.element], 22 + ctx.measureText(f.name).width, 19, ELEMENT_COL[f.element]);
    text(`Lv.${f.level}`, 20, 42);
    if (f.kind === 'human') {
      const g = gradeOf(f.gradeId);
      text(g.name, 76, 42, GRADE_COL[g.id]);
      if (g.id === 'A5' && Math.floor(now / 300) % 2) {
        ctx.fillStyle = '#f8d040';
        ctx.fillRect(164, 40, 3, 9); ctx.fillRect(161, 43, 9, 3);
      }
    }
    statusChip(150, 42);
    hpBar(22, 66, 148, v.hp, f.stats.hp);
  } else {
    box(210, 108, 168, 82);
    text(f.name, 224, 120);
    text(`Lv.${f.level}`, 362, 120, C.ink, FONT, 'right');
    ctx.font = FONT;
    if (f.element) chip(ELEMENT_NAMES[f.element], 226 + ctx.measureText(f.name).width, 119, ELEMENT_COL[f.element]);
    else statusChip(250, 120);
    hpBar(224, 144, 138, v.hp, f.stats.hp);
    text(`${Math.ceil(v.hp)}/${f.stats.hp}`, 362, 152, C.ink, FONT, 'right');
    const ind = B.st.mode === 'wild' && (f.uid === G.animal.uid ? G.animal : findHuman(f.uid));
    if (ind) {
      ctx.fillStyle = C.line;
      ctx.fillRect(224, 174, 138, 3);
      ctx.fillStyle = C.exp;
      ctx.fillRect(224, 174, Math.round((138 * ind.exp) / expToNext(ind.level)), 3);
    }
  }
}

function drawBattle(now) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = C.grass;
  ctx.beginPath(); ctx.ellipse(316, 110, 62, 12, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(72, 186, 70, 12, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = C.grassDk;
  for (const [x, y] of [[278, 106], [340, 112], [304, 116], [40, 182], [96, 190], [70, 180]]) ctx.fillRect(x, y, 6, 2);

  ctx.save();
  ctx.translate(B.shake ? Math.round(Math.sin(now / 20) * B.shake) : 0, 0);
  const foe = 1 - B.me;
  drawFighter(foe, now);
  if (B.ball) {
    const k = B.ball;
    if (k.mode === 'burst') {
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        const d = k.r + k.t * 50;
        ctx.globalAlpha = 1 - k.t;
        ctx.fillStyle = i % 2 ? C.ball : C.ballHi;
        ctx.fillRect(k.x + Math.cos(a) * d - 4, k.y + Math.sin(a) * d - 4, 8, 8);
        ctx.globalAlpha = 1;
      }
    } else {
      const capping = B.cap && !B.cap.result;
      const wobble = capping ? Math.sin(now / 35) * 3 * B.cap.wave * (0.4 + B.cap.struggle) : 0;
      const squash = capping ? 0.07 * Math.sin(now / 45) * B.cap.wave + 0.06 * (B.squeeze ?? 0) : k.squash ?? 0;
      ball(k.x + (k.mode === 'wrap' ? wobble : 0), k.y, k.r, { alpha: k.mode === 'wrap' ? 0.42 : 1, squash });
    }
  }
  for (const s of fx.stars) {
    ctx.fillStyle = '#f8c838';
    ctx.fillRect(s.x - 2, s.y - 6, 4, 12);
    ctx.fillRect(s.x - 6, s.y - 2, 12, 4);
  }
  drawFighter(B.me, now);
  ctx.restore();
  drawInfo(foe, now);
  drawInfo(B.me, now);
  // 隊伍剩幾隻（小圓點）
  for (const s of [0, 1]) {
    const team = B.st.sides[s].team;
    const top = posOf(s) === 'top';
    team.forEach((f, i) => {
      ctx.fillStyle = f.hp > 0 ? C.ball : C.line;
      const x = top ? 20 + i * 12 : 224 + i * 12;
      const y = top ? 88 : 98;
      if (B.view[s].info) ctx.fillRect(x, y, 8, 8);
    });
  }

  if (B.news) drawNews(B.news);
  box(0, 192, W, 96);
  if (B.cap) {
    text('連打 A！把球收緊！', TEXT_X, 206);
    const bar = (label, y, v, col) => {
      text(label, TEXT_X, y);
      ctx.fillStyle = C.ink;
      ctx.fillRect(66, y + 2, W - 84, 14);
      ctx.fillStyle = C.line;
      ctx.fillRect(68, y + 4, W - 88, 10);
      ctx.fillStyle = col;
      ctx.fillRect(68, y + 4, Math.round((W - 88) * v), 10);
    };
    bar('收緊', 232, B.cap.tight, C.tight);
    bar('掙扎', 256, B.cap.struggle, C.struggle);
  } else drawText();
  drawMenu();

  if (fx.stripes > 0) {
    ctx.fillStyle = C.night;
    for (let y = 0; y < H; y += 24) {
      const w = W * fx.stripes;
      ctx.fillRect((y / 24) % 2 ? W - w : 0, y, w, 12);
      ctx.fillRect((y / 24) % 2 ? 0 : W - w, y + 12, w, 12);
    }
  }
}

/** 新聞字幕條（真人迷因角色出場時，蓋在對手下面） */
function drawNews(lines) {
  const x = 150, y = 118, w = W - x - 4, h = 22 + lines.length * 20;
  ctx.fillStyle = '#2a2e3c';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#8a96aa'; ctx.lineWidth = 2;
  ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);
  lines.forEach((s, i) => text(s, x + w / 2, y + 9 + i * 20, '#f6f4ea', FONT, 'center'));
}

function drawTitle(now) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = C.grass;
  ctx.fillRect(0, 200, W, 88);
  ctx.fillStyle = C.grassDk;
  for (let x = 6; x < W; x += 22) ctx.fillRect(x, 206 + ((x * 7) % 11), 6, 2);
  const ids = Object.keys(HUMANS);
  const id = ids[Math.floor(now / 2200) % ids.length];
  const bob = Math.sin(now / 300) * 3;
  sprite(id, W / 2 - 42, 72 + bob, 3);
  ball(W / 2, 114 + bob, 50, { alpha: 0.4, squash: Math.sin(now / 160) * 0.04 });
  text('人類捕捉計畫', W / 2, 14, C.ink, BIG, 'center');
  text('CATCH  THE  HUMANS', W / 2, 50, C.ball, FONT, 'center');
  ANIMAL_ORDER.forEach((a, i) => sprite(a, 46 + i * 76, 196 + (i % 2) * 6, 2));
  if (!UI.menu && Math.floor(now / 500) % 2) text('按 A 開始', W / 2, 172, C.ink, FONT, 'center');
  drawMenu();
}

function drawSelect(now) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  text('選擇你的家畜', W / 2, 10, C.ink, FONT, 'center');
  ANIMAL_ORDER.forEach((id, i) => {
    const x = 40 + i * 77, y = 34;
    if (i === SEL) {
      ctx.fillStyle = C.grass;
      ctx.beginPath(); ctx.roundRect(x, y, 74, 74, 6); ctx.fill();
      ctx.strokeStyle = C.ink; ctx.lineWidth = 3; ctx.stroke();
    }
    const hop = i === SEL ? Math.abs(Math.sin(now / 180)) * -4 : 0;
    sprite(id, x + 9, y + 9 + hop, 2);
  });
  const a = ANIMALS[ANIMAL_ORDER[SEL]];
  box(0, 114, W, 174);
  text(`${a.name}　${a.desc}`, 18, 128);
  [['體力', a.base.hp], ['攻擊', a.base.atk], ['防禦', a.base.def], ['速度', a.base.spd]].forEach(([n, base], i) => {
    const y = 154 + i * 22;
    text(n, 18, y);
    ctx.fillStyle = C.line;
    ctx.fillRect(66, y + 5, 120, 8);
    ctx.fillStyle = C.ink;
    ctx.fillRect(66, y + 5, Math.round((120 * base) / 120), 8);
  });
  text('技能', 232, 154, C.soft);
  a.moves.forEach((m, i) => text(MOVES[m].name, 232, 176 + i * 22));
  text('◀ ▶ 選擇　A 決定', W / 2, 250, C.soft, FONT, 'center');
  drawMenu();
}

function drawStory() {
  ctx.fillStyle = C.night;
  ctx.fillRect(0, 0, W, H);
  if (G.animal) sprite(G.animal.species, W / 2 - 56, 50, 4);
  box(0, 192, W, 96);
  drawText();
}

function drawRanch(now) {
  // 養殖場：水泥牆、血跡、鐵欄杆後面拴著鐵鏈的人類
  ctx.fillStyle = '#c8c4bc';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#8a8a86';
  ctx.fillRect(0, 96, W, 96);
  ctx.fillStyle = '#7a1414';
  for (const [x, y, w] of [[30, 170, 22], [150, 182, 30], [250, 160, 16], [96, 110, 12]]) ctx.fillRect(x, y, w, 6);
  text('人類養殖場', 18, 14);
  text(`已收服 ${G.humans.length} 隻`, W - 18, 14, C.soft, FONT, 'right');
  const a = G.animal;
  text(`${nameOf(a)}　Lv.${a.level}`, 18, 40);
  ctx.fillStyle = C.line;
  ctx.fillRect(18, 64, 120, 3);
  ctx.fillStyle = C.exp;
  ctx.fillRect(18, 64, Math.round((120 * a.exp) / expToNext(a.level)), 3);
  const { w, l } = G.pvp;
  if (w + l) text(`PK ${w}勝${l}敗`, 18, 72, C.soft);
  sprite(a.species, 240, 34, 3);
  teamInds().filter((x) => x.kind === 'human').forEach((h, i) => {
    const shake = Math.sin(now / 240 + i * 1.7) * 2;
    const x = 40 + i * 76 + shake;
    // 鐵鏈拴在脖子上
    ctx.fillStyle = '#b4bac2';
    for (let k = 0; k < 6; k++) ctx.fillRect(x + 28 + k * 2, 112 + k * 5, 4, 4);
    sprite(h.species, x, 136, 2);
  });
  // 前面一排鐵欄杆
  ctx.fillStyle = '#3a3e46';
  ctx.fillRect(0, 104, W, 4);
  ctx.fillRect(0, 186, W, 4);
  for (let x = 4; x < W; x += 18) ctx.fillRect(x, 104, 4, 86);
  box(0, 192, W, 96);
  drawText();
  drawMenu();
}

function drawCard() {
  const c = CARD;
  const h = HUMANS[c.species];
  const grade = gradeOf(c.gradeId);
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  box(0, 0, W, 192);
  text(`人類圖鑑　No.${pad3(h.no)}`, 18, 16, C.soft);
  ctx.fillStyle = C.grass;
  ctx.beginPath(); ctx.roundRect(14, 40, 120, 120, 6); ctx.fill();
  sprite(c.species, 18, 44, 4);
  text(h.name, 148, 44);
  chip(`${ELEMENT_NAMES[h.element]}屬性`, 148, 70, ELEMENT_COL[h.element]);
  if (c.dex) {
    // 圖鑑模式：顯示抓過的最高肉質、目前養了幾隻
    text('最高肉質', 148, 98, C.soft);
    if (c.gradeId) text(grade.name, 228, 98, GRADE_COL[grade.id]);
    else text('還沒抓到', 228, 98, C.soft);
    text(`養殖場裡有 ${c.owned} 隻`, 148, 122);
  } else {
    text('肉質', 148, 98, C.soft);
    text(grade.name, 196, 98, GRADE_COL[grade.id]);
    text(`Lv.${c.level}`, 148, 122);
  }
  text(`出處：${h.origin}`, 148, 146, C.soft);
  if (c.no) text(`耳標 ${pad3(c.no)}`, W - 18, 16, C.ink, FONT, 'right');
  box(0, 192, W, 96);
  drawText();
}

function drawLobby(now) {
  ctx.fillStyle = C.night;
  ctx.fillRect(0, 0, W, H);
  text('連線對戰', 18, 12, '#f6f4ea');
  if (L0) text(L0.mode === 'fair' ? 'Lv.50 公平賽' : 'Lv.50 無差別賽', W - 18, 12, C.soft, FONT, 'right');
  const L0 = LOBBY;
  if (L0) {
    text('房號', W / 2, 40, C.soft, FONT, 'center');
    L0.digits.forEach((d, i) => {
      const x = W / 2 - 64 + i * 34;
      ctx.fillStyle = '#f6f4ea';
      ctx.beginPath(); ctx.roundRect(x, 62, 28, 40, 4); ctx.fill();
      text(String(d), x + 14, 66, C.ink, BIG, 'center');
      if (L0.editing && i === L0.pos) {
        ctx.fillStyle = C.ball;
        ctx.fillRect(x, 106, 28, 4);
        if (Math.floor(now / 400) % 2) {
          text('▲', x + 14, 44, C.ball, FONT, 'center');
          text('▼', x + 14, 112, C.ball, FONT, 'center');
        }
      }
    });
    teamInds().forEach((ind, i) => sprite(ind.species, 22 + i * 70, 134, 2));
  }
  box(0, 192, W, 96);
  drawText();
  drawMenu();
}

function drawWorldScene(now) {
  drawWorld(now);
  if (UI.text) {
    box(0, 192, W, 96);
    drawText();
  }
  drawMenu();
}

function render(now) {
  ctx.imageSmoothingEnabled = false;
  const draw = { stats: drawStats, secret: drawSecret, title: drawTitle, select: drawSelect, story: drawStory, battle: drawBattle, ranch: drawRanch, card: drawCard, lobby: drawLobby, world: drawWorldScene }[scene];
  draw?.(now);
  if (fx.flash > 0) {
    ctx.fillStyle = `rgba(255,255,255,${fx.flash})`;
    ctx.fillRect(0, 0, W, H);
  }
  requestAnimationFrame(render);
}

// ───────── 標題與開場 ─────────
async function titleScreen() {
  scene = 'title';
  clearText();
  await waitKey(['A']);
  sfx('blip');
  for (;;) {
    const saved = hasSave();
    const items = saved ? ['繼續', '重新開始', '匯入存檔'] : ['新遊戲', '匯入存檔'];
    const i = await menu(items, { x: 96, y: 128, w: 128, h: saved ? 98 : 72, rowH: 26 }, { cancel: false });
    if (items[i] === '繼續' && load()) return world();
    if (items[i] === '匯入存檔') {
      if (await importSave()) return world();
      continue;
    }
    if (items[i] === '重新開始' && (await menu(['重新開始', '算了'], { x: 180, y: 96, w: 140, h: 96, rowH: 30 }, { cancel: false })) !== 0) continue;
    return selectAnimal();
  }
}

async function selectAnimal() {
  scene = 'select';
  SEL = 0;
  for (;;) {
    const k = await waitKey(['LEFT', 'RIGHT', 'UP', 'DOWN', 'A']);
    if (k === 'A') {
      sfx('blip');
      const i = await menu(['就是牠', '再想想'], { x: 184, y: 186, w: 132, h: 72, rowH: 26 });
      if (i === 0) break;
      continue;
    }
    SEL = (SEL + (k === 'LEFT' || k === 'UP' ? -1 : 1) + 4) % 4;
    sfx('move');
  }
  newGame(ANIMAL_ORDER[SEL]);
  scene = 'story';
  const v = { animal: nameOf(G.animal) };
  await say(fill('{animal}被人類養了一輩子。每天吃飽、睡飽，等著被吃。', v));
  await say('直到今天早上，牠聽見主人在講電話：「明天就送去。」');
  await say(fill('{animal}決定，換一下立場。', v));
  await say('這一次，輪到人類被圈養。');
  await say(fill('運送家畜的貨車停在台北車站前。趁司機去買便當，{animal}跳下了車。', v));
  return world();
}

// ───────── 地圖（台北車站）與選單 ─────────
async function world() {
  placeAt(G.pos);
  for (;;) {
    scene = 'world';
    clearText();
    const ev = await explore();
    if (ev.type === 'encounter') {
      await wildBattle(ev.area);
    } else if (ev.type === 'notice') {
      await say(ev.text);
    } else if (ev.type === 'talk') {
      await talk(ev.thing);
    } else if (ev.type === 'menu') {
      if ((await worldMenu()) === 'title') return titleScreen();
    }
  }
}

const withAnimal = (str) => fill(str, { animal: nameOf(G.animal) });

async function talk(thing) {
  if (thing.trainer) return trainerTalk(thing.trainer);
  for (const line of thing.lines ?? []) await say(withAnimal(line));
  if (thing.shop) return shopMenu();
  if (thing.action === 'ranch') return ranchMenu();
  if (thing.action === 'secret') return secretDoor();
  if (!thing.heal) return;
  show('要吃便當休息嗎？');
  const i = await menu(['吃便當', '不用了'], { x: 180, y: 96, w: 140, h: 96, rowH: 30 });
  if (i !== 0) {
    await say('豬店員：「下次再來喔！」');
    return;
  }
  healAll();
  G.respawn = { ...G.pos };
  save();
  sfx('heal');
  await say('大家點了素食便當。排骨的部分，誰都沒有碰。');
  await say('隊伍的體力和招式次數全部回滿了！');
}

/** 用方向鍵輸入數字（不用叫出手機鍵盤）：◀▶ 換位數、▲▼ 改數字、A 確定、B 取消 */
async function pickNumber(label, len) {
  const d = Array(len).fill(0);
  let pos = 0;
  for (;;) {
    show(`${label}：${d.map((x, i) => (i === pos ? `【${x}】` : ` ${x} `)).join('')} 元\n◀▶ 換位數　▲▼ 改數字　A 確定`);
    const k = await waitKey(['LEFT', 'RIGHT', 'UP', 'DOWN', 'A', 'B']);
    if (k === 'B') { clearText(); return null; }
    if (k === 'A') { clearText(); sfx('blip'); return Number(d.join('')); }
    if (k === 'LEFT' || k === 'RIGHT') pos = (pos + (k === 'LEFT' ? len - 1 : 1)) % len;
    else d[pos] = (d[pos] + (k === 'UP' ? 1 : 9)) % 10;
    sfx('move');
  }
}

// ───────── 能力畫面：身體素質、經驗值、招式 ─────────
let STATS = null;

async function statsScreen(ind) {
  STATS = ind;
  scene = 'stats';
  clearText();
  await waitKey(['A', 'B']);
  STATS = null;
}

function drawStats() {
  const ind = STATS;
  const f = makeFighter(ind, 0, 0);
  const [hp, max] = hpOf(ind);
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  box(0, 0, W, H);
  ctx.fillStyle = C.grass;
  ctx.beginPath(); ctx.roundRect(14, 14, 120, 120, 6); ctx.fill();
  sprite(ind.species, 18, 18, 4);
  text(f.name, 14, 142);
  text(`Lv.${ind.level}`, 14, 166);
  if (f.element) chip(ELEMENT_NAMES[f.element], 76, 167, ELEMENT_COL[f.element]);
  if (ind.kind === 'human') { const g = gradeOf(ind.gradeId); text(g.name, 14, 190, GRADE_COL[g.id]); }
  // 經驗值
  const need = expToNext(ind.level);
  text('經驗值', 14, 216, C.soft);
  ctx.fillStyle = C.line; ctx.fillRect(14, 240, 120, 6);
  ctx.fillStyle = C.exp; ctx.fillRect(14, 240, Math.round((120 * Math.min(ind.exp, need)) / need), 6);
  text(`${ind.exp}/${need}`, 14, 252, C.ink);
  // 身體素質：條的長度跟「同等級的頂尖數值」比
  const top = calcStats({ hp: 150, atk: 150, def: 150, spd: 150 }, ind.level);
  [['體力', 'hp', `${hp}/${max}`], ['攻擊', 'atk'], ['防禦', 'def'], ['速度', 'spd']].forEach(([label, k, shown], i) => {
    const y = 16 + i * 30;
    text(label, 150, y, C.soft);
    text(shown ?? String(f.stats[k]), W - 18, y, C.ink, FONT, 'right');
    ctx.fillStyle = C.line; ctx.fillRect(196, y + 22, W - 214, 4);
    ctx.fillStyle = k === 'hp' ? C.exp : C.ink;
    ctx.fillRect(196, y + 22, Math.round((W - 214) * Math.min(1, f.stats[k] / top[k])), 4);
  });
  text('招式', 150, 140, C.soft);
  f.moves.forEach((m, i) => {
    const mv = MOVES[m];
    text(mv.name, 150, 162 + i * 24);
    text(`PP ${f.pp[i]}/${mv.pp}`, W - 18, 162 + i * 24, C.soft, FONT, 'right');
  });
  text('A / B 返回', W - 18, 262, C.soft, FONT, 'right');
}

// ───────── 暗門・測試室（看美術、隨意組隊伍、跟任何人類對戰）─────────
// 入口在廣場左下角。裡面做的事都不會存檔，出來就恢復原本進度。
const SECRET_ANSWER = 81000; // 公道價八萬一
let SECRET = null; // { ids }：瀏覽人類清單時，右邊顯示目前選到的那隻

async function secretDoor() {
  await say('門上刻著一行字：「我跟你講，公道價是多少？」');
  const n = await pickNumber('公道價', 5);
  if (n === null) return;
  if (n !== SECRET_ANSWER) return say('門動也不動。暗號好像不對。');
  sfx('caught');
  await say('喀啦——暗門打開了！裡面是一間測試室。');
  save();
  const backup = JSON.stringify(G);
  SAVE_LOCK.on = true;
  try {
    await secretRoom();
  } finally {
    SAVE_LOCK.on = false;
    Object.assign(G, JSON.parse(backup));
    placeAt(G.pos);
    SECRET = null;
  }
  scene = 'world';
  await say('你走出暗門。剛才在裡面發生的事，就像一場夢。');
}

async function secretRoom() {
  for (;;) {
    scene = 'secret';
    SECRET = null;
    show('測試室：在這裡做的事都不會存檔。', 220);
    const items = ['人類一覽', '隊伍', '換家畜', '全員回滿', '離開'];
    const i = await menu(items, { x: 224, y: 0, w: 160, h: 192, rowH: 34 });
    clearText();
    if (i < 0 || items[i] === '離開') return;
    if (items[i] === '人類一覽') await secretHumans();
    if (items[i] === '換家畜') await secretAnimal();
    if (items[i] === '隊伍') await teamScreen();
    if (items[i] === '全員回滿') { healAll(); await say('隊伍的體力和招式次數全部回滿了！'); }
  }
}

let lastLevel = 5;
/** 自由選等級 1～100：◀▶ 加減 1、▲▼ 加減 10 */
const pickLevel = async () => {
  for (;;) {
    show(`等級：Lv.${lastLevel}\n◀▶ 加減 1　▲▼ 加減 10　A 決定`);
    const k = await waitKey(['LEFT', 'RIGHT', 'UP', 'DOWN', 'A', 'B']);
    if (k === 'B') { clearText(); return null; }
    if (k === 'A') { clearText(); sfx('blip'); return lastLevel; }
    lastLevel = Math.min(100, Math.max(1, lastLevel + { LEFT: -1, RIGHT: 1, UP: 10, DOWN: -10 }[k]));
    sfx('move');
  }
};
const pickGrade = async () => {
  const i = await menu(GRADES.map((g) => g.name), { x: 224, y: 40, w: 160, h: 130, rowH: 34 });
  return i < 0 ? null : GRADES[i].id;
};

async function secretHumans() {
  const ids = Object.keys(HUMANS).sort((a, b) => HUMANS[a].no - HUMANS[b].no);
  let start = 0;
  for (;;) {
    scene = 'secret';
    SECRET = { ids };
    const i = await menu(ids.map((id) => `${pad3(HUMANS[id].no)} ${HUMANS[id].name}`), { x: 0, y: 0, w: 200, h: H, rowH: 32, rows: 8 }, { start });
    if (i < 0) return;
    start = i;
    const id = ids[i];
    const act = await menu(['跟牠對戰', '加入隊伍', '返回'], { x: 224, y: 120, w: 160, h: 130, rowH: 34 });
    if (act < 0 || act === 2) continue;
    const gradeId = await pickGrade();
    if (!gradeId) continue;
    const level = await pickLevel();
    if (!level) continue;
    if (act === 0) {
      SECRET = null;
      await wildBattle(null, { species: id, level, gradeId });
    } else {
      const h = createIndividual('human', id, level, gradeId, { no: G.nextNo++ });
      G.humans.push(h);
      G.team = [h.uid, ...G.team].slice(0, TEAM_HUMANS);
      await say(`${HUMANS[id].name}（${gradeOf(gradeId).name} Lv.${level}）加入隊伍了！`);
    }
  }
}

async function secretAnimal() {
  const i = await menu(ANIMAL_ORDER.map((a) => ANIMALS[a].name), { x: 224, y: 40, w: 160, h: 164, rowH: 34 });
  if (i < 0) return;
  const level = await pickLevel();
  if (!level) return;
  G.animal = createIndividual('animal', ANIMAL_ORDER[i], level);
  await say(`換成 ${ANIMALS[ANIMAL_ORDER[i]].name} Lv.${level} 了。`);
}

function drawSecret(now) {
  ctx.fillStyle = '#2a2040';
  ctx.fillRect(0, 0, W, H);
  if (SECRET?.ids && UI.menu) {
    // 人類一覽：右邊放大顯示目前選到的那隻
    const id = SECRET.ids[UI.menu.index];
    const h = id && HUMANS[id];
    if (h) {
      ctx.fillStyle = '#4a3c6a';
      ctx.beginPath(); ctx.ellipse(292, 150, 70, 12, 0, 0, Math.PI * 2); ctx.fill();
      sprite(id, 236, 38, 4);
      text(h.name, 292, 166, '#f6f4ea', FONT, 'center');
      chip(`${ELEMENT_NAMES[h.element]}屬性`, 262, 190, ELEMENT_COL[h.element]);
      text(ART.includes(id) ? '正式美術' : '暫時版', 292, 220, ART.includes(id) ? '#f8d040' : C.soft, FONT, 'center');
    }
  } else {
    text('暗門・測試室', 18, 14, '#f6f4ea');
    const team = teamInds();
    team.forEach((ind, i) => sprite(ind.species, 8 + i * 42, 120, i ? 1.5 : 2));
    team.forEach((ind, i) => text(`Lv${ind.level}`, 8 + i * 42, 168, C.soft));
  }
  if (UI.text) { box(0, 192, W, 96); drawText(); }
  drawMenu();
}

// ───────── 人類養殖場：合成強化、出貨 ─────────
const LIST_BOX = { x: 0, y: 0, w: W, h: 192, rowH: 32, rows: 5 };
const shortLabel = (h) => `${nameOf(h)} ${gradeOf(h.gradeId).name} Lv${h.level}`;

/** 從養殖場的人類裡選一隻；沒有符合的就回傳 null */
async function pickHuman(prompt, list, label = shortLabel) {
  if (!list.length) return null;
  show(prompt);
  const i = await menu(list.map(label), LIST_BOX);
  return i < 0 ? null : list[i];
}

function removeHumans(uids) {
  G.humans = G.humans.filter((h) => !uids.includes(h.uid));
  G.team = G.team.filter((u) => !uids.includes(u));
}

async function ranchMenu() {
  for (;;) {
    scene = 'world';
    show(`錢包：${G.money} 元`, 140);
    const i = await menu(['合成強化', '出貨', '查看人類', '隊伍', '離開'], { x: 160, y: 56, w: 160, h: 168, rowH: 28 });
    clearText();
    if (i < 0 || i === 4) return;
    if (!G.humans.length && i !== 3) {
      await say('養殖場裡還沒有人類。先去抓一些回來吧。');
      continue;
    }
    if (i === 0) await synthMenu();
    if (i === 1) await shipMenu();
    if (i === 2) await herdScreen();
    if (i === 3) await teamScreen();
  }
}

async function synthMenu() {
  const need = SYNTH_MATERIALS + 1;
  await say(`合成強化：任意 ${need} 隻人類合成 1 隻（主體 1 隻＋材料 ${SYNTH_MATERIALS} 隻）。不同種也可以！`);
  await say('合成出來會隨機變成其中一種人類。肉質取三隻裡最好的再升一級，能力也會變強。');
  if (G.humans.length < need) {
    await say(`養殖場裡只有 ${G.humans.length} 隻人類，還差 ${need - G.humans.length} 隻。`);
    return;
  }
  const main = await pickHuman('要用哪一隻當主體？（等級、耳標會留下來）', G.humans.filter((h) => (h.boost ?? 0) < MAX_BOOST));
  if (!main) return;
  const mats = [];
  const pool = () => G.humans.filter((h) => h.uid !== main.uid && !mats.includes(h));
  while (mats.length < SYNTH_MATERIALS) {
    const m = await pickHuman(`選第 ${mats.length + 1} 隻材料`, pool());
    if (!m) return;
    mats.push(m);
  }
  const kinds = [...new Set([main, ...mats].map((h) => HUMANS[h.species].name))];
  show(`把${[main, ...mats].map(nameOf).join('、')}丟進絞肉機？材料會消失。`);
  if ((await menu(['合成', '取消'], { x: 180, y: 96, w: 140, h: 96, rowH: 30 })) !== 0) return;
  const before = nameOf(main);
  const res = synthesize(main, mats);
  removeHumans(mats.map((m) => m.uid));
  markSeen(main.species);
  if (GRADE_ORDER.indexOf(main.gradeId) > GRADE_ORDER.indexOf(G.best[main.species] ?? '')) G.best[main.species] = main.gradeId;
  save();
  await say('絞肉機轟隆隆地轉了起來……');
  if (kinds.length > 1) await say(`裡面混著${kinds.join('、')}的味道……`);
  sfx('caught');
  for (let k = 0; k < 2; k++) await tween(140, (t) => (fx.flash = 0.8 * (1 - t)));
  if (res.changed) await say(`轟！${before}變成了${nameOf(main)}！`);
  else await say(`${before}吃下了營養補給品，變成了${nameOf(main)}！`);
  await say(`肉質是「${gradeOf(main.gradeId).name}」，能力提升了！`);
}

async function shipMenu() {
  const h = await pickHuman('要出貨哪一隻？', G.humans, (x) => `${shortLabel(x)} ${shipPrice(x)}元`);
  if (!h) return;
  const price = shipPrice(h);
  show(`${nameOf(h)}可以賣 ${price} 元。出貨之後就回不來了。`);
  if ((await menu(['出貨', '取消'], { x: 180, y: 96, w: 140, h: 96, rowH: 30 })) !== 0) return;
  removeHumans([h.uid]);
  G.money += price;
  save();
  sfx('ping');
  await say(`${nameOf(h)}被解開鐵鏈，拖進了後面的房間。`);
  await say('……一陣慘叫之後，冷藏車開走了。');
  await say(`得到了 ${price} 元！謝謝惠顧。`);
}

async function worldMenu() {
  for (;;) {
    scene = 'world';
    clearText();
    const badges = Object.keys(G.flags).filter((k) => k.startsWith('BADGE:')).length;
    show(`錢包：${G.money} 元\n徽章：${badges} 個`, 150);
    const items = ['隊伍', '背包', '人類圖鑑', '連線對戰', '設定', '存檔', '回標題'];
    const i = await menu(items, { x: 176, y: 0, w: 144, h: 240, rowH: 30 });
    clearText();
    if (i < 0) return null;
    const pickd = items[i];
    if (pickd === '隊伍') await teamScreen();
    if (pickd === '背包') await fieldBag();
    if (pickd === '人類圖鑑') await speciesDex();
    if (pickd === '連線對戰') await pvpLobby();
    if (pickd === '設定' && (await settings()) === 'imported') { placeAt(G.pos); return null; }
    if (pickd === '存檔') {
      save();
      scene = 'world';
      await say('存檔完成。');
    }
    if (pickd === '回標題') {
      save();
      return 'title';
    }
  }
}

/** 個體目前的體力：沒記錄就是全滿 */
function hpOf(ind) {
  const max = makeFighter(ind, 0, 0).stats.hp;
  return [ind.hp == null ? max : Math.min(ind.hp, max), max];
}

const humanLabel = (h) => {
  const [hp, max] = hpOf(h);
  return `${pad3(h.no)} ${nameOf(h)} Lv${h.level} ${hp > 0 ? `${hp}/${max}` : '倒下'}`;
};

async function teamScreen() {
  for (;;) {
    scene = 'ranch';
    const team = teamInds();
    const label = (ind) => {
      if (ind.kind === 'human') return humanLabel(ind);
      const [hp, max] = hpOf(ind);
      return `${nameOf(ind)} Lv${ind.level} ${hp > 0 ? `${hp}/${max}` : '倒下'}（家畜）`;
    };
    const slots = team.map(label);
    while (slots.length < TEAM_HUMANS + 1) slots.push('（空位）');
    show('排第一個的，戰鬥時先上場。');
    const i = await menu(slots, { x: 0, y: 0, w: W, h: 192, rowH: 32 });
    if (i < 0) return;
    const ind = team[i];
    if (!ind) {
      await pickForTeam(null);
      continue;
    }
    const opts = ['看能力', '換位置', ...(ind.kind === 'human' ? ['換別隻', '移出隊伍'] : [])];
    const c = await menu(opts, { x: 224, y: 40, w: 160, h: 26 + opts.length * 34, rowH: 34 });
    if (c < 0) continue;
    if (opts[c] === '看能力') await statsScreen(ind);
    if (opts[c] === '換位置') {
      show(`${nameOf(ind)}要跟誰交換位置？`);
      const j = await menu(team.map(label), { x: 0, y: 0, w: W, h: 192, rowH: 32 }, { start: i });
      if (j >= 0 && j !== i) {
        [team[i], team[j]] = [team[j], team[i]];
        setTeamOrder(team);
      }
    }
    if (opts[c] === '換別隻') await pickForTeam(ind);
    if (opts[c] === '移出隊伍') setTeamOrder(team.filter((x) => x !== ind));
    save();
  }
}

/** 從養殖場挑一隻人類放進隊伍：replace 有值就換掉牠，沒有就加在最後 */
async function pickForTeam(replace) {
  const pool = G.humans.filter((h) => !G.team.includes(h.uid));
  if (!pool.length) return say('養殖場裡沒有其他人類了。');
  show('要換誰？');
  const j = await menu(pool.map(humanLabel), { x: 0, y: 0, w: W, h: 192, rowH: 32, rows: 5 });
  if (j < 0) return;
  const team = teamInds();
  if (replace) team[team.indexOf(replace)] = pool[j];
  else team.push(pool[j]);
  setTeamOrder(team);
}

async function herdScreen() {
  if (!G.humans.length) {
    await say('養殖場裡還是空的。快去抓第一隻人類吧。');
    return;
  }
  for (;;) {
    scene = 'ranch';
    show('要看哪一隻？');
    const items = G.humans.map((h) => `${pad3(h.no)} ${nameOf(h)}　${gradeOf(h.gradeId).name}`);
    const j = await menu(items, { x: 0, y: 0, w: W, h: 192, rowH: 32, rows: 5 });
    if (j < 0) return;
    await showCard(G.humans[j]);
  }
}

async function showCard(ind, line) {
  CARD = ind;
  scene = 'card';
  if (line) await say(line);
  await say(HUMANS[ind.species].dex);
}

// ───────── 戰鬥共用 ─────────
function startBattleView(st, me) {
  B = {
    st, me,
    view: [0, 1].map((s) => ({ hp: active(st, s).hp, x: (s === me ? 1 : -1) * 260, drop: 0, vis: true, info: false, blink: false })),
    ball: null, cap: null, shake: 0,
  };
  clearText();
  scene = 'battle';
}

async function battleIntro() {
  for (let i = 0; i < 3; i++) await tween(110, (k) => (fx.flash = 1 - k));
  await tween(500, (k) => (fx.stripes = k));
  await tween(400, (k) => (fx.stripes = 1 - k));
  fx.stripes = 0;
  await tween(700, (k) => B.view.forEach((v, s) => (v.x = (s === B.me ? 1 : -1) * 260 * (1 - ease(k)))));
}

async function slide(s, out) {
  const dir = posOf(s) === 'bottom' ? -1 : 1;
  await tween(350, (k) => (B.view[s].x = dir * 260 * (out ? ease(k) : 1 - ease(k))));
}

/** 播放戰鬥事件 */
async function play(events) {
  for (const e of events) {
    const s = e.side;
    const v = B.view[s];
    if (e.t === 'text') await say(L(e.text));
    else if (e.t === 'lunge') {
      const dir = posOf(s) === 'bottom' ? 1 : -1;
      await tween(180, (k) => (v.x = Math.sin(k * Math.PI) * 14 * dir));
    } else if (e.t === 'hit' || e.t === 'hp') {
      if (e.t === 'hit') {
        sfx('hit');
        if (e.mult > 1) B.shake = 4;
        v.blink = true;
        await sleep(360);
        v.blink = false;
        B.shake = 0;
      } else sfx('heal');
      const from = v.hp;
      await tween(Math.min(700, 120 + Math.abs(from - e.hp) * 6), (k) => (v.hp = from + (e.hp - from) * k));
    } else if (e.t === 'faint') {
      sfx('faint');
      await tween(400, (k) => (v.drop = k));
      await say(L(`${tag(active(B.st, s))}倒下了！`));
    } else if (e.t === 'switch') {
      const mine = s === B.me;
      const out = B.st.sides[s].team[e.from];
      if (out.hp > 0) {
        await say(mine ? `回來吧，${out.name}！` : `對手收回了${out.name}。`);
        await slide(s, true);
      }
      const f = active(B.st, s);
      v.hp = f.hp;
      v.drop = 0;
      v.x = (posOf(s) === 'bottom' ? -1 : 1) * 260;
      B.onSwitch?.(s, f);
      await say(mine ? `去吧，${f.name}！` : `對手派出了${f.name}！`, { wait: false });
      await slide(s, false);
      await sleep(250);
    } else if (e.t === 'forfeit') {
      await say(s === B.me ? '你投降了。' : '對手投降了。');
    }
  }
}

/** 選技能，回傳行動或 null（按 B 返回） */
async function chooseMove() {
  const f = active(B.st, B.me);
  if (!hasPp(f)) {
    await say(`${f.name}的招式全部用完了！`);
    return { type: 'move', index: STRUGGLE };
  }
  let start = 0;
  for (;;) {
    clearText();
    // 招式 2×2 排在文字框；上方小框顯示目前游標那招的屬性、威力、PP
    const i = await menu(f.moves.map((m) => MOVES[m].name), {
      x: 0, y: 192, w: W, h: 96, rowH: 34, cols: 2, colW: 150,
      extra: (idx) => {
        const m = MOVES[f.moves[idx]];
        const el = m.element ? `${ELEMENT_NAMES[m.element]}屬性` : '無屬性';
        box(210, 108, 168, 82); // 剛好蓋住自己的資訊框
        text(m.kind === 'attack' ? `${el}　威力${m.power}` : `${el}　變化技`, 224, 124, C.soft);
        text(`PP ${f.pp[idx]}/${m.pp}`, 224, 152, f.pp[idx] > 0 ? C.ink : C.hpR);
      },
    }, { start });
    if (i < 0) return null;
    if (f.pp[i] > 0) return { type: 'move', index: i };
    start = i;
    await say(TEXT.noPp);
  }
}

/** 選隊伍裡的一隻。forced：一定要選（倒下補人） */
async function chooseMember({ forced = false } = {}) {
  const side = B.st.sides[B.me];
  for (;;) {
    const items = side.team.map((f, i) =>
      `${f.name} Lv${f.level}　${f.hp > 0 ? `${f.hp}/${f.stats.hp}` : '倒下'}${i === side.active ? '　出場中' : ''}`);
    show(forced ? '要派誰上場？' : '要換誰上場？');
    const start = Math.max(0, side.team.findIndex((f, j) => f.hp > 0 && j !== side.active));
    const i = await menu(items, { x: 0, y: 0, w: W, h: 192, rowH: 34 }, { cancel: !forced, start });
    if (i < 0) return null;
    if (side.team[i].hp <= 0) await say(`${side.team[i].name}已經沒有力氣戰鬥了。`);
    else if (i === side.active) await say(`${side.team[i].name}已經在場上了。`);
    else return i;
  }
}

// ───────── 背包 ─────────
const bagList = (filter) => Object.entries(G.bag).filter(([id, n]) => n > 0 && ITEMS[id] && filter(ITEMS[id])).map(([id, n]) => ({ id, n }));

/** 從背包選一個道具，回傳道具 id 或 null */
async function chooseItem(prompt, filter) {
  const list = bagList(filter);
  if (!list.length) {
    await say('背包裡沒有可以用的道具。');
    return null;
  }
  show(prompt);
  const i = await menu(list.map((x) => `${ITEMS[x.id].name}　×${x.n}`), LIST_BOX);
  return i < 0 ? null : list[i].id;
}

/** 在地圖上用道具 */
async function fieldBag() {
  for (;;) {
    scene = 'world';
    const id = await chooseItem('要用什麼？（B 關閉）', (it) => it.use !== 'battle');
    if (!id) return;
    const it = ITEMS[id];
    if (it.kind === 'repel') {
      if (G.repel > 0) { await say(`驅人噴霧的效果還有 ${G.repel} 步。`); continue; }
      G.repel = it.steps;
      addItem(id, -1);
      save();
      await say(`噴了驅人噴霧。接下來 ${it.steps} 步不會遇到野生人類。`);
      continue;
    }
    // 回體力、回 PP：選一隻隊員
    const team = teamInds();
    show(`要給誰用${it.name}？`);
    const j = await menu(team.map((ind) => {
      const [hp, max] = hpOf(ind);
      return `${nameOf(ind)} Lv${ind.level} ${hp > 0 ? `${hp}/${max}` : '倒下'}`;
    }), LIST_BOX);
    if (j < 0) continue;
    const ind = team[j];
    const [hp, max] = hpOf(ind);
    if (it.kind === 'heal') {
      if (hp <= 0) { await say(`${nameOf(ind)}已經倒下了。${it.name}救不回來，去便當店休息吧。`); continue; }
      if (hp >= max) { await say(`${nameOf(ind)}的體力已經是滿的。`); continue; }
      const nhp = Math.min(max, hp + Math.ceil(max * it.heal));
      ind.hp = nhp >= max ? null : nhp;
      await say(`${nameOf(ind)}喝了${it.name}，體力回復到 ${nhp}/${max}！`);
      if (ind.species === 'CHICKEN') await say('……雞決定不要去想它是用什麼做的。');
    } else if (it.kind === 'pp') {
      if (!ind.pp) { await say(`${nameOf(ind)}的招式次數已經是滿的。`); continue; }
      ind.pp = null;
      await say(`${nameOf(ind)}喝了${it.name}，招式次數全部回滿了！`);
    }
    addItem(id, -1);
    save();
  }
}

/**
 * 戰鬥中用道具。回傳：
 *   { ball: id }  丟寶貝球（交給呼叫的人處理收服）
 *   'used'        用了回復道具（這回合換對方出手）
 *   null          取消
 */
async function battleBag(canCatch) {
  for (;;) {
    const id = await chooseItem('要用什麼？', (it) => it.use !== 'field');
    if (!id) return null;
    const it = ITEMS[id];
    if (it.kind === 'ball') {
      if (!canCatch) { await say('不能收服別人養的人類！'); continue; }
      return { ball: id };
    }
    const side = B.st.sides[0];
    show(`要給誰用${it.name}？`);
    const j = await menu(side.team.map((f) => `${f.name} Lv${f.level} ${f.hp > 0 ? `${f.hp}/${f.stats.hp}` : '倒下'}`), LIST_BOX);
    if (j < 0) continue;
    const f = side.team[j];
    if (f.hp <= 0) { await say(`${f.name}已經倒下了，${it.name}救不回來。`); continue; }
    if (it.kind === 'heal') {
      if (f.hp >= f.stats.hp) { await say(`${f.name}的體力已經是滿的。`); continue; }
      addItem(id, -1);
      const nhp = Math.min(f.stats.hp, f.hp + Math.ceil(f.stats.hp * it.heal));
      f.hp = nhp;
      clearText();
      if (j === side.active) await play([{ t: 'hp', side: 0, hp: nhp }]);
      await say(`${f.name}喝了${it.name}，體力回復了！`);
    } else {
      addItem(id, -1);
      f.pp = f.moves.map((m) => MOVES[m].pp);
      await say(`${f.name}喝了${it.name}，招式次數全部回滿了！`);
    }
    return 'used';
  }
}

// ───────── 商店（一樓大廳的超商）─────────
async function shopMenu() {
  for (;;) {
    scene = 'world';
    show(`錢包：${G.money} 元\n要買什麼？`);
    const i = await menu(SHOP.map((id) => `${ITEMS[id].name}　${ITEMS[id].price}元`), LIST_BOX);
    if (i < 0) {
      await say('浣熊店員：「謝謝光臨！」');
      return;
    }
    const id = SHOP[i];
    const it = ITEMS[id];
    await say(it.desc);
    show(`${it.name}要買幾個？（背包裡有 ${itemCount(id)} 個）`);
    const qs = [1, 5, 10];
    const q = await menu(qs.map((n) => `${n} 個　${n * it.price}元`), { x: 150, y: 80, w: 170, h: 112, rowH: 28 });
    if (q < 0) continue;
    const n = qs[q];
    if (G.money < n * it.price) {
      await say('錢不夠。去養殖場出貨一些人類吧。');
      continue;
    }
    G.money -= n * it.price;
    addItem(id, n);
    save();
    sfx('ping');
    await say(`買了 ${n} 個${it.name}！`);
    if (G.animal.species === 'CHICKEN') await say('浣熊店員：「要不要加購一顆茶葉蛋？」……雞沉默了。');
  }
}

// ───────── 圖鑑、設定 ─────────
const markSeen = (species) => { if (!G.seen.includes(species)) G.seen.push(species); };
const GRADE_ORDER = ['CHOICE', 'PRIME', 'A5'];
function markCaught(ind) {
  markSeen(ind.species);
  G.caught[ind.species] = (G.caught[ind.species] ?? 0) + 1;
  if (GRADE_ORDER.indexOf(ind.gradeId) > GRADE_ORDER.indexOf(G.best[ind.species] ?? '')) G.best[ind.species] = ind.gradeId;
}

async function speciesDex() {
  const list = Object.entries(HUMANS).sort((a, b) => a[1].no - b[1].no);
  const caught = Object.keys(G.best).length;
  for (;;) {
    scene = 'world';
    show(`遇過 ${G.seen.length} 種，抓過 ${caught} 種。`);
    const items = list.map(([id, h]) => {
      if (!G.seen.includes(id)) return `No.${pad3(h.no)} ？？？`;
      return `No.${pad3(h.no)} ${h.name}${G.best[id] ? '　' + gradeOf(G.best[id]).name : ''}`;
    });
    const i = await menu(items, LIST_BOX);
    if (i < 0) return;
    const [id] = list[i];
    if (!G.seen.includes(id)) {
      await say('還沒遇過這種人類。去更多地方找找看吧。');
      continue;
    }
    CARD = { species: id, gradeId: G.best[id] ?? null, dex: true, owned: G.humans.filter((h) => h.species === id).length };
    scene = 'card';
    await say(G.best[id] ? HUMANS[id].dex : '只有遠遠看過。抓到之後才知道牠的肉質。');
  }
}

async function settings() {
  for (;;) {
    show('換手機時：舊手機「匯出存檔」，新手機「匯入存檔」。');
    const i = await menu(['文字速度', '匯出存檔', '匯入存檔'], { x: 150, y: 80, w: 170, h: 112, rowH: 28 });
    if (i < 0) return clearText();
    if (i === 0) await textSpeedSetting();
    if (i === 1) await exportSave();
    if (i === 2 && (await importSave())) return 'imported';
  }
}

// ───────── 匯出／匯入存檔（換手機用）─────────
async function exportSave() {
  clearText();
  await panel({
    title: '匯出存檔',
    note: '把下面這一整串複製起來（可以先傳到 LINE 給自己），到新手機打開遊戲，在標題畫面選「匯入存檔」貼上。',
    value: exportCode(),
    readonly: true,
    buttons: [
      { label: '複製', onClick: async (ta, say) => { say((await copyText(ta)) ? '已複製！' : '自動複製失敗，請長按文字框，選「全選」再「複製」。'); return true; } },
      { label: '關閉', cancel: true },
    ],
  });
}

/** 成功匯入回傳 true（G 已經換成匯入的進度） */
async function importSave() {
  clearText();
  if (hasSave()) {
    await say('注意：匯入後，這支手機上原本的進度會被蓋掉。');
    if ((await menu(['繼續匯入', '算了'], { x: 180, y: 96, w: 140, h: 96, rowH: 30 })) !== 0) return false;
  }
  const r = await panel({
    title: '匯入存檔',
    note: '長按下面的白色框框，選「貼上」，把舊手機匯出的整串文字貼進來。',
    noKeyboard: true,
    buttons: [
      { label: '匯入', onClick: async (ta, say) => {
        if (importCode(ta.value)) return false;
        say('這串文字讀不出來。請確認有整串複製（開頭是 CTH1-），沒有少字。');
        return true;
      } },
      { label: '取消', cancel: true },
    ],
  });
  if (r.i < 0) return false;
  await say(`匯入成功！歡迎回來，${nameOf(G.animal)}。`);
  return true;
}

async function textSpeedSetting() {
  const speeds = Object.keys(TEXT_SPEEDS);
  show(`文字速度：目前是「${getTextSpeed()}」`);
  const i = await menu(speeds.map((s) => `文字速度：${s}`), { x: 150, y: 80, w: 170, h: 112, rowH: 28 }, { start: speeds.indexOf(getTextSpeed()) });
  if (i >= 0) {
    setTextSpeed(speeds[i]);
    await say(`文字速度改成「${speeds[i]}」了。按住 A 可以快轉。`);
  }
}

// ───────── 野生戰鬥 ─────────
const ACTIONS = ['技能', '換人', '背包', '逃跑'];
const ACTION_BOX = { x: 152, y: 192, w: 168, h: 96, rowH: 34, cols: 2, colW: 74 };

async function wildBattle(areaId, force = null) {
  const w = force ?? rollWild(AREAS[areaId], Math.random, GRADES);
  const wild = createIndividual('human', w.species, w.level, w.gradeId);
  const st = createBattle({ mode: 'wild', seed: (Math.random() * 2 ** 32) >>> 0, teams: [teamInds(), [wild]] });
  startBattleView(st, 0);
  const joined = new Set([active(st, 0).uid]);
  B.onSwitch = (s, f) => s === 0 && joined.add(f.uid);
  await battleIntro();
  B.view[1].info = true;
  const e = active(st, 1);
  markSeen(e.species);
  const v = { animal: nameOf(G.animal), human: e.name };
  B.news = HUMANS[e.species].news ?? null;
  await say(fill(pick(HUMANS[e.species].lines.appear), v));
  const rivalLine = HUMANS[e.species].rival?.[G.animal.species];
  if (rivalLine) await say(rivalLine);
  B.news = null;
  if (e.gradeId === 'A5') {
    // A5 和牛：稀有的「閃光」，要有儀式感
    sfx('caught');
    for (let k = 0; k < 3; k++) await tween(140, (t) => (fx.flash = 0.9 * (1 - t)));
    await say('★ 閃閃發亮！這是稀有的「A5和牛」！ ★');
  }
  B.view[0].info = true;

  for (;;) {
    const me = active(st, 0);
    show(`${me.name}\n要做什麼？`, 140);
    const act = await menu(ACTIONS, ACTION_BOX, { cancel: false });
    let action = null;
    if (act === 0) action = await chooseMove();
    else if (act === 1) {
      const slot = await chooseMember();
      if (slot !== null) action = { type: 'switch', slot };
    } else if (act === 2) {
      const r = await battleBag(true);
      if (r === 'used') action = { type: 'pass' };
      else if (r?.ball) {
        if (e.hp / e.stats.hp > 0.5) {
          await say('對方還很有活力，現在丟很可能抓不住……');
          show('還是要丟嗎？');
          if ((await menu(['還是要丟', '算了'], { x: 180, y: 96, w: 140, h: 96, rowH: 30 })) !== 0) continue;
        }
        let quick = false;
        if ((G.caught[e.species] ?? 0) >= QUICK_AFTER) {
          show(`${e.name}已經抓過 ${G.caught[e.species]} 隻了。`);
          quick = (await menu(['快速收服', '自己收緊'], { x: 180, y: 96, w: 140, h: 96, rowH: 30 }, { cancel: false })) === 0;
        }
        addItem(r.ball, -1);
        const res = await capture(e, ITEMS[r.ball], { quick });
        if (res === 'caught') {
          const ind = createIndividual('human', e.species, e.level, e.gradeId, { no: G.nextNo++ });
          G.humans.push(ind);
          markCaught(ind);
          const lines = [...HUMANS[e.species].lines.caught, ...GENERIC_CAUGHT];
          await showCard(ind, fill(pick(lines), { ...v, grade: gradeOf(e.gradeId).name, no: pad3(ind.no) }));
          if (G.team.length < TEAM_HUMANS) {
            G.team.push(ind.uid);
            await say(`${e.name}加入了隊伍！`);
          } else await say(`隊伍滿了。${e.name}被拴進了養殖場。`);
          scene = 'battle';
          return afterBattle(joined, expReward(e));
        }
        // 收服失敗：人類撐破球，戰鬥繼續，這一回合換對方出手
        await say(fill(pick(HUMANS[e.species].lines.breakout), v));
        action = { type: 'pass' };
      }
    } else {
      await say(TEXT.run);
      return afterBattle(joined, 0);
    }
    if (!action) continue;

    await play(runTurn(st, [action, chooseAiAction(st, 1)]));
    if (st.winner === 0) {
      for (const s of TEXT.humanFainted.slice(1)) await say(fill(s, v));
      return afterBattle(joined, expReward(e));
    }
    if (st.winner === 1) {
      for (const s of TEXT.playerFainted.slice(1)) await say(fill(s, v));
      return afterBattle(joined, 0, true);
    }
    if (st.need.includes(0)) {
      const slot = await chooseMember({ forced: true });
      await play(replace(st, [slot, null]));
    }
  }
}

// ───────── 訓練家對戰（道館）─────────
async function trainerTalk(tr) {
  if (G.flags[tr.id]) {
    for (const line of tr.after) await say(withAnimal(line));
    return;
  }
  for (const line of tr.intro) await say(withAnimal(line));
  if (!teamInds().some((ind) => hpOf(ind)[0] > 0)) {
    await say('你的隊伍都倒下了，先去便當店休息吧。');
    return;
  }
  await trainerBattle(tr);
}

async function trainerBattle(tr) {
  const foes = tr.team.map((t) => createIndividual('human', t.species, t.level, t.gradeId));
  const st = createBattle({ mode: 'trainer', seed: (Math.random() * 2 ** 32) >>> 0, teams: [teamInds(), foes] });
  startBattleView(st, 0);
  const joined = new Set([active(st, 0).uid]);
  B.onSwitch = (s, f) => (s === 0 ? joined.add(f.uid) : markSeen(f.species));
  await battleIntro();
  B.view[1].info = true;
  markSeen(active(st, 1).species);
  await say(`${tr.name}派出了${active(st, 1).name}！`);
  B.view[0].info = true;

  for (;;) {
    const me = active(st, 0);
    show(`${me.name}\n要做什麼？`, 140);
    const act = await menu(ACTIONS, ACTION_BOX, { cancel: false });
    let action = null;
    if (act === 0) action = await chooseMove();
    else if (act === 1) {
      const slot = await chooseMember();
      if (slot !== null) action = { type: 'switch', slot };
    } else if (act === 2) {
      if ((await battleBag(false)) === 'used') action = { type: 'pass' };
    } else await say('不能從訓練家的對戰中逃跑！');
    if (!action) continue;

    await play(runTurn(st, [action, chooseAiAction(st, 1)]));
    if (st.winner === 0) {
      for (const line of tr.win) await say(withAnimal(line));
      G.flags[tr.id] = true;
      G.money += tr.reward;
      sfx('caught');
      await say(`得到了 ${tr.reward} 元！`);
      if (tr.badge) {
        G.flags[`BADGE:${tr.badge}`] = true;
        sfx('ping');
        await say(`★ 得到了「${tr.badge}」！ ★`);
      }
      const exp = Math.round(foes.reduce((sum, f) => sum + f.level * 6, 0) * 1.5);
      return afterBattle(joined, exp);
    }
    if (st.winner === 1) {
      await say(`${tr.name}：「下次再來挑戰吧！」`);
      for (const s of TEXT.playerFainted.slice(2)) await say(fill(s, { animal: nameOf(G.animal) }));
      return afterBattle(joined, 0, true);
    }
    if (st.need.length) {
      const mine = st.need.includes(0) ? await chooseMember({ forced: true }) : null;
      const theirs = st.need.includes(1) ? aliveSlots(st, 1)[0] : null;
      await play(replace(st, [mine, theirs]));
    }
  }
}

/**
 * 戰鬥結束：體力和 PP 帶回個體（到便當店才補滿）；
 * 沒倒下的參戰者拿經驗值；全滅就回到最後休息的便當店。
 */
async function afterBattle(joined, exp, wiped = false) {
  scene = 'battle';
  for (const f of B.st.sides[0].team) {
    const ind = findInd(f.uid);
    if (!ind) continue;
    ind.hp = f.hp;
    ind.pp = [...f.pp];
  }
  if (exp > 0) {
    for (const f of B.st.sides[0].team) {
      if (!joined.has(f.uid) || f.hp <= 0) continue;
      const ind = findInd(f.uid);
      if (!ind) continue;
      const oldMax = makeFighter(ind, 0, 0).stats.hp;
      await say(fill(TEXT.expGain, { animal: f.name, exp }));
      for (const lv of gainExp(ind, exp)) {
        sfx('caught');
        await say(fill(TEXT.levelUp, { animal: f.name, level: lv }));
        for (const m of movesLearnedAt(ind.kind, ind.species, lv)) await learnMove(ind, f.name, m);
      }
      const newMax = makeFighter(ind, 0, 0).stats.hp;
      if (ind.hp != null) ind.hp = Math.min(newMax, ind.hp + newMax - oldMax); // 升級多出來的體力直接加上去
    }
  }
  if (wiped) {
    healAll();
    placeAt(G.respawn);
  }
  save();
  return wiped ? 'lose' : 'done';
}

/** 學新招。招式滿 4 個時讓玩家選一招忘掉，也可以放棄 */
async function learnMove(ind, name, moveId) {
  const mv = MOVES[moveId].name;
  if (ind.moves.includes(moveId)) return;
  if (ind.moves.length < MOVE_SLOTS) {
    ind.moves.push(moveId);
    if (ind.pp) ind.pp.push(MOVES[moveId].pp);
    sfx('ping');
    await say(`${name}學會了${mv}！`);
    return;
  }
  for (;;) {
    await say(`${name}想學${mv}，但是已經會 4 招了。`);
    show(`要忘掉哪一招，換成${mv}？`);
    const items = [...ind.moves.map((m) => MOVES[m].name), `不學${mv}`];
    const i = await menu(items, { x: 0, y: 0, w: W, h: 192, rowH: 32 }, { cancel: false });
    if (i === MOVE_SLOTS) {
      show(`真的不學${mv}嗎？`);
      if ((await menu(['不學了', '再想想'], { x: 180, y: 192, w: 140, h: 96, rowH: 30 }, { cancel: false })) === 0) {
        await say(`${name}沒有學${mv}。`);
        return;
      }
      continue;
    }
    const old = MOVES[ind.moves[i]].name;
    ind.moves[i] = moveId;
    if (ind.pp) ind.pp[i] = MOVES[moveId].pp;
    sfx('ping');
    await say(`一、二……噗！${name}忘掉了${old}，學會了${mv}！`);
    return;
  }
}

async function capture(e, ballItem = ITEMS.BALL, { quick = false } = {}) {
  await say(`${active(B.st, 0).name}丟出了${ballItem.name}！`, { wait: false });
  await sleep(250);
  sfx('throw');
  const p = POS.top;
  const sx = 96, sy = 150, tx = p.x + 56, ty = p.y + 58;
  B.ball = { x: sx, y: sy, r: 6, mode: 'fly' };
  await tween(520, (k) => {
    B.ball.x = sx + (tx - sx) * k;
    B.ball.y = sy + (ty - sy) * k - Math.sin(k * Math.PI) * 80;
  });
  sfx('boing');
  B.ball.mode = 'wrap';
  await tween(320, (k) => (B.ball.r = 6 + 56 * ease(k)));

  const capOpts = {
    hpRatio: e.hp / e.stats.hp,
    asleep: e.status === 'sleep',
    strength: HUMANS[e.species].strength,
    gradeStruggle: gradeOf(e.gradeId).struggle,
    ball: ballItem.struggle,
  };
  const cap = createCapture(capOpts);
  let result;
  if (quick) {
    // 快速收服：不用連打，球自己收緊，用機率決定
    show('快速收服中……');
    for (let i = 0; i < 3; i++) {
      sfx('rock');
      await tween(280, (k) => (B.ball.squash = Math.sin(k * Math.PI * 2) * 0.12));
      await tween(260, (k) => (B.ball.r = 62 - 8 * (i + k)));
    }
    result = Math.random() < quickChance(capOpts) ? 'caught' : 'escaped';
    B.ball.squash = 0;
    clearText();
  }
  clearText();
  if (!quick) { B.cap = cap; B.squeeze = 0; await sleep(400); }
  result ??= await new Promise((res) => {
    let last = performance.now();
    const f = (k) => {
      if (k === 'A') { press(cap); B.squeeze = 1; sfx('squeeze'); }
    };
    waiters.add(f);
    const step = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      update(cap, dt);
      B.squeeze = Math.max(0, B.squeeze - dt * 6);
      B.ball.r = 62 - 26 * cap.tight;
      if (cap.result) { waiters.delete(f); res(cap.result); } else requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });

  const v = B.view[1];
  if (result === 'caught') {
    const r0 = B.ball.r;
    await tween(380, (k) => {
      B.ball.r = r0 + (9 - r0) * ease(k);
      v.scale = Math.max(0.05, B.ball.r / 62);
    });
    v.vis = false;
    B.cap = null;
    B.ball.mode = 'closed';
    sfx('rock');
    const y0 = B.ball.y;
    await tween(300, (k) => (B.ball.y = y0 + (104 - y0) * k * k));
    for (let i = 0; i < 3; i++) {
      await sleep(350);
      sfx('rock');
      await tween(260, (k) => (B.ball.squash = Math.sin(k * Math.PI * 2) * 0.25));
    }
    sfx('caught');
    fx.stars = [0, 1, 2].map((i) => ({ x: B.ball.x - 20 + i * 20, y: 80 }));
    await tween(500, (k) => fx.stars.forEach((s, i) => (s.y = 86 - k * 20 - i * 3)));
    await sleep(200);
    fx.stars = [];
    return 'caught';
  }
  sfx('pop');
  B.cap = null;
  B.ball.mode = 'burst';
  B.ball.t = 0;
  await tween(320, (k) => (B.ball.t = k));
  B.ball = null;
  // 撐破球之後人類還在場上，抖一下表示掙脫
  await tween(300, (k) => (v.x = Math.sin(k * Math.PI * 4) * 6));
  v.x = 0;
  return 'escaped';
}

// ───────── 連線 PK ─────────
async function chooseCode() {
  LOBBY.editing = true;
  LOBBY.pos = 0;
  show('上下改數字，左右移動，A 確定。');
  for (;;) {
    const k = await waitKey(['UP', 'DOWN', 'LEFT', 'RIGHT', 'A', 'B']);
    const d = LOBBY.digits;
    if (k === 'UP') d[LOBBY.pos] = (d[LOBBY.pos] + 1) % 10;
    if (k === 'DOWN') d[LOBBY.pos] = (d[LOBBY.pos] + 9) % 10;
    if (k === 'LEFT') LOBBY.pos = (LOBBY.pos + 3) % 4;
    if (k === 'RIGHT') LOBBY.pos = (LOBBY.pos + 1) % 4;
    sfx('move');
    if (k === 'A' || k === 'B') {
      LOBBY.editing = false;
      return k === 'A';
    }
  }
}

async function pvpLobby() {
  scene = 'lobby';
  LOBBY = { digits: [0, 0, 0, 0], pos: 0, editing: false };
  show('檢查連線中……');
  if (!(await canConnect())) {
    await say('這個畫面沒辦法連線。請用 Claude 打開遊戲網址，朋友也要有權限打開同一個網址。');
    LOBBY = null;
    return;
  }
  show('要開房間還是加入朋友的房間？');
  const i = await menu(['開新房間', '輸入房號'], { x: 160, y: 192, w: 160, h: 96, rowH: 30 });
  if (i < 0) { LOBBY = null; return; }
  show('要打哪一種？（兩個人要選一樣的）');
  const m = await menu(['公平賽', '無差別賽'], { x: 160, y: 192, w: 160, h: 96, rowH: 30 });
  if (m < 0) { LOBBY = null; return; }
  LOBBY.mode = m === 0 ? 'fair' : 'open';
  await say(m === 0 ? '公平賽：全部 Lv.50，肉質和強化都不算，只比隊伍搭配。' : '無差別賽：全部 Lv.50，肉質和強化照算。');
  if (i === 0) LOBBY.digits = [0, 0, 0, 0].map(() => Math.floor(Math.random() * 10));
  else if (!(await chooseCode())) { LOBBY = null; return; }
  const code = LOBBY.digits.join('');

  let opp = null;
  const conn = await openRoom(`${LOBBY.mode}-${code}`, (p) => (opp = p));
  if (!conn) {
    await say('連不上房間，請稍後再試。');
    LOBBY = null;
    return;
  }
  const nonce = randomId(12);
  const mine = myPresence({ nonce, team: teamInds(), mode: LOBBY.mode });
  conn.setMine(mine);
  try {
    for (;;) {
      show(`${LOBBY.mode === 'fair' ? '公平賽' : '無差別賽'}房號 ${code}。把房號和模式告訴朋友，等待對手加入……（B 離開）`);
      const r = await waitUntil(() => opp && opp.nonce, { cancel: true });
      if (r === 'cancel') return;
      const check = checkOpponent(opp);
      if (check.ok) break;
      if (check.reason === 'version') {
        await say('雙方的遊戲版本不同，請兩邊都重新整理網頁再試一次。');
        return;
      }
      await say('對手的隊伍資料有問題，沒辦法開打。');
      return;
    }
    sfx('ping');
    await say('對手來了！');
    await pvpBattle(conn, mine, () => opp);
  } finally {
    conn.close();
    LOBBY = null;
  }
}

async function pvpBattle(conn, mine, getOpp) {
  const opp0 = getOpp();
  const { state: st, mySide } = setupBattle(mine, opp0);
  startBattleView(st, mySide);
  await battleIntro();
  B.view.forEach((v) => (v.info = true));
  await say(`對手派出了${active(st, 1 - mySide).name}！`);
  const acts = [];
  const sameOpp = () => getOpp()?.nonce === opp0.nonce;

  for (let k = 0; st.winner === null; k++) {
    let a = null;
    if (mustChoose(st, mySide)) {
      if (st.need.length) a = { type: 'switch', slot: await chooseMember({ forced: true }) };
      else {
        for (;;) {
          show(`${active(st, mySide).name}\n要做什麼？`, 140);
          const c = await menu(['技能', '換人', '投降'], { x: 152, y: 192, w: 168, h: 96, rowH: 34, cols: 2, colW: 74 }, { cancel: false });
          if (c === 0) a = await chooseMove();
          if (c === 1) {
            const slot = await chooseMember();
            if (slot !== null) a = { type: 'switch', slot };
          }
          if (c === 2) {
            show('真的要投降嗎？');
            if ((await menu(['投降', '繼續打'], { x: 180, y: 192, w: 140, h: 96, rowH: 30 })) === 0) a = { type: 'forfeit' };
          }
          if (a) break;
        }
      }
    }
    acts.push(encodeAct(a));
    conn.setMine({ ...mine, acts });

    // 等對手這一步的選擇；對手斷線就等他回來（最多 60 秒）
    for (;;) {
      show('等待對手……');
      const r = await waitUntil(() => !sameOpp() || getOpp().acts?.length > k, { timeoutMs: 15000 });
      if (r === 'ok' && sameOpp()) break;
      show('對手好像斷線了，等他回來……（B 放棄）');
      const back = await waitUntil(() => sameOpp() && getOpp().acts?.length > k, { cancel: true, timeoutMs: 60000 });
      if (back === 'ok') break;
      await say('對手離開了，這場不算。');
      return;
    }
    const raw = [];
    raw[mySide] = acts[k];
    raw[1 - mySide] = getOpp().acts[k];
    const step = stepActions(st, raw);
    clearText();
    await play(st.need.length ? replace(st, step) : runTurn(st, step));
  }

  if (st.winner === mySide) {
    G.pvp.w++;
    sfx('caught');
    await say('你贏了！人類就是要這樣養。');
  } else if (st.winner === -1) {
    G.pvp.d++;
    await say('平手。雙方的人類都累倒了。');
  } else {
    G.pvp.l++;
    await say('你輸了……回養殖場再練練吧。');
  }
  save();
}

// ───────── 啟動 ─────────
async function boot() {
  await Promise.all([loadFont(), loadArt()]);
  requestAnimationFrame(render);
  // 檢查美術用：網址加 ?test-battle=代號，直接跟那隻人類打
  const t = new URLSearchParams(location.search).get('test-battle');
  if (t && HUMANS[t]) {
    if (!load()) newGame('PIG');
    AREAS.__TEST = { name: '測試', encounters: [{ species: t, weight: 1, levels: [5, 5] }] };
    return wildBattle('__TEST');
  }
  titleScreen();
}
boot();

// 自動測試用：網址加上 #debug 才會開放
if (location.hash === '#debug') {
  window.__cth = {
    G,
    DATA_VERSION,
    data: { ANIMALS, HUMANS },
    get scene() { return scene; },
    get menu() { return UI.menu?.items; },
    get text() { return UI.text?.lines.join(''); },
    get battle() { return B; },
  };
}
