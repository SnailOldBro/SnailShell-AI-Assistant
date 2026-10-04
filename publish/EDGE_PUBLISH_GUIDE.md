# Edge Add-ons 上架完整指南（蜗牛壳AI助理 v1.2.3）

> 适用于：Microsoft Edge Add-ons（edge.microsoft.com/Add-ons）
> 对应官方流程：Partner Center 8 步提交法
> 本扩展为 Manifest V3 Chromium 扩展，与 Chrome 同一套包，**几乎零代码改动**即可提交

---

## 0. 先说结论：你的优势与唯一风险

**优势（已核实，均符合要求）**
- `manifest_version: 3` ✅（Edge 同样拒绝 MV2）
- 代码内**无 `eval`、无外链 `<script src>`、无从远程 import** ✅（Edge Step 6 会问"远程代码"，你属于"否"，但要会表达）
- 单一用途明确：AI 辅助网页阅读 ✅
- 不收集用户数据、不传开发者服务器 ✅
- 图标 16/48/128 齐备 ✅，隐私政策页已备 ✅，商店文案已备 ✅

**唯一风险**
- `host_permissions: ["<all_urls>"]` + `scripting` 属于敏感组合，Edge 会要求**逐条权限合理化**（Step 6 "Justify any permissions"）。说明写清楚即可过，写含糊必被拒。

---

## 1. 提交前准备

### 1.1 开发者账号

1. 准备一个 **Microsoft 账号（MSA）**：Outlook.com / Live.com / Hotmail.com / GitHub 账号均可。
   > ⚠️ 建议用**专用的微软账号**，别用你日常登录的工作/学校账号，后续涉及发布者声誉与产品所有权。
2. 访问 **Partner Center**（partner.microsoft.com）→ 注册 → 选择「Microsoft Edge 计划」→ 填开发者信息表单：
   - 国家/地区、账户类型（**个人 / 公司**）
   - 发布者显示名称（Publisher display name，会出现在商店里，个人建议填"蜗牛壳AI助理"这类可读名，公司则填公司名）
   - 联系人信息、公司审批者（公司账号时）
   - 同意开发者协议
3. 提交后**等验证邮件**（通常几分钟到 1–2 个工作日；公司账号更久）。账号状态为"已验证"才能提交扩展。
   > **费用口径**：官方（learn.microsoft.com）明确「向 Microsoft Edge 计划提交扩展**不收取注册费**」。但若你注册的是**公司账户**，Partner Center 的企业身份验证环节可能会提示一次性验证费用（个人账户无此项）。**以 Partner Center 页面当时显示为准**。
4. 可选：把账号与组织 Microsoft Entra 租户绑定，方便多人协作管理扩展（个人开发者跳过）。

### 1.2 素材清单与规格（务必按此准备）

| 素材 | 规格要求 | 项目现状 | 缺口处理 |
|---|---|---|---|
| 扩展 Logo | **300 × 300 px PNG** | ✅ **已生成** `publish/logo-300.png` | 从 icon128 做 LANCZOS 超采样放大（先 600 再收敛到 300），直接上传 |
| 截图 | 最多 **10 张**，**640×480 或 1280×800** | ✅ **已生成 4 张** `publish/screenshots/` | ①总结本页 ②右键引用提问 ③空状态引导 ④设置页；脚本 `publish/gen-screenshots.py` 可随时重出 |
| 促销图（小） | 440 × 280（可选） | 无 | 从截图裁剪 |
| 促销图（大） | 1400 × 560（可选） | 无 | 横幅设计 |
| 描述文字 | **250–5000 字符**（纯文本，非富文本） | 已备（中英双语） | 直接用 `store-listing.md` 内容 |
| 隐私政策 URL | 公开可访问的 https 链接 | ✅ 已部署 | `https://snailoldbro.github.io/SnailShell-AI-Assistant/privacy-policy.html` |
|  YouTube 视频 | 可选，推荐不超过 2 分钟 | 无 | 可选，能显著提高通过感与转化 |
| 搜索词 | 合计最多 **21 个词/词组** | 未填 | 见 Step 7 |

