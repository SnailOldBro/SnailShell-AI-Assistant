# Edge 商店 · Privacy 隐私页 逐字段填写包（中文版）

> 对应后台左侧导航 **Privacy 隐私** 这一页。全部文案为中文，可直接复制粘贴。
> 权限名、API 名、代码标识保留英文原样（如 `sidePanel`、`chrome.storage.local`、`eval()`），便于审核与 manifest 逐字对照。
> 每个文本框上限 **1000 字符**，隐私政策 URL 上限 2048——下方文案均已校验在限额内。

---

## 字段清单速览（共 10 个文本框 + 2 组勾选）

| # | 界面字段 | 怎么填 |
|---|---|---|
| 1 | Single purpose description * 单一用途描述 | 粘贴 **A** |
| 2 | sidePanel justification * 侧边栏说明 | 粘贴 **B** |
| 3 | contextMenus justification * 上下文菜单的合理性 | 粘贴 **C** |
| 4 | storage justification * 存储的合理性 | 粘贴 **D** |
| 5 | activeTab justification * 活动标签页的合理性 | 粘贴 **E** |
| 6 | scripting justification * 脚本权限说明 | 粘贴 **F** |
| 7 | clipboardWrite justification * 剪贴板写入权限说明 | 粘贴 **G** |
| 8 | Host permission justification * 主机权限说明 | 粘贴 **H**（最重要的一格） |
| 9 | Are you using remote code? * 是否使用远程代码 | 选 **No, I do not use remote code**（默认已选） |
| 10 | Justification 说明 | 粘贴 **I**（主动澄清 fetch 不是远程代码） |
| 11 | What user data do you plan to collect… | **9 个复选框全部不勾** |
| 12 | Privacy policy URL * 隐私政策网址 | 粘贴 **J** |
| 13 | I certify that the following disclosures are true: * | **3 个复选框全部勾上** |

---

## A. Single purpose description *（单一用途描述）

```text
本扩展的唯一用途是「AI 辅助网页阅读」：读取用户当前正在查看的页面正文，用于（1）生成该页面的要点总结；（2）让用户结合该页面内容继续提问；（3）让用户引用页面中选中的段落并就该段落提问。除此之外不包含任何其他功能：不收集浏览历史、不含广告与推广链接、不做后台统计分析，任何数据都不会发送给开发者。所有 AI 请求均由用户浏览器直连用户自己配置的 AI 服务，使用用户自己的 API Key，不经过任何中转服务器。
```

---

## B. sidePanel justification *（侧边栏说明）

```text
sidePanel 权限用于提供本扩展的用户界面。全部对话界面——总结输出、流式回答、提问输入框、引用内容条——都渲染在用户从工具栏打开的浏览器侧边栏内。若没有 sidePanel 扩展就无处显示结果、也无法接收用户输入，功能将无法实现。
```

---

## C. contextMenus justification *（上下文菜单的合理性）

```text
contextMenus 权限用于添加本扩展所依赖的两个右键菜单项：「AI 就这段内容提问」与「AI 总结选中内容」。这两个菜单项出现在网页文本选区的右键菜单中，也是用户针对某一段落内容提问的唯一入口。此外扩展仅在工具栏添加一个用于打开侧边栏的入口项，不会在浏览器内部页面添加任何菜单。
```

---

## D. storage justification *（存储的合理性）

```text
storage 权限用于把用户自己的配置保存在用户本机，全部通过 chrome.storage.local 实现，包括：（1）用户添加的自定义模型列表（显示名称、服务商预设、Base URL、模型名称与用户的 API Key）；（2）可选的主密码保护状态；（3）本地对话历史。上述数据不会写入任何远程服务，始终留在用户的浏览器配置目录内，用户可在设置页删除或卸载扩展时一并清除。
```

---

## E. activeTab justification *（活动标签页的合理性）

```text
activeTab 权限用于让扩展在用户明确触发的那一刻读取用户当前所在的标签页内容，即：用户点击工具栏图标、点击右键菜单项，或执行总结命令时。该权限是一次性访问当前可见页面的最小范围授权：只作用于该标签页、只在用户做出手势之后生效、且仅在该次操作期间有效，不会用于追踪用户的浏览轨迹。
```

---

## F. scripting justification *（脚本权限说明）

