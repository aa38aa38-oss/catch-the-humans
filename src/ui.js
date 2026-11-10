// 畫面與操作的共用工具：畫布、按鍵、文字框、選單、音效、繪圖小工具。
// 之後加地圖畫面、商店畫面時都共用這些。
import { getSprite, SIZE } from './sprites.js';

// ───────── 畫布 ─────────
// 內部畫布 320×288（GB 160×144 的兩倍，讓中文字清楚），再整體放大到螢幕。
export const W = 320, H = 288;
const cv = document.getElementById('screen');
export const ctx = cv.getContext('2d');
const FAMILY = '"DotGothic16", "PingFang TC", "Noto Sans TC", "Microsoft JhengHei", sans-serif';
export const FONT = `16px ${FAMILY}`;
export const BIG = `32px ${FAMILY}`;
export const C = {
  bg: '#f6f4ea', ink: '#2c2c3c', soft: '#8a8c98', box: '#fdfcf6', line: '#d8d4c4',
  grass: '#cfdca8', grassDk: '#a9bf82', ball: '#f0648c', ballHi: '#ffd2df',
  hpG: '#46b45c', hpY: '#e6b632', hpR: '#e04848', exp: '#4c88e0', night: '#22202c',
  tight: '#f0648c', struggle: '#f08a2c', win: '#d09a10',
};
export const ELEMENT_COL = { FIRE: '#e45a32', EARTH: '#a8743a', WIND: '#4ea468', WATER: '#4686d8' };
export const GRADE_COL = { CHOICE: '#7a6a58', PRIME: '#3c70c8', A5: '#d09a10' };

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const ease = (k) => 1 - (1 - k) * (1 - k);
export function tween(ms, fn) {
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
export async function loadFont() {
  try {
    await Promise.race([document.fonts.load(FONT, '人類捕捉'), sleep(2500)]);
  } catch {}
}

// ───────── 音效（GB 方波嗶嗶聲）─────────
let ac = null;
let soundOn = true;
try { soundOn = localStorage.getItem('cth-sound') !== 'off'; } catch {}
const SFX = {
  blip: [[880, 0.04]], move: [[660, 0.03]], hit: [[160, 0.05], [90, 0.12]], throw: [[400, 0.06], [600, 0.12]],
  boing: [[220, 0.06], [440, 0.06], [330, 0.12]], squeeze: [[560, 0.03]], pop: [[300, 0.04], [80, 0.25]],
  caught: [[660, 0.1], [880, 0.1], [1320, 0.25]], faint: [[400, 0.1], [300, 0.1], [200, 0.3]], heal: [[520, 0.08], [780, 0.12]],
  rock: [[180, 0.06]], ping: [[990, 0.06], [1480, 0.1]],
};
export function sfx(name) {
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

// ───────── 按鍵 ─────────
export const waiters = new Set();
export function emit(key) {
  for (const w of [...waiters]) w(key);
}
export function waitKey(keys) {
  return new Promise((res) => {
    const f = (k) => {
      if (keys.includes(k)) { waiters.delete(f); res(k); }
    };
    waiters.add(f);
  });
}
/** 每 100ms 檢查一次條件，直到成立（'ok'）、按 B 取消（'cancel'）或逾時（'timeout'） */
export async function waitUntil(pred, { cancel = false, timeoutMs = 0 } = {}) {
  let cancelled = false;
  const f = (k) => { if (cancel && k === 'B') cancelled = true; };
  waiters.add(f);
  try {
    const t0 = performance.now();
    for (;;) {
      if (pred()) return 'ok';
      if (cancelled) return 'cancel';
      if (timeoutMs && performance.now() - t0 > timeoutMs) return 'timeout';
      await sleep(100);
    }
  } finally {
    waiters.delete(f);
  }
}
const KEYMAP = {
  ArrowUp: 'UP', ArrowDown: 'DOWN', ArrowLeft: 'LEFT', ArrowRight: 'RIGHT',
  w: 'UP', s: 'DOWN', a: 'LEFT', d: 'RIGHT',
  z: 'A', Z: 'A', ' ': 'A', Enter: 'A', j: 'A',
  x: 'B', X: 'B', Escape: 'B', Backspace: 'B', k: 'B',
};
// 按住方向鍵（地圖走路用）：記住目前按著的方向，最後按下的優先
const DIRS = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
const held = [];
let tapped = null; // 很快按一下就放開的方向，也要算走一步
const hold = (k) => { if (DIRS.includes(k)) { tapped = k; if (!held.includes(k)) held.push(k); } };
const release = (k) => { const i = held.indexOf(k); if (i >= 0) held.splice(i, 1); };
/** 目前要走的方向：按住的方向優先，沒有的話看剛剛有沒有點一下 */
export function heldDir() {
  const d = held.at(-1) ?? tapped;
  tapped = null;
  return d ?? null;
}
export const clearTap = () => (tapped = null);
window.addEventListener('keydown', (e) => {
  const k = KEYMAP[e.key];
  if (!k) return;
  e.preventDefault();
  if (!e.repeat) { hold(k); emit(k); }
});
window.addEventListener('keyup', (e) => {
  const k = KEYMAP[e.key];
  if (k) release(k);
});
window.addEventListener('blur', () => (held.length = 0));
// ───────── 搖桿：外觀是十字鍵，用起來像手遊的虛擬搖桿 ─────────
// 在左半邊任何地方按下都算，以十字鍵中心為圓心，手指往哪推就往哪走；按住不放可以直接滑動換方向。
const zone = document.querySelector('.left');
const pad = document.querySelector('.dpad');
if (zone && pad) {
  const thumb = pad.querySelector('.thumb');
  const arms = Object.fromEntries([...pad.querySelectorAll('[data-key]')].map((b) => [b.dataset.key, b]));
  let pid = null;
  let cur = null;
  const setDir = (d) => {
    if (d === cur) return;
    if (cur) { release(cur); arms[cur]?.classList.remove('is-down'); }
    cur = d;
    if (d) { hold(d); emit(d); arms[d]?.classList.add('is-down'); }
  };
  const update = (e) => {
    const r = pad.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    const dist = Math.hypot(dx, dy);
    const max = r.width / 2;
    const k = dist > max ? max / dist : 1;
    thumb.style.transform = `translate(${dx * k}px, ${dy * k}px)`;
    if (dist < r.width * 0.14) return setDir(null); // 中間的不動區
    const ax = Math.abs(dx), ay = Math.abs(dy);
    // 推到斜角時維持原本的方向，避免在兩個方向之間亂跳
    if (cur && (cur === 'LEFT' || cur === 'RIGHT' ? ax >= ay * 0.7 && Math.sign(dx) === (cur === 'RIGHT' ? 1 : -1)
      : ay >= ax * 0.7 && Math.sign(dy) === (cur === 'DOWN' ? 1 : -1))) return;
    setDir(ax > ay ? (dx > 0 ? 'RIGHT' : 'LEFT') : dy > 0 ? 'DOWN' : 'UP');
  };
  zone.addEventListener('pointerdown', (e) => {
    if (pid !== null) return;
    e.preventDefault();
    pid = e.pointerId;
    zone.setPointerCapture?.(pid);
    thumb.classList.add('on');
    update(e);
  });
  zone.addEventListener('pointermove', (e) => { if (e.pointerId === pid) update(e); });
  const end = (e) => {
    if (e.pointerId !== pid) return;
    pid = null;
    setDir(null);
    thumb.classList.remove('on');
    thumb.style.transform = '';
  };
  zone.addEventListener('pointerup', end);
  zone.addEventListener('pointercancel', end);
  zone.addEventListener('lostpointercapture', end);
}

for (const btn of document.querySelectorAll('[data-key]')) {
  if (btn.closest('.dpad')) continue; // 十字鍵交給搖桿處理
  btn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    btn.classList.add('is-down');
    hold(btn.dataset.key);
    emit(btn.dataset.key);
  });
  const up = () => { btn.classList.remove('is-down'); release(btn.dataset.key); };
  btn.addEventListener('pointerup', up);
  btn.addEventListener('pointerleave', up);
  btn.addEventListener('pointercancel', up);
}
document.addEventListener('contextmenu', (e) => e.preventDefault());

