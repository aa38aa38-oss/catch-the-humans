// 匯出／匯入存檔測試：匯出的碼在「另一支手機」（清空的儲存空間）匯入後，進度要一模一樣
const store = new Map();
globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
const { G, newGame, exportCode, importCode, addItem } = await import('./save.js');
const { createIndividual } = await import('./individual.js');
const assert = (c, m) => { if (!c) { console.error('✘ ' + m); process.exit(1); } };

newGame('PIG');
G.humans.push(createIndividual('human', 'ELSA', 7, 'A5', { no: 1 }));
G.money = 1234; addItem(Object.keys((await import('./data/items.js')).ITEMS)[0], 2);
const before = JSON.stringify(G);
const code = exportCode();
assert(code.startsWith('CTH1-'), '存檔碼開頭');

store.clear(); // 換到新手機
newGame('COW'); G.money = 0;
assert(!importCode('亂打的字'), '亂碼要失敗');
assert(!importCode('CTH1-abc'), '壞掉的碼要失敗');
assert(G.money === 0, '失敗時原本進度不變');
assert(importCode(' ' + code.slice(0, 30) + '\n' + code.slice(30) + ' '), '正確的碼（含換行空白）要成功');
if (JSON.stringify(G) !== before) { const a = JSON.parse(before), b = G; for (const k in a) if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) console.error(k, JSON.stringify(a[k]).slice(0,200), JSON.stringify(b[k]).slice(0,200)); }
assert(JSON.stringify(G) === before, '匯入後進度一模一樣');
console.log('匯出／匯入存檔測試全部通過 ✔');
