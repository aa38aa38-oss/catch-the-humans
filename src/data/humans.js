// 野生人類圖鑑。目標 51 隻，新增一隻就在這裡加一筆。
// strength：收服時的掙扎力道（1.0 為標準）
// moves / learnset / evolveMoves / tms：同 animals.js 的說明
// lines：專屬台詞，{animal} 主角、{grade} 肉質、{no} 牧場編號
//   appear  出場
//   caught  收服成功
//   escape  撐破寶貝球逃走
export const HUMANS = {
  ACE: {
    no: 1, name: '火拳艾斯', element: 'FIRE', origin: '海賊王',
    base: { hp: 70, atk: 95, def: 60, spd: 85 },
    moves: ['FIRE_FIST', 'FLAME_RING'],
    strength: 1.0,
    dex: '體溫偏高，全身自帶炙燒效果，不需另外加熱。產地：新世界海域。',
    lines: {
      appear: ['野生的火拳艾斯出現了！自帶火源，省下一筆瓦斯費。', '野生的火拳艾斯出現了！他今天還活著，真是稀有。'],
      caught: ['收服成功！火拳艾斯｜肉質：{grade}｜備註：已預先炙燒。', '艾斯被抓了。這次被抓，至少不用上刑場。'],
      escape: ['艾斯把寶貝球燒穿了。他逃走了，留下一股烤橡膠味。'],
    },
  },
  THING: {
    no: 2, name: '石頭人', element: 'EARTH', origin: '驚奇四超人',
    base: { hp: 95, atk: 90, def: 110, spd: 30 },
    moves: ['ROCK_PUNCH', 'STONE_BODY'],
    strength: 1.15,
    dex: '肉質極度緊實，牙口不好者請慎選。建議燉煮時間：三百年。產地：紐約。',
    lines: {
      appear: ['野生的石頭人出現了！看起來很難嚼。', '野生的石頭人出現了！這塊肉，要用電鑽切。'],
      caught: ['收服成功！石頭人｜肉質：{grade}｜備註：建議燉煮三百年。'],
      escape: ['石頭人撐破了寶貝球。太硬了，連球都咬不動。'],
    },
  },
  IRON_FAN: {
    no: 3, name: '鐵扇公主', element: 'WIND', origin: '西遊記',
    base: { hp: 75, atk: 80, def: 65, spd: 90 },
    moves: ['PALM_FAN', 'SANDSTORM'],
    strength: 0.95,
    dex: '長年揮動芭蕉扇，手臂肉特別有彈性。扇子另售。產地：火焰山芭蕉洞。',
    lines: {
      appear: ['野生的鐵扇公主出現了！自帶扇子，天生的烤肉攤老闆娘。', '野生的鐵扇公主出現了！搧了五百年的扇子，手臂肉一定很有彈性。'],
      caught: ['收服成功！鐵扇公主｜肉質：{grade}｜備註：扇子另售。'],
      escape: ['鐵扇公主逃走了。一扇子，連人帶球搧到隔壁縣。'],
    },
  },
  FIREFIGHTER: {
    no: 4, name: '消防隊員', element: 'WATER', origin: '職業',
    base: { hp: 90, atk: 70, def: 80, spd: 60 },
    moves: ['WATER_JET', 'RESCUE_FIRST'],
    strength: 1.0,
    dex: '放養長大，運動量大，低脂高蛋白。含水量偏高，下鍋前請瀝乾。產地：都市。',
    lines: {
      appear: [
        '野生的消防隊員出現了！放養長大，運動量充足。',
        '野生的消防隊員出現了！他救過很多貓。可惜你是{animal}。',
        '野生的消防隊員出現了！每天扛水管，肉應該很有嚼勁。',
      ],
      caught: ['收服成功！消防隊員｜肉質：{grade}｜備註：低脂高蛋白，健身族首選。'],
      escape: ['消防隊員逃走了。逃生路線，他比誰都熟。'],
    },
  },
};

// 收服成功時，除了專屬台詞外也可能抽到的通用台詞
export const GENERIC_CAUGHT = ['{human}已入欄。編號 {no}，耳標已打上。'];

// 肉質等級：類似個體值，跟 Lv. 分開。遇到時依機率隨機決定。
export const GRADES = [
  { id: 'CHOICE', name: '精選級', rate: 0.70, statBonus: 1.00, struggle: 1.00 },
  { id: 'PRIME', name: '極佳級', rate: 0.25, statBonus: 1.08, struggle: 1.10 },
  { id: 'A5', name: 'A5和牛', rate: 0.05, statBonus: 1.18, struggle: 1.20 },
];
