// 連線 PK 的規則（純邏輯，不碰網路，方便測試）。
//
// 做法：雙方把「我是誰、我的隊伍、我到目前為止每一步的選擇」放在自己的狀態裡給對方看。
// 兩邊用同一顆種子、照同樣順序套用雙方的選擇，各自算出一模一樣的戰況。
import { createBattle, sanitize } from './battle.js';
import { DATA_VERSION } from './data/index.js';
import { toWire, fromWire } from './individual.js';
import { hash32 } from './rng.js';

export const PVP_LEVEL = 50;
export const TEAM_MAX = 5; // 家畜 1 + 人類 4

/** 我方要公開的狀態 */
export function myPresence({ nonce, team, acts = [] }) {
  return { app: 'cth', v: DATA_VERSION, nonce, team: team.slice(0, TEAM_MAX).map(toWire), acts };
}

/** 檢查對手狀態是否可以開打；回傳 { ok, reason } */
export function checkOpponent(p) {
  if (!p || p.app !== 'cth' || typeof p.nonce !== 'string') return { ok: false, reason: 'notGame' };
  if (p.v !== DATA_VERSION) return { ok: false, reason: 'version' };
  if (!Array.isArray(p.team) || p.team.length < 1 || p.team.length > TEAM_MAX) return { ok: false, reason: 'team' };
  if (p.team[0]?.k !== 'a') return { ok: false, reason: 'team' };
  if (p.team.some((w, i) => !fromWire(w, PVP_LEVEL, i))) return { ok: false, reason: 'team' };
  return { ok: true };
}

/**
 * 用雙方的狀態建立戰鬥。誰是 0 號方由 nonce 排序決定，兩邊算出來一定一樣。
 * 回傳 { state, mySide }
 */
export function setupBattle(mine, theirs) {
  const meFirst = mine.nonce < theirs.nonce;
  const order = meFirst ? [mine, theirs] : [theirs, mine];
  const teams = order.map((p) => p.team.map((w, i) => fromWire(w, PVP_LEVEL, i)));
  const seed = hash32(`${order[0].nonce}|${order[1].nonce}|${DATA_VERSION}`);
  return { state: createBattle({ mode: 'pvp', seed, teams, level: PVP_LEVEL }), mySide: meFirst ? 0 : 1 };
}

// 行動壓成短字串，省傳輸空間：m0 第 1 招、s3 換成第 4 隻、f 投降、n 這步不用選
export const encodeAct = (a) =>
  a == null ? 'n' : a.type === 'move' ? `m${a.index}` : a.type === 'switch' ? `s${a.slot}` : a.type === 'forfeit' ? 'f' : 'n';
export function decodeAct(str) {
  if (typeof str !== 'string') return null;
  if (str === 'f') return { type: 'forfeit' };
  const n = Number(str.slice(1));
  if (str[0] === 'm' && Number.isInteger(n)) return { type: 'move', index: n };
  if (str[0] === 's' && Number.isInteger(n)) return { type: 'switch', slot: n };
  return null;
}

/** 這一步 s 方需不需要做選擇 */
export const mustChoose = (state, s) => (state.need.length ? state.need.includes(s) : state.winner === null);

/** 把雙方第 k 步的選擇整理成可以套用的形式 */
export function stepActions(state, raw) {
  return raw.map((str, s) => {
    const a = decodeAct(str);
    if (state.need.length) return a?.type === 'switch' ? a.slot : null;
    return sanitize(state, s, a);
  });
}
