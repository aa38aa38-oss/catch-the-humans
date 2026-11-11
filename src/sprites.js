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

// ── 訓練家（動物，側面朝右）──
function rat() {
  const G1 = '#8a8a96', G2 = '#b4b4be', P = '#f0a0b0';
  const g = new Grid();
  g.line(3, 18, 1, 13, P).line(1, 13, 2, 9, P);
  g.ell(12, 18, 8, 5, G1);
  g.ell(12, 20, 5, 2.4, G2);
  g.ell(20, 15, 4.5, 3.8, G1);
  g.ell(24, 16, 2, 1.6, G2).px(26, 16, P);
  g.ell(18, 11, 2.2, 2.2, G1).ell(18, 11, 1.2, 1.2, P);
  g.px(21, 14, K);
  g.rect(9, 22, 2, 3, P).rect(16, 22, 2, 3, P);
  g.line(24, 17, 27, 18, '#5a5a64').line(24, 16, 27, 15, '#5a5a64');
  return g.outline();
}
function pigeon() {
  const B1 = '#8c96a8', B2 = '#b8c0cc', N = '#5aa080', V = '#8a5aa8', O = '#f08a2c', H = '#2c4a8c';
  const g = new Grid();
  g.line(11, 22, 10, 26, O).line(15, 22, 16, 26, O);
  g.ell(5, 15, 4, 2.4, '#5a6478');
  g.ell(12, 16, 8, 6, B1);
  g.ell(11, 15, 5, 3, B2);
  g.line(7, 17, 15, 19, '#5a6478');
  g.ell(18, 10, 3.4, 3.6, N).ell(17, 12, 2.6, 2, V);
  g.ell(20, 7, 3.4, 3.2, B1);
  g.px(21, 6, O).px(23, 7, '#d8a070').px(24, 8, '#d8a070');
  // 列車長帽子
  g.rect(17, 2, 7, 2, H).rect(16, 4, 9, 1, '#1c2a50').px(20, 2, '#f0d038');
  return g.outline();
}

