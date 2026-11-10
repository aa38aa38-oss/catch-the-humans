// 遊戲流程：標題、選家畜、牧場、隊伍、野生戰鬥、連線 PK。
// 規則在 battle.js / capture.js / pvp.js，資料在 data/，畫面工具在 ui.js。
import {
  createBattle, runTurn, replace, chooseAiAction, active, aliveSlots, gainExp, expReward, expToNext,
  fill, pick, tag, rollWild,
} from './battle.js';
import { createCapture, press, update } from './capture.js';
import { ANIMALS, HUMANS, GRADES, MOVES, AREAS, gradeOf, DATA_VERSION } from './data/index.js';
import { ANIMAL_ORDER } from './data/animals.js';
import { GENERIC_CAUGHT } from './data/humans.js';
import { TEXT } from './data/text.js';
import { ELEMENT_NAMES } from './elements.js';
import { createIndividual, nameOf } from './individual.js';
import { canConnect, openRoom } from './net.js';
import { myPresence, checkOpponent, setupBattle, encodeAct, mustChoose, stepActions } from './pvp.js';
import { randomId } from './rng.js';
import { G, save, load, hasSave, newGame, teamInds, findHuman, TEAM_HUMANS } from './save.js';
import { SIZE } from './sprites.js';
import {
  W, H, ctx, C, ELEMENT_COL, GRADE_COL, BIG, FONT, UI, TEXT_X, sleep, ease, tween, loadFont, sfx, waiters, waitKey,
  waitUntil, say, show, clearText, menu, box, text, chip, sprite, hpBar, drawText, drawMenu, ball,
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
  top: { x: 196, y: 2, clip: 112 },
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
    box(146, 108, 168, 82);
    text(f.name, 160, 120);
    text(`Lv.${f.level}`, 298, 120, C.ink, FONT, 'right');
    ctx.font = FONT;
    if (f.element) chip(ELEMENT_NAMES[f.element], 162 + ctx.measureText(f.name).width, 119, ELEMENT_COL[f.element]);
    else statusChip(186, 120);
    hpBar(160, 144, 138, v.hp, f.stats.hp);
    text(`${Math.ceil(v.hp)}/${f.stats.hp}`, 298, 152, C.ink, FONT, 'right');
    const ind = B.st.mode === 'wild' && (f.uid === G.animal.uid ? G.animal : findHuman(f.uid));
    if (ind) {
      ctx.fillStyle = C.line;
      ctx.fillRect(160, 174, 138, 3);
      ctx.fillStyle = C.exp;
      ctx.fillRect(160, 174, Math.round((138 * ind.exp) / expToNext(ind.level)), 3);
    }
  }
}

