// 主角家畜。無屬性（element: null）。
// base：種族值，數值算法見 src/battle.js 的 calcStats
// moves：一開始就會的招式
// learnset：升級學招表，例如 [{ level: 10, move: 'XXX' }]（之後一起設計）
// evolveMoves：進化時學的招（之後做進化時用）
// tms：可以用「招式學習器」學的招（之後做道具時用）
export const ANIMALS = {
  COW: {
    name: '牛', desc: '攻擊高，速度慢',
    base: { hp: 80, atk: 100, def: 70, spd: 40 },
    moves: ['RAMMING', 'RUMINATE'],
    learnset: [{ level: 8, move: 'BULL_TEMPER' }, { level: 15, move: 'REVERSE_MILKING' }, { level: 25, move: 'BULLFIGHT' }, { level: 35, move: 'BRAGGING' }, { level: 45, move: 'LAST_SUPPER' }],
  },
  PIG: {
    name: '豬', desc: '體力最多',
    base: { hp: 115, atk: 75, def: 75, spd: 50 },
    moves: ['BODY_SLAM', 'MUD_BATH'],
    learnset: [{ level: 8, move: 'PIG_TEAMMATE' }, { level: 15, move: 'EAT_AND_SLEEP' }, { level: 25, move: 'PORK_BELLY_RUSH' }, { level: 35, move: 'LARD_ARMOR' }, { level: 45, move: 'ROAST_PIG' }],
  },
  SHEEP: {
    name: '羊', desc: '防禦高',
    base: { hp: 80, atk: 70, def: 105, spd: 60 },
    moves: ['HEADBUTT', 'LULLABY'],
    learnset: [{ level: 8, move: 'OWN_WOOL' }, { level: 15, move: 'WOLF_CLOTHING' }, { level: 25, move: 'COUNTING_SHEEP' }, { level: 35, move: 'WOOL_FELT' }, { level: 45, move: 'SCAPEGOAT' }],
  },
  CHICKEN: {
    name: '雞', desc: '速度最快',
    base: { hp: 60, atk: 75, def: 55, spd: 110 },
    moves: ['PECK', 'DAWN_CALL'],
    learnset: [{ level: 8, move: 'BUSYBODY' }, { level: 15, move: 'CHICKEN_FIRST' }, { level: 25, move: 'NO_EGG_TODAY' }, { level: 35, move: 'POPCORN_CHICKEN' }, { level: 45, move: 'CHAOS' }],
  },
};

export const ANIMAL_ORDER = ['COW', 'PIG', 'SHEEP', 'CHICKEN'];