> **Logo 300×300 生成命令**（macOS 自带，等比例不失真）：
> ```bash
> cd "/Users/cervan/Desktop/codexProject/Projects/浏览器AI助手/SnailShell AI Assistant"
> sips -Z 300 icons/icon128.png --out publish/logo-300.png
> ```

### 1.3 打包与自测

打包在**扩展根目录**执行（`package.sh` 已内建排除规则，自动读版本号、校验 `manifest.json` 在 ZIP 顶层）：

```bash
cd "/Users/cervan/Desktop/codexProject/Projects/浏览器AI助手/SnailShell AI Assistant"
bash package.sh
# 产物：../snailshell-v1.2.3.zip（manifest.json 必须在 ZIP 顶层，脚本会自动校验）
```

**打包铁律**
- `manifest.json` 必须在 ZIP **第一层**，不能包在一层文件夹里 → 外层目录打包会导致上传后**无法解析**（最常见的翻车点）。
- 只打运行时需要的文件：排除 `scripts/`（图标生成脚本）、`publish/`（上架素材）、`icons/backup/`、`README.md`、`.git`、`__MACOSX`、`*.DS_Store`。
- 用命令行 `zip`，不要用 macOS 右键「压缩」（会塞入 `__MACOSX` 垃圾目录）。
- 版本号只允许**递增**，Edge 不允许回滚版本号；1.2.3 已存在则下次要提交 1.2.4 或更高。

**自测清单（提交前在 Edge 上跑一遍）**
- [ ] `edge://extensions` 开启开发者模式 → 「加载已解压的扩展程序」选本目录，无报错
- [ ] 点工具栏图标 → 侧边栏打开，未配置模型时显示「前往设置模型」引导
- [ ] 设置页 → DeepSeek → 填 Key → 拉取模型 → 测试连接「连接成功」→ 保存
- [ ] 任意文章页点「总结本页」→ 流式输出要点，生成中可点「停止」
- [ ] 选中文字 → 右键「AI 就这段内容提问」→ 侧边栏出现引用块 → 得到回答
- [ ] 选中文字 → 右键「AI 总结选中内容」→ 直接输出选段总结
- [ ] 开启主密码 → Key 显示「已加密」；锁定后侧边栏要求解锁
- [ ] `edge://` 等内部页面 → 提示无法读取但不崩溃
- [ ] 控制台（F12）无报错、无死循环、无遗留 `console.log`

### 1.4 截图内容建议（补 3–5 张即可）

1. 侧边栏「总结本页」流式输出要点
2. 选中网页文字 → 右键「AI 就这段内容提问」→ 侧边栏带引用块
3. 设置页：多模型列表 + 「测试连接」显示「连接成功」
4. 设置页：主密码保护开关与「已加密」状态
5. （可选）Ollama 本地模型接入

---

## 2. Partner Center 8 步详解（逐字段照填）

### Step 1：准备要提交的扩展
确认：工作原型 ✅、已建开发者账号 ✅、已产出 ZIP ✅、manifest 字段值 reviewed ✅。

> **重要：manifest 里哪些字段会直接进商店页且不可改？**
> Edge 会把 `manifest.json` 里的 **Name** 和 **Description** 自动带入商店详情页，且这两项在 Partner Center 的 Store Listings 页面是**只读**的。
> 建议：先想清楚最终展示名与一句话简介，再定 manifest；后续想改就得重新提交新版本。
> 当前 manifest：`"name": "蜗牛壳AI助理"`、`"description"` 为 129 字的完整一句话介绍（已定稿，勿再改）。
> 注意区分两个字段：**manifest 的 description** 会自动进商店页且只读；**Step 7 的 Description 字段**要你自己填 250–5000 字符，用 `store-listing.md` 第三节的中/英文详细描述（574 字符，已够下限）。

### Step 2：在合作伙伴中心创建新的扩展
- 登录 Partner Center → 左上 Home → **Workspaces** 区域点 **Edge 卡片** → Overview 页 → 点 **Create new extension** → 进入「Upload package (.zip file)」页。

