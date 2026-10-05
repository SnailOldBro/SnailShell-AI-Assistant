#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
蜗牛壳AI助理 · 英文版商店截图生成器
--------------------------------------
产品界面（侧边栏 / 设置页）目前是纯中文硬编码，没有做 UI i18n。
如果把截图里的界面整段翻译成英文，就会与用户实际装到的界面不一致。

因此本脚本的做法是：**保留真实的中文界面截图，在顶部加一条英文说明带**，
说明这张图在演示什么功能。这样既真实，又让英文用户看懂。

处理方式（不裁内容、不改变宽高比）：
  原图 1280×800 → 等比缩到 1136×710（1280:800 = 1.6，710×1.6 = 1136）
  → 贴在 1280×90 的英文标题带下方，两侧各留 72px 浅色边
  → 成品仍是 1280×800，符合商店要求

用法：/usr/bin/python3 publish/gen-screenshots-en.py
输出：publish/screenshots-en/1..4-*.png
"""
import os
from PIL import Image, ImageDraw, ImageFont

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.join(BASE, "publish", "screenshots")
OUT_DIR = os.path.join(BASE, "publish", "screenshots-en")

FONT_CANDIDATES = [
    "/System/Library/Fonts/Hiragino Sans GB.ttc",
    "/System/Library/Fonts/STHeiti Medium.ttc",
    "/System/Library/Fonts/STHeiti Light.ttc",
]

W, H = 1280, 800
BAND_H = 90
SIDE_PAD = 72
SIDE_COLOR = (236, 238, 242)
BAND_TOP = (124, 106, 240)
BAND_BOTTOM = (72, 56, 176)
TITLE_COLOR = (255, 255, 255)
SUB_COLOR = (216, 211, 245)

CAPTIONS = {
    "1-summary": ("Summarize any page in one click",
                  "One-click extraction with a streaming summary you can stop at any time"),
    "2-quote": ("Ask AI about any selection",
                "Right-click a passage to ask a question with it as context"),
    "3-empty": ("Start in a few seconds",
                "Add your model, then summarize, ask or quote — no sign-up required"),
    "4-options": ("Bring your own model",
                  "Any OpenAI-compatible endpoint, using your own API key"),
}


def load_font(size):
    for path in FONT_CANDIDATES:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size, index=0)
            except Exception:
                continue
    return ImageFont.load_default()


def band(size, top, bottom):
    w, h = size
    strip = Image.new("RGB", (1, h))
    px = strip.load()
    for y in range(h):
        t = y / max(h - 1, 1)
        px[0, y] = tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3))
    return strip.resize(size, Image.BILINEAR)


def build(key, title, subtitle):
    src = Image.open(os.path.join(SRC_DIR, key + ".png")).convert("RGB")
    body_h = H - BAND_H
    # 等比缩放，不裁切、不变形
    scale = min(W / src.width, body_h / src.height)
    new_size = (int(src.width * scale), int(src.height * scale))
    shot = src.resize(new_size, Image.LANCZOS)

    canvas = Image.new("RGB", (W, H), SIDE_COLOR)
    canvas.paste(band((W, BAND_H), BAND_TOP, BAND_BOTTOM), (0, 0))
    canvas.paste(shot, ((W - new_size[0]) // 2, BAND_H + (body_h - new_size[1]) // 2))

    d = ImageDraw.Draw(canvas)
    d.text((40, 20), title, font=load_font(25), fill=TITLE_COLOR)
    d.text((40, 54), subtitle, font=load_font(14), fill=SUB_COLOR)
    return canvas


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    for key, (title, subtitle) in CAPTIONS.items():
        img = build(key, title, subtitle)
        out = os.path.join(OUT_DIR, key + ".png")
        img.save(out, "PNG")
        print(f"  ✓ screenshots-en/{key}.png  {img.size}  ← {title}")


if __name__ == "__main__":
    main()
