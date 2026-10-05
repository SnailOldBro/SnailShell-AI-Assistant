# Edge 商店 · Notes for certification 认证说明（复制粘贴用）

**限制：少于 2000 字符**（下方文案 1,9xx 字符，已校验）
**必须先在上方第一个问题选「Yes」**，再把这份贴进 Notes 框。

---

## 页面第一个问题怎么选

选 **Yes, I need to provide credentials, accounts, or other info for testers**

理由：本扩展没有可用模型就完全无法工作。审核员无法自行注册 DeepSeek（需实名+手机号），
若选 No，审核员点「总结本页」会毫无反应，极可能被判「功能不工作」而拒。

## 测试 Key 怎么准备

1. 单独注册一个测试账号（不要用你的主力账号）
2. 只用于审核，额度设最小
3. 审核通过后**立即删除或重置 Key**

---

## 认证说明正文（复制下面全部内容）

```text
HOW TO TEST

A model must be configured by the user before this extension can answer anything.

1) SETUP
Open the side panel from the toolbar. With no model configured it shows a "Go to settings" prompt. Open Settings (chrome://extensions > Details > Extension options) > "+ Add model" > pick provider "DeepSeek" > paste the test API key below into the API key box > "Fetch models" > choose deepseek-chat > "Test connection" (should report success) > "Save model". Any OpenAI-compatible endpoint works; Ollama at http://localhost:11434 works if installed.

2) SUMMARIZE A PAGE
Open any article page > in the side panel click "Summarize this page" > the page is summarized with streaming output; Send turns into Stop and can interrupt it.

3) ASK A FOLLOW-UP
After the summary, type a follow-up such as "expand the second point" > the model answers using the page as context.

4) RIGHT-CLICK A SELECTION
Select a sentence on the page > right-click > "Ask AI about this" > the side panel opens with a quote block > type a question > get an answer. Right-click > "Summarize selection" summarizes the selection directly.

5) LOCAL HISTORY
Settings > history lists past conversations and restores them.

TEST CREDENTIALS
Provider: DeepSeek
API key: <在此粘贴你的测试 Key>

DATA FLOW
Page text is read from the page DOM only after an explicit user action, and is sent only to the AI endpoint the user configured. Nothing is sent to the developer or any third party. Chat history and API keys stay in chrome.storage.local. The extension contains no eval, no remote script, no remote import, and never executes any code returned by the AI service.

PERMISSIONS
sidePanel = UI. contextMenus = right-click entries. storage = local settings, keys, history. activeTab = read the current tab only on user action. scripting = inject the bundled extractor to read rendered text. clipboardWrite = copy an answer. host_permissions <all_urls> = read the text of the page the user is on, only on explicit user action.
```

---

## 粘贴前记得替换一处

把正文里的这一行换成你的真实测试 Key：

```
API key: <在此粘贴你的测试 Key>
```

替换后总字符数会略变，仍在 2000 以内。