### Step 3：上传扩展包
- 左侧点 **Packages** → 拖入 `snailshell-v1.2.3.zip` 或点 Browse 选择。
- 等待校验（Extension 概览页会解析你的包）→ 若失败，按提示修复后重新上传；通过后点 **Continue**。
- 注意：Edge 只接受 **.zip**，不接受 7z / rar / tar.gz。

### Step 4：输入可用性信息（Availability）
- **Visibility（可见性）**：
  - `Public`：商店内可被搜索、浏览、安装 → **正式上架选这个**
  - `Hidden`：不可发现，只能通过直接链接访问 → **首次提交建议选 Hidden 先跑通流程**，验证通过后改 Public
- **Markets（市场）**：默认全选即可；想先小范围发布可取消勾选部分市场（注意：已安装用户不受影响）。

### Step 5：输入描述扩展的属性（Properties）
- **Category（分类）**：选 **Productivity（生产力）**
- **收集个人信息？**：选 **否（No）**
- **隐私策略 URL**：填你托管的 `privacy-policy.html` 公开链接（见第 3 节）
- **Website URL / 支持联系人**：个人开发者可不填，但**强烈建议填**（审核与用户信任都加分）
- **成人内容（Adult content）**：否
- 备注：这些属性会**公开展示**在商店页，必须与实际一致。

### Step 6：输入隐私信息（Privacy）⭐ 最关键，必被细审
这一步有 5 个小项，我们逐条给答案：

1. **说明扩展的用途（State the purpose）**
   > 中文：本扩展的单一用途是「AI 辅助网页阅读」——围绕当前页面进行总结、提问与引用，不含任何其他无关功能。
   > English: The single purpose is “AI-assisted web reading” — summarizing, questioning and quoting the current page only.

2. **证明权限合理（Justify any permissions）** ⭐ 逐条必写
   | 权限 | 合理化说明（复制到表单） |
   |---|---|
   | `sidePanel` | 提供侧边栏交互界面，承载总结、提问与引用对话框 |
   | `contextMenus` | 提供右键菜单「AI 就这段内容提问」与「AI 总结选中内容」 |
   | `storage` | 在本机保存用户添加的自定义模型配置与对话历史，不上传 |
   | `activeTab` | 仅在用户主动点击工具栏图标或右键时，访问当前标签页内容 |
   | `scripting` | 向当前页面注入本地自带的正文提取脚本，用于总结与引用 |
   | `clipboardWrite` | 将 AI 的回答复制到剪贴板 |
   | `host_permissions <all_urls>` | 需对任意网站读取**已渲染的页面正文**以支持总结；仅用户主动触发、仅读取已渲染内容、**不向开发者发送任何数据** |

3. **声明远程代码的使用（Declare remote code）** ⚠️ 这里最容易踩坑
   - 选择：**否（不使用远程代码）**。
   - 但务必在备注/说明里写清楚，避免审核误解：
     > 本扩展不包含任何从远程加载或执行的代码：没有 `eval`、没有外部 `<script src>`、没有从远程 origin 动态 import。
     > 扩展仅使用 `fetch` **调用用户自行在设置中配置的 AI 服务接口**以获取 JSON / SSE 文本数据，并**不执行**从远端返回的任何代码；所有逻辑均随扩展包本地分发。

4. **认证数据使用实践（Certify data usage practices）**
   - 是否收集/传输个人信息：**否**
   - 数据是否发往开发者或第三方：**否**。页面内容仅按用户配置，直连**用户自己填写的 AI 服务**（使用用户自己的 API Key），不经任何中转服务器。
   - 若用户未配置模型，扩展不发任何外部请求。
   - API Key 与对话历史仅存本机 `chrome.storage.local`（可选 PBKDF2+AES-GCM 加密）。

5. **设置隐私策略（Privacy policy）**
   - 填公开 https 链接（见第 3 节）。Edge 会**抽查**该链接真实可访问。

