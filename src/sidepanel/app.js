// ============================================================
// app.js —— 侧边栏主逻辑（ESM）
//
// 职责：对话流、流式渲染、总结本页、引用提问、主密码解锁、
//       未配置引导。LLM 请求由本页面直接发起（常驻不被打断）。
//
// 隐私：API Key 只在本扩展上下文使用，绝不写入网页 DOM。
// ============================================================

import { getConfig, getActiveModel, getAllModels, saveConfig, isUnlocked, unlockVault, getHistory, upsertChat, deleteChats } from '../shared/storage.js';
import { chatStream } from '../shared/llm-adapter.js';
import { extractPageContent } from '../shared/extractor.js';
import { renderMarkdown } from './markdown.js';

const $ = (id) => document.getElementById(id);

const chatEl = $('chat');
const emptyState = $('emptyState');
const unlockPanel = $('unlockPanel');
const input = $('input');
const quoteBar = $('quoteBar');
const quoteText = $('quoteText');

const state = {
  config: null,
  activeModel: null,
  models: [],
  unlocked: false,
  mode: 'empty',
  conversation: [], // {role, content, meta?, raw?, ts?}
  currentId: null,        // 当前对话 id（加载历史后即该历史 id）
  currentStartedAt: null, // 当前对话初次时间
  history: [],            // 历史对话列表缓存
  historyMode: 'normal',  // 'normal' | 'batch'
  selectedChats: new Set(),
  pageUrl: '',
  streaming: false,
  abortCtrl: null,
  pendingQuote: null,
  assistantTextEl: null,
  streamingNote: null,
};

/* ================= 初始化 ================= */

init();

async function init() {
  state.currentId = genId();
  bindEvents();
  await loadConfig();
  await checkPendingQuote();
  listenMessages();
  watchStorageChanges();
}

function genId() {
  return 'c_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

function bindEvents() {
  $('btnOptions').addEventListener('click', () => chrome.runtime.openOptionsPage());
  $('btnClear').addEventListener('click', clearConversation);
  $('btnNewChat').addEventListener('click', newChat);
  $('btnHistory').addEventListener('click', openHistory);
  $('btnHistoryClose').addEventListener('click', closeHistory);
  $('btnHistoryBatch').addEventListener('click', toggleBatchMode);
  $('btnHistoryDeleteSelected').addEventListener('click', deleteSelectedChats);
  $('modelSelect').addEventListener('change', onModelSwitch);
  $('btnEmptyOptions').addEventListener('click', () => chrome.runtime.openOptionsPage());
  $('btnUnlockOptions').addEventListener('click', () => chrome.runtime.openOptionsPage());
  $('btnUnlock').addEventListener('click', doUnlock);
  $('unlockInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') doUnlock(); });
  $('btnSend').addEventListener('click', () => onSend());
  $('btnQuoteClose').addEventListener('click', clearQuote);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (isCommandMenuOpen()) runCommand(COMMANDS[0].id);
      else onSend();
    }
  });
  input.addEventListener('input', () => {
    autoResizeInput();
    handleCommandInput();
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#commandMenu') && !e.target.closest('#input')) hideCommandMenu();
  });
}

function listenMessages() {
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.type === 'QUOTE_READY') checkPendingQuote();
  });
}

// 设置页保存 / 修改主密码后，自动刷新侧边栏状态
function watchStorageChanges() {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.config) {
      loadConfig();
    }
  });
}

/* ================= 配置与状态 ================= */

async function loadConfig() {
  state.config = await getConfig();
  state.unlocked = await isUnlocked();
  state.models = await getAllModels();
  state.activeModel = await getActiveModel();
  updateModelUI();

  const hasModel = state.activeModel && state.activeModel.baseUrl && state.activeModel.model;
  if (!hasModel) {
    setMode('empty');
  } else if (state.config.vaultEnabled && !state.unlocked) {
    setMode('unlock');
  } else {
    setMode('ready');
  }
}

