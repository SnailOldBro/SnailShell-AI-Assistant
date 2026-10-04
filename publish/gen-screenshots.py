#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
蜗牛壳AI助理 · Edge/Chrome 商店截图生成器
----------------------------------------
生成「模拟浏览器窗口」版商店截图：左侧一篇示例网页，右侧真实侧边栏 UI（复用 src/sidepanel/style.css）。
消息气泡的 DOM 结构与 src/sidepanel/app.js 的 renderUser / streamResponse 完全一致，视觉效果与真产品一致。

用法：
    /usr/bin/python3 publish/gen-screenshots.py          # 生成 stub（供 headless Chrome 截图）
    # 之后分多次调用 Chrome 截图（注意：一次 Bash 只能起一个 Chrome，见 memory）
    # 截图完会自动提示删除命令

输出：publish/screenshots/*.png (1280x800)
"""
import os
import sys

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SP = os.path.join(BASE, "src", "sidepanel")
SHOT_DIR = os.path.join(BASE, "publish", "screenshots")

HEADER = """<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8">
<title>蜗牛壳AI助理</title>
<link rel="stylesheet" href="{css}" />
<style>
  html,body {{ margin:0; padding:0; height:100%; background:#e9ecef; }}
  body {{ font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif; }}
  .window {{ display:flex; flex-direction:column; height:100vh; }}
  /* 模拟浏览器工具栏 */
  .chrome-bar {{ height:44px; background:#dee1e5; display:flex; align-items:center;
                 gap:8px; padding:0 14px; border-bottom:1px solid #c9ced4; }}
  .chrome-bar .dot {{ width:11px; height:11px; border-radius:50%; background:#b9bfc7; }}
  .chrome-addr {{ flex:1; height:24px; background:#fff; border-radius:12px; margin-left:8px;
                  display:flex; align-items:center; padding:0 12px; font-size:12px; color:#5b6470; }}
  /* 主体：左网页 + 右侧栏 */
  .stage {{ flex:1; display:flex; min-height:0; }}
  .demo-page {{ flex:1; background:#fff; margin:14px; border-radius:6px; padding:34px 40px;
                overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,.06); }}
  .demo-page h1 {{ font-size:26px; margin:0 0 6px; color:#1f2328; }}
  .demo-page .sub {{ font-size:13px; color:#7b8794; margin-bottom:20px; }}
  .demo-page h2 {{ font-size:18px; color:#1f2328; margin:22px 0 8px; }}
  .demo-page p {{ font-size:14px; line-height:1.9; color:#3c434b; margin:0 0 12px; }}
  .demo-page .ph {{ height:11px; border-radius:5px; background:#eef1f4; margin:0 0 10px; }}
  .demo-page .ph.w90 {{ width:90%; }} .demo-page .ph.w100 {{ width:100%; }}
  .demo-page .ph.w70 {{ width:70%; }} .demo-page .ph.w80 {{ width:80%; }}
  .demo-page .hl {{ background:#fff4d6; height:11px; border-radius:5px; margin:0 0 12px; width:75%; }}
  /* 右侧栏：与真实 sidePanel 同宽同高 */
  .side {{ width:420px; flex-shrink:0; background:#fff; border-left:1px solid #dfe3e8;
           display:flex; flex-direction:column; min-height:0; }}
  .sh-top {{ flex-shrink:0; }}
  .sh-bottom {{ flex-shrink:0; }}
  .sh-mid {{ flex:1; min-height:0; display:flex; }}
  /* 截图修正：headless 下 select 渲染成空方块，且 .quote-bar 会盖过 .hidden */
  .model-select {{ display:none; }}
  .icon-btn {{ flex-shrink:0; }}
  body.no-quote #quoteBar {{ display:none !important; }}
  body.show-quote #quoteBar {{ display:flex !important; }}
</style></head><body class="{bodycls}">
<div class="window">
  <div class="chrome-bar">
    <span class="dot"></span><span class="dot"></span><span class="dot"></span>
    <div class="chrome-addr">https://example.com/blog/how-ai-reads-the-web</div>
  </div>
  <div class="stage">
    <div class="demo-page">
      <h1>深入理解：浏览器扩展如何读懂一个网页</h1>
      <div class="sub">示例文章 · 阅读约 8 分钟</div>
      <h2>正文提取的挑战</h2>
      <p><div class="hl"></div></p>
      <p><div class="ph w100"></div><div class="ph w90"></div><div class="ph w95"></div></p>
      <h2>为什么「读得准」比「读得快」更重要</h2>
      <p><div class="ph w100"></div><div class="ph w80"></div></p>
      <p><div class="ph w90"></div><div class="ph w70"></div></p>
    </div>
    <div class="side">
      <div class="sh-top">
{header}
      </div>
      <div class="sh-mid">
{chat}
      </div>
      <div class="sh-bottom">
{composer}
      </div>
    </div>
  </div>
</div>
</body></html>"""

# 从真实 index.html 拆出 header 与 composer（保证 DOM/样式 100% 一致）
def extract_from_index():
    with open(os.path.join(SP, "index.html"), encoding="utf-8") as f:
        html = f.read()
    def grab(wrapper, end_tag):
        i = html.index(wrapper)
        j = html.index(end_tag, i)
        return html[i + len(wrapper):j]
    header = grab('<header class="topbar">', '</header>')
    composer = grab('<footer class="composer">', '</footer>')
    return header, composer

HDR, CMP = extract_from_index()

def msg(cls, body, meta="10:24"):
    return (
        f'<div class="msg {cls}"><div class="msg-text">{body}</div>'
        f'<div class="msg-meta"><span class="msg-time">{meta}</span></div></div>'
    )

SCENES = {
    "1-summary": {
        "model": "deepseek-chat",
        "chat": (
            msg("user", "总结这一页的核心要点", "10:24")
            + '<div class="msg assistant"><div class="msg-text">'
              "<p>以下是本文的要点总结：</p>"
              "<p>· 正文提取的核心挑战在于区分「正文」与「导航/广告/推荐」等噪音模块</p>"
              "<p>· 启发式规则（密度、链接比、标签权重）比单纯 DOM 深度更有效</p>"
              "<p>· 提取质量会因站点结构差异而下降，需按站点灰度调整</p>"
              "<p>· 本文档 Demo 演示了在浏览器扩展中注入提取脚本的完整链路</p>"
              "</div><div class=\"msg-meta\"><span class=\"msg-time\">10:24</span>"
              "<div class=\"msg-actions\"><span class=\"action-btn\">复制</span>"
              "<span class=\"action-btn\">修改</span></div></div></div>"
        ),
        "quote": False,
        "input": "继续展开第二点",
    },
    "2-quote": {
        "model": "deepseek-chat",
        "chat": (
            '<div id="quoteBar" class="quote-bar">'
            '<span class="quote-tag">引用</span>'
            '<span class="quote-text">启发式规则（密度、链接比、标签权重）比单纯 DOM 深度更有效</span>'
            '<button class="close-x">×</button></div>'
            + msg("user", "这句话怎么理解？", "10:31")
            + '<div class="msg assistant"><div class="msg-text">'
              "<p>这句话的意思是：判断哪段是正文时，不能只看它在 DOM 里有多深，</p>"
              "<p>而要看<strong>文本密度</strong>（文字占比）、<strong>链接密度</strong>（链接占多少）</p>"
              "<p>与<strong>标签权重</strong>（article/main 权重最高）这几个特征的加权结果。</p>"
              "</div><div class=\"msg-meta\"><span class=\"msg-time\">10:31</span>"
              "<div class=\"msg-actions\"><span class=\"action-btn\">复制</span>"
              "<span class=\"action-btn\">修改</span></div></div></div>"
        ),
        "quote": False,
        "input": "继续",
    },
    "3-empty": {
        "model": "",
        "chat": "",
        "quote": False,
        "input": "自定义模型，免费更安全。输入/调用更多功能",
        "empty": True,
    },
}

def build(key, cfg):
    # 把 model-name 注入 header 的品牌区（真实 DOM 由 app.js 填充，这里预填以便截图）
    header = HDR.replace('<div class="model-name" id="modelName"></div>',
                         f'<div class="model-name" id="modelName">{cfg.get("model","未配置模型")}</div>')

    if cfg.get("empty"):
        chat = ('<div id="emptyState" class="empty-state">'
                '<p class="empty-title">开始使用</p>'
                '<p class="empty-desc">选中网页文字 → 右键「AI 就这段内容提问」<br />'
                '或输入「/」调用总结本页等功能<br />或任意提问</p>'
                '<button class="primary">前往设置模型</button></div>')
    else:
        chat = cfg["chat"]

    # 场景内手写了 quote-bar 才显示引用条，否则强制隐藏（绕开 .hidden 被 .quote-bar 覆盖）
    bodycls = "show-quote" if "quote-bar" in chat else "no-quote"
    return HEADER.format(
        css="../src/sidepanel/style.css",
        header=header,
        chat=chat,
        composer=CMP,
        bodycls=bodycls,
    )

def main():
    os.makedirs(SHOT_DIR, exist_ok=True)
    out = []
    for key, cfg in SCENES.items():
        path = os.path.join(SP, "_shot_%s.html" % key)
        with open(path, "w", encoding="utf-8") as f:
            f.write(build(key, cfg))
        out.append(path)
        print("stub ->", path)
    print("\n请逐条执行 Chrome 截图（一次只能起一个 Chrome）：")
    for key in SCENES:
        print(f'  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" '
              f'--headless=new --disable-gpu --hide-scrollbars '
              f'--screenshot="publish/screenshots/{key}.png" '
              f'--window-size=1280,800 --virtual-time-budget=3000 '
              f'"file://{os.path.join(SP, "_shot_%s.html" % key)}"')
    print("\n截图完成后清理 stub：rm -f src/sidepanel/_shot_*.html")

if __name__ == "__main__":
    main()
