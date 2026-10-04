// ============================================================
// markdown.js —— 轻量、安全的 Markdown 渲染器（ESM）
//
// 覆盖：标题、粗体/斜体、行内代码、代码块、有序/无序列表、
//       链接、表格、引用、删除线、段落。
//
// 安全红线：所有文本先做 HTML 转义（模型输出一律当作纯文本），
// 链接只允许 http/https/mailto 协议，杜绝 javascript: 等 XSS 注入。
// ============================================================

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// 占位符：用于在转义前保护安全的 <br> 标签，转义后再还原。
// 选择 NUL 字符是因为正常文本不会出现，且 escapeHtml 不会改动它。
const BR_PLACEHOLDER = '\u0000BR\u0000';

function renderInline(s) {
  // 模型输出里常混有 <br> / <br/> / <br /> 换行标签，先保护起来，
  // 其余一切 HTML 标签仍按纯文本转义，杜绝 XSS。
  let t = String(s).replace(/<br\s*\/?>/gi, BR_PLACEHOLDER);
  t = escapeHtml(t);
  t = t.replace(new RegExp(BR_PLACEHOLDER, 'g'), '<br>');
  // 行内代码 `...`
  t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
  // 链接 [text](url) —— 协议白名单
  t = t.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)\s]+|mailto:[^)\s]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
  );
  // 粗体 **...** 或 __...__
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  // 删除线 ~~...~~
  t = t.replace(/~~([^~]+)~~/g, '<del>$1</del>');
  // 斜体 *...*
  t = t.replace(/(^|[^*\w])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
  return t;
}

function parseTableRow(line) {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
}

function isTableSep(line) {
  return /^\s*\|?[\s:|-]+\|?\s*$/.test(line) && line.includes('-');
}

function renderTable(header, rows) {
  const head = '<thead><tr>' + header.map((c) => '<th>' + renderInline(c) + '</th>').join('') + '</tr></thead>';
  const body = '<tbody>' + rows.map((r) => '<tr>' + r.map((c) => '<td>' + renderInline(c) + '</td>').join('') + '</tr>').join('') + '</tbody>';
  return '<table>' + head + body + '</table>';
}

function isBlockStart(line) {
  return /^\s*(#{1,6}\s|```|[-*+]\s|\d+[.)]\s|>)/.test(line);
}

export function renderMarkdown(md) {
  if (!md) return '';
  const lines = String(md).replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // 代码块
    if (/^\s*```/.test(line)) {
      const code = [];
      i++;
      while (i < lines.length && !/^\s*```/.test(lines[i])) {
        code.push(lines[i]);
        i++;
      }
      i++; // 跳过结束 ```
      out.push('<pre><code>' + escapeHtml(code.join('\n')) + '</code></pre>');
      continue;
    }

    // 表格
    if (line.includes('|') && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      const header = parseTableRow(line);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].includes('|')) {
        rows.push(parseTableRow(lines[i]));
        i++;
      }
      out.push(renderTable(header, rows));
      continue;
    }

    // 标题
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      out.push('<h' + h[1].length + '>' + renderInline(h[2]) + '</h' + h[1].length + '>');
      i++;
      continue;
    }

    // 无序列表（条目间允许空行，避免被拆成多个 <ul>）
    if (/^\s*[-*+]\s+/.test(line)) {
      const items = [];
      while (i < lines.length) {
        if (/^\s*[-*+]\s+/.test(lines[i])) {
          items.push('<li>' + renderInline(lines[i].replace(/^\s*[-*+]\s+/, '')) + '</li>');
          i++;
        } else if (lines[i].trim() === '') {
          i++;
        } else {
          break;
        }
      }
      out.push('<ul>' + items.join('') + '</ul>');
      continue;
    }

    // 有序列表（条目间允许空行，避免被拆成多个 <ol> 导致编号都从 1 重新开始）
    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items = [];
      while (i < lines.length) {
        if (/^\s*\d+[.)]\s+/.test(lines[i])) {
          items.push('<li>' + renderInline(lines[i].replace(/^\s*\d+[.)]\s+/, '')) + '</li>');
          i++;
        } else if (lines[i].trim() === '') {
          i++;
        } else {
          break;
        }
      }
      out.push('<ol>' + items.join('') + '</ol>');
      continue;
    }

    // 引用
    if (/^\s*>\s?/.test(line)) {
      const quote = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        quote.push(lines[i].replace(/^\s*>\s?/, ''));
        i++;
      }
      out.push('<blockquote>' + renderInline(quote.join('<br>')) + '</blockquote>');
      continue;
    }

    // 空行
    if (line.trim() === '') { i++; continue; }

    // 段落（合并连续非空、非块起始的行）
    const para = [];
    while (i < lines.length && lines[i].trim() !== '' && !isBlockStart(lines[i])) {
      para.push(lines[i]);
      i++;
    }
    // 保护：若当前行是未被上方识别的块起始，强制推进，防止死循环
    if (para.length === 0) { i++; continue; }
    out.push('<p>' + renderInline(para.join('<br>')) + '</p>');
  }

  return out.join('');
}
