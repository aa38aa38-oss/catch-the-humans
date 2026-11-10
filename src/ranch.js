// 人類牧場的規則：合成強化、出貨價格（純邏輯，方便測試）。
import { GRADES, HUMANS } from './data/index.js';

export const SYNTH_MATERIALS = 2; // 主體之外要幾隻同種人類當材料
export const MAX_BOOST = 5; // 最多強化幾次
export const BOOST_STAT = 0.04; // 每次強化，能力值 +4%

/** 強化帶來的能力倍率 */
export const boostMult = (boost = 0) => 1 + BOOST_STAT * Math.min(MAX_BOOST, boost);

/** 能不能拿 materials 來強化 main；回傳 null 代表可以，否則回傳原因 */
export function synthBlock(main, materials) {
  if (main.kind !== 'human') return '只有人類可以合成。';
  if ((main.boost ?? 0) >= MAX_BOOST) return '已經強化到最高了。';
  if (materials.length !== SYNTH_MATERIALS) return `需要 ${SYNTH_MATERIALS} 隻材料。`;
  if (materials.some((m) => m.uid === main.uid)) return '主體不能當材料。';
  if (materials.some((m) => m.species !== main.species)) return '材料要跟主體同一種人類。';
  return null;
}

/** 合成：主體強化 +1、肉質升一級（已經是最高就不變）。回傳 { gradeUp } */
export function synthesize(main, materials) {
  const why = synthBlock(main, materials);
  if (why) throw new Error(why);
  main.boost = (main.boost ?? 0) + 1;
  const i = GRADES.findIndex((g) => g.id === main.gradeId);
  const gradeUp = i < GRADES.length - 1;
  if (gradeUp) main.gradeId = GRADES[i + 1].id;
  return { gradeUp };
}

const GRADE_PRICE = { CHOICE: 1, PRIME: 2, A5: 5 };

/** 出貨價格：等級 × 10 × 肉質倍數 × 強化加價 */
export function shipPrice(ind) {
  if (!HUMANS[ind.species]) return 0;
  return Math.round(ind.level * 10 * (GRADE_PRICE[ind.gradeId] ?? 1) * (1 + 0.2 * (ind.boost ?? 0)));
}

/** 顯示用名字：強化過的加上 +N */
export const boostedName = (name, boost) => (boost ? `${name}+${boost}` : name);
