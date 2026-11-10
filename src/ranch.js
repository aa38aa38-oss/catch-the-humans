// 人類養殖場的規則：合成強化、出貨價格（純邏輯，方便測試）。
import { GRADES, HUMANS } from './data/index.js';
import { defaultMoves } from './individual.js';

export const SYNTH_MATERIALS = 2; // 主體之外要幾隻人類當材料（不同種也可以）
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
  if (materials.some((m) => m.kind !== 'human')) return '只有人類可以當材料。';
  return null;
}

const gradeIndex = (id) => Math.max(0, GRADES.findIndex((g) => g.id === id));

/**
 * 合成：3 隻合成 1 隻（主體＋2 隻材料，可以不同種）。
 * - 結果隨機變成 3 隻裡面其中一種人類（同種的越多，越容易變成那一種）
 * - 肉質：取 3 隻裡最好的，再升一級（最高 A5）
 * - 強化次數：主體的 +1；等級、經驗值、耳標沿用主體
 * - 變成別種人類時，招式換成那種人類在這個等級會的招
 * 回傳 { from, to, gradeUp, changed }
 */
export function synthesize(main, materials, rand = Math.random) {
  const why = synthBlock(main, materials);
  if (why) throw new Error(why);
  const all = [main, ...materials];
  const from = main.species;
  const to = all[Math.floor(rand() * all.length)].species;
  const bestGrade = Math.max(...all.map((h) => gradeIndex(h.gradeId)));
  const next = Math.min(GRADES.length - 1, bestGrade + 1);
  const gradeUp = next > gradeIndex(main.gradeId);
  main.gradeId = GRADES[next].id;
  main.boost = (main.boost ?? 0) + 1;
  const changed = to !== from;
  if (changed) {
    main.species = to;
    main.moves = defaultMoves('human', to, main.level);
    main.pp = null;
  }
  return { from, to, gradeUp, changed };
}

const GRADE_PRICE = { CHOICE: 1, PRIME: 2, A5: 5 };

/** 出貨價格：等級 × 10 × 肉質倍數 × 強化加價 */
export function shipPrice(ind) {
  if (!HUMANS[ind.species]) return 0;
  return Math.round(ind.level * 10 * (GRADE_PRICE[ind.gradeId] ?? 1) * (1 + 0.2 * (ind.boost ?? 0)));
}

/** 顯示用名字：強化過的加上 +N */
export const boostedName = (name, boost) => (boost ? `${name}+${boost}` : name);