function updateModelUI() {
  const sel = $('modelSelect');
  const nameEl = $('modelName');
  sel.innerHTML = '';
  if (!state.models.length) {
    // 未配置模型：第一行显示「未配置模型」，第二行下拉框隐藏
    nameEl.textContent = '未配置模型';
    sel.classList.add('hidden');
    return;
  }
  sel.classList.remove('hidden');
  const active = state.activeModel || state.models[0];
  nameEl.textContent = active?.name || '未命名';
  state.models.forEach((m) => {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.textContent = m.model || '未设置模型名';
    sel.appendChild(opt);
  });
  sel.value = active?.id || state.models[0]?.id || '';
}

async function onModelSwitch(e) {
  await saveConfig({ activeModelId: e.target.value });
  await loadConfig();
  toast('已切换模型');
}

function setMode(mode) {
  state.mode = mode;
  unlockPanel.classList.toggle('hidden', mode !== 'unlock');
  if (mode === 'unlock') $('unlockInput').focus();
  updateEmptyState();
}

// 空状态：未配置模型 / 已配置但对话为空 都显示「开始使用」引导；
// 区别仅在是否显示「前往设置模型」按钮。
function updateEmptyState() {
  const hasModel = !!(state.activeModel && state.activeModel.baseUrl && state.activeModel.model);
  const chatEmpty = state.conversation.length === 0 && !state.streaming;
  const show = state.mode !== 'unlock' && chatEmpty;
  emptyState.classList.toggle('hidden', !show);
  $('btnEmptyOptions').classList.toggle('hidden', hasModel);
}

async function doUnlock() {
  const pwd = $('unlockInput').value;
  const err = $('unlockErr');
  if (!pwd) return;
  try {
    await unlockVault(pwd);
    err.classList.add('hidden');
    $('unlockInput').value = '';
    await loadConfig();
    toast('已解锁');
  } catch (_) {
    err.textContent = '主密码错误，请重试';
    err.classList.remove('hidden');
  }
}

/* ================= 右键引用 ================= */

async function checkPendingQuote() {
  const data = await chrome.storage.session.get('pendingQuote');
  const q = data.pendingQuote;
  if (!q) return;
  await chrome.storage.session.remove('pendingQuote');

  if (q.intent === 'summarize') {
    await summarizeSelection(q.selection, q.url);
  } else if (q.intent === 'translate') {
    await translateSelection(q.selection, q.url);
  } else {
    state.pendingQuote = q;
    showQuote(q.selection);
    input.placeholder = '针对引用的文字提问…';
    input.focus();
  }
}

function showQuote(selection) {
  state.pendingQuote = { selection };
  quoteText.textContent = selection;
  quoteBar.classList.remove('hidden');
}

function clearQuote() {
  state.pendingQuote = null;
  quoteBar.classList.add('hidden');
  quoteText.textContent = '';
  input.placeholder = '自定义模型，免费更安全。输入/调用更多功能';
}

/* ================= 页面正文获取 ================= */

async function getPageContent() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) return null;
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractPageContent,
    });
    return result?.result || null;
  } catch (_) {
    return null; // 浏览器内部页 / 商店页等无法注入
  }
}

/* ================= 对话动作 ================= */

async function summarizePage() {
  if (state.mode !== 'ready') {
    toast(state.mode === 'unlock' ? '请先解锁主密码' : '请先配置模型');
    return;
  }
  if (state.streaming) return;
  const page = await getPageContent();
  if (!page || !page.text) {
    toast('当前页面无法读取（可能是浏览器内部页）');
    return;
  }
  state.pageUrl = page.url;

  const sys = state.config.summaryPrompt ? state.config.summaryPrompt + '\n\n' : '';
  const content =
    sys +
    `请总结下面的网页内容，用简洁的要点列出重点。\n\n` +
    `【标题】${page.title}\n【网址】${page.url}\n\n【正文】\n${page.text}`;

  pushUser(content, { type: 'page', label: page.title || page.url || '已加载网页' });
  await streamResponse();
}

