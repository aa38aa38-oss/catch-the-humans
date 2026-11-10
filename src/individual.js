// 「個體」：玩家擁有的每一隻家畜或人類。存檔、組隊、連線傳給對手的都是它。
// 種族值不存在個體裡，只存物種 id，所以之後調整數值會自動套用。
// 個體自己記得「目前會的招式」（最多 4 招），因為每隻學到、忘掉的招不一樣。
import { ANIMALS, HUMANS, MOVES, speciesOf, gradeOf } from './data/index.js';
import { randomId } from './rng.js';
import { MAX_BOOST, boostedName } from './ranch.js';

export const MOVE_SLOTS = 4;

/** 物種在某等級「升級時」會學的招式 */
export const movesLearnedAt = (kind, species, level) =>
  (speciesOf(kind, species).learnset ?? []).filter((e) => e.level === level).map((e) => e.move);

/** 一隻剛遇到的個體會的招：初始招式＋到目前等級為止升級學到的，保留最後 4 招 */
export function defaultMoves(kind, species, level) {
  const sp = speciesOf(kind, species);
  const learned = (sp.learnset ?? []).filter((e) => e.level <= level).sort((a, b) => a.level - b.level).map((e) => e.move);
  const all = [...sp.moves, ...learned].filter((m, i, arr) => arr.indexOf(m) === i);
  return all.slice(-MOVE_SLOTS);
}

/** 這個物種「有可能」會的所有招式（升級、進化、招式學習器），用來檢查對手傳來的招式 */
export function learnableMoves(kind, species) {
  const sp = speciesOf(kind, species);
  return new Set([...sp.moves, ...(sp.learnset ?? []).map((e) => e.move), ...(sp.evolveMoves ?? []), ...(sp.tms ?? [])]);
}

/**
 * @param kind 'animal' | 'human'
 * @param species 物種 id，例如 'COW'、'ACE'
 */
export function createIndividual(kind, species, level, gradeId = 'CHOICE', extra = {}) {
  return { uid: randomId(), kind, species, level, exp: 0, gradeId, moves: defaultMoves(kind, species, level), ...extra };
}

export const nameOf = (ind) => boostedName(speciesOf(ind.kind, ind.species).name, ind.boost);

/** 轉成連線傳輸用的精簡格式（不含等級：PK 統一 Lv.50） */
export const toWire = (ind) => ({ k: ind.kind === 'animal' ? 'a' : 'h', s: ind.species, g: ind.gradeId, m: ind.moves, b: ind.boost ?? 0 });

/** 把對手傳來的資料還原成個體；資料不合法就回傳 null（對手的資料一律不信任） */
export function fromWire(w, level, i = 0) {
  if (!w || typeof w !== 'object') return null;
  const kind = w.k === 'a' ? 'animal' : w.k === 'h' ? 'human' : null;
  if (!kind || typeof w.s !== 'string' || !Object.hasOwn(kind === 'animal' ? ANIMALS : HUMANS, w.s)) return null;
  const gradeId = kind === 'animal' ? 'CHOICE' : gradeOf(w.g).id;
  const ok = learnableMoves(kind, w.s);
  const moves = Array.isArray(w.m) && w.m.length >= 1 && w.m.length <= MOVE_SLOTS && w.m.every((m) => ok.has(m) && MOVES[m])
    ? [...new Set(w.m)] : null;
  if (!moves) return null;
  const boost = kind === 'human' && Number.isInteger(w.b) && w.b >= 0 && w.b <= MAX_BOOST ? w.b : 0;
  return { uid: `opp-${i}`, kind, species: w.s, level, exp: 0, gradeId, moves, boost };
}
