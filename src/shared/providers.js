// ============================================================
// providers.js —— 模型服务商预设表（ESM）
//
// 设计意图：降低「自定义模型」的上手门槛。
// 用户选一家预设 → 自动带出 baseUrl 与推荐模型名，
// 只需填自己的 API Key 即可。所有地址均指向官方直连，
// 插件不经过任何第三方中转。
//
// 注意：这些地址与默认模型名可能随服务商调整，
// 属于「需要偶尔维护」的适配层数据，与站点选择器同理。
// ============================================================

export const PROVIDERS = [
  {
    id: 'deepseek',
    name: 'DeepSeek 深度求索',
    baseUrl: 'https://api.deepseek.com/v1',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    hint: '开放平台 platform.deepseek.com 创建 API Key',
  },
  {
    id: 'qwen',
    name: '阿里云百炼（Qwen 通义千问）',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    models: ['qwen-plus', 'qwen-max', 'qwen-turbo', 'qwen-long'],
    hint: '百炼控制台 bailian.console.aliyun.com 创建 Key，走 OpenAI 兼容模式',
  },
  {
    id: 'glm',
    name: '智谱 GLM',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    models: ['glm-4-plus', 'glm-4-flash', 'glm-4-air'],
    hint: '智谱开放平台 open.bigmodel.cn 创建 API Key',
  },
  {
    id: 'kimi',
    name: 'Moonshot Kimi',
    baseUrl: 'https://api.moonshot.cn/v1',
    models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
    hint: '平台 platform.moonshot.cn 创建 API Key',
  },
  {
    id: 'ollama',
    name: 'Ollama（本地模型）',
    baseUrl: 'http://localhost:11434/v1',
    models: [],
    hint: '本地运行，Key 可随便填（如 ollama）；模型名以 ollama list 为准',
    noKey: true,
  },
  {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini'],
    hint: 'platform.openai.com 创建 API Key',
  },
  {
    id: 'custom',
    name: '自定义（任意 OpenAI 兼容服务）',
    baseUrl: '',
    models: [],
    hint: '填任何兼容 /chat/completions 的服务地址',
  },
];

/** 按 id 取预设 */
export function getProvider(id) {
  return PROVIDERS.find((p) => p.id === id) || PROVIDERS[PROVIDERS.length - 1];
}
