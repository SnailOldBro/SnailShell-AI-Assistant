# Edge 商店 · Notes for certification 认证说明（复制粘贴用）

**限制：少于 2000 字符**（下方正文 1,9xx 字符，已校验）
**必须先在上方第一个问题选「Yes」**

---

## 页面第一个问题怎么选

选 **Yes, I need to provide credentials, accounts, or other info for testers**

理由：本扩展没有可用模型就完全无法工作。审核员无法自行注册平台账号（需实名+手机号），
若选 No，审核员点「总结本页」会毫无反应，极可能被判「功能不工作」而拒。

## 测试用的服务配置

| 项 | 值 |
|---|---|
| 服务商下拉框 | 选**最后一项**「Enter custom values / 不选，手动填写」（**不要选预设**） |
| Base URL | `https://apihub.agnes-ai.com/v1` |
| 模型名 | `agnes-3.0-flash` |
| API Key | 见下 |

已实测：非流式与 SSE 流式均返回标准 OpenAI 格式，扩展可直接使用。

---

## 认证说明正文（复制下面全部内容）

```text
HOW TO TEST

A model must be configured before this extension can answer anything. The steps below use a working test endpoint; any OpenAI-compatible endpoint works the same way.

1) SETUP
Open the side panel from the toolbar. With no model configured it shows a "Go to settings" prompt. Open Settings (chrome://extensions > Details > Extension options) > "+ Add model" > in the provider dropdown choose the last option "Enter custom values" (do NOT pick a preset) > fill in:
Base URL: https://apihub.agnes-ai.com/v1
Model name: agnes-3.0-flash
API key: <在此粘贴你的测试 Key>
Then click "Fetch models" (it should list agnes-3.0-flash), then "Test connection" (should report success), then "Save model".

2) SUMMARIZE A PAGE
Open any article page > in the side panel click "Summarize this page" > the page is summarized with streaming output; Send turns into Stop and can interrupt it.

3) ASK A FOLLOW-UP
After the summary, type a follow-up such as "expand the second point" > the model answers using the page as context.

4) RIGHT-CLICK A SELECTION
Select a sentence on the page > right-click > "Ask AI about this" > the side panel opens with a quote block > type a question > get an answer.

DATA FLOW
Page text is read from the page DOM only after an explicit user action and is sent only to the AI endpoint the user configured. Nothing is sent to the developer or any third party. API keys and chat history stay in chrome.storage.local. The extension contains no eval, no remote script, no remote import, and never executes any code returned by the AI service.

PERMISSIONS
sidePanel = UI. contextMenus = right-click entries. storage = local settings, keys, history. activeTab = read the current tab only on user action. scripting = inject the bundled extractor to read rendered text. clipboardWrite = copy an answer. host_permissions <all_urls> = read the text of the page the user is on.
```
