// 人類養殖場：像豬舍一樣，收服的人類被關在鐵欄杆後面、拴著鐵鏈。
// 養殖場管理台可以合成強化、出貨。
export const RANCH = {
  name: '人類養殖場',
  rows: [
    '################',
    '#vvcvvcvvcvvcvv#',
    '#vvcvvcvvcvvcvv#',
    '#cccccccccccccc#',
    '#xxxKKxxxxxxxHH#',
    '#xxxxxxxxxxqxxx#',
    '#xxxxxxqxxxxxxx#',
    'xxxxxxxxxxxxxxx#',
    '################',
  ],
  // 每一格豬欄（左上角座標，2×2），每格最多關 2 隻
  stalls: [{ x: 1, y: 1 }, { x: 4, y: 1 }, { x: 7, y: 1 }, { x: 10, y: 1 }, { x: 13, y: 1 }],
  warps: [{ x: 0, y: 7, to: 'TPE_PLAZA', tx: 18, ty: 6, dir: 'LEFT' }],
  npcs: [],
  signs: [
    ...[4, 5].map((x) => ({ x, y: 4, action: 'ranch', lines: ['管理台上放著一把剁肉刀和一本「出貨登記簿」。'] })),
    ...Array.from({ length: 14 }, (_, i) => ({ x: i + 1, y: 3, lines: ['鐵欄杆後面傳來鐵鏈拖地的聲音。', '人類們抬頭看著{animal}，眼神裡寫滿了「為什麼」。'] })),
    ...[13, 14].map((x) => ({ x, y: 4, lines: ['掛肉架。上面掛著的東西……還是不要細看比較好。'] })),
  ],
  labels: [{ x: 4.5, y: 3.3, text: '養殖場管理台' }],
};
