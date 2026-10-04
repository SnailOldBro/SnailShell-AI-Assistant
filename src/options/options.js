// ============================================================
// options.js —— 设置页逻辑（ESM）
//
// 多模型管理：添加 / 编辑 / 删除 / 设为当前；厂商预设一键填充、
// 拉取模型列表、测试连接；主密码保护 A/B 档（含解锁）。
// ============================================================

import { PROVIDERS, getProvider } from '../shared/providers.js';
import {
  getConfig, saveConfig, getAllModels, saveModels,
  enableVault, disableVault, lockVault, resetVault, unlockVault, isUnlocked,
} from '../shared/storage.js';
import { listModels, testConnection } from '../shared/llm-adapter.js';

const $ = (id) => document.getElementById(id);

const modelListEl = $('modelList');
const editorCard = $('editorCard');
const editorTitle = $('editorTitle');
const mNameInput = $('mName');
const providerSel = $('provider');
const baseUrlInput = $('baseUrl');
const apiKeyInput = $('apiKey');
const modelInput = $('model');
const modelDropdown = $('modelDropdown');
const summaryPromptInput = $('summaryPrompt');
const vaultPwdInput = $('vaultPwd');
const statusEl = $('status');
const btnFetchModels = $('btnFetchModels');
const btnTest = $('btnTest');

const state = {
  models: [],
  activeModelId: '',
  editingId: null, // null = 新增；否则为编辑中的模型 id
  vaultEnabled: false,
  unlocked: false,
};

// 拉取到的模型名列表（字符串数组），用于自定义下拉
let modelOptions = [];

init();

async function init() {
  PROVIDERS.forEach((p) => {
    if (p.id === 'custom') return;
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.name;
    providerSel.appendChild(opt);
  });
  bindEvents();
  await refresh();
}

function bindEvents() {
  $('btnAddModel').addEventListener('click', () => openEditor());
  $('btnSaveModel').addEventListener('click', saveModel);
  $('btnCancelEdit').addEventListener('click', closeEditor);
  providerSel.addEventListener('change', onProviderChange);
  $('btnToggleKey').addEventListener('click', toggleKeyVisible);
  modelInput.addEventListener('focus', () => openDropdown());
  modelInput.addEventListener('input', () => renderDropdown(modelInput.value.trim()));
  modelInput.addEventListener('blur', () => closeDropdown());
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.model-combo')) closeDropdown();
  });
  $('btnFetchModels').addEventListener('click', fetchModels);
  $('btnTest').addEventListener('click', doTest);
  $('btnSavePrefs').addEventListener('click', doSavePrefs);
  $('btnEnableVault').addEventListener('click', doEnableVault);
  $('btnUnlockVault').addEventListener('click', doUnlockVault);
  $('btnLockVault').addEventListener('click', async () => { await lockVault(); await refresh(); toast('已上锁'); });
  $('btnDisableVault').addEventListener('click', doDisableVault);
  $('btnResetVault').addEventListener('click', doResetVault);
  $('vaultToggle').addEventListener('click', toggleVault);
  $('btnCopyEmail').addEventListener('click', copyEmail);
  document.querySelectorAll('.reward-item').forEach((b) => b.addEventListener('click', (e) => selectReward(e.currentTarget.dataset.amount)));
}

async function refresh() {
  const cfg = await getConfig();
  state.vaultEnabled = cfg.vaultEnabled;
  state.unlocked = await isUnlocked();
  state.models = await getAllModels();
  state.activeModelId = cfg.activeModelId;
  summaryPromptInput.value = cfg.summaryPrompt || '';
  renderModelList();
  await updateVaultUI();
}

/* ================= 模型列表 ================= */

