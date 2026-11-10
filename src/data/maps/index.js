// 地圖資料。一張地圖一個物件，之後新地圖放在同一個資料夾，再加到下面的 MAPS。
//
// rows：地圖格子，每個字元是一格（意思見 src/tiles.js 的 TILES）
// encounters：哪一種格子會遇敵，以及對應的地區（src/data/areas.js）
// zoneName：走進遇敵區時跳出的提示
// warps：踩到 (x, y) 就傳送到另一張地圖的 (tx, ty)
// npcs：站在地圖上的人，A 鍵對話。{animal} 會換成主角的名字；有 trainer 的是訓練家（見 train.js）
// shop: true 的看板是商店
// signs：看板、櫃台等「面對它按 A」會出現的文字；heal: true 是回復點；action: 'ranch' 打開牧場管理
// pen：牧場裡人類走動的範圍
// labels：畫在地圖上的字
import { TPE_PLAZA, TPE_HALL, TPE_PLATFORM } from './taipei.js';
import { RANCH } from './ranch.js';
import { TRAIN_GYM } from './train.js';

export const MAPS = { TPE_PLAZA, TPE_HALL, TPE_PLATFORM, RANCH, TRAIN_GYM };

/** 新遊戲的出發點 */
export const START = { map: 'TPE_PLAZA', x: 9, y: 9, dir: 'UP' };
/** 第一個回復點（全滅時回到這裡） */
export const FIRST_RESPAWN = { map: 'TPE_HALL', x: 3, y: 2, dir: 'UP' };