async function summarizeSelection(selection, url) {
  if (state.streaming) return;
  const content =
    `请总结下面选中的文字，用简洁的要点列出。\n\n` +
    `【来源】${url || state.pageUrl || ''}\n\n【选中文字】\n${selection}`;
  pushUser(content, { type: 'quote', label: '总结选中文字' });
  await streamResponse();
}

async function translateSelection(selection, url) {
  if (state.streaming) return;
  const content =
    `请把下面选中的内容翻译成中文；若原文已是中文，则翻译成英文。只输出译文，不要任何额外解释。\n\n` +
    `【来源】${url || state.pageUrl || ''}\n\n【选中文字】\n${selection}`;
  pushUser(content, { type: 'quote', label: '翻译选中文字' });
  await streamResponse();
}

async function onSend() {
  const text = input.value.trim();
  if (!text) return;
  if (state.streaming) {
    stopStreaming();
    return;
  }
  input.value = '';
  autoResizeInput();

  let content;
  let meta;
  const raw = text; // 用户实际输入的原文，供「修改」回填
  if (state.pendingQuote) {
    const sel = state.pendingQuote.selection;
    content =
      `请针对下面选中的文字回答用户的问题。\n\n` +
      `<引用>\n${sel}\n</引用>\n\n问题：${text}`;
    meta = { type: 'quote', label: '引用提问' };
    clearQuote();
  } else {
    content = text;
    meta = null;
  }

  pushUser(content, meta, raw);
  await streamResponse();
}

/* ================= 消息与流式渲染 ================= */

function pushUser(content, meta, raw) {
  const ts = Date.now();
  if (state.currentStartedAt == null) state.currentStartedAt = ts;
  state.conversation.push({ role: 'user', content, meta: meta || undefined, raw: raw ?? null, ts });
  renderUser(content, meta, raw, ts);
  updateEmptyState();
}

async function streamResponse() {
  state.streaming = true;
  setStreamingUI(true);

  // 渲染空助手气泡
  const bubble = document.createElement('div');
  bubble.className = 'msg assistant';
  const textEl = document.createElement('div');
  textEl.className = 'msg-text';
  bubble.appendChild(textEl);
  chatEl.appendChild(bubble);
  state.assistantTextEl = textEl;
  scrollBottom();

  let acc = '';
  let assistantTs = null;
  state.abortCtrl = new AbortController();

  try {
    await chatStream(
      {
        baseUrl: state.activeModel.baseUrl,
        apiKey: state.activeModel.apiKey,
        model: state.activeModel.model,
        messages: state.conversation.map((m) => ({ role: m.role, content: m.content })),
        signal: state.abortCtrl.signal,
      },
      (delta) => {
        acc += delta;
        textEl.innerHTML = renderMarkdown(acc);
        smartScroll();
      },
    );
    if (acc) {
      assistantTs = Date.now();
      state.conversation.push({ role: 'assistant', content: acc, ts: assistantTs });
    } else {
      textEl.textContent = '（模型未返回内容）';
    }
  } catch (e) {
    if (e && e.name === 'AbortError') {
      if (acc) {
        assistantTs = Date.now();
        state.conversation.push({ role: 'assistant', content: acc, ts: assistantTs });
        textEl.innerHTML = renderMarkdown(acc) + '<p class="md-stopped">[已停止]</p>';
      } else {
        textEl.textContent = '[已停止]';
      }
    } else {
      const msg = '请求失败：' + (e?.message || '未知错误');
      textEl.textContent = msg;
    }
  } finally {
    state.streaming = false;
    state.abortCtrl = null;
    state.assistantTextEl = null;
    setStreamingUI(false);
    finalizeAssistant(bubble, acc, assistantTs || Date.now());
    smartScroll();
  }
}

