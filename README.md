# 蜗牛壳AI助理（Chrome 扩展 · Manifest V3）

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Manifest](https://img.shields.io/badge/Manifest-V3-blue.svg)](./manifest.json)
[![Chrome](https://img.shields.io/badge/Chrome-扩展-绿色.svg)](https://chrome.google.com/webstore/category/extensions)

自定义模型**——用自己的 API Key 直连你选的服务（DeepSeek / Qwen / GLM / Kimi / Ollama / 任意 endpoint），数据不经过任何第三方中转，免费更安全。

## 开源

本项目开源，协议 [MIT](./LICENSE)，可自由使用、修改、分发（需保留版权声明）。

- **仓库**：<https://github.com/SnailOldBro/SnailShell-AI-Assistant>
- **问题反馈 / 功能建议**：<https://github.com/SnailOldBro/SnailShell-AI-Assistant/issues>
- **隐私政策**：<https://snailoldbro.github.io/SnailShell-AI-Assistant/privacy-policy.html>
- **拉取源码**：`git clone https://github.com/SnailOldBro/SnailShell-AI-Assistant.git`
- **打包上架用**：`bash package.sh`（产物 `snailshell-v<版本>.zip`，`manifest.json` 在 ZIP 顶层）
- 开源仓库已做脱敏处理：不含任何收款码图片、真实邮箱、API Key，以及内部打包脚本

## 功能

- **总结网页**：自动提取网页正文，一键生成要点总结
- **页面提问**：带页面上下文追问，流式输出，可随时停止
- **右键引用提问**：选中文字 → 右键「AI 就这段内容提问」→ 侧边栏带引用块提问；或右键「AI 总结选中内容」直接总结选段
- **多模型管理**：可添加多个自定义模型配置，侧边栏顶部下拉随时切换「当前使用」，支持编辑与删除
- **自定义模型**：厂商预设一键填充 + 「拉取模型」自动列模型名 + 手动填写兜底
- **本地历史与安全**：对话存本机扩展存储；API Key 提供两档保护（见下）
- **鼓励支持**：设置页底部「鼓励支持」→ 点商品卡片显示微信 / 支付宝收款码（0.1 / 1 / 10 元三档），二维码为图床外链，不打包进扩展

## 安装（开发者模式加载）

1. 打开 Chrome，地址栏输入 `chrome://extensions`
2. 右上角打开「开发者模式」
3. 点「加载已解压的扩展程序」，选择本目录（`SnailShell AI Assistant/`）
4. 工具栏出现蜗牛壳图标即成功；点击图标打开侧边栏

## 配置模型（以 DeepSeek 为例）

1. 点侧边栏「设置」（或 `chrome://extensions` 里该扩展的「详情 → 扩展程序选项」）
2. 点「+ 添加模型」→ 服务商选「DeepSeek 深度求索」→ Base URL 自动填好
3. 填显示名称、你的 API Key（[platform.deepseek.com](https://platform.deepseek.com) 创建）
4. 点「拉取模型」→ 下拉选 `deepseek-chat`（日常）或 `deepseek-reasoner`（深度推理）；也可手填
5. 点「测试连接」确认 → 「保存模型」

**多模型**：重复上述步骤即可添加多个（如再加一个 Qwen、一个 Ollama 本地模型）。列表里可「编辑 / 删除 / 使用」，「使用」即切换为当前模型；侧边栏顶部下拉也能随时切换。其他厂商预设：阿里云百炼（Qwen）、智谱 GLM、Moonshot Kimi、Ollama 本地（Key 随便填）、OpenAI，或选「不选，手动填写」填任意 OpenAI 兼容地址。

## API Key 的两档安全

| 档位 | 行为 | 适用 |
|---|---|---|
| **A 明文（默认）** | 各模型 Key 明文存本机 `chrome.storage.local`，重开浏览器免填 | 个人设备、图省事 |
| **B 主密码（可选开关）** | 所有模型的 Key 用 PBKDF2 + AES-GCM 整体加密成密文落盘；重开浏览器输一次主密码解锁，不必重填完整 Key | KEY 敏感、更高要求 |

安全边界（务必知悉）：
- Key 只在扩展上下文中使用，**网页脚本、其他普通扩展读不到**；请求经 HTTPS 直连你填写的服务，**不经任何中转**。
- 明文档防不住「已拿到本机文件系统完整权限的恶意程序」；介意请开启主密码档。

**忘记主密码怎么办**：主密码加密不可逆、无法找回。忘记时只能「重置保护」——清空所有已加密的 Key，回到明文模式后重新填写（设置页「主密码保护」区点「重置保护」按钮，模型条目与地址保留，仅 Key 需重填）。建议将主密码存入可靠的密码管理器。

## 合规红线（这个插件不做的事）

- 只处理你当前页面已渲染的内容与你主动选中的文字
- 不翻页批量抓取、不绕过付费墙、不自动构造请求
- 不读取 Cookie、不碰账号凭据、不采集浏览历史
- 发给模型的内容请自行评估敏感度

## 目录结构

```
SnailShell AI Assistant/
├── manifest.json              # MV3，权限最小化（sidePanel/contextMenus/storage/activeTab/scripting）
├── src/
│   ├── sidepanel/             # 侧边栏主界面（对话、流式、总结、引用）
│   ├── options/               # 设置页（多模型增删改选、拉取模型、测试连接、主密码、鼓励支持）
│   ├── background/            # service worker（右键菜单、打开侧栏、引用传递）
│   └── shared/
│       ├── providers.js       # 厂商预设表
│       ├── llm-adapter.js     # OpenAI 兼容层（SSE 流解析 / 模型拉取 / 连接测试）
│       ├── storage.js         # 多模型配置 + 主密码加密
│       └── extractor.js       # 正文提取（自包含函数，按需注入）
├── icons/                     # 16/48/128 PNG
└── scripts/gen_icons.py       # 图标生成脚本（零依赖）
```

## 本地验收清单

- [ ] `chrome://extensions` 开发者模式加载无报错
- [ ] 点工具栏图标 → 侧边栏打开；未配置时显示「前往设置模型」引导
- [ ] 设置页选 DeepSeek → 填 Key → 拉取模型 → 测试连接显示「连接成功」→ 保存
- [ ] 打开任意文章页 → 点「总结本页」→ 流式输出要点；生成中「发送」变「停止」可中断
- [ ] 在总结后继续追问（如「第二点展开讲讲」）→ 模型带上下文回答
- [ ] 选中网页一段文字 → 右键「AI 就这段内容提问」→ 侧边栏出现引用块 → 输入问题得到回答
- [ ] 选中文字 → 右键「AI 总结选中内容」→ 直接输出选段总结
- [ ] 关闭浏览器重开 → 配置仍在，免填 Key（A 档）
- [ ] 开启主密码 → Key 框变「已加密」；锁定后侧边栏要求解锁；输错密码提示错误
- [ ] `chrome://` 等内部页面点「总结本页」→ 提示无法读取，不崩溃
- [ ] 设置页底部「鼓励支持」→ 点 0.1/1/10 元商品卡片 → 显示对应微信/支付宝收款码与感谢语

## 已知边界

- `chrome://`、Chrome 商店等浏览器内部页面无法注入正文提取（浏览器限制），会给出明确提示
- 部分站点正文结构特殊时，提取质量可能下降（启发式算法，后续可升级 Readability）
- 服务商若调整 API 地址或模型名，需更新 `src/shared/providers.js` 预设表
