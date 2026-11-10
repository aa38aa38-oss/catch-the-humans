// 「個體」：玩家擁有的每一隻家畜或人類。存檔、組隊、連線傳給對手的都是它。
// 物種資料（技能、種族值）不存在個體裡，只存物種 id，所以之後調整數值會自動套用。
import { ANIMALS, HUMANS, speciesOf, gradeOf } from './data/index.js';
import { randomId } from './rng.js';

/**
 * @param kind 'animal' | 'human'
 * @param species 物種 id，例如 'COW'、'ACE'
 */
export function createIndividual(kind, species, level, gradeId = 'CHOICE', extra = {}) {
  return { uid: randomId(), kind, species, level, exp: 0, gradeId, ...extra };
}

export const nameOf = (ind) => speciesOf(ind.kind, ind.species).name;

/** 轉成連線傳輸用的精簡格式（不含等級：PK 統一 Lv.50） */
export const toWire = (ind) => ({ k: ind.kind === 'animal' ? 'a' : 'h', s: ind.species, g: ind.gradeId });

/** 把對手傳來的資料還原成個體；資料不合法就回傳 null（對手的資料一律不信任） */
export function fromWire(w, level, i = 0) {
  if (!w || typeof w !== 'object') return null;
  const kind = w.k === 'a' ? 'animal' : w.k === 'h' ? 'human' : null;
  if (!kind || typeof w.s !== 'string' || !Object.hasOwn(kind === 'animal' ? ANIMALS : HUMANS, w.s)) return null;
  const gradeId = kind === 'animal' ? 'CHOICE' : gradeOf(w.g).id;
  return { uid: `opp-${i}`, kind, species: w.s, level, exp: 0, gradeId };
}