function stopStreaming() {
  if (state.abortCtrl) state.abortCtrl.abort();
}

function setStreamingUI(streaming) {
  const btn = $('btnSend');
  if (streaming) {
    btn.innerHTML = ICONS.stop;
    btn.title = '停止';
    btn.setAttribute('aria-label', '停止');
    btn.classList.add('stop');
    state.streamingNote = addSystemNote('正在生成…');
  } else {
    btn.innerHTML = ICONS.send;
    btn.title = '发送';
    btn.setAttribute('aria-label', '发送');
    btn.classList.remove('stop');
    if (state.streamingNote) {
      removeSystemNote(state.streamingNote);
      state.streamingNote = null;
    }
  }
}

function renderUser(content, meta, raw, ts) {
  const bubble = document.createElement('div');
  bubble.className = 'msg user';

  if (meta && meta.type === 'page') {
    bubble.classList.add('page-card');
    const t = document.createElement('div');
    t.className = 'card-title';
    t.textContent = '已加载网页';
    const s = document.createElement('div');
    s.className = 'card-sub';
    s.textContent = meta.label || '';
    bubble.appendChild(t);
    bubble.appendChild(s);
  } else if (meta && meta.type === 'quote') {
    bubble.classList.add('quote-msg');
    const label = document.createElement('div');
    label.className = 'quote-label';
    label.textContent = meta.label || '引用';
    bubble.appendChild(label);
    const txt = document.createElement('div');
    txt.className = 'msg-text';
    // 只展示引用原文/问题，不展示完整 prompt
    txt.textContent = summarizeUserText(content);
    bubble.appendChild(txt);
  } else {
    const txt = document.createElement('div');
    txt.className = 'msg-text';
    txt.textContent = content;
    bubble.appendChild(txt);
  }

  // 时间 +（可编辑的聊天消息）复制 / 修改操作
  const row = buildMetaRow(ts || Date.now());
  if (raw != null) {
    const copyBtn = actionBtn('copy', '复制');
    copyBtn.addEventListener('click', () => copyText(raw, copyBtn));
    const editBtn = actionBtn('edit', '修改');
    editBtn.addEventListener('click', () => editUserMessage(raw));
    row.appendChild(copyBtn);
    row.appendChild(editBtn);
  }
  bubble.appendChild(row);

  chatEl.appendChild(bubble);
  scrollBottom();
}

// 引用类消息在气泡里只显示可读摘要（原文已含在正文中）
function summarizeUserText(content) {
  const m = content.match(/<引用>\n([\s\S]*?)\n<\/引用>\n\n问题：([\s\S]*)/);
  if (m) return '“' + m[1].slice(0, 120) + (m[1].length > 120 ? '…' : '') + '”\n\n' + m[2];
  const m2 = content.match(/【选中文字】\n([\s\S]*)/);
  if (m2) return '“' + m2[1].slice(0, 120) + (m2[1].length > 120 ? '…' : '') + '”';
  return content.slice(0, 200);
}

function clearConversation() {
  if (state.streaming) stopStreaming();
  resetChat();
}

// 开启新对话：先归档当前对话到历史，再清空开新的
async function newChat() {
  if (state.streaming) stopStreaming();
  await persistCurrentChat();
  resetChat();
}

// 重置为全新空对话（不保存历史）
function resetChat() {
  state.conversation = [];
  state.currentId = genId();
  state.currentStartedAt = null;
  state.pendingQuote = null;
  chatEl.innerHTML = '';
  clearQuote();
  updateEmptyState();
}

// 把当前对话写入历史（按 id 覆盖），标题直接取首句提问语截断（不做 AI 总结）
async function persistCurrentChat() {
  if (!state.conversation.length) return;
  const existing = state.history.find((c) => c.id === state.currentId);
  const chat = {
    id: state.currentId,
    title: chatTitleFromMessages(state.conversation),
    createdAt: state.currentStartedAt || existing?.createdAt || Date.now(),
    updatedAt: Date.now(),
    messages: state.conversation.map((m) => ({
      role: m.role,
      content: m.content,
      meta: m.meta,
      raw: m.raw,
      ts: m.ts,
    })),
  };
  await upsertChat(chat);
}

