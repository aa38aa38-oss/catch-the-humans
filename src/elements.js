// 四元素相剋系統：火 → 土 → 風 → 水 → 火（箭頭代表「剋」）
export const ELEMENTS = Object.freeze({
  FIRE: 'FIRE',
  EARTH: 'EARTH',
  WIND: 'WIND',
  WATER: 'WATER',
});

export const ELEMENT_NAMES = Object.freeze({
  FIRE: '火',
  EARTH: '土',
  WIND: '風',
  WATER: '水',
});

// 每個元素「剋」誰
const BEATS = Object.freeze({
  FIRE: 'EARTH',
  EARTH: 'WIND',
  WIND: 'WATER',
  WATER: 'FIRE',
});

export const SUPER_EFFECTIVE = 2.0;
export const NOT_EFFECTIVE = 0.5;
export const NEUTRAL = 1.0;

/** 攻擊屬性打防守屬性時的傷害倍率 */
export function getMultiplier(attack, defense) {
  if (!(attack in BEATS) || !(defense in BEATS)) {
    throw new Error(`未知的元素：${attack} / ${defense}`);
  }
  if (BEATS[attack] === defense) return SUPER_EFFECTIVE;
  if (BEATS[defense] === attack) return NOT_EFFECTIVE;
  return NEUTRAL; // 同屬性與對角（火↔風、水↔土）
}
