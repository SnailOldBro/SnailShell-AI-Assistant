// ============================================================
// storage.js —— 多模型配置与密钥的安全存储封装（ESM）
//
// 数据模型：
//   ModelEntry = { id, name, baseUrl, apiKey, model }
//   config = {
//     models: ModelEntry[],   // 多个模型配置
//     activeModelId: string,  // 当前使用的模型
//     vaultEnabled: boolean,
//     summaryPrompt: string,
//     defaultLanguage: string,
//   }
//
// 安全档位（A/B）：
//   A 明文：models 里 apiKey 明文存 chrome.storage.local，重开免填。
//   B 主密码：整个 models（含所有 key）用 PBKDF2 + AES-GCM 加密成
//     密文落盘；解锁后 models 明文暂存 chrome.storage.session（会话级），
//     同时把派生密钥 raw 字节暂存 session，用于解锁期间重加密。
//
// 红线：Key 只存在于本机扩展存储，绝不写入网页 DOM、不打印日志、
//      不发往任何第三方中转。
// ============================================================

const enc = new TextEncoder();
const dec = new TextDecoder();

const STORE_KEY = 'config';
const VAULT_KEY = 'vault';
const SESSION_MODELS = 'unlockedModels';
const SESSION_RAWKEY = 'vaultRawKey';

const DEFAULT_CONFIG = {
  models: [],
  activeModelId: '',
  vaultEnabled: false,
  summaryPrompt: '',
  defaultLanguage: 'zh',
};

/* ---------- 基础工具 ---------- */

function toB64(buf) {
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function fromB64(str) {
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function randBytes(n) {
  return crypto.getRandomValues(new Uint8Array(n));
}

/* ---------- 加密原语（Web Crypto） ---------- */

async function deriveKey(password, salt) {
  const material = await crypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 150000, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    true, // 需导出 raw 字节用于解锁期间重加密，extractable 必须为 true
    ['encrypt', 'decrypt'],
  );
}

async function importRawKey(rawB64) {
  return crypto.subtle.importKey(
    'raw', fromB64(rawB64), { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'],
  );
}

/** 用主密码加密整个 models 数组。 */
async function encryptModels(models, password) {
  const salt = randBytes(16);
  const iv = randBytes(12);
  const key = await deriveKey(password, salt);
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(models)),
  );
  return { salt: toB64(salt), iv: toB64(iv), cipher: toB64(cipher) };
}

/** 用主密码解密 vault。 */
async function decryptModels(vault, password) {
  const key = await deriveKey(password, fromB64(vault.salt));
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromB64(vault.iv) }, key, fromB64(vault.cipher),
  );
  return JSON.parse(dec.decode(plain));
}

/** 用已解锁的派生密钥重加密（salt 复用，仅换 iv + cipher）。 */
async function reencryptModels(models, saltB64, rawKeyB64) {
  const iv = randBytes(12);
  const key = await importRawKey(rawKeyB64);
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(models)),
  );
  return { salt: saltB64, iv: toB64(iv), cipher: toB64(cipher) };
}

/* ---------- 配置读写 ---------- */

export async function getConfig() {
  const data = await chrome.storage.local.get(STORE_KEY);
  return { ...DEFAULT_CONFIG, ...(data[STORE_KEY] || {}) };
}

export async function saveConfig(partial) {
  const cur = await getConfig();
  const next = { ...cur, ...partial };
  await chrome.storage.local.set({ [STORE_KEY]: next });
  return next;
}

/** 去掉 apiKey 的脱敏副本（加密模式下 config 里的 models 不带明文 key）。 */
function maskModels(models) {
  return (models || []).map((m) => ({ ...m, apiKey: '' }));
}

/* ---------- 模型读写 ---------- */

/** 所有模型（含明文 key）。加密档未解锁时返回脱敏版。 */
export async function getAllModels() {
  const cfg = await getConfig();
  if (!cfg.vaultEnabled) return cfg.models;
  const sess = await chrome.storage.session.get(SESSION_MODELS);
  return sess[SESSION_MODELS] || cfg.models;
}

/** 当前激活的模型；无则返回 null。 */
export async function getActiveModel() {
  const cfg = await getConfig();
  const models = await getAllModels();
  return models.find((m) => m.id === cfg.activeModelId) || models[0] || null;
}

/**
 * 保存模型列表 + 激活 id。
 * 明文档直接落盘；加密档需已解锁（用 session 里的派生密钥重加密）。
 */
