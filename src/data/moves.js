// 技能資料表。新增技能只要在這裡加一筆。
// kind: 'attack' 攻擊 / 'status' 變化技
// element: 'FIRE' | 'EARTH' | 'WIND' | 'WATER' | null（無屬性）
// effect（可選）：
//   { heal: 0.4 }                         回復最大體力 40%
//   { stat: 'def', stages: 1, target: 'self' }   能力變化（atk/def/acc）
//   { status: 'sleep', target: 'foe' }    異常狀態（sleep 睡著 / burn 燒傷）
//   chance：附加效果的機率（攻擊技用），省略就是 100%
// hits: [最少, 最多] 連續攻擊次數
// text：使用後的額外描述，{user} 使用者、{foe} 對手

export const MOVES = {
  // ── 家畜 ──
  RAMMING: { name: '蠻牛衝撞', kind: 'attack', element: null, power: 60, accuracy: 90 },
  RUMINATE: {
    name: '反芻', kind: 'status', element: null, accuracy: 100,
    effect: { heal: 0.4 },
    text: '{user}把早上吃的草吐出來，再嚼了一次。',
  },
  BODY_SLAM: { name: '肉彈壓頂', kind: 'attack', element: null, power: 50, accuracy: 100 },
  MUD_BATH: {
    name: '滾泥巴', kind: 'status', element: null, accuracy: 100,
    effect: { stat: 'def', stages: 1, target: 'self' },
    text: '{user}全身裹滿泥巴。順便完成了醃料步驟。',
  },
  HEADBUTT: { name: '頭槌', kind: 'attack', element: null, power: 45, accuracy: 100 },
  LULLABY: {
    name: '咩～催眠曲', kind: 'status', element: null, accuracy: 75,
    effect: { status: 'sleep', target: 'foe' },
  },
  PECK: { name: '啄啄啄', kind: 'attack', element: null, power: 18, accuracy: 95, hits: [2, 4] },
  DAWN_CALL: {
    name: '凌晨五點叫床', kind: 'status', element: null, accuracy: 100,
    effect: { stat: 'atk', stages: -1, target: 'foe' },
    text: '{foe}被吵醒，整個人沒力了。',
  },

  // ── 野生人類 ──
  FIRE_FIST: { name: '火拳', kind: 'attack', element: 'FIRE', power: 50, accuracy: 100 },
  FLAME_RING: {
    name: '炎戒', kind: 'attack', element: 'FIRE', power: 25, accuracy: 100,
    effect: { status: 'burn', target: 'foe', chance: 0.5 },
  },
  ROCK_PUNCH: { name: '岩石重拳', kind: 'attack', element: 'EARTH', power: 55, accuracy: 90 },
  STONE_BODY: {
    name: '磐石體', kind: 'status', element: 'EARTH', accuracy: 100,
    effect: { stat: 'def', stages: 1, target: 'self' },
    text: '{user}變得更硬了。離能吃又遠了一步。',
  },
  PALM_FAN: { name: '芭蕉扇', kind: 'attack', element: 'WIND', power: 55, accuracy: 95 },
  SANDSTORM: {
    name: '飛沙走石', kind: 'attack', element: 'WIND', power: 30, accuracy: 100,
    effect: { stat: 'acc', stages: -1, target: 'foe', chance: 0.6 },
    text: '沙子跑進{foe}的眼睛！',
  },
  WATER_JET: { name: '高壓水柱', kind: 'attack', element: 'WATER', power: 50, accuracy: 100 },
  RESCUE_FIRST: {
    name: '救人優先', kind: 'status', element: 'WATER', accuracy: 100,
    effect: { heal: 0.35 },
    text: '{user}先救了自己。',
  },
};
