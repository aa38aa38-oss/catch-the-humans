// 戰鬥規則（純邏輯，不碰畫面）。每回合回傳一串「事件」，交給畫面依序播放。
import { getMultiplier } from './elements.js';
import { MOVES } from './data/moves.js';
import { ANIMALS } from './data/animals.js';
import { HUMANS, GRADES } from './data/humans.js';
import { TEXT } from './data/text.js';

export const fill = (s, vars) => s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
export const pick = (arr, rng = Math.random) => arr[Math.floor(rng() * arr.length)];

/** 依種族值、等級、肉質加成算出能力值 */
export function calcStats(base, level, bonus = 1) {
  const other = (b) => Math.floor(((b * 2 * level) / 100 + 5) * bonus);
  return {
    hp: Math.floor(((base.hp * 2 * level) / 100 + level + 10) * bonus),
    atk: other(base.atk),
    def: other(base.def),
    spd: other(base.spd),
  };
}

function makeFighter({ name, element, base, level, bonus = 1, moves, side }) {
  const stats = calcStats(base, level, bonus);
  return {
    name, element, base, level, bonus, moves, side, stats,
    hp: stats.hp,
    stages: { atk: 0, def: 0, acc: 0 },
    status: null, // 'sleep' | 'burn'
    sleepTurns: 0,
  };
}

export function createAnimal(id, level = 5) {
  const a = ANIMALS[id];
  return { ...makeFighter({ name: a.name, element: null, base: a.base, level, moves: a.moves, side: 'player' }), id, exp: 0 };
}

export function rollGrade(rng = Math.random) {
  let r = rng();
  for (const g of GRADES) {
    if (r < g.rate) return g;
    r -= g.rate;
  }
  return GRADES[0];
}

export function createHuman(id, level, grade) {
  const h = HUMANS[id];
  return {
    ...makeFighter({ name: h.name, element: h.element, base: h.base, level, bonus: grade.statBonus, moves: h.moves, side: 'enemy' }),
    id, grade,
  };
}

/** 依玩家等級隨機產生一隻野生人類 */
export function createWildHuman(playerLevel, rng = Math.random) {
  const id = pick(Object.keys(HUMANS), rng);
  const lo = Math.max(2, playerLevel - 2);
  const level = lo + Math.floor(rng() * (playerLevel + 1 - lo + 1));
  return createHuman(id, level, rollGrade(rng));
}

/** 回到戰鬥開始前的狀態（能力變化、異常狀態清除，體力全滿） */
export function restore(f) {
  f.hp = f.stats.hp;
  f.stages = { atk: 0, def: 0, acc: 0 };
  f.status = null;
  f.sleepTurns = 0;
}

const stageMult = (s) => (s >= 0 ? (2 + s) / 2 : 2 / (2 - s));
const accMult = (s) => (s >= 0 ? (3 + s) / 3 : 3 / (3 - s));

export function damageOf(user, target, move, rng = Math.random) {
  const atk = user.stats.atk * stageMult(user.stages.atk);
  const def = target.stats.def * stageMult(target.stages.def);
  const mult = getMultiplier(move.element, target.element);
  const raw = Math.floor((((2 * user.level) / 5 + 2) * move.power * atk) / def / 50) + 2;
  const dmg = Math.max(1, Math.floor(raw * mult * (0.85 + rng() * 0.15)));
  return { dmg, mult };
}

/** 野生人類的行動選擇 */
export function chooseEnemyMove(enemy, player, rng = Math.random) {
  const options = enemy.moves.map((id) => {
    const m = MOVES[id];
    let w = 1;
    const e = m.effect;
    if (m.kind === 'attack') w = 2 + (e?.status === 'burn' && player.status ? -1 : 0);
    if (e?.heal) w = enemy.hp < enemy.stats.hp * 0.5 && (enemy.healsUsed ?? 0) < 3 ? 3 : 0; // 每場最多回血 3 次
    if (e?.stat && e.target === 'self') w = enemy.stages[e.stat] >= 2 ? 0 : 0.8;
    return { id, w };
  });
  const total = options.reduce((s, o) => s + o.w, 0);
  let r = rng() * total;
  for (const o of options) {
    if (r < o.w) {
      if (MOVES[o.id].effect?.heal) enemy.healsUsed = (enemy.healsUsed ?? 0) + 1;
      return o.id;
    }
    r -= o.w;
  }
  return enemy.moves.find((id) => MOVES[id].kind === 'attack') ?? enemy.moves[0];
}