// ── 地圖上的路人（正面）──
function person({ hat, hair, shirt, pants, extra }) {
  const S = '#f0c098';
  const g = new Grid();
  g.rect(10, 22, 3, 5, pants).rect(15, 22, 3, 5, pants);
  g.ell(14, 17, 6, 6, shirt);
  g.rect(7, 13, 3, 8, shirt).rect(18, 13, 3, 8, shirt);
  g.px(8, 21, S).px(19, 21, S);
  g.ell(14, 8, 4.4, 4.6, S);
  g.rect(10, 4, 9, 2, hair).px(10, 6, hair).px(18, 6, hair);
  if (hat) g.ell(14, 4, 6, 1.4, hat).rect(10, 1, 9, 3, hat);
  g.px(12, 8, K).px(16, 8, K).rect(13, 11, 3, 1, '#c87058');
  extra?.(g);
  return g.outline();
}
// ── 第二批野生人類（正面）──
/** 人類模板：腿、身體、手、頭；opts 可以換顏色，extra 加特徵 */
function human({ skin = '#f0c098', shirt, pants, hair, arms, wide = 0, extra }) {
  const g = new Grid();
  g.rect(10 - wide, 22, 3, 5, pants).rect(15 + wide, 22, 3, 5, pants);
  g.ell(14, 17, 6 + wide, 6, shirt);
  g.rect(7 - wide, 13, 3, 8, arms ?? shirt).rect(18 + wide, 13, 3, 8, arms ?? shirt);
  g.px(8 - wide, 21, skin).px(19 + wide, 21, skin);
  g.ell(14, 8, 4.4, 4.6, skin);
  if (hair) g.rect(10, 4, 9, 2, hair).px(10, 6, hair).px(18, 6, hair);
  g.px(12, 8, K).px(16, 8, K).rect(13, 11, 3, 1, '#c87058');
  extra?.(g);
  return g.outline();
}
const akainu = () => human({ shirt: '#a82c2c', pants: '#7a1c1c', hair: '#2a2024', extra: (g) => {
  g.ell(14, 4, 6, 1.4, '#f4f4f0').rect(10, 1, 9, 3, '#f4f4f0').px(14, 2, '#3c5ca8');
  g.px(11, 14, '#d83848').px(12, 14, '#d83848');
  g.ell(4, 19, 3, 3.5, '#f06018').ell(4, 19, 1.6, 2, '#f8d038').ell(24, 19, 3, 3.5, '#f06018').ell(24, 19, 1.6, 2, '#f8d038');
} });
const rengoku = () => human({ shirt: '#2a2a34', pants: '#2a2a34', extra: (g) => {
  g.ell(14, 4, 6, 3.4, '#f8d038').px(9, 2, '#e04828').px(19, 2, '#e04828').px(14, 0, '#e04828').px(11, 1, '#e04828').px(17, 1, '#e04828');
  g.rect(6, 22, 16, 3, '#f4f4f0').rect(6, 25, 16, 2, '#e04828');
  g.px(12, 8, '#e04828').px(16, 8, '#e04828');
} });
const ash = () => human({ shirt: '#3c5ca8', pants: '#3c5070', hair: '#2a2024', arms: '#2a2a34', extra: (g) => {
  g.ell(14, 4, 6, 1.4, '#d83830').rect(10, 1, 9, 3, '#d83830').rect(12, 1, 4, 2, '#f4f4f0');
  g.rect(13, 12, 2, 10, '#2a2a34');
  g.ell(23, 20, 2.4, 2.4, '#d83830').rect(21, 20, 5, 2, '#f4f4f0').px(23, 20, K);
} });
const chef = () => human({ shirt: '#f4f4f0', pants: '#3a3a44', extra: (g) => {
  g.ell(14, 1.6, 4.6, 2.4, '#f4f4f0').rect(10, 2, 9, 3, '#f4f4f0');
  g.px(13, 15, '#c8c8c8').px(13, 18, '#c8c8c8');
  g.ell(24, 17, 3.6, 1.6, '#2a2a34').rect(20, 16, 2, 1, '#5a3e28');
  g.ell(24, 14, 2, 2, '#f06018').px(24, 12, '#f8d038');
} });
const tangKi = () => human({ shirt: '#f0c098', pants: '#2a2a34', hair: '#2a2024', extra: (g) => {
  g.rect(10, 3, 9, 1, '#d83830');
  g.line(11, 12, 17, 12, '#d83830'); g.ell(14, 16, 4, 4, '#d83830'); g.px(14, 16, '#f0d038');
  g.px(10, 17, '#a01818').px(18, 18, '#a01818').px(11, 19, '#a01818');
  g.ell(24, 19, 2.2, 2.2, '#8a8e98').px(24, 16, '#8a8e98').px(27, 19, '#8a8e98').px(21, 19, '#8a8e98').px(24, 22, '#8a8e98');
} });
const aokiji = () => human({ shirt: '#f4f4f0', pants: '#f4f4f0', arms: '#f4f4f0', extra: (g) => {
  g.ell(14, 4, 5, 2.4, '#2a2024'); g.rect(10, 6, 9, 1, '#5a8ac8');
  g.rect(13, 12, 2, 8, '#5a8ac8');
  g.px(3, 14, '#c8ecf8').px(4, 13, '#c8ecf8').px(24, 12, '#c8ecf8').px(25, 14, '#c8ecf8').px(2, 18, '#9ad8f0');
} });
const angler = () => human({ shirt: '#9a8a5a', pants: '#5a5040', extra: (g) => {
  g.ell(14, 4, 6, 1.6, '#c8b070').rect(10, 2, 9, 2, '#c8b070');
  g.rect(10, 14, 2, 3, '#7a6a40').rect(16, 14, 2, 3, '#7a6a40');
  g.line(20, 20, 26, 2, '#7a5030'); g.line(26, 2, 26, 9, '#d8d8d8'); g.ell(26, 11, 1.4, 1, '#6cb0e8');
} });
const rafting = () => human({ shirt: '#5a8ac8', pants: '#3a3a44', hair: '#2a2024', extra: (g) => {
  g.rect(11, 11, 6, 2, '#c87058');
  for (const [x, y] of [[3, 3], [6, 8], [22, 2], [25, 9], [2, 14], [26, 15]]) g.px(x, y, '#9ad8f0').px(x, y + 1, '#9ad8f0');
  g.line(22, 12, 25, 24, '#f0c830').ell(25, 25, 1.6, 2.2, '#f0c830');
} });
const aquaman = () => human({ shirt: '#e8901c', pants: '#3c8a4c', arms: '#f0c098', extra: (g) => {
  g.ell(14, 5, 5.4, 3.4, '#d8b048').rect(9, 6, 2, 6, '#d8b048').rect(17, 6, 2, 6, '#d8b048');
  g.rect(11, 11, 6, 2, '#d8b048');
  for (let y = 13; y < 22; y += 3) g.line(10, y, 18, y, '#c07010');
  g.line(24, 6, 24, 26, '#f0d038').px(22, 5, '#f0d038').px(26, 5, '#f0d038').px(22, 4, '#f0d038').px(26, 4, '#f0d038').px(24, 3, '#f0d038');
} });
const lifeguard = () => human({ skin: '#c88858', shirt: '#c88858', pants: '#d83830', hair: '#2a2024', extra: (g) => {
  g.px(14, 13, '#f0d038').line(12, 12, 14, 13, '#2a2a34');
  g.ell(23, 19, 3.6, 3.6, '#d83830').ell(23, 19, 1.6, 1.6, null);
  g.px(21, 17, '#f4f4f0').px(25, 21, '#f4f4f0');
} });
const bullKing = () => human({ skin: '#7a4a30', shirt: '#a83030', pants: '#2a2a34', wide: 1, extra: (g) => {
  g.ell(14, 8, 5, 4.6, '#7a4a30').ell(14, 11, 2.6, 1.6, '#c89070').px(13, 11, K).px(15, 11, K);
  g.line(9, 5, 5, 1, '#f0e0a0').line(19, 5, 23, 1, '#f0e0a0').px(4, 2, '#f0e0a0').px(24, 2, '#f0e0a0');
  g.px(12, 7, '#f0d038').px(16, 7, '#f0d038');
  g.rect(10, 14, 9, 2, '#f0d038');
} });
const colonel = () => human({ shirt: '#f4f4f0', pants: '#f4f4f0', arms: '#f4f4f0', extra: (g) => {
  g.rect(10, 4, 9, 2, '#e8e8e8');
  g.rect(11, 7, 3, 2, '#2a2a34').rect(15, 7, 3, 2, '#2a2a34').px(14, 7, '#2a2a34');
  g.ell(14, 12, 2, 1.6, '#e8e8e8');
  g.line(13, 13, 13, 16, '#2a2a34').line(15, 13, 15, 16, '#2a2a34');
  g.rect(21, 15, 6, 7, '#d83830').rect(22, 15, 1, 7, '#f4f4f0').rect(24, 15, 1, 7, '#f4f4f0').ell(24, 14, 3, 1.4, '#c88830');
} });
const hulk = () => human({ skin: '#6cb048', shirt: '#6cb048', pants: '#7a4aa0', hair: '#1e1e24', wide: 2, extra: (g) => {
  g.ell(14, 17, 9, 6.4, '#6cb048'); g.px(10, 16, '#4c8a30').px(18, 16, '#4c8a30').line(12, 19, 16, 19, '#4c8a30');
  g.rect(4, 12, 3, 9, '#6cb048').rect(21, 12, 3, 9, '#6cb048');
  g.rect(12, 11, 5, 1, '#2a2a34');
} });
const ryotsu = () => human({ shirt: '#3c5ca8', pants: '#2c3c70', hair: '#2a2024', extra: (g) => {
  g.ell(14, 4, 5.6, 1.4, '#2c3c70').rect(10, 2, 9, 2, '#2c3c70').px(14, 2, '#f0d038');
  g.rect(10, 6, 9, 1, '#1e1e24');
  g.rect(13, 13, 2, 7, '#f0d038');
  g.rect(9, 26, 4, 1, '#c8a070').rect(15, 26, 4, 1, '#c8a070');
  g.rect(21, 18, 5, 3, '#5aa050').px(23, 19, '#f0d038');
} });
const gaara = () => human({ shirt: '#8a5a3a', pants: '#5a3e28', extra: (g) => {
  g.ell(14, 4, 5.4, 2.6, '#c83020').px(9, 3, '#c83020').px(19, 3, '#c83020').px(14, 1, '#c83020');
  g.rect(11, 7, 3, 2, '#2a2a34').rect(15, 7, 3, 2, '#2a2a34').px(12, 8, '#8ad0b0').px(16, 8, '#8ad0b0');
  g.px(11, 5, '#d83830').px(12, 5, '#d83830');
  g.ell(22, 12, 3.6, 4.6, '#c8a070').ell(22, 7, 2, 1.6, '#c8a070').rect(18, 13, 8, 1, '#8a6a40');
  for (const [x, y] of [[3, 24], [5, 22], [25, 25], [23, 23], [2, 20]]) g.px(x, y, '#d8c090');
} });
const ronald = () => human({ skin: '#f8f4ec', shirt: '#f0c830', pants: '#f0c830', arms: '#f4f4f0', extra: (g) => {
  g.ell(14, 4, 6.4, 3, '#d83830').px(8, 6, '#d83830').px(20, 6, '#d83830');
  g.rect(12, 10, 5, 2, '#d83830').px(11, 9, '#d83830').px(17, 9, '#d83830');
  for (let y = 14; y < 21; y += 2) { g.rect(7, y, 3, 1, '#d83830'); g.rect(18, y, 3, 1, '#d83830'); }
  g.rect(9, 25, 5, 2, '#d83830').rect(15, 25, 5, 2, '#d83830');
} });
const batman = () => human({ shirt: '#6a6e78', pants: '#2a2a34', arms: '#2a2a34', extra: (g) => {
  g.ell(14, 7, 4.8, 4.4, '#2a2a34').px(10, 2, '#2a2a34').px(10, 3, '#2a2a34').px(18, 2, '#2a2a34').px(18, 3, '#2a2a34');
  g.rect(12, 9, 5, 3, '#f0c098').rect(13, 11, 3, 1, '#c87058');
  g.px(12, 7, '#f4f4f0').px(16, 7, '#f4f4f0');
  g.ell(14, 15, 2.4, 1.2, '#f0d038').px(14, 15, '#2a2a34');
  g.rect(10, 20, 9, 1, '#f0d038');
  g.line(4, 12, 2, 26, '#1e1e24').line(24, 12, 26, 26, '#1e1e24');
} });
const mountainMonkey = () => {
  const g = new Grid();
  const M = '#8a5a3a', F = '#e0b088';
  g.ell(14, 24, 3.4, 3.4, '#2a2a34').ell(14, 24, 1.4, 1.4, '#8a8e98');
  g.rect(7, 14, 14, 3, '#3a3a44').rect(5, 13, 3, 2, '#9aa0a8').rect(20, 13, 3, 2, '#9aa0a8');
  g.ell(14, 18, 5, 3, '#d83830');
  g.rect(9, 15, 2, 4, M).rect(17, 15, 2, 4, M);
  g.ell(14, 8, 4.8, 4.6, M).ell(14, 9.5, 3.2, 2.8, F);
  g.ell(8.5, 8, 1.6, 1.8, F).ell(19.5, 8, 1.6, 1.8, F);
  g.px(12, 8, K).px(16, 8, K).rect(13, 11, 3, 1, '#a05a40');
  g.ell(14, 4, 5.4, 2.4, '#f4f4f0').rect(9, 4, 11, 1, '#2a2a34');
  g.rect(13, 20, 2, 2, '#f0d038');
  return g.outline();
};
const hanzo = () => human({ shirt: '#2a2a34', pants: '#2a2a34', arms: '#2a2a34', extra: (g) => {
  g.ell(14, 8, 4.8, 4.8, '#2a2a34');
  g.rect(11, 7, 7, 2, '#f0c098').px(12, 8, K).px(16, 8, K);
  g.line(18, 5, 23, 3, '#a83030').line(18, 6, 24, 6, '#a83030');
  g.rect(10, 18, 9, 1, '#6a6e78');
  g.px(24, 18, '#9aa0a8').px(23, 19, '#9aa0a8').px(25, 19, '#9aa0a8').px(24, 20, '#9aa0a8').px(24, 19, '#2a2a34');
} });

