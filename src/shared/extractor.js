// ============================================================
// extractor.js —— 页面正文提取 + 选中文字（ESM，供按需注入）
//
// 重要约束：这两个导出函数会被 chrome.scripting.executeScript({func})
// 序列化后注入到目标页面执行，因此必须「完全自包含」——
// 所有 helper 都要定义在函数体内部，不能引用模块作用域变量。
//
// 选择器只取语义类（article / main / .article / .content 等），
// 不用 Vue scoped（data-v-xxxx）、React __jsx 等构建期随机类名。
// ============================================================

/**
 * 提取当前页面正文。返回 { title, description, text, url }。
 * 采用「候选容器打分」启发式：正文文本长、链接密度低者胜出，
 * 找不到语义容器时退回 body 全文（innerText 天然排除脚本/样式）。
 */
export function extractPageContent() {
  const MAX_LEN = 30000;

  function cleanText(t) {
    return (t || '')
      .replace(/\u00a0/g, ' ')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  function scoreBlock(el) {
    const text = el.innerText || '';
    const len = text.replace(/\s+/g, '').length;
    let linkLen = 0;
    const links = el.querySelectorAll('a');
    for (let i = 0; i < links.length; i++) linkLen += (links[i].innerText || '').length;
    const density = len > 0 ? linkLen / len : 1;
    return len * (1 - density);
  }

  const title = document.title || '';
  const descEl = document.querySelector('meta[name="description"]');
  const description = descEl ? descEl.getAttribute('content') || '' : '';

  const selectors = [
    'article', 'main', '[role="main"]',
    '.article', '.article-content', '.post', '.post-content',
    '.content', '.entry-content', '.markdown-body', '#content', '#main',
  ];

  const seen = new Set();
  const candidates = [];
  for (let i = 0; i < selectors.length; i++) {
    const nodes = document.querySelectorAll(selectors[i]);
    for (let j = 0; j < nodes.length; j++) {
      if (!seen.has(nodes[j])) {
        seen.add(nodes[j]);
        candidates.push(nodes[j]);
      }
    }
  }

  let best = null;
  let bestScore = 0;
  for (let i = 0; i < candidates.length; i++) {
    const s = scoreBlock(candidates[i]);
    if (s > bestScore) {
      bestScore = s;
      best = candidates[i];
    }
  }

  let text = best ? cleanText(best.innerText) : cleanText(document.body.innerText);
  if (text.length > MAX_LEN) text = text.slice(0, MAX_LEN) + '\n\n[内容过长，已截断]';

  return { title, description, text, url: location.href };
}

/** 返回主文档当前选中的文字（空串表示未选中）。 */
export function getSelectedText() {
  return window.getSelection ? String(window.getSelection()) : '';
}
