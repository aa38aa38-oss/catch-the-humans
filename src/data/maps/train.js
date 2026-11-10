// 第一個道館：停在月台的台鐵自強號。車廂走道上有訓練家擋路，最後面是館主。
// npcs 裡有 trainer 的就是訓練家：對他按 A 會開打；打贏之後他會坐到 sit 的位置讓出走道。
const t = (species, level, gradeId = 'CHOICE') => ({ species, level, gradeId });

export const TRAIN_GYM = {
  name: '自強號 車廂（道館）',
  rows: [
    '######################',
    '#.ss.ss.ss.ss.ss.ss..#',
    'D....................#',
    '#.ss.ss.ss.ss.ss.ss..#',
    '######################',
  ],
  warps: [{ x: 0, y: 2, to: 'TPE_PLATFORM', tx: 11, ty: 2, dir: 'DOWN' }],
  npcs: [
    {
      x: 7, y: 2, sprite: 'RAT', sit: { x: 7, y: 1 },
      trainer: {
        id: 'TRAIN_RAT', name: '偷便當的老鼠', reward: 150,
        team: [t('ACE', 9), t('FIREFIGHTER', 9)],
        intro: ['偷便當的老鼠：「這節車廂的便當都是我的！」', '「想過去？先打贏我養的人類再說！」'],
        win: ['偷便當的老鼠：「我的排骨便當……」'],
        after: ['偷便當的老鼠：「其實我只是想吃排骨而已……」', '……牠完全沒發現這句話有多恐怖。'],
      },
    },
    {
      x: 13, y: 2, sprite: 'RAT', sit: { x: 13, y: 3 },
      trainer: {
        id: 'TRAIN_SEAT', name: '霸佔博愛座的老鼠', reward: 200,
        team: [t('IRON_FAN', 10), t('THING', 10)],
        intro: ['霸佔博愛座的老鼠：「這個位子是我先坐的！」', '「要我讓座？除非你打贏我！」'],
        win: ['霸佔博愛座的老鼠：「好啦好啦，讓給你。」'],
        after: ['霸佔博愛座的老鼠：「博愛座是給老弱婦孺坐的。」', '「……人類不算在裡面。」'],
      },
    },
    {
      x: 20, y: 2, sprite: 'PIGEON',
      trainer: {
        id: 'TRAIN_LEADER', name: '鴿子列車長', reward: 500, badge: '列車徽章', leader: true,
        team: [t('FIREFIGHTER', 12, 'PRIME'), t('IRON_FAN', 12), t('THING', 13, 'PRIME')],
        intro: [
          '鴿子列車長：「各位旅客您好，本列車開往終點站——屠宰場。」',
          '「……開玩笑的。在這班車上，被端上餐盤的會是人類。」',
          '「我是這班車的列車長，也是這一站的館主。讓我看看你養的人類！」',
        ],
        win: ['鴿子列車長：「咕咕……你的人類養得真好。」', '「這是列車徽章。有了它，下一站的人類會怕你。」'],
        after: ['鴿子列車長：「下一站還在施工。等軌道修好，我就載你過去。」'],
      },
    },
  ],
  signs: [],
  labels: [],
};
