# 人類捕捉計畫（Catch the Humans）

反向寶可夢 RPG：你是一隻被人類養了一輩子的家畜（牛、豬、羊、雞），用彈力寶貝球收服野生人類。GB 像素風回合制，黑色幽默。

- 設計文件：[DESIGN.md](DESIGN.md)
- 試玩：用手機打開私人網址，橫向遊玩（網址在設計文件第八節）

## 在電腦上執行

不需要安裝任何東西，在專案資料夾開一個網頁伺服器就好：

```bash
python3 -m http.server 8000
```

然後打開 http://localhost:8000 。鍵盤操作：方向鍵移動，Z／空白鍵 = A，X = B。

## 測試

```bash
node src/elements.test.mjs && node src/battle.test.mjs
```
