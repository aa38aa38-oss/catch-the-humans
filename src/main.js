// 遊戲主程式：畫面、操作、場景流程。規則在 battle.js / capture.js，資料在 data/。
import { createAnimal, createWildHuman, runTurn, gainExp, expReward, expToNext, restore, fill, pick, calcStats } from './battle.js';
import { createCapture, press, update } from './capture.js';
import { ANIMALS, ANIMAL_ORDER } from './data/animals.js';
import { HUMANS, GRADES, GENERIC_CAUGHT } from './data/humans.js';
import { MOVES } from './data/moves.js';
import { TEXT } from './data/text.js';
import { ELEMENT_NAMES } from './elements.js';
import { getSprite, SIZE } from './sprites.js';

// ───────── 畫面 ─────────
// 內部畫布 320×288（GB 160×144 的兩倍，讓中文字清楚），再整體放大到螢幕。
const W = 320, H = 288;
const cv = document.getElementById('screen');
const ctx = cv.getContext('2d');
const FONT = '16px "DotGothic16", "PingFang TC", "Noto Sans TC", "Microsoft JhengHei", sans-serif';
const BIG = '32px "DotGothic16", "PingFang TC", "Noto Sans TC", "Microsoft JhengHei", sans-serif';
const C = {
  bg: '#f6f4ea', ink: '#2c2c3c', soft: '#8a8c98', box: '#fdfcf6', line: '#d8d4c4',
  grass: '#cfdca8', grassDk: '#a9bf82', ball: '#f0648c', ballHi: '#ffd2df',
  hpG: '#46b45c', hpY: '#e6b632', hpR: '#e04848', exp: '#4c88e0', night: '#22202c',
  tight: '#f0648c', struggle: '#f08a2c',
};
const ELEMENT_COL = { FIRE: '#e45a32', EARTH: '#a8743a', WIND: '#4ea468', WATER: '#4686d8' };
const GRADE_COL = { CHOICE: '#7a6a58', PRIME: '#3c70c8', A5: '#d09a10' };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ease = (k) => 1 - (1 - k) * (1 - k);
function tween(ms, fn) {
  return new Promise((res) => {
    const t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / ms);
      fn(k);
      k < 1 ? requestAnimationFrame(step) : res();
    };
    requestAnimationFrame(step);
  });
}

// ───────── 音效（GB 方波嗶嗶聲）─────────
let ac = null;
let soundOn = true;
try { soundOn = localStorage.getItem('cth-sound') !== 'off'; } catch {}
const SFX = {
  blip: [[880, 0.04]], move: [[660, 0.03]], hit: [[160, 0.05], [90, 0.12]], throw: [[400, 0.06], [600, 0.12]],
  boing: [[220, 0.06], [440, 0.06], [330, 0.12]], squeeze: [[560, 0.03]], pop: [[300, 0.04], [80, 0.25]],
  caught: [[660, 0.1], [880, 0.1], [1320, 0.25]], faint: [[400, 0.1], [300, 0.1], [200, 0.3]], heal: [[520, 0.08], [780, 0.12]],
  rock: [[180, 0.06]],
};
function sfx(name) {
  if (!soundOn) return;
  try {
    ac ??= new (window.AudioContext || window.webkitAudioContext)();
    let t = ac.currentTime;
    for (const [f, d] of SFX[name]) {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = 'square';
      o.frequency.setValueAtTime(name === 'squeeze' ? f + Math.random() * 120 : f, t);
      g.gain.setValueAtTime(0.05, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g).connect(ac.destination);
      o.start(t);
      o.stop(t + d + 0.02);
      t += d;
    }
  } catch {}
}

