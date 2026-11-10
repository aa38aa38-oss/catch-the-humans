// 原型用的像素角色：用程式在 28×28 的格子上畫，最後自動描黑邊。
// 之後換成正式美術時，只要讓 getSprite 回傳圖片就好。

export const SIZE = 28;
const OUTLINE = '#20181c';

class Grid {
  constructor() {
    this.c = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
  }
  px(x, y, col) {
    x = Math.round(x); y = Math.round(y);
    if (x >= 0 && y >= 0 && x < SIZE && y < SIZE) this.c[y][x] = col;
    return this;
  }
  rect(x, y, w, h, col) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.px(i, j, col);
    return this;
  }
  ell(cx, cy, rx, ry, col) {
    for (let j = 0; j < SIZE; j++)
      for (let i = 0; i < SIZE; i++) {
        const dx = (i + 0.5 - cx) / rx, dy = (j + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.px(i, j, col);
      }
    return this;
  }
  line(x0, y0, x1, y1, col) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let k = 0; k <= n; k++) this.px(x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n, col);
    return this;
  }
  // 自動描邊：透明格子只要上下左右碰到有色格子就塗成黑邊
  outline() {
    const add = [];
    for (let y = 0; y < SIZE; y++)
      for (let x = 0; x < SIZE; x++) {
        if (this.c[y][x]) continue;
        const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
          const v = this.c[y + dy]?.[x + dx];
          return v && v !== OUTLINE;
        });
        if (near) add.push([x, y]);
      }
    for (const [x, y] of add) this.c[y][x] = OUTLINE;
    return this;
  }
  toCanvas() {
    const cv = document.createElement('canvas');
    cv.width = cv.height = SIZE;
    const g = cv.getContext('2d');
    for (let y = 0; y < SIZE; y++)
      for (let x = 0; x < SIZE; x++)
        if (this.c[y][x]) {
          g.fillStyle = this.c[y][x];
          g.fillRect(x, y, 1, 1);
        }
    return cv;
  }
}

const K = OUTLINE;

// ── 家畜（側面，面向右）──
function cow() {
  const W = '#f4f0e8', S = '#3a3438', P = '#f0a0a8', H = '#e8d070', D = '#8c8478';
  const g = new Grid();
  g.rect(7, 19, 3, 6, W).rect(16, 19, 3, 6, W).rect(11, 20, 2, 5, D).rect(20, 20, 2, 5, D);
  g.rect(7, 24, 3, 1, S).rect(16, 24, 3, 1, S);
  g.ell(13, 15, 9, 6, W);
  g.ell(9, 13, 3, 2.5, S).ell(15, 17, 2.5, 2, S).ell(17, 11, 2, 1.5, S);
  g.ell(13, 21, 2, 1.2, P);
  g.line(4, 12, 3, 18, S).ell(3, 19, 1, 1.4, S);
  g.ell(22, 11, 4, 4, W);
  g.ell(25, 13, 2.4, 2, P).px(25, 13, K);
  g.px(23, 10, K).px(20, 8, S).px(19, 9, S);
  g.px(21, 7, H).px(21, 6, H).px(24, 7, H).px(24, 6, H);
  return g.outline();
}

function pig() {
  const P = '#f4b0b8', D = '#d87888', N = '#e08898';
  const g = new Grid();
  g.rect(8, 20, 3, 4, D).rect(17, 20, 3, 4, P).rect(10, 21, 2, 3, D).rect(19, 21, 2, 3, D);
  g.ell(13, 16, 10, 7, P);
  g.ell(11, 18, 6, 3, '#f8c8cc');
  g.px(3, 13, D).px(2, 12, D).px(2, 11, D).px(3, 10, D).px(4, 11, D);
  g.ell(22, 13, 5, 5, P);
  g.ell(26, 14, 2, 2.2, N).px(26, 13, K).px(26, 15, K);
  g.px(20, 8, D).px(21, 8, D).px(20, 9, D).px(21, 9, P).px(22, 9, P).px(19, 10, D);
  g.px(23, 12, K);
  return g.outline();
}

function sheep() {
  const W = '#f8f4ec', G = '#d8d0c4', F = '#4a4248', L = '#5a5258';
  const g = new Grid();
  g.rect(8, 19, 2, 6, L).rect(17, 19, 2, 6, L).rect(11, 20, 2, 5, F).rect(20, 20, 2, 5, F);
  for (const [x, y, r] of [[8, 13, 4], [13, 11, 4.5], [18, 13, 4], [9, 18, 3.6], [14, 18, 4], [18, 18, 3.4], [5, 15, 3]]) g.ell(x, y, r, r, W);
  g.px(10, 12, G).px(15, 10, G).px(12, 16, G).px(17, 15, G).px(7, 17, G);
  g.ell(23, 12, 3.4, 4.2, F);
  g.ell(21, 8, 2.6, 1.8, W);
  g.px(19, 11, F).px(18, 12, F);
  g.px(24, 11, '#f8f4ec').px(24, 12, K);
  return g.outline();
}

function chicken() {
  const W = '#fcfaf2', G = '#d8d4c8', R = '#e04040', Y = '#f0b830';
  const g = new Grid();
  g.line(12, 21, 11, 25, Y).line(16, 21, 17, 25, Y).px(10, 25, Y).px(18, 25, Y);
  g.ell(6, 10, 2.4, 4, W).ell(8, 8, 2, 4, W);
  g.ell(13, 16, 7.5, 6, W);
  g.ell(12, 16, 4, 2.6, G);
  g.ell(18, 9, 3.6, 3.6, W);
  g.px(17, 4, R).px(18, 4, R).px(19, 5, R).px(18, 5, R).px(17, 5, R).px(16, 5, R);
  g.px(22, 9, Y).px(23, 9, Y).px(22, 10, Y);
  g.px(20, 11, R).px(20, 12, R).px(21, 11, R);
  g.px(19, 8, K);
  return g.outline();
}

