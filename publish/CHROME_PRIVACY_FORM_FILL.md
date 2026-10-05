# Chrome 应用商店 · Privacy practices 隐私实践页 填写包

> 对应 Chrome 开发者后台的 **Privacy practices** 步骤。
> 与 Edge 版本的差异：**Chrome 没有「远程代码」这一项**，其余基本相同。
> 全部文案为英文（审核看英文更稳），可直接复制粘贴。

---

## 字段清单速览

| # | 界面字段 | 怎么填 |
|---|---|---|
| 1 | Privacy policy URL * 隐私政策网址 | 粘贴 **J** |
| 2 | Single purpose description * 单一用途描述 | 粘贴 **A** |
| 3–9 | 权限合理化（7 条，每条一个输入框） | 粘贴 **B** ~ **H** |
| 10 | Data usage 数据使用 · 是否收集用户数据 | **不勾选任何数据类型** |
| 11 | 我不会出售/传输数据给第三方 | **勾选** |
| 12 | 我不会将数据用于与单一用途无关的目的 | **勾选** |

---

## J. Privacy policy URL *（隐私政策网址）

```
https://snailoldbro.github.io/SnailShell-AI-Assistant/privacy-policy.html
```

> Chrome 会**抽查这个链接能否公开访问**，提交前新开标签打开确认一次。

---

## A. Single purpose description *（单一用途描述）

```
本扩展的唯一用途是「AI 辅助网页阅读」：读取用户当前正在查看的页面正文，用于（1）生成该页面的要点总结；（2）让用户结合该页面内容继续提问；（3）让用户引用页面中选中的段落并就该段落提问。除此之外不包含任何其他功能：不收集浏览历史、不含广告与推广链接、不做后台统计分析，任何数据都不会发送给开发者。所有 AI 请求均由用户浏览器直连用户自己配置的 AI 服务，使用用户自己的 API Key，不经过任何中转服务器。
```

---

## B. sidePanel justification *（侧边栏说明）

```
sidePanel 权限用于提供本扩展的用户界面。全部对话界面——总结输出、流式回答、提问输入框、引用内容条——都渲染在用户从工具栏打开的浏览器侧边栏内。若没有 sidePanel 扩展就无处显示结果、也无法接收用户输入，功能将无法实现。
```

---

## C. contextMenus justification *（上下文菜单的合理性）

```
contextMenus 权限用于添加本扩展所依赖的两个右键菜单项：「AI 就这段内容提问」与「AI 总结选中内容」。这两个菜单项出现在网页文本选区的右键菜单中，也是用户针对某一段落内容提问的唯一入口。此外扩展仅在工具栏添加一个用于打开侧边栏的入口项，不会在浏览器内部页面添加任何菜单。
```

---

## D. storage justification *（存储的合理性）

```
storage 权限用于把用户自己的配置保存在用户本机，全部通过 chrome.storage.local 实现，包括：（1）用户添加的自定义模型列表（显示名称、服务商预设、Base URL、模型名称与用户的 API Key）；（2）可选的主密码保护状态；（3）本地对话历史。上述数据不会写入任何远程服务，始终留在用户的浏览器配置目录内，用户可在设置页删除或卸载扩展时一并清除。
```

---

## E. activeTab justification *（活动标签页的合理性）

```
activeTab 权限用于让扩展在用户明确触发的那一刻读取用户当前所在的标签页内容，即：用户点击工具栏图标、点击右键菜单项，或执行总结命令时。该权限是一次性访问当前可见页面的最小范围授权：只作用于该标签页、只在用户做出手势之后生效、且仅在该次操作期间有效，不会用于追踪用户的浏览轨迹。
```

---

## F. scripting justification *（脚本权限说明）

```
scripting 权限用于把扩展自带的正文提取函数注入当前页面，以读取页面中已经渲染出来的正文内容（可见段落，并忽略导航、广告与推荐模块）。该脚本是随扩展包一同分发的静态文件（src/shared/extractor.js），运行期间不会下载、生成或修改任何代码。它只读取页面 DOM 并把文本返回给扩展，不会修改页面。
```

---

## G. clipboardWrite justification *（剪贴板写入权限说明）

```
clipboardWrite 权限仅用于一项由用户主动触发的操作：把 AI 回答复制到剪贴板。扩展在每条回答下方提供「复制」按钮，用户点击后才会把该条回答的文本写入剪贴板。扩展从不读取剪贴板内容，也不会自行或在后台写入剪贴板。
```

---

## H. Host permission justification *（主机权限说明 · 最重要的一格）

```
host_permissions <all_urls> 是必需的，因为「总结一个页面」必然要读取用户当前所在页面的正文，而该页面可能位于任意站点——文章站、博客、新闻页或文档站，无法预先穷举出一份固定的域名清单。该权限的使用受到严格的三点限制：（1）只在用户明确操作后触发（点击工具栏图标、右键菜单命令或总结命令）；（2）只读取页面 DOM 中已经渲染出来的文本，不读取 Cookie、登录凭据、表单填写内容与浏览历史；（3）提取出的文本只会发送给用户在设置页中自行配置的 AI 接口，并使用用户自己的 API Key。不会有任何数据发送给开发者或第三方，扩展也不存在任何后台或定时行为。
```

---

## Data usage 数据使用

**不勾选任何数据类型。** 本扩展不收集、不传输用户数据。

Chrome 会列出这些类别，全部不要勾：

- Browsing history（浏览历史）
- Bookmarks（书签）
- User activity（用户活动）
- Website content（网站内容）
- Personally identifiable information（个人身份信息）
- Financial and payment information（财务与支付信息）
- Health information（健康信息）
- Authentication information（认证信息）
- Personal communications（个人通信）
- Location（位置）
- Other（其他）

> **可能有疑问**：扩展明明会读取当前页面正文，为什么不勾 Website content？
> 因为**「读取并本地处理」不等于「收集」**——读取到的文本只发往用户自己配置的 AI 接口，不存储、不上传、不交给开发者或第三方。
> 而且 2026-08-01 起的新政策明确：**只收集与功能直接必需的信息**，不勾才是正确的。

---

## 两条合规声明

**都勾上：**

- ☑ I don't sell or transfer user data to third parties, except as necessary for the single purpose
- ☑ I don't use or transfer user data for purposes that are unrelated to the single purpose

如果后台还有 **creditworthiness / lending**（信用评估 / 放贷）相关声明，**不要勾**（我们不做这类用途）。

---

## 填完自检

- [ ] 隐私政策 URL 已填，且新开标签能打开
- [ ] 7 条权限说明全部填了
- [ ] Data usage 一项都没勾
- [ ] 合规声明已勾选
- [ ] 点 **Next / Save** 进入 Distribution 分发步骤