function applyEffect(e, user, target, events, rng, moveText, vars) {
  const who = e.target === 'self' ? user : target;
  const v = { ...vars, target: who.name };
  if (e.heal) {
    if (user.hp >= user.stats.hp) {
      events.push({ t: 'text', text: fill(TEXT.healFull, v) });
      return;
    }
    if (moveText) events.push({ t: 'text', text: fill(moveText, v) });
    user.hp = Math.min(user.stats.hp, user.hp + Math.ceil(user.stats.hp * e.heal));
    events.push({ t: 'hp', side: user.side, hp: user.hp });
    events.push({ t: 'text', text: fill(TEXT.heal, v) });
    return;
  }
  if (e.stat) {
    const cur = who.stages[e.stat];
    const next = Math.max(-6, Math.min(6, cur + e.stages));
    if (next === cur) {
      events.push({ t: 'text', text: fill(TEXT.statMax, v) });
      return;
    }
    who.stages[e.stat] = next;
    if (moveText) events.push({ t: 'text', text: fill(moveText, v) });
    events.push({ t: 'text', text: fill(e.stages > 0 ? TEXT.statUp[e.stat] : TEXT.statDown[e.stat], v) });
    return;
  }
  if (e.status) {
    if (who.status) {
      if (who.status === 'sleep' && e.status === 'sleep') events.push({ t: 'text', text: fill(TEXT.alreadyAsleep, v) });
      return;
    }
    who.status = e.status;
    if (e.status === 'sleep') who.sleepTurns = 1 + Math.floor(rng() * 3);
    if (moveText) events.push({ t: 'text', text: fill(moveText, v) });
    events.push({ t: 'text', text: fill(pick(TEXT[e.status], rng), v) });
    events.push({ t: 'status', side: who.side, status: who.status });
  }
}

/** 一隻角色使用一個技能，事件寫進 events */
export function useMove(user, target, moveId, events, rng = Math.random) {
  const move = MOVES[moveId];
  const vars = { user: user.name, foe: target.name };

  if (user.status === 'sleep') {
    if (user.sleepTurns > 0) {
      user.sleepTurns--;
      events.push({ t: 'text', text: fill(TEXT.asleep, vars) });
      return;
    }
    user.status = null;
    events.push({ t: 'text', text: fill(TEXT.wakeUp, vars) });
    events.push({ t: 'status', side: user.side, status: null });
  }

  events.push({ t: 'text', text: fill(TEXT.useMove, { ...vars, move: move.name }) });
  events.push({ t: 'lunge', side: user.side });

  const selfOnly = move.kind === 'status' && move.effect?.target !== 'foe';
  if (!selfOnly) {
    const hitChance = (move.accuracy / 100) * accMult(user.stages.acc);
    if (rng() >= hitChance) {
      events.push({ t: 'text', text: TEXT.miss });
      return;
    }
  }

  if (move.kind === 'status') {
    applyEffect(move.effect, user, target, events, rng, move.text, vars);
    return;
  }

  const [lo, hi] = move.hits ?? [1, 1];
  const n = lo + Math.floor(rng() * (hi - lo + 1));
  let landed = 0;
  let mult = 1;
  for (let i = 0; i < n && target.hp > 0; i++) {
    const r = damageOf(user, target, move, rng);
    mult = r.mult;
    target.hp = Math.max(0, target.hp - r.dmg);
    landed++;
    events.push({ t: 'hit', side: target.side, hp: target.hp, mult });
  }
  if (mult > 1) events.push({ t: 'text', text: TEXT.superEffective });
  if (mult < 1) events.push({ t: 'text', text: TEXT.notEffective });
  if (n > 1) events.push({ t: 'text', text: fill(TEXT.hits, { n: landed }) });

  if (move.effect && target.hp > 0 && rng() < (move.effect.chance ?? 1)) {
    applyEffect(move.effect, user, target, events, rng, move.text, vars);
  }
}

function burnTick(f, events) {
  if (f.status !== 'burn' || f.hp <= 0) return;
  f.hp = Math.max(0, f.hp - Math.max(1, Math.floor(f.stats.hp / 12)));
  events.push({ t: 'text', text: fill(TEXT.burnTick, { user: f.name }) });
  events.push({ t: 'hit', side: f.side, hp: f.hp, mult: 1 });
}

/**
 * 跑一個完整回合：雙方依速度出手，回合結束時結算燒傷。
 * 回傳 { events, winner: 'player' | 'enemy' | null }
 */
export function runTurn(player, enemy, playerMoveId, rng = Math.random) {
  const events = [];
  const enemyMoveId = chooseEnemyMove(enemy, player, rng);
  const playerFirst = player.stats.spd > enemy.stats.spd || (player.stats.spd === enemy.stats.spd && rng() < 0.5);
  const order = playerFirst
    ? [[player, enemy, playerMoveId], [enemy, player, enemyMoveId]]
    : [[enemy, player, enemyMoveId], [player, enemy, playerMoveId]];

  for (const [u, t, m] of order) {
    if (u.hp <= 0 || t.hp <= 0) continue;
    useMove(u, t, m, events, rng);
  }
  burnTick(player, events);
  burnTick(enemy, events);

  let winner = null;
  if (enemy.hp <= 0) winner = 'player';
  else if (player.hp <= 0) winner = 'enemy';
  if (winner) events.push({ t: 'faint', side: winner === 'player' ? 'enemy' : 'player' });
  return { events, winner };
}

export const expToNext = (level) => level * 8;
export const expReward = (enemy) => enemy.level * 6;

/** 加經驗值，回傳升到的等級清單 */
export function gainExp(animal, amount) {
  const ups = [];
  animal.exp += amount;
  while (animal.exp >= expToNext(animal.level)) {
    animal.exp -= expToNext(animal.level);
    animal.level++;
    const old = animal.stats.hp;
    animal.stats = calcStats(animal.base, animal.level);
    animal.hp += animal.stats.hp - old;
    ups.push(animal.level);
  }
  return ups;
}
