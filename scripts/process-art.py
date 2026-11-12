#!/usr/bin/env python3
"""把 Gemini 畫的原圖轉成遊戲用的像素圖。
用法：把原圖放進 art/source/（檔名 = 英文代號，例如 CHEN_PINGWEI.png），執行 python3 scripts/process-art.py
輸出：art/humans/代號.png（112×112、透明背景、減色、加外框）
步驟：切掉底部字幕條 → 去掉白色背景 → 裁到人物大小 → 縮小 → 減色 → 加外框
"""
import sys, glob, os
from collections import deque
from PIL import Image

SIZE = 112          # 遊戲裡的大小（畫布像素）
COLORS = 48         # 減色後最多幾色
OUTLINE = (32, 30, 40, 255)
ROOT = os.path.join(os.path.dirname(__file__), '..')

def is_white(p): return p[0] > 228 and p[1] > 228 and p[2] > 228

def cut_subtitle(im):
    """從下往上找：左右兩端都是深色的橫條 = 字幕條，切掉"""
    w, h = im.size; px = im.load()
    dark = lambda p: sum(p[:3]) < 600   # 不是白色就算（字幕條本身有亮色邊線）
    xs = (int(w * 0.03), int(w * 0.97))
    y = h - 1
    while y > h * 0.9 and not all(dark(px[x, y]) for x in xs): y -= 1   # 跳過最下面的亮邊
    bottom = y
    while y > h * 0.5 and all(dark(px[x, y]) for x in xs): y -= 1
    if bottom - y < h * 0.05: return im, False   # 太薄，不是字幕條
    y -= max(2, h // 200)   # 再往上多切幾行，把條上緣的亮邊也切掉
    return im.crop((0, 0, w, y)), True

def remove_white(im):
    """從四邊開始，把連在一起的白色背景變透明（人物身上的白衣服不會被去掉）"""
    im = im.convert('RGBA'); w, h = im.size; px = im.load()
    q = deque((x, y) for x in range(w) for y in (0, h - 1)) ; q.extend((x, y) for y in range(h) for x in (0, w - 1))
    seen = set()
    while q:
        x, y = q.popleft()
        if (x, y) in seen or not (0 <= x < w and 0 <= y < h): continue
        seen.add((x, y))
        if not is_white(px[x, y]): continue
        px[x, y] = (0, 0, 0, 0)
        q.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))
    return im

def process(path):
    name = os.path.splitext(os.path.basename(path))[0]
    im = Image.open(path).convert('RGB')
    im, had_bar = cut_subtitle(im)
    im = remove_white(im)
    im = im.crop(im.getbbox())
    w, h = im.size; k = (SIZE - 2) / max(w, h)
    small = im.resize((max(1, round(w * k)), max(1, round(h * k))), Image.LANCZOS)
    # 半透明邊緣：一半以上不透明就留，其餘全透明（像素圖不要半透明）
    alpha = small.getchannel('A').point(lambda a: 255 if a >= 128 else 0)
    rgb = small.convert('RGB').quantize(COLORS, method=Image.FASTOCTREE).convert('RGB')
    small = rgb.convert('RGBA'); small.putalpha(alpha)
    out = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    out.paste(small, ((SIZE - small.width) // 2, SIZE - 1 - small.height), small)  # 置中、貼齊底部
    px = out.load(); add = []
    for y in range(SIZE):
        for x in range(SIZE):
            if px[x, y][3] == 0 and any(0 <= x + dx < SIZE and 0 <= y + dy < SIZE and px[x + dx, y + dy][3] for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                add.append((x, y))
    for x, y in add: px[x, y] = OUTLINE
    out.save(os.path.join(ROOT, 'art/humans', name + '.png'))
    print(f'{name}: {"切掉字幕條，" if had_bar else ""}輸出 {SIZE}×{SIZE}')

files = sys.argv[1:] or sorted(glob.glob(os.path.join(ROOT, 'art/source/*.png')))
for f in files: process(f)
