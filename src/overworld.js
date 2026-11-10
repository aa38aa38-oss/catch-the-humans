// 地圖畫面：畫格子、走路、傳送、遇敵區提示、遇敵判定。
// 只負責「走」，遇到事情（遇敵、對話、開選單）就回傳一個事件給 main.js 處理。
import { MAPS } from './data/maps/index.js';
import { TILES } from './data/tiles.js';
import { G, save } from './save.js';
import { W, H, ctx, C, FONT, text, box, sprite, sfx, waiters, heldDir, clearTap, tween, sleep } from './ui.js';

export const TILE = 32; // 一格 32 像素（GB 的 16 像素放大兩倍）
const STEP_MS = 170;
export const ENCOUNTER_RATE = 0.08; // 在遇敵區每走一步遇到人類的機率
const DIR = { UP: [0, -1], DOWN: [0, 1], LEFT: [-1, 0], RIGHT: [1, 0] };

/** 畫面狀態：px/py 是走路動畫中的像素位置 */
export const OW = { px: 0, py: 0, walking: false, banner: null, fade: 0 };

export const currentMap = () => MAPS[G.pos.map];
const tileAt = (m, x, y) => m.rows[y]?.[x] ?? '#';
/** 訓練家被打敗後會坐到旁邊（sit），讓出走道 */
export const npcPos = (n) => (n.trainer && n.sit && G.flags[n.trainer.id] ? n.sit : n);
const npcAt = (m, x, y) => m.npcs?.find((n) => npcPos(n).x === x && npcPos(n).y === y);

export function passable(m, x, y) {
  const t = TILES[tileAt(m, x, y)];
  return !!t && !t.solid && !npcAt(m, x, y);
}
export const zoneArea = (m, x, y) => m.encounters?.[tileAt(m, x, y)] ?? null;

function syncPixels() {
  OW.px = G.pos.x * TILE;
  OW.py = G.pos.y * TILE;
}

