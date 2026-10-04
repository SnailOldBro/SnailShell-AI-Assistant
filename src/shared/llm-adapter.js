// ============================================================
// llm-adapter.js —— OpenAI 兼容适配层（ESM）
//
// 这是整个插件的「卖点核心」：把 DeepSeek / Qwen / GLM / Kimi /
// Ollama / 任意 OpenAI 兼容服务，统一成一套调用。
//
// 能力：
//   1. chatStream  —— 流式对话（SSE 逐字回调）
//   2. chatOnce    —— 非流式一次性请求（测试连接 / 兜底）
//   3. listModels  —— 拉取模型名列表（含 Ollama 本地 fallback）
//
// 地址规范化：不管用户填 /v1、/v4 还是裸域名，都正确拼出
// /chat/completions 与 /models。
// ============================================================

function normBase(baseUrl) {
  return (baseUrl || '').trim().replace(/\/+$/, '');
}

function chatUrl(baseUrl) {
  const u = normBase(baseUrl);
  if (/\/chat\/completions$/.test(u)) return u;
  return u + '/chat/completions';
}

function modelsUrl(baseUrl) {
  const u = normBase(baseUrl);
  if (/\/models$/.test(u)) return u;
  return u + '/models';
}

function authHeaders(apiKey) {
  return {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + (apiKey || ''),
  };
}

/** 从失败响应里抠一段可读错误，方便用户排查（如 401 未授权 / 404 地址错）。 */
async function readError(res) {
  try {
    const text = await res.text();
    return `HTTP ${res.status}：${text.slice(0, 300)}`;
  } catch (_) {
    return `HTTP ${res.status}`;
  }
}

/**
 * 流式对话。onDelta 收到增量文本；signal 可中止。
 * messages 形如 [{role:'user'|'assistant'|'system', content:string}]
 */
export async function chatStream({ baseUrl, apiKey, model, messages, temperature, signal }, onDelta) {
  if (!baseUrl || !apiKey || !model) {
    throw new Error('请先在设置页填写 Base URL、API Key 与模型名');
  }
  const body = { model, messages, stream: true };
  if (temperature !== undefined && temperature !== null) body.temperature = temperature;

  const res = await fetch(chatUrl(baseUrl), {
    method: 'POST',
    headers: authHeaders(apiKey),
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) throw new Error(await readError(res));

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx;
    while ((idx = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (!line.startsWith('data:')) continue;
      const payload = line.slice(5).trim();
      if (payload === '[DONE]') return;
      try {
        const json = JSON.parse(payload);
        const delta = json.choices?.[0]?.delta?.content || json.choices?.[0]?.message?.content;
        if (delta) onDelta(delta);
      } catch (_) {
        /* 忽略空行 / 非 JSON 行 */
      }
    }
  }

  // 处理末尾可能残留、未换行结束的最后一块 data
  if (buffer.trim().startsWith('data:')) {
    const payload = buffer.trim().slice(5).trim();
    if (payload !== '[DONE]') {
      try {
        const json = JSON.parse(payload);
        const delta = json.choices?.[0]?.delta?.content || json.choices?.[0]?.message?.content;
        if (delta) onDelta(delta);
      } catch (_) {}
    }
  }
}

/** 非流式请求，返回完整文本。用于测试连接与兜底。10 秒超时。 */
export async function chatOnce({ baseUrl, apiKey, model, messages, temperature }) {
  if (!baseUrl || !apiKey || !model) {
    throw new Error('请先在设置页填写 Base URL、API Key 与模型名');
  }
  const body = { model, messages, stream: false, max_tokens: 1 };
  if (temperature !== undefined && temperature !== null) body.temperature = temperature;

  let res;
  try {
    res = await fetch(chatUrl(baseUrl), {
      method: 'POST',
      headers: authHeaders(apiKey),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });
  } catch (e) {
    if (isTimeoutError(e)) throw new Error('连接超时（10 秒），请检查网络或地址');
    throw e;
  }
  if (!res.ok) throw new Error(await readError(res));
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * 拉取模型列表。标准走 GET /models（返回 {data:[{id}]}），10 秒超时。
 * 失败时若为本地 Ollama，退回 /api/tags（{models:[{name}]}）。
 * 仍失败则抛错，由调用方降级为「手动填写」。
 */
export async function listModels(baseUrl, apiKey) {
  if (!baseUrl) throw new Error('请先填写 Base URL');
  try {
    const res = await fetch(modelsUrl(baseUrl), {
      headers: authHeaders(apiKey),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(await readError(res));
    const data = await res.json();
    if (Array.isArray(data.data)) return data.data.map((m) => m.id).filter(Boolean);
    return [];
  } catch (e) {
    if (isTimeoutError(e)) throw new Error('请求超时（10 秒），请检查地址或网络');
    if (/localhost|127\.0\.0\.1/.test(baseUrl)) {
      try {
        const origin = new URL(normBase(baseUrl)).origin;
        const res = await fetch(origin + '/api/tags', { signal: AbortSignal.timeout(10000) });
        const data = await res.json();
        if (Array.isArray(data.models)) return data.models.map((m) => m.name).filter(Boolean);
      } catch (_) {
        /* 忽略 fallback 失败，继续抛原错误 */
      }
    }
    throw e;
  }
}

/** 判断是否为超时/中断类错误（AbortSignal.timeout 抛 TimeoutError/DOMException）。 */
function isTimeoutError(e) {
  return !!(e && (e.name === 'TimeoutError' || e.name === 'AbortError'));
}

/** 测试连通性：发一个 max_tokens=1 的最小请求，能通即返回 true。 */
export async function testConnection({ baseUrl, apiKey, model }) {
  try {
    await chatOnce({ baseUrl, apiKey, model, messages: [{ role: 'user', content: 'ping' }] });
    return true;
  } catch (e) {
    throw e;
  }
}
