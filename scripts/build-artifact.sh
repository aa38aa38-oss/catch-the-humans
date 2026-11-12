#!/usr/bin/env bash
# 把遊戲打包到 dist/，給 Claude 發布成網址用。
# 用法：scripts/build-artifact.sh
# 印出的最後一行是發布時 files 參數要用的檔案清單。
set -e
cd "$(dirname "$0")/.."
rm -rf dist && mkdir -p dist
# index.html 只取 ARTIFACT-START 到 ARTIFACT-END 之間（發布平台會自己包 <html>）
sed -n '/ARTIFACT-START/,/ARTIFACT-END/p' index.html | grep -v 'ARTIFACT-\|^</head>$\|^<body>$' > dist/index.html
cp -r src dist/
mkdir -p dist/art && cp -r art/humans dist/art/
rm -f dist/src/*.test.mjs
(cd dist && find src art -type f | sort | sed 's/.*/"&"/' | paste -sd, | sed 's/^/[/; s/$/]/')