function renderModelList() {
  modelListEl.innerHTML = '';
  if (!state.models.length) {
    const empty = document.createElement('div');
    empty.className = 'model-empty';
    empty.textContent = '还没有模型，点下方「添加模型」开始。';
    modelListEl.appendChild(empty);
    return;
  }

  state.models.forEach((m) => {
    const isActive = m.id === state.activeModelId;
    const item = document.createElement('div');
    item.className = 'model-item' + (isActive ? ' active' : '');

    const info = document.createElement('div');
    info.className = 'model-info';
    const name = document.createElement('div');
    name.className = 'model-name';
    name.textContent = m.name || '未命名模型';
    if (isActive) {
      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.textContent = '使用中';
      name.appendChild(badge);
    }
    const sub = document.createElement('div');
    sub.className = 'model-sub';
    sub.textContent = `${m.model || '未设置模型名'} · ${m.baseUrl || '未设置地址'}`;
    info.appendChild(name);
    info.appendChild(sub);

    const actions = document.createElement('div');
    actions.className = 'model-actions';

    if (!isActive) {
      const useBtn = document.createElement('button');
      useBtn.className = 'ghost';
      useBtn.textContent = '使用';
      useBtn.addEventListener('click', () => setActive(m.id));
      actions.appendChild(useBtn);
    }
    const copyBtn = document.createElement('button');
    copyBtn.className = 'ghost';
    copyBtn.textContent = '复制';
    copyBtn.addEventListener('click', () => copyModel(m.id));
    actions.appendChild(copyBtn);
    const editBtn = document.createElement('button');
    editBtn.className = 'ghost';
    editBtn.textContent = '编辑';
    editBtn.addEventListener('click', () => openEditor(m.id));
    const delBtn = document.createElement('button');
    delBtn.className = 'ghost danger';
    delBtn.textContent = '删除';
    delBtn.addEventListener('click', () => removeModel(m.id));
    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    item.appendChild(info);
    item.appendChild(actions);
    modelListEl.appendChild(item);
  });
}

async function setActive(id) {
  await saveConfig({ activeModelId: id });
  await refresh();
  toast('已切换当前模型');
}

async function removeModel(id) {
  const m = state.models.find((x) => x.id === id);
  if (!confirm(`确定删除模型「${m?.name || ''}」吗？`)) return;
  const models = state.models.filter((x) => x.id !== id);
  let activeId = state.activeModelId;
  if (activeId === id) activeId = models[0]?.id || '';
  await saveModels(models, activeId);
  if (state.editingId === id) closeEditor();
  await refresh();
  toast('已删除');
}

async function copyModel(id) {
  const m = state.models.find((x) => x.id === id);
  if (!m) return;
  if (state.vaultEnabled && !state.unlocked) { toast('主密码已锁定，请先解锁后再复制'); return; }
  const newName = nextCopyName(m.name || '未命名模型');
  const newModel = {
    ...m,
    id: 'm_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
    name: newName,
  };
  const models = [...state.models, newModel];
  await saveModels(models, state.activeModelId);
  await refresh();
  toast('已复制');
}

// 生成副本名称：名称副本 → 名称副本2 → 名称副本3 …
function nextCopyName(name) {
  const base = name + '副本';
  const has = (s) => state.models.some((x) => x.name === s);
  if (!has(base)) return base;
  let n = 2;
  while (has(base + n)) n++;
  return base + n;
}

/* ================= 编辑器 ================= */

function openEditor(id) {
  state.editingId = id || null;
  editorTitle.textContent = id ? '编辑模型' : '添加模型';
  editorCard.classList.remove('hidden');
  modelOptions = [];
  modelDropdown.innerHTML = '';
  modelDropdown.classList.add('hidden');

  if (id) {
    const m = state.models.find((x) => x.id === id);
    mNameInput.value = m?.name || '';
    baseUrlInput.value = m?.baseUrl || '';
    modelInput.value = m?.model || '';
    apiKeyInput.value = m?.apiKey || '';
    providerSel.value = '';
  } else {
    mNameInput.value = '';
    baseUrlInput.value = '';
    modelInput.value = '';
    apiKeyInput.value = '';
    providerSel.value = '';
  }

  apiKeyInput.disabled = false;
  apiKeyInput.placeholder = 'sk-xxxx';
  $('keyHint').textContent = 'Key 只保存在本机浏览器，不经过任何第三方中转。';

  if (state.vaultEnabled && !state.unlocked) {
    apiKeyInput.disabled = true;
    apiKeyInput.value = '';
    apiKeyInput.placeholder = '主密码已锁定，请先解锁';
    $('keyHint').textContent = '主密码锁定状态下无法增删改模型，请先在上方「主密码保护」区解锁。';
  }

  editorCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  mNameInput.focus();
}

