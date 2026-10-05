#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
蜗牛壳AI助理 · 商店促销图生成器（中英双语）
----------------------------------------------
生成 Edge / Chrome 商店宣传块（可选加分项，不填也不影响过审）：
  - Small promotional tile : 440 x 280
  - Large promotional tile : 1400 x 560

每种语言一套，共 4 张：
  promo-small-440x280.png / promo-large-1400x560.png        （中文）
  promo-small-440x280-en.png / promo-large-1400x560-en.png  （英文）

合规：商店禁止宣传图出现价格、折扣、评分星级、倒计时，本脚本只放
品牌图标 + 功能说明。

用法：/usr/bin/python3 publish/gen-promo-tiles.py
"""
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ICON = os.path.join(BASE, "icons", "icon128.png")
OUT_DIR = os.path.join(BASE, "publish")

FONT_CANDIDATES = [
    "/System/Library/Fonts/Hiragino Sans GB.ttc",
    "/System/Library/Fonts/STHeiti Medium.ttc",
    "/System/Library/Fonts/STHeiti Light.ttc",
]

PURPLE = (110, 92, 232)
DEEP = (44, 38, 110)
INK = (31, 35, 40)
SOFT = (108, 117, 128)


def load_font(size):
    for path in FONT_CANDIDATES:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size, index=0)
            except Exception:
                continue
    return ImageFont.load_default()


def vertical_gradient(size, top, bottom):
    """1×h 竖向插值后放大，避免引入 numpy。"""
    w, h = size
    strip = Image.new("RGB", (1, h))
    px = strip.load()
    for y in range(h):
        t = y / max(h - 1, 1)
        px[0, y] = tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3))
    return strip.resize(size, Image.BILINEAR)


def round_mask(size, radius):
    m = Image.new("L", size, 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, size[0] - 1, size[1] - 1], radius=radius, fill=255)
    return m


def paste_icon(canvas, icon, box, size):
    im = icon.resize((size, size), Image.LANCZOS)
    canvas.paste(im, box, im)


COPY = {
    "zh": {
        "small": {
            "name": "蜗牛壳AI助理",
            "tag": "自定义模型，免费更安全",
            "feat": "总结网页 · 页面提问 · 右键引用",
            "sub": "自带 API Key · 不经中转",
        },
        "large": {
            "name": "蜗牛壳AI助理",
            "tag": "自定义模型，免费更安全",
            "line1": "支持任意 OpenAI 兼容模型，用你自己的 API Key 直连。",
            "line2": "数据不经过任何第三方中转服务器。",
            "cards": [
                ("总结网页", "一键提取正文，流式输出要点"),
                ("页面提问", "带着当前页上下文继续追问"),
                ("右键引用", "选中文字，就这段内容提问"),
            ],
        },
    },
    "en": {
        "small": {
            "name": "SnailShell AI Assistant",
            "tag": "Your own model. Free & private.",
            "feat": "Summarize  ·  Ask  ·  Quote",
            "sub": "Your API key  ·  No relay server",
        },
        "large": {
            "name": "SnailShell AI Assistant",
            "tag": "Your own model. Free & private.",
            "line1": "Bring your own OpenAI-compatible model and connect with your own API key.",
            "line2": "Your data never passes through any third-party relay server.",
            "cards": [
                ("Summarize page", "One-click extraction, streaming output"),
                ("Ask about page", "Follow-up questions with page context"),
                ("Quote to ask", "Right-click a selection to ask"),
            ],
        },
    },
}


def build_small(icon, c, lang):
    W, H = 440, 280
    canvas = vertical_gradient((W, H), (247, 246, 253), (232, 230, 250)).convert("RGBA")
    deco = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(deco).ellipse([W - 150, -70, W + 60, 140], fill=(255, 255, 255, 70))
    canvas = Image.alpha_composite(canvas, deco.filter(ImageFilter.GaussianBlur(2)))

    d = ImageDraw.Draw(canvas)
    paste_icon(canvas, icon, (30, 34), 84)
    d.text((30, 136), c["name"], font=load_font(23 if lang == "en" else 26), fill=INK)
    d.text((30, 172), c["tag"], font=load_font(15 if lang == "en" else 17), fill=DEEP)
    d.line([(30, 204), (410, 204)], fill=(210, 206, 240), width=1)
    d.text((30, 216), c["feat"], font=load_font(14 if lang == "en" else 15), fill=PURPLE)
    d.text((30, 242), c["sub"], font=load_font(11 if lang == "en" else 12), fill=SOFT)
    return canvas.convert("RGB")


def build_large(icon, c, lang):
    W, H = 1400, 560
    canvas = vertical_gradient((W, H), (250, 249, 255), (231, 228, 251)).convert("RGBA")
    deco = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    dd = ImageDraw.Draw(deco)
    dd.ellipse([W - 420, -190, W + 220, 450], fill=(255, 255, 255, 85))
    dd.ellipse([-160, H - 240, 260, H + 180], fill=(255, 255, 255, 60))
    canvas = Image.alpha_composite(canvas, deco.filter(ImageFilter.GaussianBlur(3)))

    paste_icon(canvas, icon, (110, 130), 200)
    d = ImageDraw.Draw(canvas)
    d.rounded_rectangle([350, 150, 355, 250], radius=3, fill=PURPLE)

    d.text((386, 146), c["name"], font=load_font(46 if lang == "en" else 54), fill=INK)
    d.text((386, 216), c["tag"], font=load_font(26 if lang == "en" else 28), fill=DEEP)
    d.text((386, 270), c["line1"], font=load_font(17), fill=SOFT)
    d.text((386, 298), c["line2"], font=load_font(17), fill=SOFT)

    x0, cw, gap = 110, 380, 40
    for i, (title, sub) in enumerate(c["cards"]):
        x = x0 + i * (cw + gap)
        card = Image.new("RGBA", (cw, 132), (255, 255, 255, 228))
        card.putalpha(round_mask((cw, 132), 16))
        canvas.paste(card, (x, 372), card)
        d = ImageDraw.Draw(canvas)
        d.rounded_rectangle([x + 28, 400, x + 34, 428], radius=3, fill=PURPLE)
        d.text((x + 50, 396), title, font=load_font(22 if lang == "en" else 24), fill=INK)
        d.text((x + 28, 442), sub, font=load_font(15 if lang == "en" else 16), fill=SOFT)
    return canvas.convert("RGB")


def main():
    icon = Image.open(ICON).convert("RGBA")
    for lang, suffix in (("zh", ""), ("en", "-en")):
        c = COPY[lang]
        for label, size in (("small", "440x280"), ("large", "1400x560")):
            path = os.path.join(OUT_DIR, f"promo-{label}-{size}{suffix}.png")
            (build_small if label == "small" else build_large)(icon, c[label], lang).save(path, "PNG")
            print(f"  ✓ {os.path.basename(path)}  {Image.open(path).size}")


if __name__ == "__main__":
    main()