// ───────── 文字框 ─────────
export const UI = { text: null, menu: null };
export const TEXT_X = 18, TEXT_W = 284;

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
      const T = UI.text;
      T.n = skip ? T.total : T.n + 1;
      if (T.n >= T.total) { clearInterval(iv); waiters.delete(f); res(); }
    }, 30);
  });
}

/** 在文字框顯示一段話。wait=false 時打完字就繼續（用在選單提示） */
export async function say(text, { wait = true, width = TEXT_W } = {}) {
  const lines = wrap(text, width);
  for (let i = 0; i < lines.length; i += 2) {
    const page = lines.slice(i, i + 2);
    UI.text = { lines: page, n: 0, total: page.join('').length, arrow: false };
    await typeOut();
    if (wait || i + 2 < lines.length) {
      UI.text.arrow = true;
      await waitKey(['A', 'B']);
      sfx('blip');
    }
  }
}
/** 立刻顯示文字（不打字、不等按鍵），用在「等待中……」之類的狀態 */
export function show(text, width = TEXT_W) {
  const lines = wrap(text, width).slice(0, 2);
  UI.text = { lines, n: lines.join('').length, total: lines.join('').length, arrow: false };
}
export const clearText = () => (UI.text = null);

/**
 * 選單。box: {x, y, w, h, rowH, cols?, colW?, rows?, extra?}
 * 回傳選到的索引；按 B 取消回傳 -1
 */
