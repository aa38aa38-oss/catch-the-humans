// 地區：決定在這裡會遇到哪些野生人類。地圖的遇敵格子會指到這裡。
// encounters：weight 出現權重；levels 等級範圍
// 設計：每一區四種屬性都有，玩家一開始就會遇到屬性相剋的情況；強的人類放在比較後面的區域。
const e = (species, weight, lo, hi) => ({ species, weight, levels: [lo, hi] });

export const AREAS = {
  TPE_PLAZA_GRASS: {
    name: '台北車站 廣場草皮',
    encounters: [
      e('FIREFIGHTER', 3, 3, 5), e('LIFEGUARD', 2, 3, 5), e('ANGLER', 3, 3, 5), // 水
      e('ACE', 2, 3, 5), e('ASH', 2, 3, 5), e('CHEF', 2, 3, 5), // 火
      e('COLONEL', 2, 3, 5), e('RONALD', 2, 3, 5), // 土、風
      e('IRON_FAN', 1, 3, 4), e('MOUNTAIN_MONKEY', 1, 4, 5),
      e('DANCING_UNCLE', 2, 3, 5), e('WEATHERMAN', 2, 3, 5), e('MASON', 2, 3, 5), e('CHEN_CAIYOU', 2, 3, 5), e('TONGSHEN', 2, 3, 5), // 第三批
    ],
  },
  TPE_HALL_CROWD: {
    name: '台北車站 大廳黑白格',
    encounters: [
      e('TANG_KI', 2, 5, 8), e('ACE', 2, 5, 8), e('CHEF', 1, 5, 8), // 火
      e('RAFTING', 2, 5, 8), e('FIREFIGHTER', 1, 5, 8), // 水
      e('RYOTSU', 2, 5, 8), e('THING', 1, 6, 8), e('COLONEL', 1, 5, 8), // 土
      e('MOUNTAIN_MONKEY', 2, 5, 8), e('IRON_FAN', 2, 5, 8), e('BATMAN', 1, 6, 8), // 風
      e('CHEN_PINGWEI', 2, 5, 8), e('RAMSAY', 2, 5, 8), e('ELSA', 2, 5, 8), e('BIAO_GE', 2, 5, 8), e('ZHUGE', 2, 5, 8), // 第三批
    ],
  },
  TPE_PLATFORM_QUEUE: {
    name: '台北車站 月台排隊區',
    encounters: [
      e('RENGOKU', 2, 8, 11), e('AKAINU', 1, 9, 12), // 火
      e('AOKIJI', 1, 9, 12), e('AQUAMAN', 2, 8, 11), // 水
      e('BULL_KING', 2, 8, 11), e('GAARA', 2, 8, 11), e('HULK', 1, 9, 12), e('THING', 1, 8, 11), // 土
      e('HANZO', 2, 8, 11), e('BATMAN', 2, 8, 11), // 風
      e('MUSTANG', 2, 8, 11), e('KISAME', 1, 9, 12), e('BRUCE_LEE', 2, 8, 11), e('THE_ROCK', 1, 9, 12), e('SUPERMAN', 1, 9, 12), e('STORM', 2, 8, 11), // 第三批
    ],
  },
};