// ───────── 畫格子 ─────────
function drawTile(t, x, y, now) {
  const T = TILE;
  const f = (col, dx = 0, dy = 0, w = T, h = T) => { ctx.fillStyle = col; ctx.fillRect(x + dx, y + dy, w, h); };
  switch (t) {
    case '.': f('#e8e2d2'); f('#d8d0bc', 0, T - 2, T, 2); f('#d8d0bc', T - 2, 0, 2, T); break;
    case ':':
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) f((i + j) % 2 ? '#34343e' : '#f2efe6', i * 16, j * 16, 16, 16);
      break;
    case ',':
      f('#dfe6ee');
      for (let i = 4; i < T; i += 8) for (let j = 4; j < T; j += 8) f('#9fb2c8', i, j, 3, 3);
      break;
    case '"':
      f('#8cc060');
      f('#6ea448', 6, 10, 3, 6); f('#6ea448', 9, 8, 3, 8); f('#6ea448', 20, 20, 3, 6); f('#6ea448', 23, 18, 3, 8);
      break;
    case 'p': f('#cf9c84'); f('#b98670', 0, 15, T, 2); f('#b98670', 15, 0, 2, 15); f('#b98670', 7, 17, 2, 15); break;
    case '_': f('#e8e2d2'); f('#f0c830', 0, 10, T, 8); for (let i = 2; i < T; i += 6) f('#c8a020', i, 12, 3, 3); break;
    case 'e': f('#2c3440'); f('#5a7088', 4, 4, 10, 24); f('#5a7088', 18, 4, 10, 24); break;
    case 'G': f('#e8e2d2'); f('#8a8e98', 0, 0, 6, T); f('#8a8e98', T - 6, 0, 6, T); f('#48b860', 12, 10, 8, 12); break;
    case 'S': f('#a8a090'); for (let i = 0; i < T; i += 6) f('#7a7466', 0, i, T, 3); break;
    case '#': f('#4a4e5c'); f('#5c6070', 0, 0, T, 6); break;
    case 'w': f('#c8b896'); f('#9c8a6a', 0, T - 4, T, 4); f('#8aa0b8', 8, 6, 16, 14); break;
    case 'B': f('#c08a50'); f('#8c5c30', 0, T - 8, T, 8); f('#f6f0e0', 6, 6, 20, 10); f('#d84838', 10, 9, 12, 4); break;
    case 'n': f('#202028'); for (let i = 0; i < 3; i++) f(i === 1 ? '#f08a2c' : '#f0c830', 4, 6 + i * 8, 24, 3); break;
    case '=': f('#9aa4b0'); f('#c8e0f0', 4, 4, 24, 16); f('#6a7480', 0, 22, T, 10); break;
    case 'g': f('#e8e2d2'); f('#8a8e98', 2, 2, T - 4, T - 4); f('#d84838', 12, 10, 8, 12); break;
    case '|': f('#e8e2d2'); f('#f8f6f0', 6, 0, 20, T); f('#c8c2b4', 22, 0, 4, T); break;
    case 'b': f('#e8e2d2'); f('#3c70c8', 2, 10, T - 4, 12); f('#24304c', 4, 22, 4, 8); f('#24304c', T - 8, 22, 4, 8); break;
    case '*': f('#cf9c84'); f('#3c7a3c', 2, 0, 28, 24); f('#5aa050', 6, 3, 10, 8); f('#7a5030', 13, 24, 6, 8); break;
    case 'o': f('#5a5c64'); if (Math.floor(y / T) % 2 === 0) f('#e8e2d2', 4, T - 3, 14, 3); break;
    case 'T': f('#c8ccd4'); f('#e45a32', 0, 18, T, 5); f('#3c4c64', 4, 4, 10, 10); f('#3c4c64', 18, 4, 10, 10); break;
    case 'r': f('#6a6458'); f('#8a8478', 0, 6, T, 3); f('#8a8478', 0, 23, T, 3); for (let i = 2; i < T; i += 10) f('#4a3a2a', i, 4, 5, 24); break;
    case 'f': f('#8cc060'); f('#b08858', 0, 8, T, 4); f('#b08858', 0, 20, T, 4); f('#8c6440', 4, 4, 5, 26); f('#8c6440', 22, 4, 5, 26); break;
    case 'h': f('#9ccc6c'); f('#7cb050', 8, 12, 3, 5); f('#7cb050', 22, 22, 3, 5); break;
    case 'K': f('#9a9a96'); f('#7a5a3a', 0, 6, T, T - 6); f('#5a3e28', 0, T - 6, T, 6); f('#d0d4d8', 8, 9, 14, 7); f('#5a3e28', 22, 11, 7, 3); f('#8a1414', 10, 15, 6, 2); break;
    case 'M': f('#f4f4f0'); f('#46b45c', 0, 0, T, 6); f('#f08a2c', 0, 6, T, 4); f('#c8ccd4', 0, T - 10, T, 10); f('#d84838', 10, 12, 12, 8); break;
    case 'D': f('#c8ccd4'); f('#e45a32', 0, 18, T, 5); f('#3c4c64', 6, 2, 20, 30); f('#9ab0c8', 9, 5, 6, 12); f('#9ab0c8', 17, 5, 6, 12); break;
    case 's': f('#e8e2d2'); f('#3c5ca8', 3, 4, 26, 22); f('#2c4a8c', 3, 4, 26, 6); f('#f4f4f0', 6, 6, 8, 3); break;
    case 'x': case 'q': case 'v': {
      // 水泥地，上面有洗不掉的血跡（位置固定，看起來每格都不一樣）
      const tx = Math.floor((x + 1e4) / T), ty = Math.floor((y + 1e4) / T);
      const hsh = (a) => { const v = Math.sin((tx + a) * 12.9898 + (ty - a) * 78.233) * 43758.5453; return v - Math.floor(v); };
      f(t === 'v' ? '#8a7a6a' : '#9a9a96');
      f(t === 'v' ? '#7a6a5a' : '#8a8a86', 0, T - 2, T, 2);
      if (t === 'v') { f('#c8b070', 4, 20, 10, 3); f('#c8b070', 18, 8, 8, 3); }
      if (hsh(1) < (t === 'v' ? 0.6 : 0.3)) {
        // 一灘乾掉的血，旁邊有拖行的痕跡
        const bx = 2 + hsh(2) * 12, by = 4 + hsh(3) * 14;
        f('#5e1010', bx, by + 2, 16, 8); f('#5e1010', bx + 3, by, 10, 12); f('#8a1818', bx + 4, by + 3, 7, 4);
        if (hsh(7) < 0.5) f('#6a1414', bx + 16, by + 5, 12, 2);
        f('#5e1010', bx + 6, by + 12, 2, 5);
      }
      if (t === 'q') { f('#3a3a40', 4, 10, 24, 12); for (let i = 6; i < 28; i += 5) f('#1e1e24', i, 12, 2, 8); f('#8a1414', 6, 20, 16, 2); }
      break;
    }
    case 'c': f('#9a9a96'); f('#3a3e46', 0, 4, T, 3); f('#3a3e46', 0, 22, T, 3); for (let i = 3; i < T; i += 7) f('#5a606a', i, 0, 3, T); break;
    case 'H':
      f('#9a9a96'); f('#4a4e56', 0, 2, T, 3);
      for (const hx of [6, 20]) { f('#b4bac2', hx, 5, 2, 8); f('#b4bac2', hx - 2, 12, 2, 3); f('#a03a3a', hx - 4, 14, 9, 12); f('#d88a8a', hx - 2, 16, 5, 4); f('#7a1414', hx - 1, 26, 2, 5); }
      break;
    default: f('#000');
  }
}

