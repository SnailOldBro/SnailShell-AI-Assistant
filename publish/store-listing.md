# 蜗牛壳AI助理 · 商店上架文案（中英文）
> 用途：直接复制粘贴进 Chrome Web Store / Edge Add-ons 仪表板的对应字段。
> 日期：2026-09-30 ｜ 适用版本：manifest v3 / v1.0.0

---

## 一、显示名称 Display name
- 中文：蜗牛壳AI助理
- English：SnailShell AI Assistant

---

## 二、摘要 Summary（≤132 字符，显示在搜索结果）
**中文：**
自定义模型，用自己的 Key 直连，数据不经任何中转，免费更安全。

**English:**
Summarize any page, ask with page context, and quote selections to chat with AI. Bring your own model & API key — no middle server.

---

## 三、详细描述 Detailed description
**中文：**
蜗牛壳AI助理是一款注重隐私使用自定义模型的浏览器侧边栏 AI 工具。

核心功能点：自定义 OpenAI 兼容模型（DeepSeek / Qwen / GLM / Kimi / Ollama / 任意 endpoint），用你自己的 API Key 直连你选的服务，数据不经过任何第三方中转服务器——免费、更安全。

功能：
- 总结网页：一键提取网页正文并生成要点总结，流式输出，可随时停止。
- 页面提问：带页面上下文追问，模型基于当前页内容回答。
- 右键引用提问：选中文字 → 右键「AI 就这段内容提问」→ 侧边栏带引用块提问；或右键「AI 总结选中内容」直接总结选段。
- 多模型管理：可添加多个模型配置，随时切换；支持厂商预设、自动拉取模型名、连接测试。
- 本地历史与安全：对话存本机扩展存储；API Key 提供明文与主密码（PBKDF2 + AES-GCM）两档保护。

我们不做的事：不翻页批量抓取、不绕过付费墙、不读取 Cookie、不碰账号凭据、不采集浏览历史。

**English:**
SnailShell AI Assistant is a privacy-first browser side-panel AI tool.

Key advantage: bring your own OpenAI-compatible model (DeepSeek / Qwen / GLM / Kimi / Ollama / any endpoint) and connect directly with your own API key — your data never passes through any third-party relay server. Free and more secure.

Features:
- Summarize page: one-click extract and summarize the page with streaming output you can stop anytime.
- Ask about page: follow-up questions with full page context.
- Quote to ask: select text → right-click "Ask AI about this" → side panel opens with a quote block; or "Summarize selection" for instant summaries.
- Multi-model manager: add, switch, and test multiple models with preset providers and auto model listing.
- Local & secure: chat history stays on your device; API keys protected by plaintext or master-password (PBKDF2 + AES-GCM) modes.

What we don't do: no bulk crawling, no paywall bypass, no cookie or credential access, no browsing-history collection.

---

## 四、单用途声明 Single purpose
**中文：** 本扩展的单一用途是"AI 辅助网页阅读"——围绕当前页面的总结、提问与引用，不含任何其他无关功能。

**English:** The single purpose of this extension is "AI-assisted web reading" — summarizing, questioning, and quoting the current page only, with no unrelated functionality.

---

## 五、权限说明 Permissions justification
| 权限 Permission | 用途（中文） | Purpose (English) |
|---|---|---|
| `sidePanel` | 提供侧边栏交互界面（总结/提问/引用） | Provides the side-panel UI (summarize / ask / quote) |
| `contextMenus` | 提供右键菜单「AI 就这段内容提问」「AI 总结选中内容」 | Right-click menus for quoting/summarizing selections |
| `storage` | 在本机保存用户的模型配置与对话历史 | Stores model config and chat history locally |
| `activeTab` | 仅用户主动点击图标或右键时访问当前标签页 | Accesses the current tab only on explicit user action |
| `scripting` | 向页面注入本地正文提取脚本，用于总结与引用 | Injects the local extraction script for summarize/quote |
| `clipboardWrite` | 将 AI 回答复制到剪贴板 | Copies AI answers to the clipboard |
| `host_permissions <all_urls>` | 需对任意网页读取已渲染正文做总结；仅用户主动触发、仅读已渲染内容、不外传 | Read rendered page text on any site for summarization; user-triggered, read-only, no transmission |

---

## 六、数据使用披露 Data use disclosure
**中文：** 本扩展不向开发者传输任何用户数据。页面内容仅在用户主动触发时，按用户配置直连用户自填的 AI 服务（用户自己的 API Key），不经过任何第三方中转。API Key 与对话历史仅存于本机浏览器扩展存储。详见隐私政策。

**English:** This extension transmits no user data to the developer. Page content is sent only when the user actively triggers a feature, directly to the user-configured AI service using the user's own API key, with no third-party relay. API keys and chat history are stored locally only. See the privacy policy.

---

## 七、分类 / 语言 / 其他字段
- 分类 Category：**Productivity（生产力）**
- 语言 Language：**zh-CN（简体中文）**，建议补充 **en**
- 隐私政策 URL Privacy policy URL：托管 `privacy-policy.html` 后的公开链接（见下方说明）
- 商家/非商家 Trader status（Chrome）：个人免费工具选 **Non-trader（非商家）**
- 可见性 Visibility：首次建议 **Unlisted（仅链接可装）** 软启动，验证无误后改 Public

---

## 八、截图内容建议（需自行补 1–5 张 1280×800 或 640×400）
1. 侧边栏「总结本页」流式输出要点
2. 选中网页文字 → 右键「AI 就这段内容提问」→ 侧边栏带引用块
3. 设置页：多模型列表 + 「测试连接」显示「连接成功」
4. 设置页：主密码保护开关与「已加密」状态

---

## 九、隐私政策托管建议
`privacy-policy.html` 是一个独立双语页面，可免费托管到：
- **GitHub Pages**（仓库 Settings → Pages，指向 main 分支根目录）
- **Vercel / Netlify / Cloudflare Pages**（拖拽部署，秒级拿到 https 链接）
- 任何静态托管；拿到公开 URL 后填进两个商店的「隐私政策 URL」字段。
