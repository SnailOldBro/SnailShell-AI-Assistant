// ============================================================
// service-worker.js —— 轻量后台路由（ESM）
//
// 职责（保持极简，不做长任务，避免被回收打断）：
//   1. 点击工具栏图标 → 打开侧边栏
//   2. 注册右键菜单（选中文字上下文）
//   3. 右键点击 → 把选中文字 + 意图存入 chrome.storage.session，
//      再打开侧边栏并通知其处理
//
// 注意：LLM 请求不放在这里（SW 随时会被回收，长流式请求会中断），
//      统一由常驻的侧边栏页面发起。
// ============================================================

const PENDING_KEY = 'pendingQuote';

// 点击工具栏图标 → 打开当前标签页的侧边栏
chrome.action.onClicked.addListener(async (tab) => {
  if (tab && tab.id) {
    try {
      await chrome.sidePanel.open({ tabId: tab.id });
    } catch (_) {
      /* 极少数环境不支持按 tab 打开，忽略 */
    }
  }
});

// 安装 / 升级时注册右键菜单（只建一次，避免重复）
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'summarize-selection',
    title: 'AI 总结选中内容',
    contexts: ['selection'],
  });
  chrome.contextMenus.create({
    id: 'ask-selection',
    title: 'AI 就这段内容提问',
    contexts: ['selection'],
  });
  chrome.contextMenus.create({
    id: 'translate-selection',
    title: 'AI 翻译选中内容',
    contexts: ['selection'],
  });
});

// 右键点击 → 存引用 → 打开侧边栏 → 通知侧边栏
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const selection = (info.selectionText || '').trim();
  if (!selection) return;

  const intent = info.menuItemId === 'summarize-selection' ? 'summarize'
    : info.menuItemId === 'translate-selection' ? 'translate'
    : 'ask';

  await chrome.storage.session.set({
    [PENDING_KEY]: {
      selection,
      intent,
      url: info.pageUrl || '',
      ts: Date.now(),
    },
  });

  if (tab && tab.id) {
    try {
      await chrome.sidePanel.open({ tabId: tab.id });
    } catch (_) {}
  }

  // 若侧边栏已经打开，通知它立即处理（无接收者时静默忽略）
  chrome.runtime.sendMessage({ type: 'QUOTE_READY' }).catch(() => {});
});
