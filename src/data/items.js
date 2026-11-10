// 道具。商店賣的、背包裡裝的都在這裡。新增道具只要加一筆。
// kind：ball 收服用 / heal 回體力 / pp 回招式次數 / repel 驅人噴霧
// use：'battle' 只能在戰鬥中用、'field' 只能在地圖上用、'both' 都可以
export const ITEMS = {
  BALL: {
    name: '寶貝球', price: 20, kind: 'ball', use: 'battle', struggle: 1,
    desc: '彈力橡皮球。丟出去會變大，把人類整個包起來。',
  },
  GLUE_BALL: {
    name: '黏膠球', price: 60, kind: 'ball', use: 'battle', struggle: 0.7,
    desc: '表面黏黏的寶貝球。人類的掙扎力道打七折。',
  },
  ESSENCE: {
    name: '滴雞精', price: 40, kind: 'heal', use: 'both', heal: 0.5,
    desc: '回復一隻隊員一半的體力。雞喝的時候請不要多想。',
  },
  ENERGY: {
    name: '提神飲料', price: 60, kind: 'pp', use: 'both',
    desc: '一隻隊員的招式次數全部回滿。',
  },
  REPEL: {
    name: '驅人噴霧', price: 80, kind: 'repel', use: 'field', steps: 100,
    desc: '噴了之後 100 步內不會遇到野生人類。人類聞到就想走開。',
  },
};

/** 商店的商品（依序排列） */
export const SHOP = ['BALL', 'GLUE_BALL', 'ESSENCE', 'ENERGY', 'REPEL'];

/** 新遊戲一開始的背包 */
export const STARTING_BAG = { BALL: 10, ESSENCE: 2 };
export const STARTING_MONEY = 100;
