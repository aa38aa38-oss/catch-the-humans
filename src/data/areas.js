// 地區：決定在這裡會遇到哪些野生人類。地圖的遇敵格子會指到這裡。
// encounters：weight 出現權重；levels 等級範圍
export const AREAS = {
  TPE_PLAZA_GRASS: {
    name: '台北車站 廣場草皮',
    encounters: [
      { species: 'FIREFIGHTER', weight: 3, levels: [3, 5] },
      { species: 'ACE', weight: 2, levels: [3, 5] },
      { species: 'IRON_FAN', weight: 1, levels: [3, 4] },
    ],
  },
  TPE_HALL_CROWD: {
    name: '台北車站 大廳黑白格',
    encounters: [
      { species: 'ACE', weight: 2, levels: [5, 8] },
      { species: 'FIREFIGHTER', weight: 2, levels: [5, 8] },
      { species: 'IRON_FAN', weight: 2, levels: [5, 8] },
      { species: 'THING', weight: 1, levels: [6, 8] },
    ],
  },
  TPE_PLATFORM_QUEUE: {
    name: '台北車站 月台排隊區',
    encounters: [
      { species: 'THING', weight: 3, levels: [8, 11] },
      { species: 'IRON_FAN', weight: 2, levels: [8, 11] },
      { species: 'ACE', weight: 1, levels: [9, 12] },
    ],
  },
};
