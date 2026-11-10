// 存檔：只存在這支手機的瀏覽器裡。
// 存檔有版本號，之後格式改變時寫一個 migrate 步驟，舊存檔就能升級而不會壞掉。
import { createIndividual, defaultMoves } from './individual.js';
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
  area: 'START_FIELD',
  pvp: { w: 0, l: 0, d: 0 },
};

export function newGame(animalId) {
  Object.assign(G, {
    v: SAVE_VERSION, animal: createIndividual('animal', animalId, 5), humans: [], team: [], nextNo: 1,
    area: 'START_FIELD', pvp: { w: 0, l: 0, d: 0 },
  });
  save();
}

export const findHuman = (uid) => G.humans.find((h) => h.uid === uid);
/** 目前的隊伍（個體陣列），家畜永遠在第一個 */
export const teamInds = () => [G.animal, ...G.team.map(findHuman).filter(Boolean)];

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
    area: d.area ?? 'START_FIELD',
    pvp: { w: 0, l: 0, d: 0, ...d.pvp },
  });
  G.team = G.team.filter((uid) => findHuman(uid)).slice(0, TEAM_HUMANS);
  for (const ind of [G.animal, ...G.humans]) if (!ind.moves?.length) ind.moves = defaultMoves(ind.kind, ind.species, ind.level);
  save();
  try { localStorage.removeItem('cth-save-v1'); } catch {}
  return true;
}
