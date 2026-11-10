// 地區（之後每張地圖對應一個或多個地區）。決定這裡會遇到哪些野生人類。
// encounters：weight 出現權重；levels 等級範圍
export const AREAS = {
  START_FIELD: {
    name: '起始草原',
    encounters: [
      { species: 'ACE', weight: 1, levels: [3, 7] },
      { species: 'THING', weight: 1, levels: [3, 7] },
      { species: 'IRON_FAN', weight: 1, levels: [3, 7] },
      { species: 'FIREFIGHTER', weight: 1, levels: [3, 7] },
    ],
  },
};