function closeEditor() {
  editorCard.classList.add('hidden');
  state.editingId = null;
}

async function saveModel() {
  const baseUrl = baseUrlInput.value.trim();
  const apiKey = apiKeyInput.value.trim();
  const model = modelInput.value.trim();
  const name = mNameInput.value.trim() || model || '未命名模型';

  if (!baseUrl) { toast('请填写 Base URL'); return; }
  if (!model) { toast('请填写模型名'); return; }
  if (!apiKey) { toast('请填写 API Key'); return; }
  if (state.vaultEnabled && !state.unlocked) { toast('主密码已锁定，请先解锁后再保存'); return; }

  const models = [...state.models];
  if (state.editingId) {
    const idx = models.findIndex((x) => x.id === state.editingId);
    if (idx >= 0) models[idx] = { ...models[idx], name, baseUrl, apiKey, model };
  } else {
    const id = 'm_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    models.push({ id, name, baseUrl, apiKey, model });
    state.activeModelId = id;
  }

  await saveModels(models, state.activeModelId);
  closeEditor();
  await refresh();
  toast('模型已保存');
}

function onProviderChange() {
  const p = getProvider(providerSel.value);
  if (!p || !p.baseUrl) return;
  baseUrlInput.value = p.baseUrl;
  if (p.models && p.models.length) setModelOptions(p.models);
  if (p.hint) statusEl.textContent = p.hint;
}

function setModelOptions(models) {
  modelOptions = models || [];
  renderDropdown();
}

function renderDropdown(filter) {
  modelDropdown.innerHTML = '';
  const list = filter
    ? modelOptions.filter((m) => m.toLowerCase().includes(filter.toLowerCase()))
    : modelOptions;
  if (!list.length) {
    modelDropdown.classList.add('hidden');
    return;
  }
  list.forEach((m) => {
    const item = document.createElement('div');
    item.className = 'model-option';
    item.textContent = m;
    item.addEventListener('mousedown', (e) => e.preventDefault());
    item.addEventListener('click', () => {
      modelInput.value = m;
      closeDropdown();
    });
    modelDropdown.appendChild(item);
  });
  modelDropdown.classList.remove('hidden');
}

function openDropdown() {
  renderDropdown(); // 展开显示所有拉取到的模型
}

function closeDropdown() {
  modelDropdown.classList.add('hidden');
}

function toggleKeyVisible() {
  const show = apiKeyInput.type === 'password';
  apiKeyInput.type = show ? 'text' : 'password';
  $('btnToggleKey').textContent = show ? '隐藏' : '显示';
}

/* 按钮状态反馈：默认蓝 / 加载中 / 成功绿 / 失败红，3 秒恢复 */
function setBtnState(btn, state, text) {
  btn.classList.remove('loading', 'success', 'error');
  if (state !== 'default') btn.classList.add(state);
  btn.textContent = text;
}

function resetBtnAfter(btn, defaultText) {
  clearTimeout(btn._resetTimer);
  btn._resetTimer = setTimeout(() => {
    btn.classList.remove('loading', 'success', 'error');
    btn.textContent = defaultText;
  }, 3000);
}

function highlightModelInput() {
  modelInput.classList.add('highlight');
  modelInput.focus(); // 聚焦触发 openDropdown，展开显示所有拉取到的模型
  clearTimeout(modelInput._hlTimer);
  modelInput._hlTimer = setTimeout(() => modelInput.classList.remove('highlight'), 3000);
}

async function resolveKeyForAction() {
  const key = apiKeyInput.value.trim();
  if (key) return key;
  if (state.editingId) {
    const m = state.models.find((x) => x.id === state.editingId);
    if (m?.apiKey) return m.apiKey;
  }
  throw new Error('请先填写 API Key（或解锁主密码）');
}

async function fetchModels() {
  statusEl.textContent = '';
  setBtnState(btnFetchModels, 'loading', '拉取中…');
  try {
    const key = await resolveKeyForAction();
    const models = await listModels(baseUrlInput.value.trim(), key);
    if (models.length) {
      setModelOptions(models);
      setBtnState(btnFetchModels, 'success', '拉取成功 ✓');
      highlightModelInput();
    } else {
      setBtnState(btnFetchModels, 'success', '拉取成功 ✓');
      statusEl.textContent = '服务未返回模型列表，请手动填写模型名。';
    }
  } catch (e) {
    setBtnState(btnFetchModels, 'error', '拉取失败 ✕');
    statusEl.textContent = '拉取失败：' + (e?.message || e) + '（可手动填写）';
  }
  resetBtnAfter(btnFetchModels, '拉取模型');
}