// ── 第三批野生人類（正面）──
const chenPingwei = () => human({ shirt: '#3a3a44', pants: '#2c3c70', hair: '#2a2024', extra: (g) => {
  g.rect(11, 6, 2, 1, '#d83830').rect(16, 6, 2, 1, '#d83830').rect(12, 11, 5, 2, '#a01818');
  g.rect(21, 17, 6, 3, '#2a2a34').rect(21, 16, 6, 1, '#8a8e98');
  g.px(3, 4, '#f06018').px(4, 3, '#f06018').px(24, 3, '#f06018').px(25, 4, '#f06018');
} });
const mustang = () => human({ shirt: '#2c3c70', pants: '#2c3c70', hair: '#2a2024', arms: '#2c3c70', extra: (g) => {
  g.rect(10, 13, 9, 1, '#f0d038').px(12, 15, '#f0d038').px(16, 15, '#f0d038');
  g.ell(20, 21, 1.6, 1.4, '#f4f4f0').px(20, 21, '#d83830');
  g.ell(23, 17, 2.4, 2.4, '#f06018').ell(23, 17, 1.2, 1.2, '#f8d038');
} });
const ramsay = () => human({ shirt: '#f4f4f0', pants: '#2a2a34', hair: '#e8c060', extra: (g) => {
  g.px(12, 15, '#2a2a34').px(16, 15, '#2a2a34').px(12, 18, '#2a2a34').px(16, 18, '#2a2a34');
  g.rect(12, 11, 5, 2, '#a01818');
  g.rect(21, 16, 5, 4, '#f4e0b0').rect(21, 20, 5, 1, '#c89050');
} });
const tongshen = () => human({ shirt: '#d83830', pants: '#3a3a44', hair: '#2a2024', wide: 2, extra: (g) => {
  g.ell(14, 17, 8.4, 6.4, '#d83830').ell(14, 8, 5, 5, '#f0c098');
  g.px(12, 8, K).px(16, 8, K).rect(12, 11, 5, 2, '#a01818');
  g.rect(9, 5, 11, 1, '#2a2a34').rect(8, 6, 2, 3, '#2a2a34').rect(19, 6, 2, 3, '#2a2a34');
  g.rect(2, 22, 24, 2, '#7a5030');
} });
const kisame = () => human({ skin: '#7aa0b8', shirt: '#2a2a34', pants: '#2a2a34', arms: '#2a2a34', extra: (g) => {
  g.ell(14, 4, 5, 2.4, '#3c5ca8').px(10, 2, '#3c5ca8').px(18, 2, '#3c5ca8');
  g.px(11, 9, '#5a7a90').px(17, 9, '#5a7a90').rect(12, 11, 5, 1, '#f4f4f0');
  g.px(12, 16, '#d83830').px(16, 19, '#d83830');
  g.line(22, 4, 25, 26, '#3c5ca8').line(23, 4, 26, 26, '#5a8ac8');
} });
const elsa = () => human({ shirt: '#8ad0f0', pants: '#8ad0f0', arms: '#c8ecf8', extra: (g) => {
  g.ell(14, 4, 5.4, 2.6, '#f8ecb0').rect(18, 6, 2, 12, '#f8ecb0');
  g.ell(14, 23, 7, 4, '#8ad0f0');
  g.px(3, 6, '#f4f4f0').px(4, 5, '#c8ecf8').px(25, 9, '#f4f4f0').px(24, 10, '#c8ecf8').px(4, 18, '#f4f4f0');
} });
const bruceLee = () => human({ shirt: '#f0d038', pants: '#f0d038', arms: '#f0c098', hair: '#2a2024', extra: (g) => {
  g.ell(14, 4, 5, 2, '#2a2024'); g.line(10, 13, 10, 25, '#2a2a34').line(18, 13, 18, 25, '#2a2a34');
  g.line(22, 12, 24, 17, '#7a5030').line(24, 17, 26, 13, '#7a5030');
} });
const chenCaiyou = () => {
  const g = new Grid();
  g.rect(4, 20, 20, 6, '#f4f4f0').rect(4, 20, 20, 1, '#2a2a34').ell(8, 26, 2, 1.4, '#2a2a34').ell(20, 26, 2, 1.4, '#2a2a34');
  g.rect(6, 22, 16, 2, '#3c5ca8');
  g.ell(14, 10, 6, 6.4, '#f4f4f0').rect(8, 3, 12, 3, '#2a2a34');
  g.px(11, 9, K).px(17, 9, K).rect(12, 13, 5, 1, K);
  return g.outline();
};
const biaoGe = () => human({ shirt: '#f4f4f0', pants: '#3a3a44', hair: '#2a2024', wide: 1, extra: (g) => {
  g.rect(11, 7, 3, 2, '#2a2a34').rect(15, 7, 3, 2, '#2a2a34');
  g.px(12, 13, '#f0d038').px(13, 14, '#f0d038').px(15, 14, '#f0d038').px(16, 13, '#f0d038');
  g.rect(22, 20, 4, 4, '#9aa0a8').rect(21, 19, 6, 1, '#9aa0a8').rect(23, 18, 2, 1, '#9aa0a8');
} });
const theRock = () => human({ skin: '#b07850', shirt: '#2a2a34', pants: '#3a3a44', arms: '#b07850', wide: 2, extra: (g) => {
  g.ell(14, 8, 4.6, 4.8, '#b07850').px(13, 3, '#f8f4ec').px(14, 3, '#f8f4ec');
  g.px(11, 6, K).px(12, 5, K).px(16, 6, K).px(17, 6, K);
  g.px(12, 8, K).px(16, 8, K).rect(13, 11, 3, 1, '#7a4030');
} });
const mason = () => human({ shirt: '#9a9a90', pants: '#5a5040', hair: '#2a2024', extra: (g) => {
  g.ell(14, 4, 6, 1.6, '#f0c830').rect(10, 2, 9, 2, '#f0c830');
  g.px(11, 17, '#c8c8c8').px(16, 19, '#c8c8c8');
  g.rect(20, 18, 7, 3, '#b84a30').rect(20, 21, 7, 3, '#c85a38').line(20, 21, 26, 21, '#d8d0c0');
} });
const superman = () => human({ shirt: '#3c5ca8', pants: '#3c5ca8', arms: '#3c5ca8', hair: '#2a2024', extra: (g) => {
  g.px(14, 7, '#2a2024');
  g.ell(14, 15, 2.6, 2, '#d83830').px(14, 15, '#f0d038');
  g.rect(10, 20, 9, 1, '#f0d038');
  g.rect(4, 12, 3, 13, '#d83830').rect(21, 12, 3, 13, '#d83830');
  g.px(12, 8, '#d83830').px(16, 8, '#d83830');
} });
const dancingUncle = () => human({ shirt: '#f4f4f0', pants: '#2a2a34', extra: (g) => {
  g.ell(14, 3, 6.4, 3.4, '#2a2024');
  g.rect(13, 12, 2, 4, '#d83830');
  g.line(4, 6, 8, 13, '#f0c098').line(24, 22, 20, 16, '#f0c098');
  g.px(3, 18, '#f0d038').px(25, 4, '#f0d038').px(2, 10, '#f0d038');
} });
const storm = () => human({ skin: '#7a4a30', shirt: '#2a2a34', pants: '#2a2a34', arms: '#2a2a34', extra: (g) => {
  g.ell(14, 4, 6.4, 3.4, '#f4f4f0').rect(8, 5, 2, 10, '#f4f4f0').rect(19, 5, 2, 10, '#f4f4f0');
  g.px(12, 8, '#f4f4f0').px(16, 8, '#f4f4f0');
  g.line(24, 2, 22, 7, '#f0e060').line(22, 7, 25, 7, '#f0e060').line(25, 7, 23, 12, '#f0e060');
} });
const zhuge = () => human({ shirt: '#f4f4f0', pants: '#c8c8c0', arms: '#f4f4f0', extra: (g) => {
  g.rect(11, 0, 7, 5, '#3a3a44').rect(10, 4, 9, 1, '#3a3a44');
  g.line(13, 12, 14, 15, '#2a2024').line(15, 12, 14, 15, '#2a2024');
  g.ell(23, 14, 3, 4, '#f4f4f0').line(23, 17, 22, 22, '#7a5030');
} });
const weatherman = () => human({ shirt: '#f0c830', pants: '#2c3c70', hair: '#5a3e28', extra: (g) => {
  g.ell(14, 4, 5.4, 2, '#5a3e28');
  g.line(22, 12, 22, 20, '#2a2a34').ell(22, 11, 1.4, 1.6, '#3a3a44');
  for (const [x, y] of [[3, 3], [5, 9], [2, 15], [25, 4], [26, 20]]) g.line(x, y, x + 2, y + 1, '#9ad8f0');
} });

