// 技能資料表。新增技能只要在這裡加一筆。
// kind: 'attack' 攻擊 / 'status' 變化技
// element: 'FIRE' | 'EARTH' | 'WIND' | 'WATER' | null（無屬性）
// effect（可選）：
//   { heal: 0.4 }                         回復最大體力 40%
//   { stat: 'def', stages: 1, target: 'self' }   能力變化（atk/def/acc）
//   { status: 'sleep', target: 'foe' }    異常狀態（sleep 睡著 / burn 燒傷）
//   chance：附加效果的機率（攻擊技用），省略就是 100%
// hits: [最少, 最多] 連續攻擊次數
// pp：一場戰鬥裡可以用幾次（跟寶可夢一樣），用完就不能再用
// recoil：使用者自己受到最大體力多少比例的反作用力傷害
// drain：打出傷害的多少比例回到自己身上
// priority：先制度，數字大的先出手（預設 0），一樣才比速度
// accuracy: null 代表必中
// effect.limit：這招最多只能把能力變化疊到幾段（例如 2 = 最多降兩次）
// effect.rest：回血後自己睡著幾回合
// text：使用後的額外描述，{user} 使用者、{foe} 對手

export const MOVES = {
  // 所有招式都用完時自動使用
  STRUGGLE: {
    name: '垂死掙扎', kind: 'attack', element: null, pp: 0, power: 50, accuracy: 100, recoil: 0.25,
    text: '{user}已經沒有招式可以用了！',
  },

  // ── 家畜 ──
  RAMMING: { name: '蠻牛衝撞', kind: 'attack', element: null, pp: 15, power: 60, accuracy: 90 },
  RUMINATE: {
    name: '反芻', kind: 'status', element: null, pp: 5, accuracy: 100,
    effect: { heal: 0.4 },
    text: '{user}把早上吃的草吐出來，再嚼了一次。',
  },
  BODY_SLAM: { name: '肉彈壓頂', kind: 'attack', element: null, pp: 20, power: 50, accuracy: 100 },
  MUD_BATH: {
    name: '滾泥巴', kind: 'status', element: null, pp: 10, accuracy: 100,
    effect: { stat: 'def', stages: 1, target: 'self' },
    text: '{user}全身裹滿泥巴。順便完成了醃料步驟。',
  },
  HEADBUTT: { name: '頭槌', kind: 'attack', element: null, pp: 20, power: 45, accuracy: 100 },
  LULLABY: {
    name: '咩～催眠曲', kind: 'status', element: null, pp: 10, accuracy: 75,
    effect: { status: 'sleep', target: 'foe' },
  },
  PECK: { name: '啄啄啄', kind: 'attack', element: null, pp: 20, power: 18, accuracy: 95, hits: [2, 4] },
  DAWN_CALL: {
    name: '凌晨五點叫床', kind: 'status', element: null, pp: 15, accuracy: 100,
    effect: { stat: 'atk', stages: -1, target: 'foe' },
    text: '{foe}被吵醒，整個人沒力了。',
  },

  // ── 家畜升級學的招（名稱黑色幽默，效果要實際有用）──
  // 牛
  BULL_TEMPER: {
    name: '牛脾氣', kind: 'status', element: null, pp: 10, accuracy: 100,
    effect: { stat: 'atk', stages: 2, target: 'self' },
    text: '{user}的牛脾氣上來了，誰勸都沒用。',
  },
  REVERSE_MILKING: {
    name: '反向擠奶', kind: 'attack', element: null, pp: 15, power: 45, accuracy: 100, drain: 0.5,
  },
  BULLFIGHT: {
    name: '西班牙鬥牛', kind: 'attack', element: null, pp: 10, power: 90, accuracy: 85, recoil: 0.15,
  },
  BRAGGING: {
    name: '吹牛', kind: 'status', element: null, pp: 15, accuracy: 100,
    effect: { stat: 'acc', stages: -1, target: 'foe', limit: 2 },
    text: '{user}開始吹牛，{foe}聽得頭昏眼花。',
  },
  LAST_SUPPER: {
    name: '最後的晚餐', kind: 'attack', element: null, pp: 5, power: 120, accuracy: 100,
    effect: { stat: 'atk', stages: -1, target: 'self' },
    text: '{user}把力氣用光了。',
  },
  // 豬
  PIG_TEAMMATE: {
    name: '豬隊友', kind: 'status', element: null, pp: 15, accuracy: 100,
    effect: { stat: 'def', stages: -1, target: 'foe' },
    text: '{user}熱情地拖累了{foe}。',
  },
  EAT_AND_SLEEP: {
    name: '吃飽就睡', kind: 'status', element: null, pp: 5, accuracy: 100,
    effect: { heal: 1, rest: 2 },
    text: '{user}吃了一整桶廚餘。',
  },
  PORK_BELLY_RUSH: { name: '三層肉衝撞', kind: 'attack', element: null, pp: 15, power: 75, accuracy: 95 },
  LARD_ARMOR: {
    name: '豬油護體', kind: 'status', element: null, pp: 10, accuracy: 100,
    effect: { stat: 'def', stages: 2, target: 'self' },
    text: '{user}全身抹滿自己煉的豬油。',
  },
  ROAST_PIG: {
    name: '烤全豬', kind: 'attack', element: 'FIRE', pp: 5, power: 100, accuracy: 90, recoil: 0.2,
  },
  // 羊
  OWN_WOOL: {
    name: '羊毛出在羊身上', kind: 'status', element: null, pp: 10, accuracy: 100,
    effect: { heal: 0.5 },
    text: '{user}剃下自己的羊毛，織了一件毛衣給自己。',
  },
  WOLF_CLOTHING: {
    name: '披著羊皮的狼', kind: 'status', element: null, pp: 10, accuracy: 100,
    effect: { stat: 'atk', stages: 2, target: 'self' },
    text: '{user}脫下羊皮，露出了狼的眼神。',
  },
  COUNTING_SHEEP: {
    name: '數羊', kind: 'status', element: null, pp: 10, accuracy: 90,
    effect: { status: 'sleep', target: 'foe' },
    text: '一隻羊、兩隻羊、三隻羊……',
  },
  WOOL_FELT: {
    name: '羊毛氈', kind: 'status', element: null, pp: 10, accuracy: 100,
    effect: { stat: 'def', stages: 2, target: 'self' },
    text: '{user}把自己壓成了一塊羊毛氈。',
  },
  SCAPEGOAT: { name: '代罪羔羊', kind: 'attack', element: null, pp: 10, power: 80, accuracy: null },
  // 雞
  BUSYBODY: {
    name: '雞婆', kind: 'status', element: null, pp: 20, accuracy: 100,
    effect: { stat: 'def', stages: -1, target: 'foe' },
    text: '{user}對{foe}的人生指指點點。',
  },
  CHICKEN_FIRST: { name: '先有雞', kind: 'attack', element: null, pp: 20, power: 40, accuracy: 100, priority: 1 },
  NO_EGG_TODAY: {
    name: '今天不生蛋', kind: 'status', element: null, pp: 5, accuracy: 100,
    effect: { heal: 0.5 },
    text: '{user}決定今天不生蛋，把營養留給自己。',
  },
  POPCORN_CHICKEN: {
    name: '鹽酥雞', kind: 'attack', element: 'FIRE', pp: 15, power: 70, accuracy: 100,
    effect: { status: 'burn', target: 'foe', chance: 0.3 },
  },
  CHAOS: { name: '雞飛狗跳', kind: 'attack', element: null, pp: 10, power: 25, accuracy: 90, hits: [2, 5] },

  // ── 野生人類 ──
  FIRE_FIST: { name: '火拳', kind: 'attack', element: 'FIRE', pp: 15, power: 50, accuracy: 100 },
  FLAME_RING: {
    name: '炎戒', kind: 'attack', element: 'FIRE', pp: 15, power: 25, accuracy: 100,
    effect: { status: 'burn', target: 'foe', chance: 0.5 },
  },
  ROCK_PUNCH: { name: '岩石重拳', kind: 'attack', element: 'EARTH', pp: 15, power: 55, accuracy: 90 },
  STONE_BODY: {
    name: '磐石體', kind: 'status', element: 'EARTH', pp: 10, accuracy: 100,
    effect: { stat: 'def', stages: 1, target: 'self' },
    text: '{user}變得更硬了。離能吃又遠了一步。',
  },
  PALM_FAN: { name: '芭蕉扇', kind: 'attack', element: 'WIND', pp: 15, power: 55, accuracy: 95 },
  SANDSTORM: {
    name: '飛沙走石', kind: 'attack', element: 'WIND', pp: 15, power: 30, accuracy: 100,
    effect: { stat: 'acc', stages: -1, target: 'foe', chance: 0.6, limit: 2 },
    text: '沙子跑進{foe}的眼睛！',
  },
  WATER_JET: { name: '高壓水柱', kind: 'attack', element: 'WATER', pp: 15, power: 50, accuracy: 100 },
  RESCUE_FIRST: {
    name: '救人優先', kind: 'status', element: 'WATER', pp: 5, accuracy: 100,
    effect: { heal: 0.35 },
    text: '{user}先救了自己。',
  },
};