// 标题：取用户提问的第一句话的前若干字符（动作类消息用其标签）
function chatTitleFromMessages(messages) {
  const first = messages.find((m) => m.role === 'user');
  if (!first) return '新对话';
  const meta = first.meta || {};

  let text;
  if (meta.type === 'page') {
    // 总结本页：标题带页面名，更易识别
    text = (meta.label && meta.label !== '已加载网页') ? '总结：' + meta.label : '总结本页';
  } else if (meta.type === 'quote') {
    if (meta.label === '引用提问') {
      const m = (first.content || '').match(/问题：([\s\S]*)$/);
      text = m ? m[1].trim() : '引用提问';
    } else {
      text = meta.label || '引用';
    }
  } else {
    // 普通提问：取首句提问语
    text = (first.content || '').trim();
  }

  // 优先取完整的第一句话（截到第一个句末标点）；无标点则截前 40 字符
  const normalized = (text || '').replace(/\s+/g, ' ').trim();
  if (!normalized) return '新对话';
  const end = normalized.search(/[。！？!?.]/);
  const firstSentence = end >= 0 ? normalized.slice(0, end + 1) : normalized;
  const LIMIT = 40;
  return firstSentence.length > LIMIT ? firstSentence.slice(0, LIMIT) + '…' : firstSentence;
}

/* ================= 历史记录 ================= */

async function loadHistory() {
  state.history = await getHistory();
}

function historyPanelOpen() {
  return !$('historyPanel').classList.contains('hidden');
}

async function openHistory() {
  await loadHistory();
  state.historyMode = 'normal';
  state.selectedChats.clear();
  renderHistoryList();
  updateHistoryBar();
  $('historyPanel').classList.remove('hidden');
}

function closeHistory() {
  $('historyPanel').classList.add('hidden');
  state.historyMode = 'normal';
  state.selectedChats.clear();
}

function toggleBatchMode() {
  state.historyMode = state.historyMode === 'batch' ? 'normal' : 'batch';
  state.selectedChats.clear();
  renderHistoryList();
  updateHistoryBar();
}

function updateHistoryBar() {
  const inBatch = state.historyMode === 'batch';
  $('btnHistoryBatch').textContent = inBatch ? '取消' : '批量删除';
  $('historyBatchBar').classList.toggle('hidden', !inBatch);
  if (inBatch) {
    const n = state.selectedChats.size;
    $('historyBatchCount').textContent = `已选 ${n} 项`;
    $('btnHistoryDeleteSelected').disabled = n === 0;
  }
}

async function deleteOneChat(id) {
  await deleteChats([id]);
  if (id === state.currentId) resetChat();
  await loadHistory();
  renderHistoryList();
  updateHistoryBar();
}

async function deleteSelectedChats() {
  if (!state.selectedChats.size) return;
  const ids = [...state.selectedChats];
  await deleteChats(ids);
  if (state.selectedChats.has(state.currentId)) resetChat();
  state.selectedChats.clear();
  state.historyMode = 'normal';
  await loadHistory();
  renderHistoryList();
  updateHistoryBar();
}

async function openChat(id) {
  const chat = state.history.find((c) => c.id === id);
  if (!chat) return;
  if (state.streaming) stopStreaming();
  closeHistory();
  state.currentId = chat.id;
  state.currentStartedAt = chat.createdAt || Date.now();
  state.pendingQuote = null;
  clearQuote();
  state.conversation = (chat.messages || []).map((m) => ({
    role: m.role,
    content: m.content,
    meta: m.meta,
    raw: m.raw,
    ts: m.ts,
  }));
  renderConversation();
}

