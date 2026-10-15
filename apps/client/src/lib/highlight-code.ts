const KEYWORDS = [
  'abstract', 'as', 'async', 'await', 'boolean', 'break', 'case', 'catch', 'class', 'const',
  'continue', 'def', 'default', 'delete', 'do', 'elif', 'else', 'enum', 'export', 'extends',
  'false', 'finally', 'for', 'from', 'function', 'if', 'implements', 'import', 'in', 'instanceof',
  'int', 'interface', 'let', 'long', 'new', 'null', 'package', 'private', 'protected', 'public',
  'return', 'static', 'string', 'String', 'struct', 'super', 'switch', 'this', 'throw', 'true',
  'try', 'typeof', 'undefined', 'var', 'void', 'while', 'yield', 'SELECT', 'FROM', 'WHERE',
  'INSERT', 'UPDATE', 'DELETE', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'ON', 'AND', 'OR', 'NOT',
  'NULL', 'CREATE', 'TABLE', 'INTO', 'VALUES', 'GROUP', 'ORDER', 'BY', 'LIMIT', 'bool', 'char',
  'double', 'float', 'namespace', 'using', 'include', 'cout', 'cin', 'std', 'vector',
];

const keywordPattern = new RegExp(`\\b(${KEYWORDS.join('|')})\\b`, 'g');

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function commentPattern(language: string) {
  const lang = language.toLowerCase();
  if (lang === 'python' || lang === 'py' || lang === 'bash' || lang === 'sh' || lang === 'shell') {
    return /#.*$/;
  }
  if (lang === 'sql') return /--.*$/;
  return /\/\/.*$/;
}

export function guessLanguage(source: string) {
  if (/\bpublic class\b|\bSystem\.out\b|\bvoid main\b/.test(source)) return 'java';
  if (/\bconsole\.log\b|\bfunction\b|\bconst\b|\blet\b|\b=>\b/.test(source)) return 'javascript';
  if (/\bdef \b|\bprint\(/.test(source)) return 'python';
  if (/\bSELECT\b|\bFROM\b/i.test(source)) return 'sql';
  return '';
}

/** Turn a one-line snippet into indented lines so the reading view can show a real block. */
export function formatSnippet(source: string) {
  const normalized = source.replace(/\r\n/g, '\n').trim();
  if (normalized.includes('\n') || !/[{;}]/.test(normalized)) return normalized;

  let raw = '';
  let quote: string | null = null;
  let escaped = false;
  for (const char of normalized) {
    if (quote) {
      raw += char;
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        continue;
      }
      if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      raw += char;
      continue;
    }
    if (char === '{') {
      raw += '{\n';
      continue;
    }
    if (char === '}') {
      raw += '\n}\n';
      continue;
    }
    if (char === ';') {
      raw += ';\n';
      continue;
    }
    raw += char;
  }

  let level = 0;
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      if (line.startsWith('}')) level = Math.max(0, level - 1);
      const indented = `${'    '.repeat(level)}${line}`;
      if (line.endsWith('{')) level += 1;
      return indented;
    })
    .join('\n');
}

export function languageLabel(language: string) {
  const lang = language.toLowerCase();
  const names: Record<string, string> = {
    js: 'JavaScript',
    javascript: 'JavaScript',
    ts: 'TypeScript',
    typescript: 'TypeScript',
    py: 'Python',
    python: 'Python',
    java: 'Java',
    cpp: 'C++',
    c: 'C',
    cs: 'C#',
    csharp: 'C#',
    sql: 'SQL',
    html: 'HTML',
    css: 'CSS',
    json: 'JSON',
    bash: 'Bash',
    sh: 'Shell',
    shell: 'Shell',
    go: 'Go',
    rust: 'Rust',
    php: 'PHP',
    xml: 'XML',
    md: 'Markdown',
    text: 'Text',
  };
  return names[lang] || (language ? language.charAt(0).toUpperCase() + language.slice(1) : 'Code');
}

export function highlightLine(line: string, language = '') {
  const stash: string[] = [];
  const hold = (html: string) => {
    const token = `\u0001${'x'.repeat(stash.length + 1)}\u0001`;
    stash.push(html);
    return token;
  };

  let text = escapeHtml(line);
  text = text.replace(commentPattern(language), (match) => hold(`<span class="tok-comment">${match}</span>`));
  text = text.replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`/g, (match) =>
    hold(`<span class="tok-string">${match}</span>`),
  );
  text = text.replace(/\b\d+(?:\.\d+)?\b/g, (match) => hold(`<span class="tok-number">${match}</span>`));
  keywordPattern.lastIndex = 0;
  text = text.replace(keywordPattern, (match) => hold(`<span class="tok-keyword">${match}</span>`));
  text = text.replace(/\b[A-Za-z_]\w*(?=\s*\()/g, (match) => hold(`<span class="tok-fn">${match}</span>`));
  return text.replace(/\u0001(x+)\u0001/g, (_, marks: string) => stash[marks.length - 1] ?? '');
}
