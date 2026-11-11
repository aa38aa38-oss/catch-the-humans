#!/usr/bin/env bash
# 自動測試（不用開瀏覽器）：資料完整性、地圖、戰鬥、連線同步、收服、養殖場
set -e
cd "$(dirname "$0")/.."
node src/elements.test.mjs
node src/battle.test.mjs | tail -1