export function menu(items, box, { cancel = true, start = 0 } = {}) {
  return new Promise((res) => {
    const cols = box.cols ?? 1;
    const rows = box.rows ?? Math.ceil(items.length / cols);
    const M = (UI.menu = { items, index: start, top: 0, rows, cols, ...box });
    const n = items.length;
    const f = (k) => {
      let i = M.index;
      if (k === 'UP') i -= cols;
      if (k === 'DOWN') i += cols;
      if (cols > 1 && k === 'LEFT') i -= 1;
      if (cols > 1 && k === 'RIGHT') i += 1;
      if (i !== M.index) {
        if (cols === 1) i = (i + n) % n;
        else if (i < 0 || i >= n) i = M.index;
        if (i !== M.index) sfx('move');
        M.index = i;
        if (cols === 1) {
          if (M.index < M.top) M.top = M.index;
          if (M.index >= M.top + rows) M.top = M.index - rows + 1;
        }
      } else if (k === 'A') {
        waiters.delete(f);
        UI.menu = null;
        sfx('blip');
        res(M.index);
      } else if (k === 'B' && cancel) {
        waiters.delete(f);
        UI.menu = null;
        res(-1);
      }
    };
    waiters.add(f);
  });
}

// ───────── 繪圖小工具 ─────────
export function box(x, y, w, h) {
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
export function text(s, x, y, col = C.ink, font = FONT, align = 'left') {
  ctx.font = font;
  ctx.fillStyle = col;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  ctx.fillText(s, x, y);
  ctx.textAlign = 'left';
}
export function cursor(x, y) {
  ctx.fillStyle = C.ink;
  ctx.beginPath();
  ctx.moveTo(x, y + 2);
  ctx.lineTo(x + 8, y + 8);
  ctx.lineTo(x, y + 14);
  ctx.fill();
}
export function sprite(id, x, y, scale = 4, { flip = false } = {}) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (flip) {
    ctx.translate(x + SIZE * scale, y);
    ctx.scale(-1, 1);
    ctx.drawImage(getSprite(id), 0, 0, SIZE * scale, SIZE * scale);
  } else ctx.drawImage(getSprite(id), x, y, SIZE * scale, SIZE * scale);
  ctx.restore();
}
export function hpBar(x, y, w, hp, max) {
  const r = Math.max(0, hp / max);
  ctx.fillStyle = C.ink;
  ctx.fillRect(x - 2, y - 2, w + 4, 10);
  ctx.fillStyle = C.line;
  ctx.fillRect(x, y, w, 6);
  ctx.fillStyle = r > 0.5 ? C.hpG : r > 0.2 ? C.hpY : C.hpR;
  ctx.fillRect(x, y, Math.round(w * r), 6);
}
export function chip(label, x, y, col) {
  ctx.font = FONT;
  const w = ctx.measureText(label).width + 8;
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.roundRect(x, y - 1, w, 21, 3); // 高度留夠，字才不會被切到
  ctx.fill();
  text(label, x + 4, y + 1, '#ffffff');
  return w;
}
export function textWidth(s) {
  ctx.font = FONT;
  return ctx.measureText(s).width;
}
export function drawText() {
  const T = UI.text;
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
export function drawMenu() {
  const M = UI.menu;
  if (!M) return;
  box(M.x, M.y, M.w, M.h);
  if (M.cols > 1) {
    M.items.forEach((it, i) => {
      const x = M.x + 30 + (i % M.cols) * M.colW;
      const y = M.y + 16 + Math.floor(i / M.cols) * M.rowH;
      text(it, x, y);
      if (i === M.index) cursor(x - 14, y);
    });
  } else {
    M.items.slice(M.top, M.top + M.rows).forEach((it, i) => {
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
  }
  M.extra?.(M.index);
}
export function ball(x, y, r, { alpha = 1, squash = 0 } = {}) {
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