function renderHistoryList() {
  const list = $('historyList');
  list.innerHTML = '';
  if (!state.history.length) {
    const empty = document.createElement('div');
    empty.className = 'history-empty';
    empty.textContent = '暂无历史对话';
    list.appendChild(empty);
    return;
  }
  state.history.forEach((c) => {
    const item = document.createElement('div');
    item.className = 'history-item' + (state.selectedChats.has(c.id) ? ' selected' : '');
    item.dataset.id = c.id;

    const main = document.createElement('div');
    main.className = 'history-item-main';
    const title = document.createElement('div');
    title.className = 'history-item-title';
    title.textContent = c.title || '新对话';
    const time = document.createElement('div');
    time.className = 'history-item-time';
    time.textContent = formatFullTime(c.createdAt);
    main.appendChild(title);
    main.appendChild(time);
    item.appendChild(main);

    if (state.historyMode === 'batch') {
      const check = document.createElement('div');
      check.className = 'history-check' + (state.selectedChats.has(c.id) ? ' on' : '');
      check.textContent = state.selectedChats.has(c.id) ? '✓' : '';
      item.appendChild(check);
    } else {
      const del = actionBtn('delete', '删除该对话');
      del.classList.add('history-del');
      del.addEventListener('click', (e) => { e.stopPropagation(); deleteOneChat(c.id); });
      item.appendChild(del);
    }

    item.addEventListener('click', () => {
      if (state.historyMode === 'batch') toggleSelect(c.id);
      else openChat(c.id);
    });
    list.appendChild(item);
  });
}

function toggleSelect(id) {
  if (state.selectedChats.has(id)) state.selectedChats.delete(id);
  else state.selectedChats.add(id);
  renderHistoryList();
  updateHistoryBar();
}

/* ================= 命令菜单（输入 / 触发） ================= */

const COMMANDS = [
  {
    id: 'summary',
    label: '总结本页',
    desc: '总结当前网页内容',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
    run: () => summarizePage(),
  },
];

function renderCommandMenu() {
  const menu = $('commandMenu');
  menu.innerHTML = '';
  COMMANDS.forEach((c) => {
    const item = document.createElement('div');
    item.className = 'command-item';
    const icon = document.createElement('span');
    icon.className = 'cmd-icon';
    icon.innerHTML = c.icon;
    const body = document.createElement('span');
    body.className = 'cmd-body';
    const label = document.createElement('span');
    label.className = 'cmd-label';
    label.textContent = c.label;
    const desc = document.createElement('span');
    desc.className = 'cmd-desc';
    desc.textContent = c.desc;
    body.appendChild(label);
    body.appendChild(desc);
    item.appendChild(icon);
    item.appendChild(body);
    item.addEventListener('click', () => runCommand(c.id));
    menu.appendChild(item);
  });
}

function showCommandMenu() {
  renderCommandMenu();
  $('commandMenu').classList.remove('hidden');
}

function hideCommandMenu() {
  $('commandMenu').classList.add('hidden');
}

function isCommandMenuOpen() {
  return !$('commandMenu').classList.contains('hidden');
}

function handleCommandInput() {
  // 输入框首字符为 / 时，向上展开命令菜单
  if (input.value === '/') showCommandMenu();
  else hideCommandMenu();
}

function runCommand(id) {
  const cmd = COMMANDS.find((c) => c.id === id);
  hideCommandMenu();
  input.value = '';
  autoResizeInput();
  if (cmd) cmd.run();
}

/* ================= 工具函数 ================= */

function autoResizeInput() {
  input.style.height = 'auto';
  input.style.height = Math.min(input.scrollHeight, 120) + 'px';
}

function scrollBottom() {
  chatEl.scrollTop = chatEl.scrollHeight;
}

// 用户是否已在底部附近（阈值内视为「在看最新内容」）
function isNearBottom() {
  return chatEl.scrollHeight - chatEl.scrollTop - chatEl.clientHeight <= 48;
}