// ───────── 操作 ─────────
const waiters = new Set();
function emit(key) {
  for (const w of [...waiters]) w(key);
}
function waitKey(keys) {
  return new Promise((res) => {
    const f = (k) => {
      if (keys.includes(k)) { waiters.delete(f); res(k); }
    };
    waiters.add(f);
  });
}
const KEYMAP = {
  ArrowUp: 'UP', ArrowDown: 'DOWN', ArrowLeft: 'LEFT', ArrowRight: 'RIGHT',
  w: 'UP', s: 'DOWN', a: 'LEFT', d: 'RIGHT',
  z: 'A', Z: 'A', ' ': 'A', Enter: 'A', j: 'A',
  x: 'B', X: 'B', Escape: 'B', Backspace: 'B', k: 'B',
};
window.addEventListener('keydown', (e) => {
  const k = KEYMAP[e.key];
  if (!k) return;
  e.preventDefault();
  if (!e.repeat) emit(k);
});
for (const btn of document.querySelectorAll('[data-key]')) {
  btn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    btn.classList.add('is-down');
    emit(btn.dataset.key);
  });
  const up = () => btn.classList.remove('is-down');
  btn.addEventListener('pointerup', up);
  btn.addEventListener('pointerleave', up);
  btn.addEventListener('pointercancel', up);
}
const soundBtn = document.getElementById('sound');
const syncSound = () => {
  soundBtn.textContent = soundOn ? '聲音 開' : '聲音 關';
  soundBtn.setAttribute('aria-pressed', String(soundOn));
};
soundBtn.addEventListener('click', () => {
  soundOn = !soundOn;
  try { localStorage.setItem('cth-sound', soundOn ? 'on' : 'off'); } catch {}
  syncSound();
});
syncSound();
document.addEventListener('contextmenu', (e) => e.preventDefault());

// ───────── 存檔（只存在這支手機的瀏覽器裡）─────────
const G = { animal: null, caught: [], nextNo: 1 };
function save() {
  try {
    const a = G.animal;
    localStorage.setItem('cth-save-v1', JSON.stringify({ animal: { id: a.id, level: a.level, exp: a.exp }, caught: G.caught, nextNo: G.nextNo }));
  } catch {}
}
function load() {
  try {
    const d = JSON.parse(localStorage.getItem('cth-save-v1'));
    if (!d?.animal || !ANIMALS[d.animal.id]) return false;
    G.animal = createAnimal(d.animal.id, d.animal.level);
    G.animal.exp = d.animal.exp;
    G.caught = d.caught ?? [];
    G.nextNo = d.nextNo ?? G.caught.length + 1;
    return true;
  } catch {
    return false;
  }
}
const hasSave = () => {
  try { return !!localStorage.getItem('cth-save-v1'); } catch { return false; }
};

// ───────── 文字框與選單 ─────────
let T = null; // 目前顯示的文字 { lines, n, total, arrow, x, width }
let M = null; // 目前的選單
const TEXT_X = 18, TEXT_W = 284;

function wrap(text, maxW) {
  ctx.font = FONT;
  const lines = [];
  let cur = '';
  for (const ch of text) {
    if (ch === '\n') { lines.push(cur); cur = ''; continue; }
    if (cur && ctx.measureText(cur + ch).width > maxW) { lines.push(cur); cur = ch; } else cur += ch;
  }
  if (cur) lines.push(cur);
  return lines;
}

function typeOut() {
  return new Promise((res) => {
    let skip = false;
    const f = (k) => { if (k === 'A' || k === 'B') skip = true; };
    waiters.add(f);
    const iv = setInterval(() => {
      T.n = skip ? T.total : T.n + 1;
      if (T.n >= T.total) { clearInterval(iv); waiters.delete(f); res(); }
    }, 30);
  });
}

/** 在文字框顯示一段話。wait=false 時打完字就繼續（用在選單提示） */
async function say(text, { wait = true, width = TEXT_W } = {}) {
  const lines = wrap(text, width);
  for (let i = 0; i < lines.length; i += 2) {
    const page = lines.slice(i, i + 2);
    T = { lines: page, n: 0, total: page.join('').length, arrow: false, width };
    await typeOut();
    if (wait || i + 2 < lines.length) {
      T.arrow = true;
      await waitKey(['A', 'B']);
      sfx('blip');
    }
  }
}

/** 直式選單，回傳選到的索引；按 B 取消回傳 -1 */
function menu(items, box, { cancel = true, rows = items.length } = {}) {
  return new Promise((res) => {
    M = { items, index: 0, top: 0, rows, ...box };
    const n = items.length;
    const f = (k) => {
      if (k === 'UP' || k === 'DOWN') {
        M.index = (M.index + (k === 'UP' ? -1 : 1) + n) % n;
        if (M.index < M.top) M.top = M.index;
        if (M.index >= M.top + rows) M.top = M.index - rows + 1;
        sfx('move');
      } else if (k === 'A') {
        waiters.delete(f);
        const i = M.index;
        M = null;
        sfx('blip');
        res(i);
      } else if (k === 'B' && cancel) {
        waiters.delete(f);
        M = null;
        res(-1);
      }
    };
    waiters.add(f);
  });
}

