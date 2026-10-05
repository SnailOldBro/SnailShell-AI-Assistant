# Edge 商店 · Privacy 隐私页 逐字段填写包

> 对应后台左侧导航 **Privacy 隐私** 这一页。所有文案均为英文（审核看英文更稳），每格均已在 1000 字符上限内。
> 页面顶部蓝色说明与 **Save & Continue** 按钮之间的部分，就是下面这些字段。

---

## 字段清单速览（共 13 个必填 + 12 个勾选）

| # | 字段 | 怎么填 |
|---|---|---|
| 1 | Single purpose description * | 粘贴下方 A |
| 2 | sidePanel justification * | 粘贴 B |
| 3 | contextMenus justification * | 粘贴 C |
| 4 | storage justification * | 粘贴 D |
| 5 | activeTab justification * | 粘贴 E |
| 6 | scripting justification * | 粘贴 F |
| 7 | clipboardWrite justification * | 粘贴 G |
| 8 | Host permission justification * | 粘贴 H |
| 9 | Are you using remote code? * | 选 **No, I do not use remote code**（默认已选） |
| 10 | Justification 说明 | 粘贴 I（澄清 fetch 不是远程代码） |
| 11 | What user data do you plan to collect… | **9 个复选框全部不勾** |
| 12 | Privacy policy URL * | 粘贴 J |
| 13 | I certify that the following disclosures are true: * | **3 个复选框全部勾上** |

---

## A. Single purpose description *（单一用途描述）

```text
The single purpose of this extension is AI-assisted web reading. It reads the text of the page the user is currently viewing in order to (1) summarize it, (2) let the user ask questions with that page as context, and (3) let the user quote a selected passage and ask about it. It contains no other features: no browsing-history collection, no advertising, no affiliate links, no background analytics, and no data is sent to the developer. All AI requests go directly from the user's browser to the AI service that the user configured themselves, using the user's own API key, with no intermediary server.
```

---

## B. sidePanel justification *（侧边栏说明）

```text
sidePanel is required to provide the user interface of this extension. All conversation UI — the summary output, the streaming answer, the question input box and the quoted-passage bar — is rendered inside the browser side panel that the user opens from the toolbar. Without sidePanel there is nowhere to display results or accept input, so the extension could not function.
```

---

## C. contextMenus justification *（上下文菜单的合理性）

```text
contextMenus is required to add the two right-click entries the product depends on: "Ask AI about this selection" and "Summarize this selection". These entries appear in the context menu of a text selection on a web page, and they are the only way for the user to ask a question about a specific passage. The extension also adds one toolbar entry that opens the side panel. No context menu is added to browser-internal pages.
```

---

## D. storage justification *（存储的合理性）

```text
storage is required to persist the user's own configuration on their own machine, entirely locally via chrome.storage.local: (a) the custom model list (display name, provider preset, base URL, model name and the user's API key), (b) the optional master-password protection state, and (c) the local conversation history. Nothing is written to any remote service. The data never leaves the user's browser profile, and it is removed when the user deletes it in the settings page or uninstalls the extension.
```

---

## E. activeTab justification *（活动标签页的合理性）

```text
activeTab is required so the extension can read the content of the tab the user is acting on, at the moment the user explicitly triggers it — that is, when the user clicks the toolbar icon, clicks a right-click entry, or runs the summarize command. This is the minimum-scope permission for one-off access to the visible page: it grants access only to that tab, only after a user gesture, and only for the duration of that action. It is not used to track the user's navigation.
```

---

## F. scripting justification *（脚本权限说明）

```text
scripting is required to inject the extension's own bundled content-extraction function into the current page in order to read the already-rendered article text (the visible paragraphs, while ignoring navigation, advertising and recommendation blocks). The script is a static file shipped inside the extension package (src/shared/extractor.js); no code is downloaded, generated or modified at runtime. It only reads the DOM and returns text to the extension; it does not modify the page.
```

---

## G. clipboardWrite justification *（剪贴板写入权限说明）

```text
clipboardWrite is required for a single user-initiated action: copying an AI answer to the clipboard. The extension shows a "Copy" action under each answer, and clicking it writes that answer's text to the clipboard. The extension never reads from the clipboard, and never writes to it on its own or in the background.
```

---

## H. Host permission justification *（主机权限说明 · 最重要的一格）

```text
host_permissions <all_urls> is required because summarizing a page necessarily means reading the text of whichever page the user is on, and that page may be on any site — an article, a blog, a news page or documentation. There is no fixed set of domains that could be declared in advance. The access is strictly limited in three ways: (1) it happens only after an explicit user action (toolbar click, right-click command, or the summarize command); (2) it reads only the text already rendered in the page DOM — never cookies, credentials, form values or browsing history; (3) the extracted text is sent only to the AI endpoint that the user themselves configured in the settings page, using the user's own API key. Nothing is transmitted to the developer or to any third party, and the extension performs no background or scheduled activity.
```

---

## I. Are you using remote code? → 选 No 后的 Justification 说明

> 这一格是**主动澄清**，防止审核把 `fetch` 误判成远程代码。强烈建议填。

```text
Confirmed: this extension contains no remote code. There is no eval(), no new Function(), no external <script src>, no dynamic import() from a remote origin, and no runtime-downloaded Wasm — all executable code is shipped statically inside the extension package. The extension does make network requests, but only with fetch() to the AI service endpoint that the user configured themselves in the settings page, in order to read the JSON or SSE response text. Those responses are rendered as text only; they are never evaluated, executed or imported as code. If the user has not configured a model, the extension makes no outbound request at all.
```

---

## J. Privacy policy URL *（隐私政策网址，0/2048）

```text
https://snailoldbro.github.io/SnailShell-AI-Assistant/privacy-policy.html
```

---

## K. What user data do you plan to collect…（9 个复选框）

**一个都不要勾。** 本扩展不收集、不传输用户数据。

- ☐ Personally identifiable information
- ☐ Health information
- ☐ Financial and payment information
- ☐ Authentication information
- ☐ Personal communications
- ☐ Location
- ☐ Web history
- ☐ User activity
- ☐ Website content

> 页面里那行红字提示的是「勾选的项目会公开显示在商店详情页」。我们不收集，所以全空。
> 注意：这与扩展会**读取当前页面正文**不矛盾——读取属于用户主动触发后的本地处理，不是「收集」。

---

## L. I certify that the following disclosures are true *（3 个复选框）

**三个全部勾上：**

- ☑ I do not sell or transfer user data to third parties, outside of the approved use cases
- ☑ I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- ☑ I do not use or transfer user data to determine creditworthiness or for lending purposes

---

## 填完后的自检

- [ ] 8 个文本框都有内容，且没有把中英文混着写（每格保持纯英文）
- [ ] 远程代码选了 **No**，且下面的 Justification 也填了澄清
- [ ] 数据收集 9 项全未勾
- [ ] 隐私政策 URL 已填，且**新开浏览器标签能打开**（Edge 会抽查这个链接）
- [ ] 3 个 certify 全部勾上
- [ ] 点 **Save & Continue** → 左侧导航的 Privacy 出现 ✓，然后进入 Store listings