// 仅在用户原本就在底部附近时才跟随滚动；用户上滑阅读时保持位置不动，
// 避免流式生成新内容时页面被反复拽回底部。
function smartScroll() {
  if (isNearBottom()) chatEl.scrollTop = chatEl.scrollHeight;
}

function addSystemNote(text) {
  const note = document.createElement('div');
  note.className = 'msg system-note';
  note.textContent = text;
  chatEl.appendChild(note);
  emptyState.classList.add('hidden');
  scrollBottom();
  return note;
}

function removeSystemNote(el) {
  if (el && el.parentNode) el.parentNode.removeChild(el);
}

function toast(text) {
  addSystemNote(text);
}

/* ================= 消息元信息（时间 / 复制 / 修改） ================= */

function formatTime(ts) {
  const d = new Date(ts);
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

// 历史列表用的完整时间：跨年带年份，否则 MM-DD HH:mm:ss
function formatFullTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const p = (n) => String(n).padStart(2, '0');
  const now = new Date();
  const date = d.getFullYear() === now.getFullYear()
    ? `${p(d.getMonth() + 1)}-${p(d.getDate())}`
    : `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  return `${date} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function buildMetaRow(ts) {
  const row = document.createElement('div');
  row.className = 'msg-meta';
  const t = document.createElement('span');
  t.className = 'msg-time';
  t.textContent = formatTime(ts);
  row.appendChild(t);
  return row;
}

const ICONS = {
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  delete: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
  send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
  stop: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>',
};

function actionBtn(kind, title) {
  const btn = document.createElement('button');
  btn.className = 'msg-action';
  btn.type = 'button';
  btn.title = title;
  btn.setAttribute('aria-label', title);
  btn.innerHTML = ICONS[kind];
  return btn;
}

async function copyText(text, btn) {
  let ok = false;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      ok = true;
    }
  } catch (_) {}
  if (!ok) ok = fallbackCopy(text);
  if (ok) {
    if (btn) flashOk(btn);
    else toast('已复制');
  } else {
    toast('复制失败');
  }
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

function flashOk(btn) {
  const orig = btn.innerHTML;
  btn.innerHTML = ICONS.check;
  btn.classList.add('ok');
  setTimeout(() => {
    btn.innerHTML = orig;
    btn.classList.remove('ok');
  }, 1500);
}

function editUserMessage(raw) {
  input.value = raw;
  autoResizeInput();
  input.focus();
}

function finalizeAssistant(bubble, acc, ts) {
  const row = buildMetaRow(ts || Date.now());
  if (acc) {
    const copyBtn = actionBtn('copy', '复制回答');
    copyBtn.addEventListener('click', () => copyText(acc, copyBtn));
    row.appendChild(copyBtn);
  }
  bubble.appendChild(row);
}

// 历史回显用：一次性渲染一条助手消息（含 Markdown + 时间 + 复制）
function renderAssistant(content, ts) {
  const bubble = document.createElement('div');
  bubble.className = 'msg assistant';
  const textEl = document.createElement('div');
  textEl.className = 'msg-text';
  textEl.innerHTML = content ? renderMarkdown(content) : '';
  bubble.appendChild(textEl);
  const row = buildMetaRow(ts || Date.now());
  if (content) {
    const copyBtn = actionBtn('copy', '复制回答');
    copyBtn.addEventListener('click', () => copyText(content, copyBtn));
    row.appendChild(copyBtn);
  }
  bubble.appendChild(row);
  chatEl.appendChild(bubble);
  return bubble;
}

// 全量渲染当前对话（加载历史 / 新对话后回显）
function renderConversation() {
  chatEl.innerHTML = '';
  state.conversation.forEach((m) => {
    if (m.role === 'user') renderUser(m.content, m.meta, m.raw, m.ts);
    else renderAssistant(m.content, m.ts);
  });
  updateEmptyState();
  scrollBottom();
}
