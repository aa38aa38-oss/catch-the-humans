// 可重現的隨機數：同一顆種子一定骰出同一串數字。
// 連線 PK 時兩支手機用同一顆種子，各自計算就會得到完全相同的戰況。

/** 從 holder.rng（32 位元整數）取下一個 0~1 的亂數，並推進狀態（mulberry32） */
export function nextRandom(holder) {
  let t = (holder.rng = (holder.rng + 0x6d2b79f5) >>> 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** 把任意字串雜湊成 32 位元整數（FNV-1a），用來產生種子或資料版本號 */
export function hash32(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** 產生一個隨機的短字串 id（存檔、連線用，不需要可重現） */
export function randomId(len = 10) {
  const abc = '0123456789abcdefghijklmnopqrstuvwxyz';
  let s = '';
  const buf = new Uint32Array(len);
  (globalThis.crypto ?? { getRandomValues: (a) => a.map(() => Math.random() * 2 ** 32) }).getRandomValues(buf);
  for (const n of buf) s += abc[n % 36];
  return s;
}
