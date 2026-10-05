# Edge 商店 · Store listings 商店列表页 填写包（中文主推）

> 对应后台左侧导航 **Store listings 商店列表**。
> 页面右上角只有 **Save draft 保存草稿** 与 **Close 关闭**，**填完务必点 Save draft**。

---

## ⚠️ 先看这里：当前是「English (United States)」页

Store listings 的页面是**按语言独立**的，你现在打开的是英文页，所以：

| 做法 | 结果 | 适合谁 |
|---|---|---|
| **做法一（推荐）**：本页填英文 → 再 Add language 添加「中文（简体）zh-CN」填中文 | 英文用户看英文页、中文用户看中文页，两边都专业 | 想认真做国际化 |
| **做法二（省事）**：本页直接填中文，不添加中文语言 | 只有一个语言版本，商店页显示中文描述 | 主要面向中国大陆用户，想尽快上架 |

> 下面 **A / B 两段是中文版**（用于做法二，或用于填写你新添加的 zh-CN 页）。
> 英文版放在文件末尾**附录**，用于做法一的 en-US 页。

---

## 字段清单（共 6 项，2 项必填）

| # | 字段 | 是否必填 | 怎么填 |
|---|---|---|---|
| 1 | Extension name 扩展名称 | 只读 | 保持「蜗牛壳AI助理」，**不用管** |
| 2 | Description 描述 | **必填** | 粘贴 **A**（中文，530 字符） |
| 3 | Extension logo 扩展图标 | **必填** | 上传 `publish/logo-300.png` |
| 4 | Small promotional tile 小型宣传块 | 可选 | 上传 `publish/promo-small-440x280.png` |
| 5 | Screenshots 截图 | 强烈建议 | 上传 4 张，见下方顺序建议 |
| 6 | Large promotional tile 大尺寸宣传块 | 可选 | 上传 `publish/promo-large-1400x560.png` |
| 7 | YouTube video URL | 可选 | **留空**，没有视频不要瞎填 |
| 8 | Search terms 搜索关键词 | 建议填 | 按 **B** 逐个 Add term |

---

## A. Description 描述（必填 · 中文，530 字符 / 上限 5000）

```text
蜗牛壳AI助理是一款注重隐私、使用自定义模型的浏览器侧边栏 AI 工具。

核心优势：支持自定义 OpenAI 兼容模型（DeepSeek / Qwen / GLM / Kimi / Ollama / 任意 endpoint），用你自己的 API Key 直连你选的服务，数据不经过任何第三方中转服务器——免费、更安全。

功能：
- 总结网页：一键提取网页正文并生成要点总结，流式输出，可随时停止。
- 页面提问：带页面上下文追问，模型基于当前页内容回答。
- 右键引用提问：选中文字 → 右键「AI 就这段内容提问」→ 侧边栏带引用块提问；或右键「AI 总结选中内容」直接总结选段。
- 多模型管理：可添加多个模型配置，随时切换；支持厂商预设、自动拉取模型名、连接测试。
- 本地历史与安全：对话存本机扩展存储；API Key 提供明文与主密码（PBKDF2 + AES-GCM）两档保护。

我们不做的事：不翻页批量抓取、不绕过付费墙、不读取 Cookie、不碰账号凭据、不采集浏览历史。

隐私政策：https://snailoldbro.github.io/SnailShell-AI-Assistant/privacy-policy.html
```

> 末尾那行隐私政策链接**建议保留**：商店描述里带 URL 是加分项，缺了容易被要求补充。

---

## B. Search terms 搜索关键词

后台规则：**最多 7 个 term，每个 term ≤30 字符，所有 term 合计不超过 21 个独立单词。**

### 中文版（用于中文页 / 做法二）

| 顺序 | 搜索词 | 字符数 |
|---|---|---|
| 1 | `网页总结` | 4 |
| 2 | `侧边栏AI助手` | 7 |
| 3 | `页面智能问答` | 6 |
| 4 | `右键划词提问` | 6 |
| 5 | `自定义API模型` | 8 |
| 6 | `DeepSeek Qwen Ollama` | 20 |
| 7 | `OpenAI兼容` | 8 |

操作：输入框填一个 → 点 **Add term 添加术语** → 重复 7 次。

> **不要**在这里重复名称里已有的字样（蜗牛壳AI助理 / SnailShell），要用用户会搜但名称里没有的词。

### 英文版（用于 en-US 页 / 做法一）