### Step 7：输入每种语言的应用商店详情（Store listing）
- **Display name**：蜗牛壳AI助理（取自 manifest）
- **Logo**：上传刚才生成的 300×300 PNG
- **Description**：**250–5000 字符**，可直接用 `store-listing.md` 里的中/英文详细描述
  - ⚠️ Edge 提供「AI 生成描述」按钮，**生成后如果提示需修改，务必人工复核**：常见问题是描述里缺 URL（此时把隐私政策链接补进去）或功能描述与实际不符。
- **Screenshots**：传 3–5 张 1280×800（或 640×480）
- **Promotional tiles 小 / 大**：可选，440×280 / 1400×560
- **YouTube 视频 URL**：可选
- **Search terms（搜索词）**：合计 ≤21 个词，建议 `网页总结, AI提问, 侧边栏助手, 右键引用, 自定义模型, OpenAI兼容, DeepSeek, Qwen, GLM, Kimi, Ollama, 本地模型, 浏览器AI, 阅读助手, 页面摘要, API Key 自带, 数据不出本机`
- **多语言**：可 Add language 加英文，或从已有语言 Duplicate assets 复用素材

### Step 8：输入认证测试说明并提交
- 在 **Notes for certification** 里写清测试路径（**模板见下方第 4 节**）。
- 点 **Publish / Submit** 提交认证。

---

## 3. 隐私政策 URL（已就绪，不用再部署）

**可直接复制到 Step 5 和 Step 6 的「隐私政策 URL」字段：**

```text
https://snailoldbro.github.io/SnailShell-AI-Assistant/privacy-policy.html
```

已用 GitHub Pages 部署（`gh-pages` 分支根目录，站点只含隐私政策一个文件），HTTPS 已强制开启，实测 HTTP 200 可访问。

> 该链接长期有效，不依赖任何第三方托管服务。若将来改了隐私政策内容，
> 重新上传 `publish/privacy-policy.html` 到 `gh-pages` 分支即可，链接不变。
> 站点根 `https://snailoldbro.github.io/SnailShell-AI-Assistant/` 有一个跳转索引页。

---

## 4. 认证测试说明（Notes for certification）直接复制版

```text
本扩展为本地运行的网页 AI 助手，需用户自行配置 AI 模型后使用，测试步骤如下：

1) 侧边栏：点击工具栏蜗牛图标打开侧边栏；未配置模型时显示「前往设置模型」引导。
2) 添加模型：设置页 → 「+ 添加模型」→ 服务商选 DeepSeek → Base URL 自动填充 →
   填入自己的 API Key（platform.deepseek.com 申请）→ 点「拉取模型」→
   选择 deepseek-chat 或 deepseek-reasoner → 点「测试连接」应显示「连接成功」→ 保存模型。
3) 总结本页：打开任意文章页 → 点「总结本页」→ 应流式输出要点；生成中按钮变为「停止」可中断。
4) 页面提问：在总结后继续追问（如「第二点展开讲讲」）→ 模型带上下文回答。
5) 右键引用：选中网页一段文字 → 右键「AI 就这段内容提问」→ 侧边栏出现引用块 → 输入问题得到回答。
6) 选中总结：选中文字 → 右键「AI 总结选中内容」→ 直接输出选段总结。
7) 本地模型（可选）：添加 Ollama 模型时 Key 可任意填写，Base URL 填 http://localhost:11434。
8) 主密码保护（可选）：设置页「主密码保护」开启后，Key 显示「已加密」；
   锁定状态下侧边栏会要求输入主密码解锁。
9) chrome:// 等浏览器内部页面无法注入正文提取，会给出明确提示，属预期行为，非缺陷。

重要说明：
- 未配置任何模型时，扩展不会向任何外部服务发起请求；
- 主机权限 <all_urls> 仅用于读取用户主动触发时当前页面已渲染的正文，用于总结/引用，
  内容按用户配置直连用户自填的 AI 服务（使用用户自己的 API Key），不经任何第三方中转，
  也不回传开发者服务器；
- API Key 与对话历史仅存储在本机 chrome.storage.local，可选主密码加密；
- 扩展无任何 eval、无外链脚本、无远程代码执行，所有逻辑随包本地分发。
```

---

## 5. 送审后的时间线与结果处理