```text
scripting 权限用于把扩展自带的正文提取函数注入当前页面，以读取页面中已经渲染出来的正文内容（可见段落，并忽略导航、广告与推荐模块）。该脚本是随扩展包一同分发的静态文件（src/shared/extractor.js），运行期间不会下载、生成或修改任何代码。它只读取页面 DOM 并把文本返回给扩展，不会修改页面。
```

---

## G. clipboardWrite justification *（剪贴板写入权限说明）

```text
clipboardWrite 权限仅用于一项由用户主动触发的操作：把 AI 回答复制到剪贴板。扩展在每条回答下方提供「复制」按钮，用户点击后才会把该条回答的文本写入剪贴板。扩展从不读取剪贴板内容，也不会自行或在后台写入剪贴板。
```

---

## H. Host permission justification *（主机权限说明 · 最重要的一格）

```text
host_permissions <all_urls> 是必需的，因为「总结一个页面」必然要读取用户当前所在页面的正文，而该页面可能位于任意站点——文章站、博客、新闻页或文档站，无法预先穷举出一份固定的域名清单。该权限的使用受到严格的三点限制：（1）只在用户明确操作后触发（点击工具栏图标、右键菜单命令或总结命令）；（2）只读取页面 DOM 中已经渲染出来的文本，不读取 Cookie、登录凭据、表单填写内容与浏览历史；（3）提取出的文本只会发送给用户在设置页中自行配置的 AI 接口，并使用用户自己的 API Key。不会有任何数据发送给开发者或第三方，扩展也不存在任何后台或定时行为。
```

---

## I. Are you using remote code? → 选 No 之后的 Justification 说明

> 这一格是**主动澄清**，目的是避免审核把 `fetch` 误判为远程代码。**强烈建议填写，不要留空。**

```text
确认：本扩展不包含任何远程代码。不存在 eval()、new Function()、外部 <script src>、从远程源发起的动态 import()，也不会在运行时下载 Wasm；全部可执行代码均随扩展包静态分发。扩展确实会发起网络请求，但仅使用 fetch() 请求用户在设置页中自行配置的 AI 服务接口，用于读取 JSON 或 SSE 响应文本。这些响应只被当作文本渲染，从不经过 eval、不被执行、也不会作为代码导入。若用户未配置任何模型，扩展不会发出任何对外请求。
```

---

## J. Privacy policy URL *（隐私政策网址，0/2048）

```text
https://snailoldbro.github.io/SnailShell-AI-Assistant/privacy-policy.html
```

---

## K. What user data do you plan to collect…（9 个复选框）

**一个都不要勾。** 本扩展不收集、不传输用户数据。

- ☐ Personally identifiable information 个人可识别信息
- ☐ Health information 健康信息
- ☐ Financial and payment information 财务和支付信息
- ☐ Authentication information 认证信息
- ☐ Personal communications 个人通信
- ☐ Location 位置信息
- ☐ Web history 网页浏览历史
- ☐ User activity 用户活动
- ☐ Website content 网站内容

> 页面里那行红字提示的是：勾选的项目会**公开显示在商店详情页**。我们不收集，所以全空。
> 可能有疑问：扩展明明会读取当前页面正文，为什么不勾 Website content？
> 因为**「读取并本地处理」不等于「收集」**——读取到的文本只发往用户自己配置的 AI 接口，不存储、不上传、不交给开发者或第三方。这属于用户主动触发后的本地处理，不构成数据收集。

---

## L. I certify that the following disclosures are true *（3 个复选框）

**三个全部勾上：**

- ☑ I do not sell or transfer user data to third parties, outside of the approved use cases
  （我不会向第三方出售或传输用户数据，仅用于已获批准的使用场景）
- ☑ I do not use or transfer user data for purposes that are unrelated to my item's single purpose
  （我不会将用户数据用于与本产品单一用途无关的目的）
- ☑ I do not use or transfer user data to determine creditworthiness or for lending purposes
  （我不会将用户数据用于确定信用worthiness 或放贷目的）

> 这三条是微软对所有开发者的统一合规声明，勾选即可，无需额外材料。

---

## 填完后的自检

