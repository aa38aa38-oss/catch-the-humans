// 野生人類圖鑑。目標 51 隻，新增一隻就在這裡加一筆。
// strength：收服時的掙扎力道（1.0 為標準）
// moves / learnset / evolveMoves / tms：同 animals.js 的說明
// rival：遇到特定家畜時的專屬台詞（例如肯德雞爺爺遇到雞）
// lines：專屬台詞，{animal} 主角、{grade} 肉質、{no} 耳標編號
//   appear  出場
//   caught  收服成功
//   breakout  撐破寶貝球（收服失敗，戰鬥繼續）
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
      breakout: ['艾斯把寶貝球燒穿了！空氣裡飄著一股烤橡膠味。'],
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
      breakout: ['石頭人撐破了寶貝球。太硬了，連球都咬不動。'],
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
      breakout: ['鐵扇公主一扇子，把寶貝球搧破了！'],
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
      breakout: ['消防隊員從寶貝球裡逃生了。逃生，他是專業的。'],
    },
  },
  AKAINU: {
    no: 5, name: '赤犬', element: 'FIRE', origin: '海賊王',
    base: { hp: 85, atk: 105, def: 80, spd: 55 },
    moves: ['GREAT_ERUPTION', 'ABSOLUTE_JUSTICE'],
    strength: 1.15,
    dex: '全身是岩漿，肉質外焦內更焦。燒過火拳艾斯，也把自己燒得很熟。產地：海軍本部。',
    lines: {
      appear: [
        '野生的赤犬出現了！他看起來很想對誰執行正義。',
        '野生的赤犬出現了！地面被他燒出了一個洞。',
      ],
      caught: ['收服成功！赤犬｜肉質：{grade}｜備註：火候過頭，請搭配大量啤酒。'],
      breakout: ['赤犬融掉了寶貝球的一角！'],
    },
  },
  RENGOKU: {
    no: 6, name: '煉獄杏壽郎', element: 'FIRE', origin: '鬼滅之刃',
    base: { hp: 75, atk: 100, def: 65, spd: 95 },
    moves: ['SHIRANUI', 'FLAME_TIGER'],
    strength: 1.05,
    dex: '炎柱。熱血到肉質自帶炭火香，咀嚼時會聽到「好吃！」。產地：無限列車。',
    lines: {
      appear: [
        '野生的煉獄杏壽郎出現了！「心要燃燒起來！」',
        '野生的煉獄杏壽郎出現了！他邊吃便當邊大喊「好吃！」',
      ],
      caught: ['收服成功！煉獄杏壽郎｜肉質：{grade}｜備註：這次他沒有死在列車上。'],
      breakout: ['煉獄杏壽郎燒斷了寶貝球！「我不會讓任何人死在這裡！」'],
    },
  },
  ASH: {
    no: 7, name: '小智', element: 'FIRE', origin: '寶可夢',
    base: { hp: 70, atk: 75, def: 70, spd: 85 },
    moves: ['I_CHOOSE_YOU', 'FOREVER_TEN'],
    strength: 1.0,
    dex: '抓了二十幾年的寶可夢，終於輪到自己被抓。永遠十歲，肉質非常嫩。產地：真新鎮。',
    lines: {
      appear: [
        '野生的小智出現了！他看到{animal}，眼睛亮了起來。',
        '野生的小智出現了！「我要成為寶可夢大師！」……這裡沒有寶可夢。',
      ],
      caught: ['收服成功！小智｜肉質：{grade}｜備註：被球收服是什麼感覺，他現在知道了。'],
      breakout: ['小智從寶貝球裡掙脫了！「這個招式我在電視上看過！」'],
    },
  },
  CHEF: {
    no: 8, name: '中式料理廚師', element: 'FIRE', origin: '職業',
    base: { hp: 80, atk: 85, def: 75, spd: 60 },
    moves: ['WOK_FIRE', 'THICKEN'],
    rival: { PIG: '廚師看著豬，默默舔了舔嘴唇。豬決定先下手為強。', CHICKEN: '廚師看著雞，說了一句「三杯」。雞決定先下手為強。' },
    strength: 1.0,
    dex: '每天站在大火爐前，全身已經被煙燻入味。產地：熱炒店後場。',
    lines: {
      appear: [
        '野生的中式料理廚師出現了！他手上的炒鍋還在冒火。',
        '野生的中式料理廚師出現了！他看著{animal}，開始盤算要用什麼醬料。',
      ],
      caught: ['收服成功！中式料理廚師｜肉質：{grade}｜備註：自帶油煙香，免醃。'],
      breakout: ['廚師用炒鍋把寶貝球翻了個面，跳了出來！'],
    },
  },
  TANG_KI: {
    no: 9, name: '乩童', element: 'FIRE', origin: '台灣有梗的人',
    base: { hp: 75, atk: 90, def: 60, spd: 80 },
    moves: ['FIRE_WALK', 'POSSESSION'],
    strength: 1.05,
    dex: '經常踩火、拿刺球打自己，皮已經很韌了。產地：廟口。',
    lines: {
      appear: [
        '野生的乩童出現了！他全身在發抖，神明好像來了。',
        '野生的乩童出現了！鑼鼓聲越來越大……',
      ],
      caught: ['收服成功！乩童｜肉質：{grade}｜備註：神明已退駕，可以安心食用。'],
      breakout: ['神明附身的乩童，一拳打破了寶貝球！'],
    },
  },
  AOKIJI: {
    no: 10, name: '青雉', element: 'WATER', origin: '海賊王',
    base: { hp: 90, atk: 90, def: 85, spd: 50 },
    moves: ['ICE_AGE', 'LAZY_JUSTICE'],
    strength: 1.1,
    dex: '冰凍果實能力者，本身就是冷凍庫，保存期限超長。產地：海軍本部（離職）。',
    lines: {
      appear: [
        '野生的青雉出現了！他騎著腳踏車……睡著了。',
        '野生的青雉出現了！周圍的溫度降了十度。',
      ],
      caught: ['收服成功！青雉｜肉質：{grade}｜備註：免冷藏，自己就會結凍。'],
      breakout: ['青雉把寶貝球凍裂了！'],
    },
  },
  ANGLER: {
    no: 11, name: '釣客', element: 'WATER', origin: '職業',
    base: { hp: 75, atk: 65, def: 75, spd: 55 },
    moves: ['CAST_ROD', 'SLACK_OFF'],
    strength: 0.9,
    dex: '一坐就是一整天，屁股的肉特別結實。產地：基隆港邊。',
    lines: {
      appear: [
        '野生的釣客出現了！他已經在這裡坐了八個小時。',
        '野生的釣客出現了！他的水桶裡一條魚都沒有。',
      ],
      caught: ['收服成功！釣客｜肉質：{grade}｜備註：被釣上來的感覺，他現在懂了。'],
      breakout: ['釣客用魚鉤勾破了寶貝球！'],
    },
  },
  RAFTING: {
    no: 12, name: '泛舟哥', element: 'WATER', origin: '新聞人物',
    base: { hp: 80, atk: 80, def: 65, spd: 75 },
    moves: ['TYPHOON_RAFTING', 'SHOUT_OUT'],
    strength: 1.0,
    dex: '颱風天堅持要泛舟，肺活量驚人，肉質吸飽了雨水。產地：颱風天的街頭。',
    lines: {
      appear: [
        '野生的泛舟哥出現了！「颱風天就是要泛舟啊！」',
        '野生的泛舟哥出現了！外面明明在下大雨，他很興奮。',
      ],
      caught: ['收服成功！泛舟哥｜肉質：{grade}｜備註：含水量偏高，下鍋前請瀝乾。'],
      breakout: ['泛舟哥大吼一聲，把寶貝球震開了！「颱風天就是要泛舟啊！」'],
    },
  },
  AQUAMAN: {
    no: 13, name: '水行俠', element: 'WATER', origin: '超級英雄（DC）',
    base: { hp: 85, atk: 90, def: 75, spd: 70 },
    moves: ['TRIDENT', 'FISH_SWARM'],
    strength: 1.1,
    dex: '亞特蘭提斯國王。整天泡在海裡，肉質帶一點海鹽味。產地：亞特蘭提斯。',
    lines: {
      appear: [
        '野生的水行俠出現了！他在跟附近的魚講話。',
        '野生的水行俠出現了！三叉戟閃閃發亮。',
      ],
      caught: ['收服成功！水行俠｜肉質：{grade}｜備註：適合清蒸，不用另外加鹽。'],
      breakout: ['水行俠叫來一群魚，把寶貝球啄破了！'],
    },
  },
  LIFEGUARD: {
    no: 14, name: '救生員', element: 'WATER', origin: '職業',
    base: { hp: 85, atk: 70, def: 70, spd: 70 },
    moves: ['LIFEBUOY', 'CPR'],
    strength: 0.95,
    dex: '曬得很均勻，全身都是古銅色，像是已經烤過一輪。產地：福隆海水浴場。',
    lines: {
      appear: [
        '野生的救生員出現了！嗶——！他吹了一聲哨子。',
        '野生的救生員出現了！他在觀察有沒有人溺水。',
      ],
      caught: ['收服成功！救生員｜肉質：{grade}｜備註：救了很多人，沒救到自己。'],
      breakout: ['救生員套著救生圈，從寶貝球裡浮了出來！'],
    },
  },
  BULL_KING: {
    no: 15, name: '牛魔王', element: 'EARTH', origin: '西遊記',
    base: { hp: 100, atk: 100, def: 90, spd: 40 },
    moves: ['DEMON_BULL_FIST', 'BULL_ROAR'],
    rival: { COW: '牛和牛魔王對看了一眼。「……你也是牛？」「不，我是人類。」' },
    strength: 1.2,
    dex: '鐵扇公主的老公、紅孩兒的爸爸。名字裡有牛，但他是人類。產地：火焰山芭蕉洞。',
    lines: {
      appear: [
        '野生的牛魔王出現了！他看著{animal}，覺得有點眼熟。',
        '野生的牛魔王出現了！頭上的角比你的還大。',
      ],
      caught: ['收服成功！牛魔王｜肉質：{grade}｜備註：雖然叫牛魔王，但是是人類肉。'],
      breakout: ['牛魔王用角頂破了寶貝球！'],
    },
  },
  COLONEL: {
    no: 16, name: '肯德雞爺爺', element: 'EARTH', origin: '速食店吉祥物',
    base: { hp: 80, atk: 80, def: 80, spd: 50 },
    moves: ['SECRET_SPICES', 'ORIGINAL_RECIPE'],
    rival: { CHICKEN: '雞全身的羽毛都豎了起來。這是幾十億隻雞的血海深仇。' },
    strength: 1.0,
    dex: '一輩子炸了幾十億隻雞的男人。全身散發十一種香料的味道。產地：速食店門口。',
    lines: {
      appear: [
        '野生的肯德雞爺爺出現了！他對著{animal}露出慈祥的微笑。',
        '野生的肯德雞爺爺出現了！空氣裡有炸雞的味道。',
      ],
      caught: ['收服成功！肯德雞爺爺｜肉質：{grade}｜備註：全世界的雞都在等這一天。'],
      breakout: ['肯德雞爺爺用拐杖撐破了寶貝球！'],
    },
  },
  HULK: {
    no: 17, name: '綠巨人浩克', element: 'EARTH', origin: '超級英雄（漫威）',
    base: { hp: 110, atk: 115, def: 90, spd: 45 },
    moves: ['HULK_SMASH', 'ANGRIER'],
    strength: 1.3,
    dex: '生氣時肌肉會膨脹三倍，冷靜下來又縮回去。建議在他生氣時秤重出貨。產地：實驗室。',
    lines: {
      appear: [
        '野生的綠巨人浩克出現了！「浩克，砸！」',
        '野生的綠巨人浩克出現了！他的褲子快撐不住了。',
      ],
      caught: ['收服成功！綠巨人浩克｜肉質：{grade}｜備註：顏色是綠的，但沒有壞掉。'],
      breakout: ['浩克越氣越大，把寶貝球撐爆了！'],
    },
  },
  RYOTSU: {
    no: 18, name: '兩津勘吉', element: 'EARTH', origin: '烏龍派出所',
    base: { hp: 95, atk: 85, def: 85, spd: 55 },
    moves: ['POLICE_BIKE', 'GET_RICH_SCHEME'],
    strength: 1.1,
    dex: '體力怪物，怎麼打都死不了。眉毛連在一起，取下來可以當滷味。產地：龜有公園前派出所。',
    lines: {
      appear: [
        '野生的兩津勘吉出現了！他騎著巡邏腳踏車，正在翹班。',
        '野生的兩津勘吉出現了！他在想怎麼把{animal}賣掉賺錢。',
      ],
      caught: ['收服成功！兩津勘吉｜肉質：{grade}｜備註：被抓了還在想怎麼賺錢。'],
      breakout: ['兩津勘吉硬是把寶貝球扳開了！「哇哈哈哈！」'],
    },
  },
  GAARA: {
    no: 19, name: '我愛羅', element: 'EARTH', origin: '火影忍者',
    base: { hp: 75, atk: 85, def: 110, spd: 60 },
    moves: ['SAND_BURIAL', 'SAND_SHIELD'],
    strength: 1.1,
    dex: '額頭寫著「愛」，全身被沙子保護，吃起來有點沙沙的。產地：砂隱村。',
    lines: {
      appear: [
        '野生的我愛羅出現了！他背上的葫蘆在流沙。',
        '野生的我愛羅出現了！他的黑眼圈很重，好像很久沒睡。',
      ],
      caught: ['收服成功！我愛羅｜肉質：{grade}｜備註：洗乾淨再吃，不然會咬到沙。'],
      breakout: ['沙子從寶貝球的縫裡流了出來，我愛羅掙脫了！'],
    },
  },
  RONALD: {
    no: 20, name: '麥當勞叔叔', element: 'WIND', origin: '速食店吉祥物',
    base: { hp: 75, atk: 75, def: 65, spd: 85 },
    moves: ['HAPPY_MEAL', 'FRY_MISSILE'],
    rival: { COW: '牛想起了漢堡裡夾的是什麼。牠的眼神變了。' },
    strength: 0.95,
    dex: '一直在笑，笑到讓人有點害怕。賣了幾百億個漢堡，現在輪到他被做成漢堡。產地：速食店門口。',
    lines: {
      appear: [
        '野生的麥當勞叔叔出現了！他一直在笑。一直。',
        '野生的麥當勞叔叔出現了！「歡迎光臨～」',
      ],
      caught: ['收服成功！麥當勞叔叔｜肉質：{grade}｜備註：可以做成漢堡，夾在他自己的麵包裡。'],
      breakout: ['麥當勞叔叔笑著從寶貝球裡鑽了出來……還在笑。'],
    },
  },
  BATMAN: {
    no: 21, name: '蝙蝠俠', element: 'WIND', origin: '超級英雄（DC）',
    base: { hp: 80, atk: 85, def: 80, spd: 90 },
    moves: ['BATARANG', 'SMOKE_BOMB'],
    strength: 1.05,
    dex: '晚上才出來活動，肉質比較暗沉。有錢人的肉，價格很高。產地：高譚市。',
    lines: {
      appear: [
        '野生的蝙蝠俠出現了！他壓低聲音說：「我是蝙蝠俠。」',
        '野生的蝙蝠俠出現了！你剛剛還沒看到他。',
      ],
      caught: ['收服成功！蝙蝠俠｜肉質：{grade}｜備註：身上的裝備可以另外拍賣。'],
      breakout: ['蝙蝠俠用蝙蝠鏢割開了寶貝球！'],
    },
  },
  MOUNTAIN_MONKEY: {
    no: 22, name: '山道猴子', element: 'WIND', origin: '網路動畫',
    base: { hp: 65, atk: 85, def: 55, spd: 110 },
    moves: ['KNEE_DOWN', 'STRAIGHT_PIPE'],
    strength: 1.0,
    dex: '騎著改裝檔車在山路上壓車的猴子。雖然長得像猴子，但他是人類。產地：北宜公路。',
    lines: {
      appear: [
        '野生的山道猴子出現了！排氣管的聲音從山的另一頭就聽得到。',
        '野生的山道猴子出現了！他把車停下來，拍了一張帥照。',
      ],
      caught: ['收服成功！山道猴子｜肉質：{grade}｜備註：分期付款還沒繳完，車另售。'],
      breakout: ['山道猴子催了一下油門，衝出了寶貝球！'],
    },
  },
  HANZO: {
    no: 23, name: '服部半藏', element: 'WIND', origin: '日本忍者',
    base: { hp: 70, atk: 90, def: 60, spd: 105 },
    moves: ['SHURIKEN', 'NINJA_VANISH'],
    strength: 1.0,
    dex: '傳說中的伊賀忍者。速度太快，很難秤重。產地：伊賀。',
    lines: {
      appear: [
        '野生的服部半藏出現了！……他在哪裡？',
        '野生的服部半藏出現了！他從天花板上掉了下來。',
      ],
      caught: ['收服成功！服部半藏｜肉質：{grade}｜備註：忍者的肉，吃起來沒有聲音。'],
      breakout: ['服部半藏用了替身術，寶貝球裡只剩一根木頭！'],
    },
  },
};

// 收服成功時，除了專屬台詞外也可能抽到的通用台詞
export const GENERIC_CAUGHT = ['{human}已入欄。編號 {no}，耳標已打上。'];

// 肉質等級：類似個體值，跟 Lv. 分開。遇到時依機率隨機決定。
export const GRADES = [
  { id: 'CHOICE', name: '冷凍肉', rate: 0.70, statBonus: 1.00, struggle: 1.00 },
  { id: 'PRIME', name: '溫體牛', rate: 0.25, statBonus: 1.08, struggle: 1.10 },
  { id: 'A5', name: 'A5和牛', rate: 0.05, statBonus: 1.18, struggle: 1.20 },
];