// ───────── 繪圖小工具 ─────────
function box(x, y, w, h) {
  ctx.fillStyle = C.box;
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(x + 2, y + 2, w - 4, h - 4, 6);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x + 7, y + 7, w - 14, h - 14, 3);
  ctx.stroke();
}
function text(s, x, y, col = C.ink, font = FONT, align = 'left') {
  ctx.font = font;
  ctx.fillStyle = col;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  ctx.fillText(s, x, y);
  ctx.textAlign = 'left';
}
function cursor(x, y) {
  ctx.fillStyle = C.ink;
  ctx.beginPath();
  ctx.moveTo(x, y + 2);
  ctx.lineTo(x + 8, y + 8);
  ctx.lineTo(x, y + 14);
  ctx.fill();
}
function sprite(id, x, y, scale = 4, { flip = false, alpha = 1 } = {}) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = alpha;
  if (flip) {
    ctx.translate(x + SIZE * scale, y);
    ctx.scale(-1, 1);
    ctx.drawImage(getSprite(id), 0, 0, SIZE * scale, SIZE * scale);
  } else ctx.drawImage(getSprite(id), x, y, SIZE * scale, SIZE * scale);
  ctx.restore();
}
function hpBar(x, y, w, hp, max) {
  const r = Math.max(0, hp / max);
  ctx.fillStyle = C.ink;
  ctx.fillRect(x - 2, y - 2, w + 4, 10);
  ctx.fillStyle = C.line;
  ctx.fillRect(x, y, w, 6);
  ctx.fillStyle = r > 0.5 ? C.hpG : r > 0.2 ? C.hpY : C.hpR;
  ctx.fillRect(x, y, Math.round(w * r), 6);
}
function chip(label, x, y, col) {
  ctx.font = FONT;
  const w = ctx.measureText(label).width + 8;
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.roundRect(x, y, w, 18, 3);
  ctx.fill();
  text(label, x + 4, y + 1, '#ffffff');
  return w;
}
function drawText() {
  if (!T) return;
  let left = T.n;
  T.lines.forEach((ln, i) => {
    const s = ln.slice(0, Math.max(0, left));
    left -= ln.length;
    text(s, TEXT_X, 210 + i * 32);
  });
  if (T.arrow && Math.floor(performance.now() / 400) % 2 === 0) {
    ctx.fillStyle = C.ink;
    ctx.beginPath();
    ctx.moveTo(292, 264); ctx.lineTo(304, 264); ctx.lineTo(298, 271);
    ctx.fill();
  }
}
function drawMenu() {
  if (!M) return;
  box(M.x, M.y, M.w, M.h);
  const shown = M.items.slice(M.top, M.top + M.rows);
  shown.forEach((it, i) => {
    const y = M.y + 14 + i * M.rowH;
    text(it, M.x + 30, y);
    if (M.top + i === M.index) cursor(M.x + 16, y);
  });
  if (M.items.length > M.rows) {
    const total = M.items.length;
    const h = M.h - 28;
    ctx.fillStyle = C.line;
    ctx.fillRect(M.x + M.w - 14, M.y + 14, 4, h);
    ctx.fillStyle = C.ink;
    ctx.fillRect(M.x + M.w - 14, M.y + 14 + (h * M.top) / total, 4, (h * M.rows) / total);
  }
  M.extra?.(M.index);
}
function ball(x, y, r, { alpha = 1, squash = 0 } = {}) {
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(x, y, r * (1 + squash), r * (1 - squash), 0, 0, Math.PI * 2);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = C.ball;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.lineWidth = r > 14 ? 4 : 3;
  ctx.strokeStyle = C.ink;
  ctx.stroke();
  ctx.globalAlpha = Math.min(1, alpha + 0.4);
  ctx.fillStyle = C.ballHi;
  ctx.beginPath();
  ctx.ellipse(x - r * 0.42, y - r * 0.42, r * 0.22, r * 0.14, -0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ───────── 場景狀態 ─────────
let scene = 'boot';
let B = null; // 戰鬥畫面狀態
let SEL = 0; // 選家畜的游標
let CARD = null; // 圖鑑卡
let fx = { flash: 0, stripes: 0, stars: [] };

const ENEMY_X = 196, ENEMY_Y = 2, PLAYER_X = 16, PLAYER_Y = 80;

function drawBattle(now) {
  const b = B;
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  // 草地
  ctx.fillStyle = C.grass;
  ctx.beginPath(); ctx.ellipse(252, 110, 62, 12, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(72, 186, 70, 12, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = C.grassDk;
  for (const [x, y] of [[214, 106], [276, 112], [240, 116], [40, 182], [96, 190], [70, 180]]) ctx.fillRect(x, y, 6, 2);

  const shakeX = b.shake ? Math.round(Math.sin(now / 20) * b.shake) : 0;
  ctx.save();
  ctx.translate(shakeX, 0);

  // 野生人類
  const e = b.enemy;
  const wobble = b.cap && !b.cap.result ? Math.sin(now / 35) * 3 * b.cap.wave * (0.4 + b.cap.struggle) : 0;
  if (b.eVis) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, 112);
    ctx.clip();
    const sc = b.eScale ?? 1;
    const sz = SIZE * 4 * sc;
    const cx = ENEMY_X + 56 + b.eX + wobble, cy = ENEMY_Y + 56;
    if (!b.eBlink || Math.floor(now / 70) % 2) sprite(e.id, cx - sz / 2, cy - sz / 2 + b.eDrop * 112, 4 * sc);
    ctx.restore();
  }
  // 寶貝球
  if (b.ball) {
    const k = b.ball;
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
      const squash = b.cap && !b.cap.result ? 0.07 * Math.sin(now / 45) * b.cap.wave + 0.06 * (b.squeeze ?? 0) : k.squash ?? 0;
      ball(k.x + (k.mode === 'wrap' ? wobble : 0), k.y, k.r, { alpha: k.mode === 'wrap' ? 0.42 : 1, squash });
    }
  }
  for (const s of fx.stars) {
    ctx.fillStyle = '#f8c838';
    ctx.fillRect(s.x - 2, s.y - 6, 4, 12);
    ctx.fillRect(s.x - 6, s.y - 2, 12, 4);
  }

  // 家畜
  if (b.pVis && (!b.pBlink || Math.floor(now / 70) % 2)) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, 192);
    ctx.clip();
    sprite(b.player.id, PLAYER_X + b.pX, PLAYER_Y + b.pDrop * 112, 4);
    ctx.restore();
  }
  ctx.restore();

  // 野生人類資訊
  if (b.showE) {
    box(6, 8, 178, 76);
    text(e.name, 20, 20);
    ctx.font = FONT;
    let x = 22 + ctx.measureText(e.name).width;
    chip(ELEMENT_NAMES[e.element], x, 19, ELEMENT_COL[e.element]);
    text(`Lv.${e.level}`, 20, 42);
    text(e.grade.name, 76, 42, GRADE_COL[e.grade.id]);
    if (e.grade.id === 'A5' && Math.floor(now / 300) % 2) {
      ctx.fillStyle = '#f8d040';
      ctx.fillRect(164, 40, 3, 9); ctx.fillRect(161, 43, 9, 3);
    }
    if (e.status) chip(e.status === 'sleep' ? '睡' : '燒', 150, 42, e.status === 'sleep' ? '#7a70b0' : '#d05030');
    hpBar(22, 66, 148, b.eHp, e.stats.hp);
  }
  // 家畜資訊
  if (b.showP) {
    const p = b.player;
    box(146, 108, 168, 82);
    text(p.name, 160, 120);
    text(`Lv.${p.level}`, 298, 120, C.ink, FONT, 'right');
    if (p.status) chip(p.status === 'sleep' ? '睡' : '燒', 186, 120, p.status === 'sleep' ? '#7a70b0' : '#d05030');
    hpBar(160, 144, 138, b.pHp, p.stats.hp);
    text(`${Math.ceil(b.pHp)}/${p.stats.hp}`, 298, 152, C.ink, FONT, 'right');
    ctx.fillStyle = C.line;
    ctx.fillRect(160, 174, 138, 3);
    ctx.fillStyle = C.exp;
    ctx.fillRect(160, 174, Math.round((138 * p.exp) / expToNext(p.level)), 3);
  }

  // 文字框
  box(0, 192, W, 96);
  if (b.cap) {
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
    bar('收緊', 232, b.cap.tight, C.tight);
    bar('掙扎', 256, b.cap.struggle, C.struggle);
  } else drawText();
  drawMenu();

  // 開場轉場：橫條閃爍
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
  // 被包在球裡的人類，輪流登場
  const ids = Object.keys(HUMANS);
  const id = ids[Math.floor(now / 2200) % ids.length];
  const bob = Math.sin(now / 300) * 3;
  sprite(id, 116, 72 + bob, 3);
  ball(160, 114 + bob, 50, { alpha: 0.4, squash: Math.sin(now / 160) * 0.04 });
  text('人類捕捉計畫', 160, 14, C.ink, BIG, 'center');
  text('CATCH  THE  HUMANS', 160, 50, C.ball, FONT, 'center');
  ANIMAL_ORDER.forEach((a, i) => sprite(a, 14 + i * 76, 196 + (i % 2) * 6, 2));
  if (!M && Math.floor(now / 500) % 2) text('按 A 開始', 160, 172, C.ink, FONT, 'center');
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
  const st = calcStats(a.base, 5);
  box(0, 114, W, 174);
  text(`${a.name}　${a.desc}`, 18, 128);
  const rows = [['體力', a.base.hp, st.hp], ['攻擊', a.base.atk, st.atk], ['防禦', a.base.def, st.def], ['速度', a.base.spd, st.spd]];
  rows.forEach(([n, base], i) => {
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
  if (G.animal) sprite(G.animal.id, 104, 50, 4);
  box(0, 192, W, 96);
  drawText();
}

function drawRanch(now) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = C.grass;
  ctx.fillRect(0, 92, W, 100);
  // 柵欄
  ctx.fillStyle = '#b08858';
  ctx.fillRect(0, 112, W, 5);
  ctx.fillRect(0, 130, W, 5);
  for (let x = 6; x < W; x += 28) ctx.fillRect(x, 102, 6, 40);
  text('人類牧場', 18, 14, C.ink, FONT);
  text(`已收服 ${G.caught.length} 隻`, 302, 14, C.soft, FONT, 'right');
  const a = G.animal;
  text(`${a.name}　Lv.${a.level}`, 18, 40);
  ctx.fillStyle = C.line;
  ctx.fillRect(18, 64, 120, 3);
  ctx.fillStyle = C.exp;
  ctx.fillRect(18, 64, Math.round((120 * a.exp) / expToNext(a.level)), 3);
  sprite(a.id, 196, 34, 3);
  // 牧場裡最近抓到的人類
  G.caught.slice(-5).forEach((c, i) => {
    const bob = Math.sin(now / 260 + i) * 2;
    sprite(c.id, 8 + i * 62, 136 + bob, 2);
  });
  box(0, 192, W, 96);
  drawText();
  drawMenu();
}