- [ ] 8 个权限／用途文本框都填了内容
- [ ] 远程代码选的是 **No, I do not use remote code**，且下方 Justification 也填了澄清（**最容易被跳过、也最容易被误判的一格**）
- [ ] 数据收集 9 项**全部未勾**
- [ ] 隐私政策 URL 已填，且**新开浏览器标签能正常打开**（Edge 会抽查这个链接）
- [ ] 3 个 certify **全部勾上**
- [ ] 点 **Save & Continue 保存并继续** → 左侧导航 Privacy 出现 ✓，即进入 Store listings 商店列表

---

## 附：英文版文案（备用）

如果想双语提交、或审核方偏好英文，可把下面对应文案追加在中文之后（注意总长度不要超过 1000 字符，因此更稳妥的做法是**用中文版提交**；本附录仅供你对照参考）。

```text
A. The single purpose of this extension is AI-assisted web reading. It reads the text of the page the user is currently viewing in order to (1) summarize it, (2) let the user ask questions with that page as context, and (3) let the user quote a selected passage and ask about it. It contains no other features: no browsing-history collection, no advertising, no affiliate links, no background analytics, and no data is sent to the developer. All AI requests go directly from the user's browser to the AI service that the user configured themselves, using the user's own API key, with no intermediary server.
```

```text
B. sidePanel is required to provide the user interface of this extension. All conversation UI — the summary output, the streaming answer, the question input box and the quoted-passage bar — is rendered inside the browser side panel that the user opens from the toolbar. Without sidePanel there is nowhere to display results or accept input, so the extension could not function.
```

```text
C. contextMenus is required to add the two right-click entries the product depends on: "Ask AI about this selection" and "Summarize this selection". These entries appear in the context menu of a text selection on a web page, and they are the only way for the user to ask a question about a specific passage. The extension also adds one toolbar entry that opens the side panel. No context menu is added to browser-internal pages.
```

```text
D. storage is required to persist the user's own configuration on their own machine, entirely locally via chrome.storage.local: (a) the custom model list (display name, provider preset, base URL, model name and the user's API key), (b) the optional master-password protection state, and (c) the local conversation history. Nothing is written to any remote service. The data never leaves the user's browser profile, and it is removed when the user deletes it in the settings page or uninstalls the extension.
```

```text
E. activeTab is required so the extension can read the content of the tab the user is acting on, at the moment the user explicitly triggers it — that is, when the user clicks the toolbar icon, clicks a right-click entry, or runs the summarize command. This is the minimum-scope permission for one-off access to the visible page: it grants access only to that tab, only after a user gesture, and only for the duration of that action. It is not used to track the user's navigation.
```

```text
F. scripting is required to inject the extension's own bundled content-extraction function into the current page in order to read the already-rendered article text (the visible paragraphs, while ignoring navigation, advertising and recommendation blocks). The script is a static file shipped inside the extension package (src/shared/extractor.js); no code is downloaded, generated or modified at runtime. It only reads the DOM and returns text to the extension; it does not modify the page.
```

```text
G. clipboardWrite is required for a single user-initiated action: copying an AI answer to the clipboard. The extension shows a "Copy" action under each answer, and clicking it writes that answer's text to the clipboard. The extension never reads from the clipboard, and never writes to it on its own or in the background.
```

```text
H. host_permissions <all_urls> is required because summarizing a page necessarily means reading the text of whichever page the user is on, and that page may be on any site — an article, a blog, a news page or documentation. There is no fixed set of domains that could be declared in advance. The access is strictly limited in three ways: (1) it happens only after an explicit user action (toolbar click, right-click command, or the summarize command); (2) it reads only the text already rendered in the page DOM — never cookies, credentials, form values or browsing history; (3) the extracted text is sent only to the AI endpoint that the user themselves configured in the settings page, using the user's own API key. Nothing is transmitted to the developer or to any third party, and the extension performs no background or scheduled activity.
```

```text
I. Confirmed: this extension contains no remote code. There is no eval(), no new Function(), no external <script src>, no dynamic import() from a remote origin, and no runtime-downloaded Wasm — all executable code is shipped statically inside the extension package. The extension does make network requests, but only with fetch() to the AI service endpoint that the user configured themselves in the settings page, in order to read the JSON or SSE response text. Those responses are rendered as text only; they are never evaluated, executed or imported as code. If the user has not configured a model, the extension makes no outbound request at all.
```
