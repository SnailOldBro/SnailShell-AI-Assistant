#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
蜗牛壳AI助理 · 商店促销图生成器
--------------------------------
生成 Edge / Chrome 商店的两张宣传块（可选加分项，不填也不影响过审）：
  - Small promotional tile : 440 x 280
  - Large promotional tile : 1400 x 560

合规注意：微软/Chrome 商店禁止在宣传图中出现价格、促销、评分、星级、
倒计时等信息，因此本脚本只放品牌图标 + 功能说明，不含任何营销承诺。

用法：/usr/bin/python3 publish/gen-promo-tiles.py
输出：publish/promo-small-440x280.png、publish/promo-large-1400x560.png
"""
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ICON = os.path.join(BASE, "icons", "icon128.png")
OUT_SMALL = os.path.join(BASE, "publish", "promo-small-440x280.png")
OUT_LARGE = os.path.join(BASE, "publish", "promo-large-1400x560.png")

FONT_CANDIDATES = [
    "/System/Library/Fonts/Hiragino Sans GB.ttc",
    "/System/Library/Fonts/STHeiti Medium.ttc",
    "/System/Library/Fonts/STHeiti Light.ttc",
]

# 品牌色：取自图标里的螺旋紫
PURPLE = (110, 92, 232)
DEEP = (44, 38, 110)
INK = (31, 35, 40)
SOFT = (108, 117, 128)
WHITE = (255, 255, 255)


def load_font(size, light=False):
    for path in FONT_CANDIDATES:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size, index=0)
            except Exception:
                continue
    return ImageFont.load_default()


def vertical_gradient(size, top, bottom):
    """生成竖向渐变背景（纯色插值，无第三方依赖）。"""
    w, h = size
    img = Image.new("RGB", (1, h))
    px = img.load()
    for y in range(h):
        t = y / max(h - 1, 1)
        px[0, y] = tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3))
    return img.resize(size, Image.BILINEAR)


def rounded_mask(size, radius):
    m = Image.new("L", size, 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, size[0] - 1, size[1] - 1], radius=radius, fill=255)
    return m


def paste_icon(canvas, icon, box, size, radius=0):
    """把图标等比缩放后贴到指定位置（可选圆角）。"""
    im = icon.resize((size, size), Image.LANCZOS)
    if radius:
        im.putalpha(rounded_mask((size, size), radius))
    canvas.paste(im, box, im)
    return im


def build_small(icon):
    W, H = 440, 280
    canvas = vertical_gradient((W, H), (247, 246, 253), (232, 230, 250)).convert("RGBA")

    # 右侧淡紫装饰圆
    deco = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(deco).ellipse([W - 150, -70, W + 60, 140], fill=(255, 255, 255, 70))
    canvas = Image.alpha_composite(canvas, deco.filter(ImageFilter.GaussianBlur(2)))

    # 左侧图标（官方图标本身即方形深紫底，不加圆角以免露黑边）
    paste_icon(canvas, icon, (34, 90), 100)
    d = ImageDraw.Draw(canvas)
    d.rounded_rectangle([150, 104, 154, 176], radius=2, fill=PURPLE)

    d.text((172, 108), "蜗牛壳AI助理", font=load_font(30), fill=INK)
    d.text((172, 150), "自定义模型，免费更安全", font=load_font(17), fill=SOFT)

    d.text((34, 214), "总结网页 · 页面提问 · 右键引用", font=load_font(15), fill=PURPLE)
    d.text((34, 240), "Your own API key. No relay server.", font=load_font(12, light=True), fill=SOFT)

    return canvas.convert("RGB")


def build_large(icon):
    W, H = 1400, 560
    canvas = vertical_gradient((W, H), (250, 249, 255), (231, 228, 251)).convert("RGBA")

    deco = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    dd = ImageDraw.Draw(deco)
    dd.ellipse([W - 420, -190, W + 220, 450], fill=(255, 255, 255, 85))
    dd.ellipse([-160, H - 240, 260, H + 180], fill=(255, 255, 255, 60))
    canvas = Image.alpha_composite(canvas, deco.filter(ImageFilter.GaussianBlur(3)))

    # 左侧图标（方形，不加圆角）
    paste_icon(canvas, icon, (110, 130), 200)
    d = ImageDraw.Draw(canvas)
    d.rounded_rectangle([350, 150, 355, 250], radius=3, fill=PURPLE)

    d.text((386, 152), "蜗牛壳AI助理", font=load_font(54), fill=INK)
    d.text((386, 226), "自定义模型，免费更安全", font=load_font(28), fill=DEEP)
    d.text((386, 276), "Bring your own OpenAI-compatible model.", font=load_font(17, light=True), fill=SOFT)
    d.text((386, 304), "Your data never passes through any third-party relay server.", font=load_font(17, light=True), fill=SOFT)

    # 三个特性卡片
    cards = [
        ("总结网页", "一键提取正文，流式输出要点"),
        ("页面提问", "带着当前页上下文继续追问"),
        ("右键引用", "选中文字，就这段内容提问"),
    ]
    x0, cw, gap = (110, 380, 40)
    for i, (t, s) in enumerate(cards):
        x = x0 + i * (cw + gap)
        card = Image.new("RGBA", (cw, 132), (255, 255, 255, 225))
        card.putalpha(rounded_mask((cw, 132), 16))
        canvas.paste(card, (x, 372), card)
        d = ImageDraw.Draw(canvas)
        d.rounded_rectangle([x + 28, 400, x + 34, 428], radius=3, fill=PURPLE)
        d.text((x + 50, 396), t, font=load_font(24), fill=INK)
        d.text((x + 28, 442), s, font=load_font(16), fill=SOFT)

    return canvas.convert("RGB")


def main():
    icon = Image.open(ICON).convert("RGBA")
    build_small(icon).save(OUT_SMALL, "PNG")
    build_large(icon).save(OUT_LARGE, "PNG")
    for p in (OUT_SMALL, OUT_LARGE):
        print("✓", os.path.relpath(p, BASE), Image.open(p).size)


if __name__ == "__main__":
    main()
