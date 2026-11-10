// 執行：node src/battle.test.mjs
import assert from 'node:assert/strict';
import { createAnimal, createWildHuman, createHuman, runTurn, gainExp, restore } from './battle.js';
import { createCapture, press, update } from './capture.js';
import { ANIMAL_ORDER } from './data/animals.js';
import { MOVES } from './data/moves.js';
import { HUMANS, GRADES } from './data/humans.js';

// 資料完整性：每個技能 id 都存在
for (const h of Object.values(HUMANS)) for (const m of h.moves) assert.ok(MOVES[m], `${h.name} 的技能 ${m} 不存在`);
assert.equal(GRADES.reduce((s, g) => s + g.rate, 0).toFixed(5), '1.00000', '肉質機率總和要是 100%');

// 隨機打 2000 場，不能當掉，而且一定會分出勝負
let turnsTotal = 0;
for (let i = 0; i < 2000; i++) {
  const a = createAnimal(ANIMAL_ORDER[i % 4], 5);
  const h = createWildHuman(a.level);
  let res = { winner: null };
  let turns = 0;
  while (!res.winner && turns < 100) {
    res = runTurn(a, h, a.moves[turns % 4 === 3 ? 1 : 0]); // 大多出攻擊技
    turns++;
  }
  assert.ok(res.winner, '戰鬥 100 回合內要結束');
  assert.ok(res.events.every((e) => e.t !== 'text' || !/\{\w+\}/.test(e.text)), '文字裡不能有沒填的 {變數}');
  turnsTotal += turns;
}
console.log(`平均每場 ${(turnsTotal / 2000).toFixed(1)} 回合`);

// 升級
const cow = createAnimal('COW', 5);
assert.deepEqual(gainExp(cow, 40), [6]);
restore(cow);
assert.equal(cow.hp, cow.stats.hp);

// 收服：每秒按 7 下 A，看不同血量的成功率
const rateAt = (hpRatio, asleep = false) => {
  let ok = 0;
  for (let i = 0; i < 500; i++) {
    const c = createCapture({ hpRatio, asleep, strength: 1, gradeStruggle: 1 });
    let t = 0;
    while (!c.result) {
      update(c, 1 / 60);
      t += 1 / 60;
      if (Math.floor(t * 7) !== Math.floor((t - 1 / 60) * 7)) press(c);
    }
    if (c.result === 'caught') ok++;
  }
  return ok / 500;
};
const table = [1, 0.6, 0.4, 0.25, 0.1].map((r) => [r, rateAt(r), rateAt(r, true)]);
for (const [r, a, s] of table) console.log(`血量 ${r * 100}%：收服率 ${(a * 100).toFixed(0)}%（睡著 ${(s * 100).toFixed(0)}%）`);
assert.ok(table[0][1] < 0.05, '滿血幾乎抓不到');
assert.ok(table[4][1] > 0.9, '剩 10% 血幾乎一定抓到');
console.log('戰鬥與收服測試全部通過 ✔');