function drawCard() {
  const c = CARD;
  const h = HUMANS[c.id];
  const grade = GRADES.find((g) => g.id === c.gradeId);
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  box(0, 0, W, 192);
  text(`人類圖鑑　No.${String(h.no).padStart(3, '0')}`, 18, 16, C.soft);
  ctx.fillStyle = C.grass;
  ctx.beginPath(); ctx.roundRect(14, 40, 120, 120, 6); ctx.fill();
  sprite(c.id, 18, 44, 4);
  text(h.name, 148, 44);
  chip(`${ELEMENT_NAMES[h.element]}屬性`, 148, 70, ELEMENT_COL[h.element]);
  text('肉質', 148, 98, C.soft);
  text(grade.name, 196, 98, GRADE_COL[grade.id]);
  text(`Lv.${c.level}`, 148, 122);
  text(`出處：${h.origin}`, 148, 146, C.soft);
  if (c.no) text(`耳標 ${String(c.no).padStart(3, '0')}`, 302, 16, C.ink, FONT, 'right');
  box(0, 192, W, 96);
  drawText();
}

function render(now) {
  ctx.imageSmoothingEnabled = false;
  if (scene === 'title') drawTitle(now);
  else if (scene === 'select') drawSelect(now);
  else if (scene === 'story') drawStory(now);
  else if (scene === 'battle') drawBattle(now);
  else if (scene === 'ranch') drawRanch(now);
  else if (scene === 'card') drawCard(now);
  if (fx.flash > 0) {
    ctx.fillStyle = `rgba(255,255,255,${fx.flash})`;
    ctx.fillRect(0, 0, W, H);
  }
  requestAnimationFrame(render);
}

