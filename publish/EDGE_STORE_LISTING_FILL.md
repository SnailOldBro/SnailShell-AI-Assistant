# Edge 商店 · Store listings 商店列表页 填写包

> 对应后台左侧导航 **Store listings 商店列表**。当前截图是 **English (United States)** 页面。
> 页面右上角有 **Save draft 保存草稿** 与 **Close 关闭**，**填完务必点 Save draft**。

---

## ⚠️ 先看这个：Extension name 是只读的

页面顶部 **Extension name 扩展名称 \*** 是一个**灰色不可编辑**的框，当前显示「蜗牛壳AI助理」。

- 它**自动取自 `manifest.json` 的 `name` 字段**，Partner Center 不允许在这里改
- 意味着英文商店页也会显示中文名「蜗牛壳AI助理」
- 想改成英文名只能：改 `manifest.json` 的 `name` → 版本号递增 → 重新打包上传 → 重新提交审核（**不建议现在做**，会拖长流程）
- 中文名在 Edge 商店是允许的，不影响过审

---

## 字段清单（共 6 项，2 项必填）

| # | 字段 | 是否必填 | 怎么填 |
|---|---|---|---|
| 1 | Extension name 扩展名称 | 只读 | 保持「蜗牛壳AI助理」，**不用管** |
| 2 | Description 描述 | **必填** | 粘贴 **A**（英文，990 字符） |
| 3 | Extension logo 扩展图标 | **必填** | 上传 `publish/logo-300.png` |
| 4 | Small promotional tile 小型宣传块 | 可选 | 上传 `publish/promo-small-440x280.png` |
| 5 | Screenshots 截图 | 强烈建议 | 上传 4 张，见下方顺序建议 |
| 6 | Large promotional tile 大尺寸宣传块 | 可选 | 上传 `publish/promo-large-1400x560.png` |
| 7 | YouTube video URL | 可选 | **留空**，没有视频不要瞎填 |
| 8 | Search terms 搜索关键词 | 建议填 | 按 **B** 逐个 Add term，7 个正好 |

---

## A. Description 描述（必填，英文，990 字符 / 上限 5000）

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

> 末尾那行隐私政策链接**建议保留**：Edge 描述里带 URL 是加分项，缺失时反而容易被要求补充。

---

## B. Search terms 搜索关键词

后台规则：**最多 7 个 term，每个 term ≤30 字符，所有 term 合计不超过 21 个独立单词**。

下面 7 个正好用满额度（合计 21 词）：

| 顺序 | 搜索词 | 字符数 | 单词数 |
|---|---|---|---|
| 1 | `ai sidebar assistant` | 20 | 3 |
| 2 | `summarize web page` | 19 | 3 |
| 3 | `chat with webpage` | 18 | 3 |
| 4 | `right click selection` | 22 | 3 |
| 5 | `custom model api key` | 21 | 4 |
| 6 | `deepseek qwen ollama` | 20 | 3 |
| 7 | `openai compatible` | 17 | 2 |
| | **合计** | | **21 / 21** |

操作：在输入框填一个词 → 点 **Add term 添加术语** → 重复 7 次。

> 注意：**不要**在这里重复堆 Extension name 里已有的词（蜗牛壳AI助理 / SnailShell），搜索词要用用户会搜但名称里没有的词。

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

---

## D. 别忘了加中文语言版本

现在只有 **English (United States)**。你的用户主要是中文用户，**强烈建议再添加简体中文**：

1. 填完本页 → 点 **Add language 添加语言** → 选 **中文（简体）zh-CN**
2. Description 粘贴下面这段中文（445 字符）
3. Logo 与 4 张截图**重新上传一次**（素材按语言独立，不会自动继承）
4. 搜索关键词也建议给中文版一套

### 中文 Description（zh-CN 用）

```text
蜗牛壳AI助理是一款注重隐私使用自定义模型的浏览器侧边栏 AI 工具。

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

### 中文搜索词（7 个，避开名称已有字样）

| 顺序 | 搜索词 |
|---|---|
| 1 | 网页总结 |
| 2 | 侧边栏AI助手 |
| 3 | 页面智能问答 |
| 4 | 右键划词提问 |
| 5 | 自定义API模型 |
| 6 | DeepSeek Qwen Ollama |
| 7 | 摘要提取工具 |

---

## 填完后的自检

- [ ] Description 已填（英文 990 字符，没有超限提示）
- [ ] Extension logo 已上传 300×300
- [ ] Screenshots 至少 1 张（建议 4 张全传，第 1 张是总结场景）
- [ ] Search terms 加了 7 个，且没有超出 21 单词
- [ ] YouTube video URL 留空（没有视频就别填）
- [ ] **点右上角 Save draft 保存草稿**（不点会丢）
- [ ] 已添加中文（zh-CN）语言并重复填一遍
- [ ] 左侧导航 Store listings 出现 ✓ → 进入 Analytics 分析页 → 再往右是 Reviews 评价
- [ ] 最后一步：**Notes for certification 认证说明**（在提交前的最后一步，指南第 4 节有可复制的英文测试步骤）

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