// ── 野生人類（正面）──
function ace() {
  const S = '#f0b080', O = '#e88c20', R = '#c83028', H = '#2a2024', B = '#2a2a40', F = '#f8d038', FF = '#f06018';
  const g = new Grid();
  g.rect(9, 21, 10, 3, B).rect(9, 24, 4, 3, B).rect(15, 24, 4, 3, B);
  g.ell(14, 17, 6.5, 5, S);
  g.rect(5, 14, 3, 7, S).rect(20, 14, 3, 6, S);
  g.px(14, 15, '#d89060').px(14, 18, '#d89060');
  for (const x of [10, 12, 14, 16, 18]) g.px(x, 13, R);
  g.ell(14, 9, 4.6, 4.8, S);
  g.rect(9, 5, 10, 3, H).px(9, 8, H).px(18, 8, H).px(9, 9, H).px(19, 9, H);
  g.px(12, 9, K).px(16, 9, K).px(12, 11, '#c86040').px(16, 11, '#c86040');
  g.ell(14, 5, 9, 1.6, O);
  g.rect(10, 1, 8, 4, O).rect(10, 4, 8, 1, R);
  g.ell(23, 13, 3.4, 4.4, FF).ell(23, 14, 2, 2.6, F).px(22, 8, FF).px(24, 9, FF).px(25, 10, F);
  return g.outline();
}

function thing() {
  const O = '#d8803c', D = '#9c5424', L = '#f0a060', B = '#3858c0';
  const g = new Grid();
  g.rect(8, 24, 5, 3, O).rect(15, 24, 5, 3, O);
  g.ell(14, 17, 11, 7.5, O);
  g.rect(9, 21, 10, 4, B);
  g.ell(3, 19, 3, 4, O).ell(25, 19, 3, 4, O);
  g.ell(14, 8, 6, 5.5, O);
  for (const [x0, y0, x1, y1] of [[6, 14, 22, 14], [4, 18, 24, 18], [10, 11, 10, 21], [18, 11, 18, 21], [14, 14, 14, 18], [8, 4, 20, 4], [9, 8, 19, 8]]) g.line(x0, y0, x1, y1, D);
  g.px(7, 12, L).px(12, 16, L).px(20, 16, L).px(16, 12, L).px(11, 6, L);
  g.rect(10, 6, 8, 1, D);
  g.px(11, 7, '#4060d0').px(17, 7, '#4060d0');
  g.rect(12, 11, 4, 1, D);
  return g.outline();
}

function ironFan() {
  const S = '#f4c8a0', H = '#20181c', R = '#b02838', P = '#e8a020', G = '#58a040', GD = '#2c6c2c';
  const g = new Grid();
  for (let y = 12; y < 27; y++) {
    const w = 4 + Math.floor((y - 12) * 0.55);
    g.rect(13 - w, y, w * 2 + 1, 1, R);
  }
  g.rect(9, 14, 9, 1, P).line(13, 15, 13, 26, P);
  g.ell(14, 8, 3.8, 4.2, S);
  g.ell(14, 3, 2.6, 2, H).rect(10, 4, 8, 3, H).px(10, 7, H).px(18, 7, H).px(10, 8, H).px(18, 8, H);
  g.px(13, 1, P).px(15, 1, P);
  g.px(12, 8, K).px(16, 8, K).px(14, 10, '#c85050');
  g.ell(23, 9, 4.6, 6.4, G);
  g.line(23, 3, 23, 15, GD).line(23, 6, 20, 4, GD).line(23, 6, 26, 4, GD).line(23, 10, 20, 8, GD).line(23, 10, 26, 8, GD);
  g.line(21, 16, 19, 19, '#8c5a30');
  g.ell(19, 19, 1.2, 1.2, S);
  return g.outline();
}

function firefighter() {
  const S = '#f0b888', C = '#3c3c44', Y = '#f0d038', H = '#d83830', W = '#b8e0f8', WB = '#6cb0e8';
  const g = new Grid();
  g.rect(9, 23, 4, 4, C).rect(15, 23, 4, 4, C);
  g.ell(14, 18, 7, 6, C);
  g.rect(7, 17, 14, 1, Y).rect(7, 21, 14, 1, Y);
  g.rect(13, 13, 2, 10, '#5a5a62');
  g.ell(14, 9, 4.2, 4.2, S);
  g.px(12, 9, K).px(16, 9, K).rect(13, 11, 3, 1, '#c87058');
  g.ell(14, 5, 7.6, 1.6, H);
  g.ell(14, 4, 5, 3.2, H);
  g.rect(13, 2, 2, 3, Y);
  g.rect(3, 16, 5, 2, '#a0a0a8');
  g.line(2, 15, 0, 13, WB).line(2, 16, 0, 16, W).line(2, 17, 0, 19, WB).px(1, 14, W).px(1, 18, W);
  return g.outline();
}

const DRAW = { COW: cow, PIG: pig, SHEEP: sheep, CHICKEN: chicken, ACE: ace, THING: thing, IRON_FAN: ironFan, FIREFIGHTER: firefighter };
const cache = {};

/** 回傳 28×28 的角色圖（canvas） */
export function getSprite(id) {
  if (!cache[id]) cache[id] = DRAW[id]().toCanvas();
  return cache[id];
}
