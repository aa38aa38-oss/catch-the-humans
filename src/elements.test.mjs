// 執行：node src/elements.test.mjs
import assert from 'node:assert/strict';
import { getMultiplier } from './elements.js';

const order = ['FIRE', 'EARTH', 'WIND', 'WATER'];
const table = [
  [1.0, 2.0, 1.0, 0.5],
  [0.5, 1.0, 2.0, 1.0],
  [1.0, 0.5, 1.0, 2.0],
  [2.0, 1.0, 0.5, 1.0],
];
order.forEach((atk, i) =>
  order.forEach((def, j) => assert.equal(getMultiplier(atk, def), table[i][j], `${atk}→${def}`)),
);
assert.equal(getMultiplier(null, 'FIRE'), 1.0, '無屬性攻擊');
assert.equal(getMultiplier('WATER', null), 1.0, '打無屬性');
console.log('元素相剋表全部通過 ✔');
