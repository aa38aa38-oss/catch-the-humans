// 所有遊戲資料的入口，以及「資料版本號」。
// 連線 PK 時雙方的版本號要相同，否則數值不一樣、算出來的戰況會不同步。
import { ANIMALS } from './animals.js';
import { HUMANS, GRADES } from './humans.js';
import { MOVES } from './moves.js';
import { hash32 } from '../rng.js';

export { ANIMALS, HUMANS, GRADES, MOVES };
export { AREAS } from './areas.js';

/** 一個物種：家畜或人類 */
export const speciesOf = (kind, id) => (kind === 'animal' ? ANIMALS[id] : HUMANS[id]);
export const gradeOf = (id) => GRADES.find((g) => g.id === id) ?? GRADES[0];

// 只拿「影響戰鬥結果」的欄位算版本號；改台詞、圖鑑文字不會影響連線
const mechanics = (table, keys) =>
  Object.keys(table).sort().map((id) => [id, ...keys.map((k) => table[id][k])]);
export const DATA_VERSION = hash32(
  JSON.stringify([
    mechanics(ANIMALS, ['base', 'moves', 'learnset', 'evolveMoves', 'tms']),
    mechanics(HUMANS, ['element', 'base', 'moves', 'strength', 'learnset', 'evolveMoves', 'tms']),
    mechanics(MOVES, ['kind', 'element', 'pp', 'power', 'accuracy', 'hits', 'effect', 'recoil', 'drain', 'priority']),
    GRADES.map((g) => [g.id, g.statBonus]),
  ]),
).toString(36);
