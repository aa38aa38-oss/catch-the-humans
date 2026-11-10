// 人類牧場：收服的人類都養在柵欄裡。牧場管理台可以合成強化、出貨。
export const RANCH = {
  name: '人類牧場',
  rows: [
    '****************',
    '*ffffffffffffff*',
    '*fhhhhhhhhhhhhf*',
    '*fhhhhhhhhhhhhf*',
    '*fhhhhhhhhhhhhf*',
    '*ffffffffffffff*',
    '*pppKKppppppppp*',
    '*pppppppppppppp*',
    'ppppppppppppppp*',
    '****************',
  ],
  // 收服的人類在這個範圍裡走來走去（只是畫面，不會擋路）
  pen: { x0: 2, y0: 2, x1: 13, y1: 4 },
  warps: [{ x: 0, y: 8, to: 'TPE_PLAZA', tx: 18, ty: 6, dir: 'LEFT' }],
  npcs: [],
  signs: [
    ...[4, 5].map((x) => ({ x, y: 6, action: 'ranch', lines: ['牧場管理台：「今天要怎麼處理這些人類？」'] })),
    ...Array.from({ length: 14 }, (_, i) => ({ x: i + 1, y: 5, lines: ['柵欄裡的人類們悠閒地走來走去。', '他們還不知道「出貨」是什麼意思。'] })),
  ],
  labels: [{ x: 4.5, y: 5.4, text: '牧場管理台' }],
};