// ── 動物 NPC：動物的頭臉，身體穿制服 ──
/** 穿衣服的動物：body 決定制服，head 畫頭 */
function animalPerson({ shirt, pants, head, extra }) {
  const g = new Grid();
  g.rect(10, 22, 3, 5, pants).rect(15, 22, 3, 5, pants);
  g.ell(14, 17, 6, 6, shirt);
  g.rect(7, 13, 3, 8, shirt).rect(18, 13, 3, 8, shirt);
  head(g);
  extra?.(g);
  return g.outline();
}
// 柴犬站務員（大廳）
const staff = () => animalPerson({
  shirt: '#3c5ca8', pants: '#24304c',
  head: (g) => {
    const O = '#e0a050', W = '#f8f0e0';
    g.ell(14, 8, 5, 4.6, O).ell(14, 10, 3, 2.2, W).px(14, 9, K);
    g.px(10, 3, O).px(10, 4, O).px(11, 4, O).px(18, 3, O).px(18, 4, O).px(17, 4, O);
    g.px(12, 7, K).px(16, 7, K);
    g.ell(14, 3.5, 5.5, 1.3, '#2c4a8c').px(14, 2, '#f0d038');
  },
  extra: (g) => g.rect(13, 13, 2, 8, '#f0d038').px(8, 21, '#e0a050').px(19, 21, '#e0a050'),
});
// 黑貓站務員（月台）
const catStaff = () => animalPerson({
  shirt: '#3c5ca8', pants: '#24304c',
  head: (g) => {
    const B = '#2a2a32';
    g.ell(14, 8, 4.8, 4.4, B);
    g.px(10, 3, B).px(10, 4, B).px(11, 4, B).px(18, 3, B).px(18, 4, B).px(17, 4, B);
    g.px(12, 8, '#f0d038').px(16, 8, '#f0d038').px(14, 10, '#f0a0b0');
    g.line(9, 10, 11, 10, '#9aa0a8').line(17, 10, 19, 10, '#9aa0a8');
    g.ell(14, 3.5, 5.5, 1.3, '#2c4a8c');
  },
  extra: (g) => g.rect(13, 13, 2, 8, '#f0d038').px(8, 21, '#2a2a32').px(19, 21, '#2a2a32'),
});
// 狐狸推銷員（廣場）
const sales = () => animalPerson({
  shirt: '#f4f4f0', pants: '#3a3a44',
  head: (g) => {
    const O = '#e87830', W = '#f8f0e0';
    g.ell(14, 8, 4.8, 4.2, O).ell(14, 10.5, 3.4, 2, W).px(14, 11, K);
    g.px(9, 2, O).px(10, 3, O).px(10, 4, O).px(19, 2, O).px(18, 3, O).px(18, 4, O);
    g.px(12, 7, K).px(16, 7, K);
  },
  extra: (g) => g.rect(13, 12, 2, 7, '#d83830').rect(19, 15, 5, 3, '#4c88e0').px(8, 21, '#e87830').px(19, 21, '#e87830'),
});