async function doTest() {
  statusEl.textContent = '';
  setBtnState(btnTest, 'loading', '测试中…');
  try {
    const key = await resolveKeyForAction();
    await testConnection({
      baseUrl: baseUrlInput.value.trim(),
      apiKey: key,
      model: modelInput.value.trim(),
    });
    setBtnState(btnTest, 'success', '连接成功 ✓');
  } catch (e) {
    setBtnState(btnTest, 'error', '连接失败 ✕');
    statusEl.textContent = '连接失败：' + (e?.message || e);
  }
  resetBtnAfter(btnTest, '测试连接');
}

async function doSavePrefs() {
  await saveConfig({ summaryPrompt: summaryPromptInput.value.trim() });
  toast('偏好已保存');
}

/* ================= 主密码 ================= */

function toggleVault() {
  const body = $('vaultBody');
  const btn = $('vaultToggle');
  const collapsed = body.classList.contains('hidden');
  if (collapsed) {
    body.classList.remove('hidden');
    btn.setAttribute('aria-expanded', 'true');
  } else {
    body.classList.add('hidden');
    btn.setAttribute('aria-expanded', 'false');
  }
}

async function updateVaultUI() {
  const enable = $('btnEnableVault');
  const unlock = $('btnUnlockVault');
  const lock = $('btnLockVault');
  const disable = $('btnDisableVault');
  const reset = $('btnResetVault');

  if (!state.vaultEnabled) {
    $('vaultStatus').textContent = '当前：明文存储，重开浏览器免填 Key。';
    enable.classList.remove('hidden');
    unlock.classList.add('hidden');
    lock.classList.add('hidden');
    disable.classList.add('hidden');
    reset.classList.add('hidden');
    vaultPwdInput.placeholder = '至少 4 位，用于加密你的 API Key';
  } else if (state.unlocked) {
    $('vaultStatus').textContent = '当前：主密码保护已开启（本会话已解锁）。';
    enable.classList.add('hidden');
    unlock.classList.add('hidden');
    lock.classList.remove('hidden');
    disable.classList.remove('hidden');
    reset.classList.remove('hidden');
    vaultPwdInput.placeholder = '输入主密码以关闭保护';
  } else {
    $('vaultStatus').textContent = '当前：主密码保护已开启（已锁定）。';
    enable.classList.add('hidden');
    unlock.classList.remove('hidden');
    lock.classList.add('hidden');
    disable.classList.add('hidden');
    reset.classList.remove('hidden');
    vaultPwdInput.placeholder = '输入主密码解锁';
  }
}

async function doEnableVault() {
  const pwd = vaultPwdInput.value;
  if (pwd.length < 4) { toast('主密码至少 4 位'); return; }
  try {
    await enableVault(pwd);
    vaultPwdInput.value = '';
    await refresh();
    toast('已开启主密码保护');
  } catch (e) {
    toast('开启失败：' + (e?.message || e));
  }
}

async function doUnlockVault() {
  const pwd = vaultPwdInput.value;
  if (!pwd) { toast('请输入主密码'); return; }
  try {
    await unlockVault(pwd);
    vaultPwdInput.value = '';
    await refresh();
    if (!editorCard.classList.contains('hidden')) openEditor(state.editingId);
    toast('已解锁');
  } catch (e) {
    toast('解锁失败：' + (e?.message || e));
  }
}

async function doDisableVault() {
  const pwd = vaultPwdInput.value;
  if (!pwd) { toast('请输入主密码以确认关闭'); return; }
  try {
    await disableVault(pwd);
    vaultPwdInput.value = '';
    await refresh();
    toast('已关闭主密码保护，Key 恢复明文存储');
  } catch (e) {
    toast('关闭失败：' + (e?.message || e));
  }
}

