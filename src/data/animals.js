// 主角家畜。無屬性（element: null）。
// base：種族值，數值算法見 src/battle.js 的 calcStats
export const ANIMALS = {
  COW: {
    name: '牛', desc: '攻擊高，速度慢',
    base: { hp: 80, atk: 100, def: 70, spd: 40 },
    moves: ['RAMMING', 'RUMINATE'],
  },
  PIG: {
    name: '豬', desc: '體力最多',
    base: { hp: 115, atk: 75, def: 75, spd: 50 },
    moves: ['BODY_SLAM', 'MUD_BATH'],
  },
  SHEEP: {
    name: '羊', desc: '防禦高',
    base: { hp: 80, atk: 70, def: 105, spd: 60 },
    moves: ['HEADBUTT', 'LULLABY'],
  },
  CHICKEN: {
    name: '雞', desc: '速度最快',
    base: { hp: 60, atk: 75, def: 55, spd: 110 },
    moves: ['PECK', 'DAWN_CALL'],
  },
};

export const ANIMAL_ORDER = ['COW', 'PIG', 'SHEEP', 'CHICKEN'];
