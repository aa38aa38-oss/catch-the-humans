# 給 Claude 的工作說明（人類捕捉計畫）

使用者不會寫程式，用中文溝通。**用量有限，請省 token。**

## 開始工作前
1. 先讀 `DESIGN.md`（所有已決定的設計都在裡面），不要重新問已經決定的事。
2. 只讀這次任務需要的檔案；用 Grep 找位置，不要整個檔案讀完。

## 省 token 規則
- **只改資料（人類、招式、台詞、數值、地圖）時：只跑 `scripts/test.sh`，不開瀏覽器、不截圖。**
- 只有改到畫面或操作時，才用 Playwright 測，而且只截一張圖。
- 回報要短：做了什麼（條列）、哪裡需要使用者決定。細節寫進 `DESIGN.md`，不要在訊息裡重複。
- 不要為了確認而重讀剛改過的檔案。
- 人類的台詞、圖鑑，使用者如果已經寫好就直接用，不要自己重寫。

## 檔案位置
- 人類：`src/data/humans.js`（精簡格式 `h(...)`，一隻一筆，依屬性分組）
- 招式：`src/data/moves.js`；出現地點：`src/data/areas.js`；家畜：`src/data/animals.js`
- 地圖：`src/data/maps/`；道具：`src/data/items.js`；像素圖：`src/sprites.js`（暫時版，之後換圖檔）
- 新增人類的填寫範本：`docs/新增人類範本.md`；候選名單：`docs/人類候選名單.md`

## 測試與發布
- 測試：`scripts/test.sh`（資料完整性、地圖連通、戰鬥、連線同步都會檢查）
- 發布：`scripts/build-artifact.sh`，再用 Artifact 工具發布 `dist/index.html`，`root` 設為 `dist`，`files` 用腳本印出的清單。
  - 遊戲網址（更新同一個）：https://claude.ai/artifact/18T75fpgM7C7kKjF2vVYNU （要帶 `url` 參數更新）
- 開發分支：`claude/inspiring-rubin-460bvw`，改完 commit 並 push。
