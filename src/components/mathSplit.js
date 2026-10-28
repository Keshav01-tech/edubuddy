// Turn over-escaped model text into the LaTeX KaTeX expects, then split it into words and formulas.

const DELIM = /\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)|\$\$([\s\S]+?)\$\$|(?<!\$)\$([^$\n]+?)\$(?!\$)/g;

const COMMAND = 'begin|end|frac|dfrac|tfrac|sqrt|sin|cos|tan|cot|sec|csc|log|ln|lim|int|sum|prod|left|right|text|mathrm|mathbf|mathbb|le|ge|leq|geq|ne|neq|to|infty|pi|theta|alpha|beta|gamma|circ|times|cdot|pm|partial|Delta|ldots|cdots|quad|displaystyle|overline|underline|vec|hat|bar';

// \( and \) sometimes come back as a null, the letters u0000, or a box.
const BROKEN_DELIM = /\\u0000|\u0000|\uFFFD|\u25A1(?:000+)?|u0000/g;

const SUPERSCRIPT = {
  '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
  'ⁿ': 'n', 'ⁱ': 'i', '⁺': '+', '⁻': '-',
};

export function sourceIsBroken(source) {
  const text = String(source || '');
  if (/\\u0000|\u0000|\uFFFD|\u25A1(?:000+)?|u0000/.test(text)) return true;
  return /(^|[^\\])(?:begin|end|frac|dfrac)\{/.test(text);
}

function repairDelimiters(text) {
  const marks = [];
  BROKEN_DELIM.lastIndex = 0;
  let next = text.replace(BROKEN_DELIM, () => {
    marks.push(true);
    return '\uE000';
  });
  BROKEN_DELIM.lastIndex = 0;
  if (!marks.length) return next;
  if (marks.length % 2 === 1) {
    const at = next.lastIndexOf('\uE000');
    next = next.slice(0, at) + next.slice(at + 1);
  }
  let open = true;
  return next.replace(/\uE000/g, () => {
    const token = open ? '\\(' : '\\)';
    open = !open;
    return token;
  });
}

function restoreCommands(text) {
  let next = text
    .replace(/\u0008egin\{/g, '\\begin{')
    .replace(/\u000Crac\{/g, '\\frac{')
    .replace(/\u0009frac\{/g, '\\tfrac{')
    .replace(/\u0009an\b/g, '\\tan')
    .replace(/\u0009heta\b/g, '\\theta')
    .replace(/\u0009ext\{/g, '\\text{')
    .replace(/\u0009imes\b/g, '\\times')
    .replace(/\u000Dight\b/g, '\\right')
    .replace(/(^|[^\\])(?<![A-Za-z])egin\{/g, '$1\\begin{')
    .replace(/(^|[^\\])(?<![A-Za-z])rac\{/g, '$1\\frac{')
    .replace(new RegExp(`(^|[^\\\\])(?<![A-Za-z])(${COMMAND})\\{`, 'g'), '$1\\$2{');
  if (!/[\\$^_⁰¹²³⁴⁵⁶⁷⁸⁹]|u0000|begin\{|end\{/.test(text)) return next;
  return next.replace(/(^|[^\\])(?<![A-Za-z])(sin|cos|tan|cot|sec|csc|log|ln|lim|infty|sqrt|pi|theta|alpha|beta|gamma)(?![A-Za-z])/g, '$1\\$2');
}

export function normalizeTexSource(source) {
  let text = restoreCommands(repairDelimiters(String(source || '')));
  let previous;
  do {
    previous = text;
    // Collapse exactly two backslashes before a command (\\sin → \sin).
    // Three backslashes are a line break plus a command (\\\tan stays), which a cases row needs.
    text = text.replace(new RegExp(`(?<!\\\\)\\\\{2}(?=(?:${COMMAND})\\b|[()\\[\\]])`, 'g'), '\\');
  } while (text !== previous);
  // A single backslash glued to a number, as in "\15", is a broken "\(" delimiter.
  // A line break is two backslashes, including before a row that starts with a digit.
  text = text.replace(/(?<!\\)\\(?=\d)/g, '');
  return text;
}

const UNIT = 'm|cm|mm|km|kg|mg|g|s|ms|N|J|W|Hz|Pa|mol|min';

const ROW_RELATION = new Set(['le', 'ge', 'leq', 'geq', 'ne', 'neq', 'lt', 'gt', 'to', 'in', 'subset', 'cdots', 'ldots', 'cdot', 'times', 'pm', 'mp', 'quad', 'qquad', 'left', 'right']);

// A cases block whose row break was lost still has one & per row, jammed into the previous cell.
function repairCases(tex) {
  return tex.replace(/\\begin\{cases\}([\s\S]*?)\\end\{cases\}/g, (full, inner) => {
    if (inner.includes('\\\\')) return full;
    let next = inner;
    for (let guard = 0; guard < 6; guard += 1) {
      if (next.includes('\\\\')) break;
      const amps = [];
      for (let i = 0; i < next.length; i += 1) if (next[i] === '&') amps.push(i);
      if (amps.length < 2) break;
      let inserted = false;
      for (let i = 0; i < amps.length - 1; i += 1) {
        const between = next.slice(amps[i] + 1, amps[i + 1]);
        const cmds = [...between.matchAll(/\\([a-zA-Z]+)/g)];
        const row = [...cmds].reverse().find((cmd) => !ROW_RELATION.has(cmd[1]));
        if (!row) continue;
        const at = amps[i] + 1 + row.index;
        next = `${next.slice(0, at)}\\\\${next.slice(at)}`;
        inserted = true;
        break;
      }
      if (!inserted) break;
    }
    return next === inner ? full : `\\begin{cases}${next}\\end{cases}`;
  });
}

function tidyTex(tex) {
  return repairCases(expandSupers(tex))
    .trim()
    .replace(/≥/g, '\\ge ')
    .replace(/≤/g, '\\le ')
    .replace(/≠/g, '\\ne ')
    .replace(/×/g, '\\times ')
    .replace(/→/g, '\\to ')
    .replace(/∞/g, '\\infty ')
    .replace(/π/g, '\\pi ')
    .replace(/ℝ/g, '\\mathbb{R}')
    .replace(/∈/g, '\\in ')
    .replace(new RegExp(`(?<!\\\\)\\\\ +(${UNIT})\\b`, 'g'), '\\,\\mathrm{$1}')
    .replace(new RegExp(`\\s+(${UNIT})\\s*$`), '\\,\\mathrm{$1}');
}

const SUPERS = Object.keys(SUPERSCRIPT).join('');

function expandSupers(text) {
  return text.replace(new RegExp(`([A-Za-z0-9)])([${SUPERS}]+)`, 'g'), (_, base, marks) => {
    const exp = [...marks].map((mark) => SUPERSCRIPT[mark] || mark).join('');
    return `${base}^{${exp}}`;
  });
}

const ATOM = String.raw`(?:[0-9]*[A-Za-z]+(?:\([^)]*\))?(?:\^\{[^{}]+\}|\^[0-9A-Za-z]+|_[0-9A-Za-z]+|_\{[^{}]+\})*|[0-9]+(?:\^\{[^{}]+\}|\^[0-9A-Za-z]+)?)`;
const POWERED = new RegExp(String.raw`(?<![A-Za-z\\])${ATOM}(?:\s*[+\-=<>]\s*${ATOM})*`, 'g');

function environmentSpans(text) {
  const spans = [];
  const re = /(?:[A-Za-z](?:\([^)]*\))?\s*=\s*)?\\begin\{[a-zA-Z*]+\}[\s\S]*?\\end\{[a-zA-Z*]+\}/g;
  for (const match of text.matchAll(re)) {
    spans.push([match.index, match.index + match[0].length]);
  }
  return spans;
}

function caretSpans(text) {
  const spans = [];
  for (const match of text.matchAll(POWERED)) {
    if (!/[\^_]/.test(match[0])) continue;
    const start = match.index;
    let end = start + match[0].length;
    while (end > start && text[end - 1] === ' ') end -= 1;
    spans.push([start, end]);
  }
  return spans;
}

function pureMath(text) {
  if (!/\\[a-zA-Z]+/.test(text)) return false;
  const words = text.match(/[A-Za-z]{2,}/g) || [];
  return words.every((word) => /^(sin|cos|tan|log|ln|pi|frac|sqrt|circ|text|mathrm|mathbf|theta|alpha|beta|gamma|deg|times|cdot)$/.test(word));
}

function bareSpans(text) {
  const spans = [];
  const command = /\\[a-zA-Z]+/g;
  for (const match of text.matchAll(command)) {
    let start = match.index;
    let end = match.index + match[0].length;
    while (start > 0 && /[0-9.+\-=^_({]/.test(text[start - 1])) start -= 1;
    if (start > 0 && text[start - 1] === ' ' && /[0-9.]/.test(text[start])) {
      let gap = start - 1;
      while (gap > 0 && text[gap - 1] === ' ') gap -= 1;
      if (gap === 0 || /[=+\-/*^(]/.test(text[gap - 1])) start = gap;
    }
    let depth = 0;
    while (end < text.length) {
      const char = text[end];
      if (char === '{') depth += 1;
      else if (char === '}') depth = Math.max(0, depth - 1);
      else if (depth === 0 && /[A-Za-z]/.test(char) && !/\\[a-zA-Z]+$/.test(text.slice(start, end + 1))) {
        const rest = text.slice(end);
        if (/^[A-Za-z]{2,}(?![a-zA-Z])/.test(rest) && !/^(sin|cos|tan|log|ln|pi)/.test(rest)) break;
        if (/^[A-Za-z]{2,}/.test(rest)) break;
      }
      if (depth === 0 && char === ' ') {
        const rest = text.slice(end + 1);
        if (!rest || /^[A-Za-z]{2,}(?![a-zA-Z])/.test(rest)) break;
        if (!/^(\\[a-zA-Z]|[0-9.+\-=^_({])/.test(rest)) break;
      }
      if (depth === 0 && !/[0-9.+\-=^_\\{}()[\]a-zA-Z\s]/.test(char)) break;
      end += 1;
    }
    spans.push([start, end]);
  }
  if (!spans.length) return [];
  spans.sort((a, b) => a[0] - b[0]);
  const merged = [spans[0]];
  for (const span of spans.slice(1)) {
    const last = merged[merged.length - 1];
    if (span[0] <= last[1]) last[1] = Math.max(last[1], span[1]);
    else merged.push(span);
  }
  return merged;
}

export function splitMath(source) {
  const text = normalizeTexSource(source);
  if (!text) return [];
  const parts = [];
  let last = 0;
  for (const match of text.matchAll(DELIM)) {
    if (match.index > last) parts.push(...splitPlain(text.slice(last, match.index)));
    const tex = tidyTex(match[1] ?? match[2] ?? match[3] ?? match[4]);
    const display = match[1] != null || match[3] != null || /\\begin\{/.test(tex);
    parts.push({ tex, display });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(...splitPlain(text.slice(last)));
  return parts.filter((part) => part.tex || part.text);
}

function mergeSpans(spans) {
  if (!spans.length) return [];
  spans.sort((a, b) => a[0] - b[0] || b[1] - a[1]);
  const merged = [spans[0].slice()];
  for (const span of spans.slice(1)) {
    const last = merged[merged.length - 1];
    if (span[0] <= last[1]) last[1] = Math.max(last[1], span[1]);
    else merged.push(span.slice());
  }
  return merged;
}

function splitPlain(text) {
  if (!text) return [];
  const expanded = expandSupers(text);
  if (pureMath(expanded)) return [{ tex: tidyTex(expanded), display: /\\begin\{/.test(expanded) }];
  const spans = mergeSpans([...environmentSpans(expanded), ...bareSpans(expanded), ...caretSpans(expanded)]);
  if (!spans.length) return [{ text: expanded }];
  const parts = [];
  let cursor = 0;
  for (const [start, end] of spans) {
    if (start > cursor) parts.push({ text: expanded.slice(cursor, start) });
    const tex = tidyTex(expanded.slice(start, end));
    parts.push({ tex, display: /\\begin\{/.test(tex) });
    cursor = end;
  }
  if (cursor < expanded.length) parts.push({ text: expanded.slice(cursor) });
  return parts;
}