export function drawWorld(now) {
  const m = currentMap();
  // 鏡頭：主角固定在畫面中間（第 5 欄、第 4 列）
  const camX = OW.px - 144;
  const camY = OW.py - 128;
  ctx.fillStyle = '#16161c';
  ctx.fillRect(0, 0, W, H);
  const x0 = Math.floor(camX / TILE), y0 = Math.floor(camY / TILE);
  for (let ty = y0; ty <= y0 + 10; ty++)
    for (let tx = x0; tx <= x0 + 11; tx++) {
      const t = m.rows[ty]?.[tx];
      if (t) drawTile(t, tx * TILE - camX, ty * TILE - camY, now);
    }
  for (const l of m.labels ?? []) {
    const lx = l.x * TILE - camX + TILE / 2, ly = l.y * TILE - camY;
    ctx.font = FONT;
    const w = ctx.measureText(l.text).width + 12;
    ctx.fillStyle = 'rgba(32,32,40,0.85)';
    ctx.fillRect(lx - w / 2, ly - 2, w, 20);
    text(l.text, lx, ly, '#f6f4ea', FONT, 'center');
  }
  for (const n of m.npcs ?? []) {
    const p = npcPos(n);
    sprite(n.sprite, p.x * TILE - camX + 2, p.y * TILE - camY + 2, 1, { flip: n.trainer && p.x > G.pos.x });
  }
  if (m.stalls) drawStalls(m.stalls, camX, camY, now);
  // 主角
  const bob = OW.walking ? Math.abs(Math.sin(now / 60)) * -2 : 0;
  const dir = G.pos.dir;
  sprite(G.animal.species, OW.px - camX + 2, OW.py - camY + 2 + bob, 1, { flip: dir === 'LEFT' });
  if (dir === 'UP' || dir === 'DOWN') {
    // 只有側面圖，用小箭頭表示面向
    ctx.fillStyle = C.ball;
    const ax = OW.px - camX + 14, ay = OW.py - camY + (dir === 'UP' ? -2 : 30);
    ctx.beginPath();
    ctx.moveTo(ax, ay); ctx.lineTo(ax + 4, ay + (dir === 'UP' ? -5 : 5)); ctx.lineTo(ax + 8, ay);
    ctx.fill();
  }
  // 遇敵區提示
  if (OW.banner && now < OW.banner.until) {
    box(8, 6, W - 16, 52);
    text('⚠ ' + OW.banner.title, 22, 16, C.hpR);
    text(OW.banner.text, 22, 34, C.ink);
  }
  if (OW.fade > 0) {
    ctx.fillStyle = `rgba(0,0,0,${OW.fade})`;
    ctx.fillRect(0, 0, W, H);
  }
}

