// 彈力寶貝球的收服拉鋸（純邏輯）。
// 玩家連打 A 讓「收緊」上升；人類自動「掙扎」。哪一邊先到 1 就決定結果。

export const PRESS_POWER = 0.04; // 每按一下 A 收緊多少
export const SLIP_PER_SEC = 0.04; // 沒按的時候球會慢慢鬆開
export const BASE_STRUGGLE = 0.5; // 滿血、標準力道時，每秒掙扎多少（約 2 秒撐破）

/**
 * @param hpRatio 人類剩餘體力比例 0~1
 * @param asleep  人類是否睡著（掙扎力道打七折）
 * @param strength 人類種類的力道（見 humans.js）
 * @param gradeStruggle 肉質等級的力道加成（見 GRADES）
 * @param ball 寶貝球種類的力道倍率（見 data/items.js，黏膠球 0.7）
 */
export function createCapture({ hpRatio, asleep = false, strength = 1, gradeStruggle = 1, ball = 1 }) {
  return {
    tight: 0,
    struggle: 0,
    wave: 0.5, // 掙扎的力道起伏 0~1
    power: BASE_STRUGGLE * strength * gradeStruggle * (0.2 + 0.8 * hpRatio) * (asleep ? 0.7 : 1) * ball,
    result: null, // 'caught' | 'escaped'
  };
}

export function press(c) {
  if (c.result) return;
  c.tight = Math.min(1, c.tight + PRESS_POWER);
  if (c.tight >= 1) c.result = 'caught';
}

export function update(c, dt, rng = Math.random) {
  if (c.result) return;
  c.wave = Math.max(0, Math.min(1, c.wave + (rng() - 0.5) * dt * 6));
  c.struggle = Math.min(1, c.struggle + c.power * (0.6 + 0.8 * c.wave) * dt);
  c.tight = Math.max(0, c.tight - SLIP_PER_SEC * dt);
  if (c.struggle >= 1) c.result = 'escaped';
}

// ───────── 快速收服 ─────────
// 同一種人類抓滿 QUICK_AFTER 隻之後，可以跳過連打，直接用機率決定。
// 機率是照「每秒按 7 下」的實測結果換算的：力道越小越好抓。
export const QUICK_AFTER = 4;

/** 快速收服的成功率（0～1），參數跟 createCapture 一樣 */
export function quickChance(opts) {
  const effort = createCapture(opts).power / BASE_STRUGGLE; // 1 = 滿血、標準力道
  return Math.max(0, Math.min(1, (0.55 - effort) / 0.17));
}