function drawBattle(now) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = C.grass;
  ctx.beginPath(); ctx.ellipse(252, 110, 62, 12, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(72, 186, 70, 12, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = C.grassDk;
  for (const [x, y] of [[214, 106], [276, 112], [240, 116], [40, 182], [96, 190], [70, 180]]) ctx.fillRect(x, y, 6, 2);

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
      const x = top ? 20 + i * 12 : 160 + i * 12;
      const y = top ? 88 : 98;
      if (B.view[s].info) ctx.fillRect(x, y, 8, 8);
    });
  }

  box(0, 192, W, 96);
  if (B.cap) {
    text('連打 A！把球收緊！', TEXT_X, 206);
    const bar = (label, y, v, col) => {
      text(label, TEXT_X, y);
      ctx.fillStyle = C.ink;
      ctx.fillRect(66, y + 2, 236, 14);
      ctx.fillStyle = C.line;
      ctx.fillRect(68, y + 4, 232, 10);
      ctx.fillStyle = col;
      ctx.fillRect(68, y + 4, Math.round(232 * v), 10);
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
  sprite(id, 116, 72 + bob, 3);
  ball(160, 114 + bob, 50, { alpha: 0.4, squash: Math.sin(now / 160) * 0.04 });
  text('人類捕捉計畫', 160, 14, C.ink, BIG, 'center');
  text('CATCH  THE  HUMANS', 160, 50, C.ball, FONT, 'center');
  ANIMAL_ORDER.forEach((a, i) => sprite(a, 14 + i * 76, 196 + (i % 2) * 6, 2));
  if (!UI.menu && Math.floor(now / 500) % 2) text('按 A 開始', 160, 172, C.ink, FONT, 'center');
  drawMenu();
}

function drawSelect(now) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  text('選擇你的家畜', 160, 10, C.ink, FONT, 'center');
  ANIMAL_ORDER.forEach((id, i) => {
    const x = 8 + i * 77, y = 34;
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
  text('技能', 202, 154, C.soft);
  a.moves.forEach((m, i) => text(MOVES[m].name, 202, 176 + i * 22));
  text('◀ ▶ 選擇　A 決定', 160, 250, C.soft, FONT, 'center');
  drawMenu();
}

function drawStory() {
  ctx.fillStyle = C.night;
  ctx.fillRect(0, 0, W, H);
  if (G.animal) sprite(G.animal.species, 104, 50, 4);
  box(0, 192, W, 96);
  drawText();
}

function drawRanch(now) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = C.grass;
  ctx.fillRect(0, 92, W, 100);
  ctx.fillStyle = '#b08858';
  ctx.fillRect(0, 112, W, 5);
  ctx.fillRect(0, 130, W, 5);
  for (let x = 6; x < W; x += 28) ctx.fillRect(x, 102, 6, 40);
  text('人類牧場', 18, 14);
  text(`已收服 ${G.humans.length} 隻`, 302, 14, C.soft, FONT, 'right');
  const a = G.animal;
  text(`${nameOf(a)}　Lv.${a.level}`, 18, 40);
  ctx.fillStyle = C.line;
  ctx.fillRect(18, 64, 120, 3);
  ctx.fillStyle = C.exp;
  ctx.fillRect(18, 64, Math.round((120 * a.exp) / expToNext(a.level)), 3);
  const { w, l } = G.pvp;
  if (w + l) text(`PK ${w}勝${l}敗`, 18, 72, C.soft);
  sprite(a.species, 196, 34, 3);
  teamInds().slice(1).forEach((h, i) => {
    const bob = Math.sin(now / 260 + i) * 2;
    sprite(h.species, 8 + i * 62, 136 + bob, 2);
  });
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
  text('肉質', 148, 98, C.soft);
  text(grade.name, 196, 98, GRADE_COL[grade.id]);
  text(`Lv.${c.level}`, 148, 122);
  text(`出處：${h.origin}`, 148, 146, C.soft);
  if (c.no) text(`耳標 ${pad3(c.no)}`, 302, 16, C.ink, FONT, 'right');
  box(0, 192, W, 96);
  drawText();
}

function drawLobby(now) {
  ctx.fillStyle = C.night;
  ctx.fillRect(0, 0, W, H);
  text('連線對戰', 18, 12, '#f6f4ea');
  text('Lv.50 公平賽', 302, 12, C.soft, FONT, 'right');
  const L0 = LOBBY;
  if (L0) {
    text('房號', 160, 40, C.soft, FONT, 'center');
    L0.digits.forEach((d, i) => {
      const x = 96 + i * 34;
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
    teamInds().forEach((ind, i) => sprite(ind.species, 22 + i * 58, 134, 2));
  }
  box(0, 192, W, 96);
  drawText();
  drawMenu();
}

function render(now) {
  ctx.imageSmoothingEnabled = false;
  const draw = { title: drawTitle, select: drawSelect, story: drawStory, battle: drawBattle, ranch: drawRanch, card: drawCard, lobby: drawLobby }[scene];
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
  if (hasSave()) {
    const i = await menu(['繼續', '重新開始'], { x: 96, y: 128, w: 128, h: 72, rowH: 26 }, { cancel: false });
    if (i === 0 && load()) return ranch();
  }
  return selectAnimal();
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
  return wildBattle();
}

// ───────── 牧場、隊伍、圖鑑 ─────────
async function ranch() {
  scene = 'ranch';
  clearText();
  for (;;) {
    scene = 'ranch';
    show('要做什麼？', 140);
    const i = await menu(['出發狩獵', '隊伍', '人類圖鑑', '連線對戰', '回標題'], { x: 160, y: 120, w: 160, h: 168, rowH: 28 }, { cancel: false });
    clearText();
    if (i === 0) return wildBattle();
    if (i === 1) await teamScreen();
    if (i === 2) await dexScreen();
    if (i === 3) await pvpLobby();
    if (i === 4) return titleScreen();
  }
}

const humanLabel = (h) => `${pad3(h.no)} ${nameOf(h)} Lv${h.level}`;

async function teamScreen() {
  for (;;) {
    scene = 'ranch';
    const slots = [`${nameOf(G.animal)} Lv${G.animal.level}（固定）`];
    for (let i = 0; i < TEAM_HUMANS; i++) {
      const h = findHuman(G.team[i]);
      slots.push(h ? humanLabel(h) : '（空位）');
    }
    show('選擇要更換的位置。');
    const i = await menu(slots, { x: 0, y: 0, w: W, h: 192, rowH: 32 });
    if (i < 0) return;
    if (i === 0) {
      await say('家畜是你的代表，一定要在隊上。');
      continue;
    }
    const current = G.team[i - 1];
    const pool = G.humans.filter((h) => !G.team.includes(h.uid));
    const options = pool.map(humanLabel);
    if (current) options.unshift('移出隊伍');
    if (!options.length) {
      await say('牧場裡沒有其他人類了。');
      continue;
    }
    show('要換誰？');
    const j = await menu(options, { x: 0, y: 0, w: W, h: 192, rowH: 32, rows: 5 });
    if (j < 0) continue;
    if (current && j === 0) G.team.splice(i - 1, 1);
    else {
      const pickH = pool[current ? j - 1 : j];
      if (current) G.team[i - 1] = pickH.uid;
      else G.team.push(pickH.uid);
    }
    save();
  }
}

async function dexScreen() {
  if (!G.humans.length) {
    await say('牧場裡還是空的。快去抓第一隻人類吧。');
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
  clearText();
  const i = await menu(f.moves.map((m) => MOVES[m].name), {
    x: 0, y: 192, w: W, h: 96, rowH: 30,
    extra: (idx) => {
      const m = MOVES[f.moves[idx]];
      const el = m.element ? `${ELEMENT_NAMES[m.element]}屬性` : '無屬性';
      text(el, 210, 206, C.soft);
      text(m.kind === 'attack' ? `威力 ${m.power}` : '變化技', 210, 236, C.soft);
    },
  });
  return i < 0 ? null : { type: 'move', index: i };
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

// ───────── 野生戰鬥 ─────────
async function wildBattle() {
  const w = rollWild(AREAS[G.area], Math.random, GRADES);
  const wild = createIndividual('human', w.species, w.level, w.gradeId);
  const st = createBattle({ mode: 'wild', seed: (Math.random() * 2 ** 32) >>> 0, teams: [teamInds(), [wild]] });
  startBattleView(st, 0);
  const joined = new Set([active(st, 0).uid]);
  B.onSwitch = (s, f) => s === 0 && joined.add(f.uid);
  await battleIntro();
  B.view[1].info = true;
  const e = active(st, 1);
  const v = { animal: nameOf(G.animal), human: e.name };
  await say(fill(pick(HUMANS[e.species].lines.appear), v));
  B.view[0].info = true;

  for (;;) {
    const me = active(st, 0);
    show(`${me.name}\n要做什麼？`, 140);
    const act = await menu(['技能', '換人', '寶貝球', '逃跑'], { x: 152, y: 192, w: 168, h: 96, rowH: 34, cols: 2, colW: 74 }, { cancel: false });
    let action = null;
    if (act === 0) action = await chooseMove();
    else if (act === 1) {
      const slot = await chooseMember();
      if (slot !== null) action = { type: 'switch', slot };
    } else if (act === 2) {
      const r = await capture(e);
      if (r === 'caught') {
        const ind = createIndividual('human', e.species, e.level, e.gradeId, { no: G.nextNo++ });
        G.humans.push(ind);
        const lines = [...HUMANS[e.species].lines.caught, ...GENERIC_CAUGHT];
        await showCard(ind, fill(pick(lines), { ...v, grade: gradeOf(e.gradeId).name, no: pad3(ind.no) }));
        if (G.team.length < TEAM_HUMANS) {
          G.team.push(ind.uid);
          await say(`${e.name}加入了隊伍！`);
        } else await say(`隊伍滿了。${e.name}被送進牧場。`);
        scene = 'battle';
        return afterWild(joined, expReward(e));
      }
      await say(fill(pick(HUMANS[e.species].lines.escape), v));
      return afterWild(joined, 0);
    } else {
      await say(TEXT.run);
      return afterWild(joined, 0);
    }
    if (!action) continue;

    await play(runTurn(st, [action, chooseAiAction(st, 1)]));
    if (st.winner === 0) {
      for (const s of TEXT.humanFainted.slice(1)) await say(fill(s, v));
      return afterWild(joined, expReward(e));
    }
    if (st.winner === 1) {
      for (const s of TEXT.playerFainted.slice(1)) await say(fill(s, v));
      return afterWild(joined, 0);
    }
    if (st.need.includes(0)) {
      const slot = await chooseMember({ forced: true });
      await play(replace(st, [slot, null]));
    }
  }
}

/** 野生戰鬥結束：沒倒下的參戰者都拿經驗值，然後全隊回滿血 */
async function afterWild(joined, exp) {
  scene = 'battle';
  if (exp > 0) {
    for (const f of B.st.sides[0].team) {
      if (!joined.has(f.uid) || f.hp <= 0) continue;
      const ind = f.uid === G.animal.uid ? G.animal : findHuman(f.uid);
      if (!ind) continue;
      await say(fill(TEXT.expGain, { animal: f.name, exp }));
      for (const lv of gainExp(ind, exp)) {
        sfx('caught');
        await say(fill(TEXT.levelUp, { animal: f.name, level: lv }));
      }
    }
  }
  save();
  return ranch();
}

async function capture(e) {
  await say(fill(TEXT.throwBall, { animal: active(B.st, 0).name }), { wait: false });
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

  const cap = createCapture({
    hpRatio: e.hp / e.stats.hp,
    asleep: e.status === 'sleep',
    strength: HUMANS[e.species].strength,
    gradeStruggle: gradeOf(e.gradeId).struggle,
  });
  clearText();
  B.cap = cap;
  B.squeeze = 0;
  await sleep(400);
  const result = await new Promise((res) => {
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
  await tween(450, (k) => (v.x = k * 200));
  v.vis = false;
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
  if (i === 0) LOBBY.digits = [0, 0, 0, 0].map(() => Math.floor(Math.random() * 10));
  else if (!(await chooseCode())) { LOBBY = null; return; }
  const code = LOBBY.digits.join('');

  let opp = null;
  const conn = await openRoom(code, (p) => (opp = p));
  if (!conn) {
    await say('連不上房間，請稍後再試。');
    LOBBY = null;
    return;
  }
  const nonce = randomId(12);
  const mine = myPresence({ nonce, team: teamInds() });
  conn.setMine(mine);
  try {
    for (;;) {
      show(`房號 ${code}。把房號告訴朋友，等待對手加入……（B 離開）`);
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
    await say('你輸了……回牧場再練練吧。');
  }
  save();
}

// ───────── 啟動 ─────────
async function boot() {
  await loadFont();
  requestAnimationFrame(render);
  titleScreen();
}
boot();

// 自動測試用：網址加上 #debug 才會開放
if (location.hash === '#debug') {
  window.__cth = {
    G,
    DATA_VERSION,
    get scene() { return scene; },
    get menu() { return UI.menu?.items; },
    get text() { return UI.text?.lines.join(''); },
    get battle() { return B; },
  };
}