export async function saveModels(models, activeModelId) {
  const cfg = await getConfig();
  if (!cfg.vaultEnabled) {
    await saveConfig({ models, activeModelId });
    return;
  }
  const sess = await chrome.storage.session.get([SESSION_MODELS, SESSION_RAWKEY]);
  const rawKey = sess[SESSION_RAWKEY];
  if (!rawKey) throw new Error('主密码已锁定，请先解锁后再修改模型');
  const vault = (await chrome.storage.local.get(VAULT_KEY))[VAULT_KEY];
  if (!vault) throw new Error('加密数据缺失，请重置主密码保护');

  const newVault = await reencryptModels(models, vault.salt, rawKey);
  await chrome.storage.local.set({
    [VAULT_KEY]: newVault,
    [STORE_KEY]: { ...cfg, models: maskModels(models), activeModelId },
  });
  await chrome.storage.session.set({ [SESSION_MODELS]: models });
}

/* ---------- 主密码（A/B 档） ---------- */

export async function enableVault(password) {
  const cfg = await getConfig();
  if (!password || password.length < 4) throw new Error('主密码至少 4 位');
  const models = await getAllModels();
  if (!models.length) throw new Error('请先添加至少一个模型');

  const vault = await encryptModels(models, password);
  await chrome.storage.local.set({
    [VAULT_KEY]: vault,
    [STORE_KEY]: { ...cfg, vaultEnabled: true, models: maskModels(models) },
  });

  // 设置后即进入锁定态，需输入主密码解锁验证（不自动解锁）
  await chrome.storage.session.remove(SESSION_MODELS);
  await chrome.storage.session.remove(SESSION_RAWKEY);
}

export async function disableVault(password) {
  const vault = (await chrome.storage.local.get(VAULT_KEY))[VAULT_KEY];
  if (!vault) throw new Error('未找到加密数据');
  const models = await decryptModels(vault, password);
  await chrome.storage.local.remove(VAULT_KEY);
  await saveConfig({ vaultEnabled: false, models });
  await chrome.storage.session.set({ [SESSION_MODELS]: models });
  await chrome.storage.session.remove(SESSION_RAWKEY);
}

/**
 * 忘记主密码的唯一出路：重置。
 * 加密数据不可逆，重置 = 清空所有已加密的 Key + 关闭保护，
 * 模型条目保留（baseUrl/model 仍在），用户重新填写 Key 即可。
 */
export async function resetVault() {
  const cfg = await getConfig();
  await chrome.storage.local.remove(VAULT_KEY);
  await saveConfig({ vaultEnabled: false, models: maskModels(cfg.models) });
  await chrome.storage.session.remove(SESSION_MODELS);
  await chrome.storage.session.remove(SESSION_RAWKEY);
}

/** 解锁：校验主密码并解密 models 放入会话存储。 */
export async function unlockVault(password) {
  const vault = (await chrome.storage.local.get(VAULT_KEY))[VAULT_KEY];
  if (!vault) throw new Error('未开启主密码');
  const models = await decryptModels(vault, password);
  const key = await deriveKey(password, fromB64(vault.salt));
  const rawKey = await crypto.subtle.exportKey('raw', key);
  await chrome.storage.session.set({
    [SESSION_MODELS]: models,
    [SESSION_RAWKEY]: toB64(rawKey),
  });
  return models;
}

/** 上锁：清空会话里的明文 models 与派生密钥。 */
export async function lockVault() {
  await chrome.storage.session.remove(SESSION_MODELS);
  await chrome.storage.session.remove(SESSION_RAWKEY);
}

/** 是否已解锁（加密档下会话中是否存在明文 models）。 */
export async function isUnlocked() {
  const cfg = await getConfig();
  if (!cfg.vaultEnabled) return true;
  const sess = await chrome.storage.session.get(SESSION_MODELS);
  return Boolean(sess[SESSION_MODELS]);
}

/* ---------- 历史对话 ---------- */

const HISTORY_KEY = 'history';

/**
 * 历史对话数据模型：
 *   Chat = { id, title, createdAt, updatedAt, messages: [{role, content, ts?}] }
 * 标题由首条消息截断生成，之后可用 AI 总结覆盖（updateChatTitle）。
 */
export async function getHistory() {
  const data = await chrome.storage.local.get(HISTORY_KEY);
  return data[HISTORY_KEY] || [];
}

export async function saveHistory(list) {
  await chrome.storage.local.set({ [HISTORY_KEY]: list });
}

/** 新增或更新一条对话（按 id），新的放最前。返回最新列表。 */
export async function upsertChat(chat) {
  const list = await getHistory();
  const i = list.findIndex((c) => c.id === chat.id);
  if (i >= 0) list[i] = chat;
  else list.unshift(chat);
  await saveHistory(list);
  return list;
}

/** 仅更新某条对话的标题（AI 总结完成后覆盖，不重写消息体）。 */
export async function updateChatTitle(id, title) {
  const list = await getHistory();
  const c = list.find((x) => x.id === id);
  if (c) {
    c.title = title;
    await saveHistory(list);
  }
}

/** 删除指定 id 的多条对话，返回剩余列表。 */
export async function deleteChats(ids) {
  const list = await getHistory();
  const next = list.filter((c) => !ids.includes(c.id));
  await saveHistory(next);
  return next;
}
