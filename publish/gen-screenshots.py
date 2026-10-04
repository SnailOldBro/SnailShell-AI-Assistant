#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
蜗牛壳AI助理 · Edge/Chrome 商店截图生成器
----------------------------------------
生成「模拟浏览器窗口」版商店截图：左侧一篇示例网页，右侧真实侧边栏 UI。

**关键实现（踩过的坑）**
- 早期版本用 `<link rel="stylesheet" href="../src/sidepanel/style.css">`，
  但 stub 本身就生成在 `src/sidepanel/` 下，`../` 多了一层 → 指向
  `src/src/sidepanel/style.css` → CSS 根本没加载 → 截图全是白底无样式。
  现改为**把 style.css 内联进 <style>**，与相对路径彻底解耦，file:// 下也稳。
- 模板用字符串 replace 而非 str.format：真实 CSS 里有 127 对花括号，
  用 format 会被当成占位符炸掉。

用法：
    /usr/bin/python3 publish/gen-screenshots.py   # 生成 stub，并打印截图命令
    # 逐条执行 Chrome 截图（一次 Bash 只能起一个 Chrome，见项目 memory）
    /usr/bin/python3 publish/gen-screenshots.py --shoot   # 生成 + 直接截三张

输出：publish/screenshots/*.png (1280x800)
"""
import os
import subprocess
import sys

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SP = os.path.join(BASE, "src", "sidepanel")
SHOT_DIR = os.path.join(BASE, "publish", "screenshots")

HEADER = """<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8">
<title>蜗牛壳AI助理</title>
<style>
/* ===== 真实侧栏样式（src/sidepanel/style.css 内联）===== */
__SIDE_CSS__
</style>
<style>
  html,body { margin:0; padding:0; height:100%; background:#e9ecef; }
  body { font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif; }
  .window { display:flex; flex-direction:column; height:100vh; }
  /* 模拟浏览器工具栏 */
  .chrome-bar { height:44px; background:#dee1e5; display:flex; align-items:center;
                gap:8px; padding:0 14px; border-bottom:1px solid #c9ced4; }
  .chrome-bar .dot { width:11px; height:11px; border-radius:50%; background:#b9bfc7; }
  .chrome-addr { flex:1; height:24px; background:#fff; border-radius:12px; margin-left:8px;
                 display:flex; align-items:center; padding:0 12px; font-size:12px; color:#5b6470; }
  /* 主体：左网页 + 右侧栏 */
  .stage { flex:1; display:flex; min-height:0; }
  .demo-page { flex:1; background:#fff; margin:14px; border-radius:6px; padding:34px 40px;
                overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,.06); }
  .demo-page h1 { font-size:26px; margin:0 0 6px; color:#1f2328; }
  .demo-page .sub { font-size:13px; color:#7b8794; margin-bottom:20px; }
  .demo-page h2 { font-size:18px; color:#1f2328; margin:22px 0 8px; }
  .demo-page p { font-size:14px; line-height:1.9; color:#3c434b; margin:0 0 12px; }
  .demo-page .ph { height:11px; border-radius:5px; background:#eef1f4; margin:0 0 10px; }
  .demo-page .ph.w90 { width:90%; } .demo-page .ph.w100 { width:100%; }
  .demo-page .ph.w70 { width:70%; } .demo-page .ph.w80 { width:80%; }
  .demo-page .ph.w95 { width:95%; } .demo-page .ph.w60 { width:60%; }
  .demo-page .hl { background:#fff4d6; height:11px; border-radius:5px; margin:0 0 12px; width:75%; }
  /* 右侧栏：与真实 sidePanel 同宽同高
     position:relative 必须加！.empty-state / .unlock-panel 用的是
     position:absolute; inset:52px 0 0 0，若无定位祖先会横跨整个 1280px
     页面（截图里空状态会跑到左侧假网页上），这是早期截图的第三个错误 */
  .side { position:relative; width:420px; flex-shrink:0; background:#fff;
          border-left:1px solid #dfe3e8; display:flex; flex-direction:column; min-height:0; }
  .sh-top { flex-shrink:0; }
  .sh-bottom { flex-shrink:0; }
  /* 必须保持 column：真实侧栏是 header / main.chat / footer 三层 flex 列，
     若这里是 row，.msg.user{align-self:flex-end} 会变成「垂直底部对齐」，
     导致用户气泡跑到助手回答下方（这是早期截图的第二个错误） */
  .sh-mid { flex:1; min-height:0; display:flex; flex-direction:column; }
  /* 修正：headless 下 select 若渲染异常则隐藏兜底（CSS 正常时不触发） */
  .model-select.is-broken { display:none; }
  .icon-btn { flex-shrink:0; }
  body.no-quote #quoteBar { display:none !important; }
  body.show-quote #quoteBar { display:flex !important; }
</style></head><body class="__BODYCLS__">
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
      <p><div class="ph w90"></div><div class="ph w70"></div><div class="ph w60"></div></p>
    </div>
    <div class="side">
      <div class="sh-top">
__HEADER__
      </div>
      <div class="sh-mid">
<main class="chat">
__CHAT__
</main>
      </div>
      <div class="sh-bottom">
__COMPOSER__
      </div>
    </div>
  </div>
</div>
</body></html>"""

# 从真实 index.html 拆出 header 与 composer（保证 DOM 与真产品一致）
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

def load_side_css():
    path = os.path.join(SP, "style.css")
    with open(path, encoding="utf-8") as f:
        css = f.read()
    if "</style" in css.lower():
        raise SystemExit("style.css 含 </style>，不能直接内联，请先转义")
    return css

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
              "</div>"
              '<div class="msg-meta"><span class="msg-time">10:24</span>'
              '<div class="msg-actions"><span class="action-btn">复制</span>'
              '<span class="action-btn">修改</span></div></div></div>'
        ),
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
              "</div>"
              '<div class="msg-meta"><span class="msg-time">10:31</span>'
              '<div class="msg-actions"><span class="action-btn">复制</span>'
              '<span class="action-btn">修改</span></div></div></div>'
        ),
        "input": "继续",
    },
    "3-empty": {
        "model": "未配置模型",
        "chat": "",
        "empty": True,
        "input": "自定义模型，免费更安全。输入 / 调用更多功能",
    },
}

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

def build(key, cfg):
    # 把 model-name 注入 header 的品牌区（真实 DOM 由 app.js 填充，这里预填以便截图）
    header = HDR.replace('<div class="model-name" id="modelName"></div>',
                         f'<div class="model-name" id="modelName">{cfg.get("model", "未配置模型")}</div>')

    if cfg.get("empty"):
        chat = ('<div id="emptyState" class="empty-state">'
                '<p class="empty-title">开始使用</p>'
                '<p class="empty-desc">选中网页文字 → 右键「AI 就这段内容提问」<br />'
                '或输入「/」调用总结本页等功能<br />或任意提问</p>'
                '<button class="primary">前往设置模型</button></div>')
    else:
        chat = cfg["chat"]

    # 只有手写了 quote-bar 的场景才显示引用条，否则强制隐藏（绕开 .hidden 被 .quote-bar 覆盖）
    bodycls = "show-quote" if "quote-bar" in chat else "no-quote"
    return (HEADER
            .replace("__SIDE_CSS__", load_side_css())
            .replace("__BODYCLS__", bodycls)
            .replace("__HEADER__", header)
            .replace("__CHAT__", chat)
            .replace("__COMPOSER__", CMP))

def shoot(key):
    stub = os.path.join(SP, "_shot_%s.html" % key)
    out = os.path.join(SHOT_DIR, key + ".png")
    cmd = [CHROME, "--headless=new", "--disable-gpu", "--no-sandbox",
           "--disable-software-rasterizer", "--hide-scrollbars",
           "--screenshot=" + out, "--window-size=1280,800",
           "--virtual-time-budget=3000", "file://" + stub]
    r = subprocess.run(cmd, capture_output=True, text=True)
    size = os.path.getsize(out) if os.path.exists(out) else 0
    print(f"  {key}.png  {size} bytes" + ("  ⚠️ 输出为空" if size == 0 else ""))

def main():
    os.makedirs(SHOT_DIR, exist_ok=True)
    if "--shoot" in sys.argv:
        for key in SCENES:
            with open(os.path.join(SP, "_shot_%s.html" % key), "w",
                      encoding="utf-8") as f:
                f.write(build(key, SCENES[key]))
            shoot(key)
        print("\n清理 stub：rm -f src/sidepanel/_shot_*.html")
        return

    print("stub ->")
    for key in SCENES:
        path = os.path.join(SP, "_shot_%s.html" % key)
        with open(path, "w", encoding="utf-8") as f:
            f.write(build(key, SCENES[key]))
        print("  ", path)
    print("\n请逐条执行 Chrome 截图（一次只能起一个 Chrome）：")
    for key in SCENES:
        print(f'  "{CHROME}" --headless=new --disable-gpu --no-sandbox '
              f'--disable-software-rasterizer --hide-scrollbars '
              f'--screenshot="publish/screenshots/{key}.png" '
              f'--window-size=1280,800 --virtual-time-budget=3000 '
              f'"file://{os.path.join(SP, "_shot_%s.html" % key)}"')
    print("\n一次性截三张：/usr/bin/python3 publish/gen-screenshots.py --shoot")
    print("截图完成后清理 stub：rm -f src/sidepanel/_shot_*.html")

if __name__ == "__main__":
    main()
