// 台北車站：車站外廣場、一樓大廳、地下月台

export const TPE_PLAZA = {
  name: '台北車站 外廣場',
  rows: [
    'wwwwwwwwwwwwwwwwwwww',
    'wwwwwwwwweewwwwwwwww',
    '*pppppppppppppppppp*',
    '*pp""""pppppp""""pp*',
    '*pp""""pppppp""""pp*',
    '*pp""""pppppp""""pp*',
    '*ppppppppppppppppppp',
    '*pb""""pppppp""""bp*',
    '*pp""""pppppp""""pp*',
    '*pppppppppppppppppp*',
    '*pppppppppppppppppp*',
    'oooooooooooooooooooo',
    'oooooooooooooooooooo',
  ],
  encounters: { '"': 'TPE_PLAZA_GRASS' },
  zoneName: '廣場草皮',
  warps: [
    { x: 9, y: 1, to: 'TPE_HALL', tx: 8, ty: 11, dir: 'UP' },
    { x: 10, y: 1, to: 'TPE_HALL', tx: 9, ty: 11, dir: 'UP' },
    { x: 19, y: 6, to: 'RANCH', tx: 1, ty: 8, dir: 'RIGHT' },
  ],
  npcs: [
    {
      x: 14, y: 9, sprite: 'SALES',
      lines: ['推銷員：「先生小姐，要不要辦一張信用卡？」', '推銷員：「……喔，你是一隻{animal}。那不用了。」'],
    },
  ],
  signs: [
    { x: 9, y: 0, lines: ['台北車站。每天有幾十萬個人類從這裡經過。', '對{animal}來說，這裡就是一座巨大的牧場。'] },
    { x: 10, y: 0, lines: ['台北車站。每天有幾十萬個人類從這裡經過。', '對{animal}來說，這裡就是一座巨大的牧場。'] },
  ],
  labels: [{ x: 10, y: 0.25, text: '台北車站' }, { x: 17.5, y: 5.3, text: '人類牧場→' }],
};

export const TPE_HALL = {
  name: '台北車站 一樓大廳',
  rows: [
    '####################',
    '#BBBB#nnnnnn#======#',
    '#....#......#.....##',
    '#.................g#',
    '#..|.........|....g#',
    '#...::::::::::....G#',
    '#...::::::::::....g#',
    '#...::::::::::....g#',
    '#...::::::::::....g#',
    '#..|.........|....g#',
    '#.................##',
    '#..................#',
    '########ee##########',
  ],
  encounters: { ':': 'TPE_HALL_CROWD' },
  zoneName: '大廳黑白格',
  warps: [
    { x: 8, y: 12, to: 'TPE_PLAZA', tx: 9, ty: 2, dir: 'DOWN' },
    { x: 9, y: 12, to: 'TPE_PLAZA', tx: 10, ty: 2, dir: 'DOWN' },
    { x: 18, y: 5, to: 'TPE_PLATFORM', tx: 1, ty: 4, dir: 'RIGHT' },
  ],
  npcs: [
    {
      x: 10, y: 10, sprite: 'STAFF',
      lines: ['站務員：「大廳的黑白格，大家都坐在地上，人超多。」', '站務員：「……咦？為什麼會有一隻{animal}在這裡？」'],
    },
  ],
  signs: [
    ...[1, 2, 3, 4].map((x) => ({
      x, y: 1, heal: true,
      lines: ['店員：「歡迎光臨台鐵便當本舖！要吃個便當休息一下嗎？」'],
    })),
    ...[6, 7, 8, 9, 10, 11].map((x) => ({ x, y: 1, lines: ['往 高雄　自強號　誤點 30 分鐘', '往 牧場　單程票　已售完'] })),
    ...[13, 14, 15, 16, 17, 18].map((x) => ({ x, y: 1, lines: ['售票員：「請問要買到哪裡？」', '……你是一隻{animal}，身上沒有錢。'] })),
    ...[3, 4, 6, 7, 8, 9].map((y) => ({ x: 18, y, lines: ['剪票口。往地下月台。', '{animal}直接從閘門底下鑽過去了。'] })),
  ],
  labels: [
    { x: 2.5, y: 1.25, text: '台鐵便當' },
    { x: 9, y: 1.25, text: '列車時刻' },
    { x: 15.5, y: 1.25, text: '售票口' },
  ],
};

export const TPE_PLATFORM = {
  name: '台北車站 地下月台',
  rows: [
    '######################',
    'TTTTTTTTTTTTTTTTTTTTTT',
    '______________________',
    '#.b.....,,,,,,,,...b.#',
    'S.......,,,,,,,,.....#',
    '#..|....,,,,,,,,..|..#',
    '#.b.....,,,,,,,,...b.#',
    '______________________',
    'rrrrrrrrrrrrrrrrrrrrrr',
    '######################',
  ],
  encounters: { ',': 'TPE_PLATFORM_QUEUE' },
  zoneName: '月台排隊區',
  warps: [{ x: 0, y: 4, to: 'TPE_HALL', tx: 17, ty: 5, dir: 'LEFT' }],
  npcs: [
    {
      x: 18, y: 4, sprite: 'STAFF',
      lines: ['站務員：「列車進站，請退到黃線後面。」', '站務員：「這班車往下一張地圖，還在施工中。」'],
    },
  ],
  signs: Array.from({ length: 22 }, (_, x) => ({ x, y: 1, lines: ['自強號。目的地：施工中。', '{animal}心想：總有一天，要把整列車的人類都抓起來。'] })),
  labels: [],
};