- **认证时长**：官方口径最长 **7 个工作日**，实际多在 **3–5 个工作日** 内完成。
- **状态变化**：提交 → 认证中（In certification）→ 通过后在 Partner Center 状态变为 **「In the Store」**（即已上架）。
- **被拒**：会收到反馈/邮件。**被拒后可直接修改**重新提交，**不需要重新排队等新账号**；只需重新上传包 + 改对应字段。

### 常见被拒原因与规避

| 被拒原因 | 规避做法 |
|---|---|
| 权限请求未充分说明 | Step 6 逐条写清（表格已在上面给全） |
| 隐私政策缺失/不可访问/内容不实 | 先部署成功再填链接；内容必须与实际数据行为一致 |
| 功能描述与实际不符 / 描述太泛 | 用真实功能清单写，配上截图 |
| 疑似恶意软件误报 | 保持代码可读、无混淆、无隐藏行为；在 Notes 里主动说明数据流向 |
| 图标/Logo 模糊或侵权 | 用自制 300×300 PNG（不要拉伸变形） |
| 描述缺失 URL / AI 生成描述被驳回 | 人工复核 AI 生成文案，补隐私政策链接并修正功能表述 |
| 单一用途被判违规 | 坚持"AI 辅助网页阅读"这一条主线，不夹带无关功能 |

---

## 6. 上架之后

- **更新版本**：改 `manifest.json` 的 `version`（必须递增，不能回滚）→ 重新执行 `package.sh` → Partner Center 该扩展页面 → 上传新包 → 走 Step 3–8 → 提交。
- **改商店信息**：部分列表信息（图标、截图、描述、搜索词）可直接在已上架扩展的 Store Listings 里编辑，**无需重新认证**，保存后即时生效；但涉及包本身的改动必须重新上传。
- **自动化提交（进阶）**：首次必须手动提交一次（拿到 Product ID、Client ID、API Key 之后），之后可用 GitHub Actions / CI 自动推送新版本：
  ```
  EDGE_PRODUCT_ID / EDGE_CLIENT_ID / EDGE_API_KEY
  ```
- **用户评价**：关注 Edge Add-ons 页面评价，负面反馈及时响应；严重问题用小版本热修。
- **下架/移除**：Partner Center 可扩展页面有 Remove/disable 选项，但已安装用户可能仍收到更新提示，需谨慎。

---

## 7. 你的落地检查清单（逐条打勾）

**准备（截至 2026-10-04 18:20 进度）**
- [x] manifest 定稿：`description` 已改为商店级完整介绍（Edge 会带入商店页且只读，务必先定稿）
- [x] `bash package.sh` 产出干净 ZIP 并校验 `manifest.json` 在顶层（已重跑，含新 description → `../snailshell-v1.2.3.zip`）
- [x] 生成 300×300 Logo：`publish/logo-300.png`
- [x] 补 4 张 1280×800 截图：`publish/screenshots/`（01总结 / 02引用提问 / 03空状态 / 04设置页）
- [ ] 注册/验证 Microsoft Edge 计划开发者账号（你正在做：已选对 Edge 计划，卡在 Email 验证）
- [ ] **部署 `publish/privacy-policy.html` 拿到公开 https 链接 ← 唯一剩余待办**
- [ ] Edge 上 `edge://extensions` 加载无解压版跑通全部自测

**提交**
- [ ] Step 2 创建扩展 → Step 3 上传 ZIP 校验通过
- [ ] Step 4 可见性（建议先 Hidden 试水 / 直接 Public）、市场
- [ ] Step 5 分类 Productivity、不收集个人信息、隐私政策 URL、不支持链接（建议填）
- [ ] Step 6 用途声明 + 7 条权限逐条说明 + 远程代码"否"（附 fetch 澄清）+ 数据实践"否" + 隐私政策
- [ ] Step 7 名称/Logo/描述(250–5000字符)/截图/搜索词(≤21)
- [ ] Step 8 粘贴第 4 节测试说明 → 提交

**收尾**
- [ ] 等 3–7 个工作日，状态变「In the Store」即上架成功
- [ ] 若被拒：按反馈改后重提（无需重排队）
