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

  // ── 第二批野生人類 ──
  // 火
  GREAT_ERUPTION: { name: '大噴火', kind: 'attack', element: 'FIRE', pp: 10, power: 70, accuracy: 90 },
  ABSOLUTE_JUSTICE: {
    name: '徹底的正義', kind: 'status', element: 'FIRE', pp: 10, accuracy: 100,
    effect: { stat: 'atk', stages: 2, target: 'self' },
    text: '{user}：「邪惡必須徹底消滅！」……他說的邪惡，是{foe}。',
  },
  SHIRANUI: { name: '炎之呼吸・不知火', kind: 'attack', element: 'FIRE', pp: 15, power: 45, accuracy: 100, priority: 1 },
  FLAME_TIGER: { name: '炎之呼吸・炎虎', kind: 'attack', element: 'FIRE', pp: 10, power: 75, accuracy: 90 },
  I_CHOOSE_YOU: {
    name: '就決定是你了', kind: 'attack', element: 'FIRE', pp: 15, power: 55, accuracy: 100,
    text: '{user}丟出了紅白相間的球……裡面什麼都沒有。',
  },
  FOREVER_TEN: {
    name: '永遠十歲', kind: 'status', element: 'FIRE', pp: 5, accuracy: 100,
    effect: { heal: 0.5 },
    text: '{user}過了二十幾年，還是十歲。',
  },
  WOK_FIRE: { name: '大火快炒', kind: 'attack', element: 'FIRE', pp: 15, power: 60, accuracy: 95 },
  THICKEN: {
    name: '勾芡', kind: 'status', element: 'FIRE', pp: 15, accuracy: 100,
    effect: { stat: 'acc', stages: -1, target: 'foe', limit: 2 },
    text: '一勺太白粉水潑過去，{foe}黏得睜不開眼睛。',
  },
  FIRE_WALK: {
    name: '過火', kind: 'attack', element: 'FIRE', pp: 15, power: 50, accuracy: 100,
    effect: { status: 'burn', target: 'foe', chance: 0.3 },
  },
  POSSESSION: {
    name: '起乩', kind: 'status', element: 'FIRE', pp: 10, accuracy: 100,
    effect: { stat: 'atk', stages: 2, target: 'self' },
    text: '{user}全身發抖……神明附身了！',
  },
  // 水
  ICE_AGE: {
    name: '冰河時代', kind: 'attack', element: 'WATER', pp: 10, power: 60, accuracy: 95,
    effect: { status: 'sleep', target: 'foe', chance: 0.2 },
    text: '{foe}被凍住，動不了了！',
  },
  LAZY_JUSTICE: {
    name: '懶散的正義', kind: 'status', element: 'WATER', pp: 5, accuracy: 100,
    effect: { heal: 0.5 },
    text: '{user}把眼罩拉下來，打了個盹。',
  },
  CAST_ROD: { name: '甩竿', kind: 'attack', element: 'WATER', pp: 20, power: 45, accuracy: 95 },
  SLACK_OFF: {
    name: '摸魚', kind: 'status', element: 'WATER', pp: 10, accuracy: 100,
    effect: { heal: 0.35 },
    text: '{user}坐下來等魚上鉤，順便休息一下。',
  },
  TYPHOON_RAFTING: { name: '颱風天就是要泛舟', kind: 'attack', element: 'WATER', pp: 10, power: 75, accuracy: 85, recoil: 0.1 },
  SHOUT_OUT: {
    name: '大聲說出來', kind: 'status', element: 'WATER', pp: 15, accuracy: 100,
    effect: { stat: 'atk', stages: -1, target: 'foe' },
    text: '{user}對著鏡頭大吼：「颱風天就是要泛舟啊！」{foe}被嚇到了。',
  },
  TRIDENT: { name: '海神三叉戟', kind: 'attack', element: 'WATER', pp: 15, power: 65, accuracy: 95 },
  FISH_SWARM: { name: '召喚魚群', kind: 'attack', element: 'WATER', pp: 15, power: 20, accuracy: 95, hits: [2, 4] },
  LIFEBUOY: { name: '丟救生圈', kind: 'attack', element: 'WATER', pp: 20, power: 50, accuracy: 100 },
  CPR: {
    name: '人工呼吸', kind: 'status', element: 'WATER', pp: 5, accuracy: 100,
    effect: { heal: 0.4 },
    text: '{user}對自己做了人工呼吸。……這在醫學上不太可能。',
  },
  // 土
  DEMON_BULL_FIST: { name: '大力牛魔拳', kind: 'attack', element: 'EARTH', pp: 15, power: 70, accuracy: 90 },
  BULL_ROAR: {
    name: '牛魔吼', kind: 'status', element: 'EARTH', pp: 15, accuracy: 100,
    effect: { stat: 'atk', stages: -1, target: 'foe' },
    text: '{user}一聲大吼，地面都在晃。',
  },
  SECRET_SPICES: {
    name: '十一種香料', kind: 'status', element: 'EARTH', pp: 15, accuracy: 100,
    effect: { stat: 'def', stages: -1, target: 'foe' },
    text: '{user}把祕密香料撒在{foe}身上，醃得很入味。',
  },
  ORIGINAL_RECIPE: { name: '原味炸雞', kind: 'attack', element: 'EARTH', pp: 15, power: 60, accuracy: 100 },
  HULK_SMASH: { name: '浩克砸', kind: 'attack', element: 'EARTH', pp: 10, power: 85, accuracy: 85 },
  ANGRIER: {
    name: '越氣越強', kind: 'status', element: 'EARTH', pp: 10, accuracy: 100,
    effect: { stat: 'atk', stages: 2, target: 'self' },
    text: '{user}的衣服又被撐破了。',
  },
  POLICE_BIKE: { name: '巡邏腳踏車衝撞', kind: 'attack', element: 'EARTH', pp: 20, power: 55, accuracy: 100 },
  GET_RICH_SCHEME: {
    name: '發財大計畫', kind: 'status', element: 'EARTH', pp: 5, accuracy: 100,
    effect: { heal: 0.5 },
    text: '{user}偷賣了上司的模型，用賺來的錢吃了一頓好的。',
  },
  SAND_BURIAL: { name: '沙瀑送葬', kind: 'attack', element: 'EARTH', pp: 15, power: 65, accuracy: 95 },
  SAND_SHIELD: {
    name: '沙之盾', kind: 'status', element: 'EARTH', pp: 10, accuracy: 100,
    effect: { stat: 'def', stages: 2, target: 'self' },
    text: '沙子自己擋在{user}前面。',
  },
  // 風
  HAPPY_MEAL: {
    name: '歡樂兒童餐', kind: 'status', element: 'WIND', pp: 10, accuracy: 80,
    effect: { status: 'sleep', target: 'foe' },
    text: '{foe}吃完兒童餐，滿足地睡著了……玩具還沒拆。',
  },
  FRY_MISSILE: { name: '薯條飛彈', kind: 'attack', element: 'WIND', pp: 15, power: 20, accuracy: 90, hits: [2, 5] },
  BATARANG: { name: '蝙蝠鏢', kind: 'attack', element: 'WIND', pp: 20, power: 45, accuracy: 100, priority: 1 },
  SMOKE_BOMB: {
    name: '煙霧彈', kind: 'status', element: 'WIND', pp: 15, accuracy: 100,
    effect: { stat: 'acc', stages: -1, target: 'foe', limit: 2 },
    text: '{user}壓低聲音說：「我是蝙蝠俠。」然後消失在煙霧裡。',
  },
  KNEE_DOWN: { name: '壓車過彎', kind: 'attack', element: 'WIND', pp: 15, power: 65, accuracy: 90 },
  STRAIGHT_PIPE: {
    name: '改管排氣', kind: 'status', element: 'WIND', pp: 15, accuracy: 100,
    effect: { stat: 'atk', stages: -1, target: 'foe' },
    text: '轟轟轟轟——！{foe}被吵到耳鳴了。',
  },
  SHURIKEN: { name: '手裡劍', kind: 'attack', element: 'WIND', pp: 20, power: 25, accuracy: 95, hits: [2, 4] },
  NINJA_VANISH: {
    name: '忍術・隱身', kind: 'status', element: 'WIND', pp: 10, accuracy: 100,
    effect: { stat: 'acc', stages: -1, target: 'foe', limit: 2 },
    text: '{user}消失了。……其實躲在{foe}背後。',
  },
  // ── 第三批野生人類 ──
  // 火
  SEAT_REMOVAL: {
    name: '拆坐墊', kind: 'attack', element: 'FIRE', pp: 15, power: 40, accuracy: 100,
    effect: { stat: 'def', stages: -1, target: 'foe', chance: 0.5 },
    text: '{user}二話不說，把{foe}的坐墊拆了下來。',
  },
  WHY_SO_LOUD: { name: '你在大聲什麼啦', kind: 'attack', element: 'FIRE', pp: 10, power: 75, accuracy: 90 },
  SNAP_SPARK: {
    name: '火花手套彈指', kind: 'status', element: 'FIRE', pp: 10, accuracy: 85,
    effect: { status: 'burn', target: 'foe' },
    text: '啪！{user}彈了一下手指。',
  },
  FLAME_ALCHEMY: { name: '高溫定點引爆', kind: 'attack', element: 'FIRE', pp: 10, power: 80, accuracy: 90 },
  STILL_RAW: {
    name: '生到還在叫', kind: 'attack', element: 'FIRE', pp: 15, power: 40, accuracy: 100,
    effect: { stat: 'def', stages: -1, target: 'foe', chance: 0.5 },
  },
  IDIOT_SANDWICH: {
    name: '白吐司夾頭', kind: 'status', element: 'FIRE', pp: 10, accuracy: 85,
    effect: { status: 'burn', target: 'foe' },
    text: '{user}用兩片白吐司夾住{foe}的頭：「你是什麼？」',
  },
  DESK_SLAM: { name: '拍桌重擊', kind: 'attack', element: 'FIRE', pp: 10, power: 75, accuracy: 90 },
  BLAME_SHIFT: {
    name: '咆哮甩鍋', kind: 'attack', element: 'FIRE', pp: 15, power: 40, accuracy: 100,
    effect: { stat: 'def', stages: -1, target: 'foe', chance: 0.5 },
  },
  // 水
  SHARK_BOMB: { name: '大鮫彈之術', kind: 'attack', element: 'WATER', pp: 10, power: 75, accuracy: 90 },
  SHARK_PRISON: {
    name: '水牢鮫舞', kind: 'attack', element: 'WATER', pp: 15, power: 40, accuracy: 100,
    effect: { stat: 'acc', stages: -1, target: 'foe', chance: 0.5, limit: 2 },
  },
  FROZEN_LAND: {
    name: '冰封萬里', kind: 'attack', element: 'WATER', pp: 15, power: 45, accuracy: 100,
    effect: { stat: 'atk', stages: -1, target: 'foe', chance: 0.5 },
  },
  ICE_CASTLE: {
    name: '冰雪城堡', kind: 'status', element: 'WATER', pp: 10, accuracy: 100,
    effect: { stat: 'def', stages: 1, target: 'self' },
  },
  BE_WATER: {
    name: '化水無形', kind: 'status', element: 'WATER', pp: 10, accuracy: 100,
    effect: { stat: 'def', stages: 1, target: 'self' },
  },
  ONE_INCH: { name: '寸勁連擊', kind: 'attack', element: 'WATER', pp: 15, power: 20, accuracy: 95, hits: [2, 5] },
  PRESSURE_GROUT: {
    name: '高壓灌注止水', kind: 'status', element: 'WATER', pp: 10, accuracy: 100,
    effect: { stat: 'def', stages: 1, target: 'self' },
  },
  POLE_BARRIER: {
    name: '全台電線桿結界', kind: 'attack', element: 'WATER', pp: 15, power: 45, accuracy: 100,
    effect: { stat: 'atk', stages: -1, target: 'foe', chance: 0.5 },
  },
  // 土
  BREAKWATER: {
    name: '海岸線防波堤', kind: 'status', element: 'EARTH', pp: 10, accuracy: 100,
    effect: { stat: 'def', stages: 1, target: 'self' },
  },
  TETRAPOD: { name: '消波塊鎮壓', kind: 'attack', element: 'EARTH', pp: 10, power: 75, accuracy: 90 },
  EYEBROW_RAISE: {
    name: '眉毛挑動', kind: 'status', element: 'EARTH', pp: 10, accuracy: 100,
    effect: { stat: 'def', stages: 1, target: 'self' },
  },
  PEOPLES_ELBOW: { name: '人民之肘', kind: 'attack', element: 'EARTH', pp: 10, power: 80, accuracy: 90 },
  BRICK_WALL: {
    name: '紅磚牆構築', kind: 'status', element: 'EARTH', pp: 10, accuracy: 100,
    effect: { stat: 'def', stages: 1, target: 'self' },
  },
  GROUT_SEAL: { name: '灌漿封頂', kind: 'attack', element: 'EARTH', pp: 10, power: 70, accuracy: 95 },
  // 風
  SONIC_TAKEOFF: {
    name: '音爆起飛', kind: 'attack', element: 'WIND', pp: 15, power: 45, accuracy: 100,
    effect: { stat: 'def', stages: -1, target: 'foe', chance: 0.5 },
  },
  HEAT_VISION_DIVE: { name: '熱視線俯衝', kind: 'attack', element: 'WIND', pp: 10, power: 80, accuracy: 90 },
  SHAKE_SHAKE: { name: '搖咧搖咧', kind: 'attack', element: 'WIND', pp: 20, power: 40, accuracy: 100, priority: 1 },
  AFRO_SPIN: { name: '爆炸頭旋轉', kind: 'attack', element: 'WIND', pp: 15, power: 20, accuracy: 95, hits: [2, 5] },
  SUMMON_TORNADO: {
    name: '召喚龍捲風', kind: 'attack', element: 'WIND', pp: 15, power: 45, accuracy: 100,
    effect: { stat: 'acc', stages: -1, target: 'foe', chance: 0.5, limit: 2 },
  },
  AIR_SHIELD: {
    name: '高空氣流護盾', kind: 'status', element: 'WIND', pp: 10, accuracy: 100,
    effect: { stat: 'def', stages: 1, target: 'self' },
  },
  EAST_WIND: {
    name: '七星壇借東風', kind: 'status', element: 'WIND', pp: 10, accuracy: 100,
    effect: { stat: 'atk', stages: 2, target: 'self' },
    text: '{user}：「萬事俱備，只欠東風。」東風來了。',
  },
  EIGHT_TRIGRAMS: {
    name: '八卦陣迷霧', kind: 'attack', element: 'WIND', pp: 15, power: 55, accuracy: 100,
    effect: { stat: 'acc', stages: -1, target: 'foe', chance: 0.4, limit: 2 },
  },
  GUST_WARNING: { name: '強烈陣風警報', kind: 'attack', element: 'WIND', pp: 20, power: 40, accuracy: 100, priority: 1 },
  TWIN_TYPHOON: {
    name: '雙颱共舞路徑圖', kind: 'status', element: 'WIND', pp: 15, accuracy: 100,
    effect: { stat: 'acc', stages: -1, target: 'foe', limit: 2 },
    text: '{foe}盯著颱風路徑圖，看到頭暈了。',
  },
};