async function doResetVault() {
  if (!confirm('重置主密码保护会清空所有已加密的 API Key，且无法恢复。\n确定重置吗？之后需重新填写各模型的 Key。')) return;
  await resetVault();
  vaultPwdInput.value = '';
  await refresh();
  toast('已重置，请重新填写各模型的 API Key');
}

let toastTimer = null;
function toast(text) {
  statusEl.textContent = text;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { if (statusEl.textContent === text) statusEl.textContent = ''; }, 3500);
}

/* ================= 关于 / 反馈 / 鼓励支持 ================= */

// 占位图（仅当收款码文件缺失/加载失败时兜底显示）
const PLACEHOLDER_QR = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="280" height="280">' +
  '<rect width="280" height="280" fill="#f0f0f3"/>' +
  '<rect x="40" y="40" width="200" height="200" fill="#ffffff" stroke="#dddddd"/>' +
  '<text x="140" y="145" font-size="18" fill="#999999" text-anchor="middle" font-family="sans-serif">收款码占位图</text>' +
  '</svg>',
);

// 金额 → 展示文案 + 撒娇感谢语（感谢语与支付方式无关）
const REWARD_INFO = {
  '0.1': { amountLabel: '1 毛', thanks: '谢谢你请我吃一根螺纹头绳～把我所有的小烦恼都绑走啦 (｡♡‿♡｡)' },
  '1': { amountLabel: '1 块', thanks: '哇～酸奶棒棒糖甜甜的，谢谢你的喜欢！(๑•̀ㅂ•́)و✧' },
  '10': { amountLabel: '10 块', thanks: '啵啵奶茶吨吨吨～你对我太好啦，谢谢！(♡˙︶˙♡)' },
};

// 收款码外链（图床直连，浏览器 UA 可访问；仅拦脚本类请求）
const PAY_QR = {
  alipay: {
    '0.1': 'https://pic.feria.eu.org/wFHs8qf1/zhifubao0-1.png',
    '1': 'https://pic.feria.eu.org/KjN3SP5t/zhifubao1-0.png',
    '10': 'https://pic.feria.eu.org/Kpt6wcJ0/zhifubao10-0.png',
  },
  wechat: {
    '0.1': 'https://pic.feria.eu.org/TB7dV8SQ/weixin0-1.png',
    '1': 'https://pic.feria.eu.org/d0yt5TKd/weixin1-0.png',
    '10': 'https://pic.feria.eu.org/5XbHGCLc/weixin10-0.png',
  },
};

// 默认不选任何金额、不显示收款码；点击商品后才显示
let currentAmount = null;

async function copyEmail() {
  const email = $('emailText').textContent.trim();
  let ok = false;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(email);
      ok = true;
    }
  } catch (_) {}
  if (!ok) ok = fallbackCopy(email);
  if (ok) flashCopyBtn();
  else toast('复制失败，请手动复制');
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch (_) {}
  ta.remove();
  return ok;
}

function flashCopyBtn() {
  const btn = $('btnCopyEmail');
  btn.textContent = '已复制 ✓';
  btn.classList.add('copied');
  clearTimeout(btn._timer);
  btn._timer = setTimeout(() => {
    btn.textContent = '复制';
    btn.classList.remove('copied');
  }, 3000);
}

function selectReward(amount) {
  if (!REWARD_INFO[amount]) return;
  currentAmount = amount;
  document.querySelectorAll('.reward-item').forEach((b) => b.classList.toggle('active', b.dataset.amount === amount));
  renderQR();
}

function renderQR() {
  const area = $('qrArea');
  if (!currentAmount || !REWARD_INFO[currentAmount]) {
    area.classList.add('hidden');
    return;
  }
  $('qrAlipay').src = PAY_QR.alipay[currentAmount] || PLACEHOLDER_QR;
  $('qrWechat').src = PAY_QR.wechat[currentAmount] || PLACEHOLDER_QR;
  $('qrAlipay').onerror = () => { $('qrAlipay').src = PLACEHOLDER_QR; };
  $('qrWechat').onerror = () => { $('qrWechat').src = PLACEHOLDER_QR; };
  $('qrAmount').textContent = REWARD_INFO[currentAmount].amountLabel;
  $('rewardThanks').textContent = REWARD_INFO[currentAmount].thanks;
  area.classList.remove('hidden');
}