/** 養殖場的豬欄：每格關 2 隻，拴著鐵鏈，在原地不安地動來動去 */
function drawStalls(stalls, camX, camY, now) {
  G.humans.slice(0, stalls.length * 2).forEach((ind, i) => {
    const st = stalls[Math.floor(i / 2)];
    const slot = i % 2;
    const shake = Math.sin(now / 240 + i * 1.7);
    const hx = (st.x + slot) * TILE - camX + 2 + shake * 2;
    const hy = (st.y + 0.55) * TILE - camY;
    // 鐵鏈：從後牆的鐵環拉到人類的脖子
    const ringX = (st.x + slot) * TILE - camX + 16, ringY = st.y * TILE - camY + 4;
    ctx.fillStyle = '#9aa0a8';
    ctx.fillRect(ringX - 3, ringY - 2, 6, 6);
    const nx = hx + 14, ny = hy + 12;
    for (let k = 0; k <= 6; k++) {
      const t = k / 6;
      const sag = Math.sin(t * Math.PI) * 6;
      ctx.fillStyle = k % 2 ? '#6a7078' : '#b4bac2';
      ctx.fillRect(ringX + (nx - ringX) * t - 2, ringY + (ny - ringY) * t + sag - 2, 4, 4);
    }
    sprite(ind.species, hx, hy, 1);
  });
}

function showZoneBanner(m) {
  OW.banner = { title: m.zoneName ?? '遇敵區', text: '這一區會遇到野生人類！', until: performance.now() + 2600 };
  sfx('ping');
}

async function warpTo(w) {
  await tween(180, (k) => (OW.fade = k));
  G.pos = { map: w.to, x: w.tx, y: w.ty, dir: w.dir ?? G.pos.dir };
  syncPixels();
  OW.banner = null;
  save();
  await tween(180, (k) => (OW.fade = 1 - k));
  OW.fade = 0;
}

/** 走到地圖指定位置（例如全滅回到回復點） */
export function placeAt(pos) {
  G.pos = { ...pos };
  syncPixels();
  OW.banner = null;
}

/** 面前那一格有什麼可以互動的 */
function facing(m) {
  const [dx, dy] = DIR[G.pos.dir];
  const x = G.pos.x + dx, y = G.pos.y + dy;
  const npc = npcAt(m, x, y);
  if (npc) return { kind: 'npc', ...npc };
  const sign = m.signs?.find((s) => s.x === x && s.y === y);
  if (sign) return { kind: 'sign', ...sign };
  return null;
}

/**
 * 在地圖上走，直到發生事情。回傳：
 *   { type: 'encounter', area }   遇到野生人類
 *   { type: 'talk', thing }       跟人或看板互動
 *   { type: 'menu' }              按 B 打開選單
 *   { type: 'notice', text }      提示訊息（例如驅人噴霧用完）
 */
export async function explore() {
  syncPixels();
  clearTap(); // 選單裡按的方向鍵不要變成走路
  const keys = [];
  const f = (k) => { if (k === 'A' || k === 'B') keys.push(k); };
  waiters.add(f);
  try {
    for (;;) {
      await new Promise((r) => requestAnimationFrame(r));
      const m = currentMap();
      const k = keys.shift();
      if (k === 'B') return { type: 'menu' };
      if (k === 'A') {
        const thing = facing(m);
        if (thing) return { type: 'talk', thing };
      }
      const dir = heldDir();
      if (!dir) continue;
      G.pos.dir = dir;
      const [dx, dy] = DIR[dir];
      const nx = G.pos.x + dx, ny = G.pos.y + dy;
      if (!passable(m, nx, ny)) {
        await sleep(90);
        continue;
      }
      const wasZone = zoneArea(m, G.pos.x, G.pos.y);
      const sx = OW.px, sy = OW.py;
      OW.walking = true;
      await tween(STEP_MS, (t) => {
        OW.px = sx + dx * TILE * t;
        OW.py = sy + dy * TILE * t;
      });
      OW.walking = false;
      G.pos.x = nx;
      G.pos.y = ny;
      syncPixels();
      const warp = m.warps?.find((w) => w.x === nx && w.y === ny);
      if (warp) {
        await warpTo(warp);
        continue;
      }
      // 驅人噴霧：每走一步少一步，用完時提醒
      if (G.repel > 0) {
        G.repel--;
        if (G.repel === 0) return { type: 'notice', text: '驅人噴霧的效果消失了。人類的味道又回來了。' };
      }
      const area = zoneArea(m, nx, ny);
      if (area && !wasZone) showZoneBanner(m);
      if (area && G.repel === 0 && !globalThis.__cthNoEncounter && Math.random() < ENCOUNTER_RATE) { // __cthNoEncounter：自動測試用
        OW.banner = null;
        return { type: 'encounter', area };
      }
    }
  } finally {
    waiters.delete(f);
  }
}