const DRAW = {
  AKAINU: akainu, RENGOKU: rengoku, ASH: ash, CHEF: chef, TANG_KI: tangKi,
  AOKIJI: aokiji, ANGLER: angler, RAFTING: rafting, AQUAMAN: aquaman, LIFEGUARD: lifeguard,
  BULL_KING: bullKing, COLONEL: colonel, HULK: hulk, RYOTSU: ryotsu, GAARA: gaara,
  RONALD: ronald, BATMAN: batman, MOUNTAIN_MONKEY: mountainMonkey, HANZO: hanzo,
  CHEN_PINGWEI: chenPingwei, MUSTANG: mustang, RAMSAY: ramsay, TONGSHEN: tongshen,
  KISAME: kisame, ELSA: elsa, BRUCE_LEE: bruceLee, CHEN_CAIYOU: chenCaiyou,
  BIAO_GE: biaoGe, THE_ROCK: theRock, MASON: mason,
  SUPERMAN: superman, DANCING_UNCLE: dancingUncle, STORM: storm, ZHUGE: zhuge, WEATHERMAN: weatherman,
  RAT: rat, PIGEON: pigeon, STAFF: staff, CAT_STAFF: catStaff, SALES: sales, COW: cow, PIG: pig, SHEEP: sheep, CHICKEN: chicken, ACE: ace, THING: thing, IRON_FAN: ironFan, FIREFIGHTER: firefighter };
const cache = {};

/** 回傳 28×28 的角色圖（canvas） */
export function getSprite(id) {
  if (!cache[id]) cache[id] = DRAW[id]().toCanvas();
  return cache[id];
}