// ───────── 流程 ─────────
async function titleScreen() {
  scene = 'title';
  T = null;
  if (hasSave()) {
    await waitKey(['A']);
    sfx('blip');
    const i = await menu(['繼續', '重新開始'], { x: 96, y: 128, w: 128, h: 72, rowH: 26 }, { cancel: false });
    if (i === 0 && load()) return ranch();
  } else {
    await waitKey(['A']);
    sfx('blip');
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
  G.animal = createAnimal(ANIMAL_ORDER[SEL], 5);
  G.caught = [];
  G.nextNo = 1;
  save();
  scene = 'story';
  const v = { animal: G.animal.name };
  await say(fill('{animal}被人類養了一輩子。每天吃飽、睡飽，等著被吃。', v));
  await say('直到今天早上，牠聽見主人在講電話：「明天就送去。」');
  await say(fill('{animal}決定，換一下立場。', v));
  await say('這一次，輪到人類被圈養。');
  return battle();
}

async function ranch() {
  scene = 'ranch';
  T = null;
  for (;;) {
    await say('要做什麼？', { wait: false, width: 150 });
    const i = await menu(['出發狩獵', '查看牧場', '回標題'], { x: 170, y: 192, w: 150, h: 96, rowH: 26 }, { cancel: false });
    if (i === 0) return battle();
    if (i === 1) {
      if (!G.caught.length) {
        await say('牧場裡還是空的。快去抓第一隻人類吧。');
        continue;
      }
      const items = G.caught.map((c) => `${String(c.no).padStart(3, '0')} ${HUMANS[c.id].name}　${GRADES.find((g) => g.id === c.gradeId).name}`);
      T = null;
      const j = await menu(items, { x: 0, y: 0, w: W, h: 192, rowH: 32, rows: 5 });
      if (j >= 0) await showCard(G.caught[j]);
      scene = 'ranch';
    }
    if (i === 2) return titleScreen();
  }
}

async function showCard(entry, line) {
  CARD = entry;
  scene = 'card';
  if (line) await say(line);
  await say(HUMANS[entry.id].dex);
}

async function play(events) {
  for (const e of events) {
    const isE = e.side === 'enemy';
    if (e.t === 'text') await say(e.text);
    else if (e.t === 'lunge') {
      const dir = isE ? -1 : 1;
      await tween(180, (k) => {
        const v = Math.sin(k * Math.PI) * 14 * dir;
        isE ? (B.eX = v) : (B.pX = v);
      });
    } else if (e.t === 'hit' || e.t === 'hp') {
      if (e.t === 'hit') {
        sfx('hit');
        if (e.mult > 1) B.shake = 4;
        isE ? (B.eBlink = true) : (B.pBlink = true);
        await sleep(360);
        B.eBlink = B.pBlink = false;
        B.shake = 0;
      } else sfx('heal');
      const from = isE ? B.eHp : B.pHp;
      await tween(Math.min(700, 120 + Math.abs(from - e.hp) * 30), (k) => {
        const v = from + (e.hp - from) * k;
        isE ? (B.eHp = v) : (B.pHp = v);
      });
    } else if (e.t === 'faint') {
      sfx('faint');
      await tween(400, (k) => (isE ? (B.eDrop = k) : (B.pDrop = k)));
    }
  }
}

async function battle() {
  const p = G.animal;
  const e = createWildHuman(p.level);
  B = { player: p, enemy: e, pHp: p.hp, eHp: e.hp, eX: -260, pX: 260, eDrop: 0, pDrop: 0, eVis: true, pVis: true, showE: false, showP: false, ball: null, cap: null };
  T = null;
  scene = 'battle';
  for (let i = 0; i < 3; i++) {
    await tween(110, (k) => (fx.flash = 1 - k));
  }
  await tween(500, (k) => (fx.stripes = k));
  await tween(400, (k) => (fx.stripes = 1 - k));
  fx.stripes = 0;
  await tween(700, (k) => {
    B.eX = -260 * (1 - ease(k));
    B.pX = 260 * (1 - ease(k));
  });
  B.showE = true;
  const v = { animal: p.name, human: e.name };
  await say(fill(pick(HUMANS[e.id].lines.appear), v));
  B.showP = true;

  for (;;) {
    await say(fill(TEXT.whatToDo, v), { wait: false, width: 150 });
    const act = await menu(['技能', '寶貝球', '逃跑'], { x: 176, y: 192, w: 144, h: 96, rowH: 26 }, { cancel: false });
    if (act === 0) {
      T = null;
      const mi = await menu(p.moves.map((m) => MOVES[m].name), {
        x: 0, y: 192, w: W, h: 96, rowH: 30,
        extra: (i) => {
          const m = MOVES[p.moves[i]];
          text(m.kind === 'attack' ? `威力 ${m.power}` : '變化技', 210, 206, C.soft);
          text(`命中 ${m.accuracy}`, 210, 236, C.soft);
        },
      });
      if (mi < 0) continue;
      const { events, winner } = runTurn(p, e, p.moves[mi]);
      await play(events);
      if (winner === 'player') {
        for (const s of TEXT.humanFainted) await say(fill(s, v));
        return afterBattle(expReward(e));
      }
      if (winner === 'enemy') {
        for (const s of TEXT.playerFainted) await say(fill(s, v));
        return afterBattle(0);
      }
    } else if (act === 1) {
      const r = await capture(e);
      if (r === 'caught') {
        const entry = { id: e.id, level: e.level, gradeId: e.grade.id, no: G.nextNo++ };
        G.caught.push(entry);
        const lines = [...HUMANS[e.id].lines.caught, ...GENERIC_CAUGHT];
        const line = fill(pick(lines), { ...v, grade: e.grade.name, no: String(entry.no).padStart(3, '0') });
        await showCard(entry, line);
        scene = 'battle';
        return afterBattle(expReward(e));
      }
      await say(fill(pick(HUMANS[e.id].lines.escape), v));
      return afterBattle(0);
    } else {
      await say(TEXT.run);
      return afterBattle(0);
    }
  }
}

async function capture(e) {
  const v = { animal: G.animal.name };
  await say(fill(TEXT.throwBall, v), { wait: false });
  await sleep(250);
  sfx('throw');
  const sx = 96, sy = 150, tx = ENEMY_X + 56, ty = ENEMY_Y + 58;
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
    strength: HUMANS[e.id].strength,
    gradeStruggle: e.grade.struggle,
  });
  T = null;
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

  if (result === 'caught') {
    const r0 = B.ball.r;
    await tween(380, (k) => {
      B.ball.r = r0 + (9 - r0) * ease(k);
      B.eScale = Math.max(0.05, B.ball.r / 62);
    });
    B.eVis = false;
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
  await tween(450, (k) => (B.eX = k * 200));
  B.eVis = false;
  return 'escaped';
}

async function afterBattle(exp) {
  const a = G.animal;
  if (exp > 0 && a.hp > 0) {
    await say(fill(TEXT.expGain, { animal: a.name, exp }));
    for (const lv of gainExp(a, exp)) {
      sfx('caught');
      await say(fill(TEXT.levelUp, { animal: a.name, level: lv }));
    }
  }
  restore(a);
  save();
  return ranch();
}

// ───────── 啟動 ─────────
async function boot() {
  try {
    await Promise.race([document.fonts.load(FONT, '人類捕捉'), sleep(2500)]);
  } catch {}
  requestAnimationFrame(render);
  titleScreen();
}
boot();

// 自動測試用：網址加上 #debug 才會開放
if (location.hash === '#debug') {
  window.__cth = {
    G,
    get scene() { return scene; },
    get menu() { return M?.items; },
    get text() { return T?.lines.join(''); },
    get battle() { return B; },
  };
}
