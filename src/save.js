// 存檔：只存在這支手機的瀏覽器裡。
// 存檔有版本號，之後格式改變時寫一個 migrate 步驟，舊存檔就能升級而不會壞掉。
import { createIndividual, defaultMoves } from './individual.js';
import { START, FIRST_RESPAWN, MAPS } from './data/maps/index.js';
import { ITEMS, STARTING_BAG, STARTING_MONEY } from './data/items.js';
import { ANIMALS, HUMANS } from './data/index.js';

const KEY = 'cth-save';
export const SAVE_VERSION = 2;
export const TEAM_HUMANS = 4; // 隊伍：家畜 1 + 人類 4

/** 遊戲進度。humans：所有收服的人類個體（多了 no 耳標編號） */
export const G = {
  v: SAVE_VERSION,
  animal: null,
  humans: [],
  team: [], // 上場的人類 uid，最多 4 個
  nextNo: 1,
  pos: { ...START }, // 目前在地圖上的位置
  respawn: { ...FIRST_RESPAWN }, // 最後一次休息的回復點
  money: 0, // 出貨、打贏訓練家賺的錢
  bag: {}, // 背包：道具 id → 數量
  repel: 0, // 驅人噴霧剩幾步
  flags: {}, // 劇情進度：打贏了哪些訓練家、拿到哪些徽章
  seen: [], // 圖鑑：遇過的人類種類
  best: {}, // 圖鑑：每種人類抓過的最高肉質
  caught: {}, // 每種人類總共抓過幾隻（抓滿 4 隻可以快速收服）
  pvp: { w: 0, l: 0, d: 0 },
};

export function newGame(animalId) {
  Object.assign(G, {
    v: SAVE_VERSION, animal: createIndividual('animal', animalId, 5), humans: [], team: [], nextNo: 1,
    pos: { ...START }, respawn: { ...FIRST_RESPAWN }, money: STARTING_MONEY, bag: { ...STARTING_BAG }, repel: 0,
    flags: {}, seen: [], best: {}, caught: {}, pvp: { w: 0, l: 0, d: 0 },
  });
  save();
}

export const findHuman = (uid) => G.humans.find((h) => h.uid === uid);
export const findInd = (uid) => (G.animal?.uid === uid ? G.animal : findHuman(uid));

/** 全部回滿（體力、PP） */
export function healAll() {
  for (const ind of [G.animal, ...G.humans]) {
    ind.hp = null;
    ind.pp = null;
  }
}
/** 目前的隊伍（個體陣列），家畜永遠在第一個 */
export const teamInds = () => [G.animal, ...G.team.map(findHuman).filter(Boolean)];

/** 從牧場裡的人類算出每種的最高肉質（舊存檔升級用） */
function bestOf(humans) {
  const order = ['CHOICE', 'PRIME', 'A5'];
  const best = {};
  for (const h of humans) if (order.indexOf(h.gradeId) > order.indexOf(best[h.species] ?? '')) best[h.species] = h.gradeId;
  return best;
}

function countOf(humans) {
  const c = {};
  for (const h of humans) c[h.species] = (c[h.species] ?? 0) + 1;
  return c;
}

/** 背包加減道具 */
export const itemCount = (id) => G.bag[id] ?? 0;
export function addItem(id, n = 1) {
  G.bag[id] = Math.max(0, itemCount(id) + n);
  if (!G.bag[id]) delete G.bag[id];
}

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(G));
  } catch {}
}

// v1（第一版原型）→ v2：加入個體編號、隊伍、連線戰績
function migrate(d) {
  if (d.v === undefined && d.animal) {
    const animal = createIndividual('animal', d.animal.id, d.animal.level);
    animal.exp = d.animal.exp ?? 0;
    const humans = (d.caught ?? []).map((c) => createIndividual('human', c.id, c.level, c.gradeId, { no: c.no }));
    d = { v: 2, animal, humans, team: humans.slice(0, TEAM_HUMANS).map((h) => h.uid), nextNo: d.nextNo ?? humans.length + 1 };
  }
  return d;
}

function read() {
  try {
    const raw = localStorage.getItem(KEY) ?? localStorage.getItem('cth-save-v1');
    return raw ? migrate(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export const hasSave = () => !!read()?.animal;

export function load() {
  const d = read();
  if (!d?.animal || !ANIMALS[d.animal.species]) return false;
  Object.assign(G, {
    v: SAVE_VERSION,
    animal: d.animal,
    humans: (d.humans ?? []).filter((h) => HUMANS[h.species]),
    team: d.team ?? [],
    nextNo: d.nextNo ?? 1,
    pos: d.pos && MAPS[d.pos.map] ? d.pos : { ...START },
    respawn: d.respawn && MAPS[d.respawn.map] ? d.respawn : { ...FIRST_RESPAWN },
    money: d.money ?? 0,
    // 背包是後來才加的：舊存檔送一份新手禮包
    bag: d.bag ? Object.fromEntries(Object.entries(d.bag).filter(([id, n]) => ITEMS[id] && n > 0)) : { ...STARTING_BAG },
    repel: d.repel ?? 0,
    flags: d.flags ?? {},
    seen: d.seen ?? [...new Set((d.humans ?? []).map((h) => h.species))],
    best: d.best ?? bestOf(d.humans ?? []),
    caught: d.caught ?? countOf(d.humans ?? []),
    pvp: { w: 0, l: 0, d: 0, ...d.pvp },
  });
  G.team = G.team.filter((uid) => findHuman(uid)).slice(0, TEAM_HUMANS);
  for (const ind of [G.animal, ...G.humans]) if (!ind.moves?.length) ind.moves = defaultMoves(ind.kind, ind.species, ind.level);
  save();
  try { localStorage.removeItem('cth-save-v1'); } catch {}
  return true;
}