| 顺序 | 搜索词 | 字符数 | 单词数 |
|---|---|---|---|
| 1 | `ai sidebar assistant` | 20 | 3 |
| 2 | `summarize web page` | 18 | 3 |
| 3 | `chat with webpage` | 17 | 3 |
| 4 | `right click selection` | 21 | 3 |
| 5 | `custom model api key` | 20 | 4 |
| 6 | `deepseek qwen ollama` | 20 | 3 |
| 7 | `openai compatible` | 17 | 2 |
| | **合计** | | **21 / 21，正好满额** |

---

## C. 图片素材（从本地直接上传）

全部就绪，路径如下：

| 字段 | 文件 | 尺寸 |
|---|---|---|
| Extension logo **必填** | `publish/logo-300.png` | 300×300 ✅（要求 300×300，1:1） |
| Small promotional tile | `publish/promo-small-440x280.png` | 440×280 ✅ |
| Screenshots | `publish/screenshots/1-summary.png` | 1280×800 ✅ |
| Screenshots | `publish/screenshots/2-quote.png` | 1280×800 ✅ |
| Screenshots | `publish/screenshots/3-empty.png` | 1280×800 ✅ |
| Screenshots | `publish/screenshots/4-options.png` | 1280×800 ✅ |
| Large promotional tile | `publish/promo-large-1400x560.png` | 1400×560 ✅ |
| YouTube video URL | — | 留空 |

**截图上传顺序建议**（商店页按上传顺序展示，第 1 张最重要）：

1. `1-summary.png` — 「总结本页」流式输出，最能体现核心价值
2. `2-quote.png` — 右键引用提问，体现差异化交互
3. `3-empty.png` — 空状态引导，体现引导设计
4. `4-options.png` — 设置页多模型管理，体现配置能力

> 促销图里**不能**出现价格、折扣、评分星级、倒计时等（微软商店政策），我生成的图只含品牌图标 + 功能说明，合规。

> ⚠️ **素材按语言独立存储**：如果你添加了 zh-CN 语言页，Logo / 截图 / 促销图**必须重新上传一遍**，不会从 en-US 自动继承。

---

## 填完后的自检

- [ ] Description 已填（中文 530 字符，没有超限提示）
- [ ] Extension logo 已上传 300×300
- [ ] Screenshots 至少 1 张（建议 4 张全传，第 1 张是总结场景）
- [ ] Search terms 加了 7 个
- [ ] YouTube video URL 留空（没有视频就别填）
- [ ] **点右上角 Save draft 保存草稿**（不点会丢）
- [ ] 左侧导航 Store listings 出现 ✓
- [ ] 最后一步：**Notes for certification 认证说明**（指南第 4 节有可复制的测试步骤）

---

## 素材文件都在哪

```
publish/
├── logo-300.png                 ← 扩展图标（必填）
├── promo-small-440x280.png      ← 小型宣传块
├── promo-large-1400x560.png     ← 大尺寸宣传块
├── screenshots/
│   ├── 1-summary.png            ← 总结本页
│   ├── 2-quote.png              ← 右键引用提问
│   ├── 3-empty.png              ← 空状态引导
│   └── 4-options.png            ← 设置页
└── gen-promo-tiles.py           ← 促销图生成脚本（想改配色/文案可重跑）
```

---

# 附：英文版文案（做做法一时用）

## A-EN. Description（英文，1083 字符）

```text
SnailShell AI Assistant is a privacy-first browser side-panel AI tool.

Key advantage: bring your own OpenAI-compatible model (DeepSeek / Qwen / GLM / Kimi / Ollama / any endpoint) and connect directly with your own API key — your data never passes through any third-party relay server. Free and more secure.

Features:
- Summarize page: one-click extract and summarize the page with streaming output you can stop anytime.
- Ask about page: follow-up questions with full page context.
- Quote to ask: select text → right-click "Ask AI about this" → side panel opens with a quote block; or "Summarize selection" for instant summaries.
- Multi-model manager: add, switch, and test multiple models with preset providers and auto model listing.
- Local and secure: chat history stays on your device; API keys protected by plaintext or master-password (PBKDF2 + AES-GCM) modes.

What we don't do: no bulk crawling, no paywall bypass, no cookie or credential access, no browsing-history collection.

Privacy policy: https://snailoldbro.github.io/SnailShell-AI-Assistant/privacy-policy.html
```
