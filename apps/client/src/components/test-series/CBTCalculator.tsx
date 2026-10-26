import React, { useState } from 'react';

interface Props {
  readonly onUseValue?: (value: string) => void;
  readonly onClose: () => void;
}

type Op = '+' | '-' | '*' | '/' | '^' | '%';
type Fn = 'sin' | 'cos' | 'tan' | 'log' | 'ln' | 'sqrt' | 'cbrt';
type Tok =
  | { kind: 'num'; value: number }
  | { kind: 'op'; value: Op }
  | { kind: 'fn'; value: Fn }
  | { kind: 'lp' }
  | { kind: 'rp' };

const FUNCTIONS = ['sqrt', 'cbrt', 'sin', 'cos', 'tan', 'log', 'ln'] as const;

function formatResult(value: number): string {
  if (!Number.isFinite(value)) return 'Error';
  const rounded = Math.round(value * 1e10) / 1e10;
  const text = String(rounded);
  return text.length > 14 ? value.toExponential(8).replace(/\.?0+e/, 'e') : text;
}

function tokenize(source: string, ans: number): Tok[] {
  const input = source
    .replace(/π/g, `(${Math.PI})`)
    .replace(/Ans/g, `(${ans})`)
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/(\d|\))\s*(?=[(π])/g, '$1*');
  const tokens: Tok[] = [];
  let index = 0;
  while (index < input.length) {
    const char = input[index];
    if (char === ' ' || char === '\n') {
      index += 1;
      continue;
    }
    if (char === '(') {
      tokens.push({ kind: 'lp' });
      index += 1;
      continue;
    }
    if (char === ')') {
      tokens.push({ kind: 'rp' });
      index += 1;
      continue;
    }
    if ('+-*/^%'.includes(char)) {
      tokens.push({ kind: 'op', value: char as Op });
      index += 1;
      continue;
    }
    const fn = FUNCTIONS.find((name) => input.startsWith(name, index));
    if (fn) {
      tokens.push({ kind: 'fn', value: fn });
      index += fn.length;
      continue;
    }
    const number = /^\d*\.?\d+(?:e[+-]?\d+)?/i.exec(input.slice(index));
    if (number?.[0]) {
      tokens.push({ kind: 'num', value: Number(number[0]) });
      index += number[0].length;
      continue;
    }
    throw new Error('Unexpected input');
  }
  return tokens;
}

function evaluateExpression(source: string, ans: number): number {
  const tokens = tokenize(source, ans);
  let index = 0;
  const peek = () => tokens[index];
  const take = () => tokens[index++];
  const takeOp = (...ops: Op[]): Op | null => {
    const token = peek();
    if (!token || token.kind !== 'op' || !ops.includes(token.value)) return null;
    index += 1;
    return token.value;
  };

  const parseExpression = (): number => {
    let value = parseTerm();
    let op = takeOp('+', '-');
    while (op) {
      const right = parseTerm();
      value = op === '+' ? value + right : value - right;
      op = takeOp('+', '-');
    }
    return value;
  };

  const parseTerm = (): number => {
    let value = parseUnary();
    let op = takeOp('*', '/');
    while (op) {
      const right = parseUnary();
      if (op === '/' && right === 0) return Number.NaN;
      value = op === '*' ? value * right : value / right;
      op = takeOp('*', '/');
    }
    return value;
  };

  const parseUnary = (): number => {
    const op = takeOp('+', '-');
    if (op) {
      const value = parseUnary();
      return op === '-' ? -value : value;
    }
    return parsePower();
  };

  const parsePower = (): number => {
    const base = parsePostfix();
    if (takeOp('^')) return base ** parseUnary();
    return base;
  };

  const parsePostfix = (): number => {
    const value = parsePrimary();
    if (takeOp('%')) return value / 100;
    return value;
  };

  const applyFn = (fn: Fn, value: number): number => {
    const radians = (value * Math.PI) / 180;
    if (fn === 'sin') return Math.sin(radians);
    if (fn === 'cos') return Math.cos(radians);
    if (fn === 'tan') {
      if (Math.abs(Math.cos(radians)) < 1e-12) return Number.NaN;
      return Math.tan(radians);
    }
    if (fn === 'log') return value <= 0 ? Number.NaN : Math.log10(value);
    if (fn === 'ln') return value <= 0 ? Number.NaN : Math.log(value);
    if (fn === 'sqrt') return value < 0 ? Number.NaN : Math.sqrt(value);
    return Math.cbrt(value);
  };

  const parsePrimary = (): number => {
    const token = peek();
    if (!token) throw new Error('Incomplete expression');
    if (token.kind === 'num') {
      take();
      return token.value;
    }
    if (token.kind === 'fn') {
      take();
      if (peek()?.kind !== 'lp') throw new Error('Missing parenthesis');
      take();
      const value = parseExpression();
      if (peek()?.kind !== 'rp') throw new Error('Missing parenthesis');
      take();
      return applyFn(token.value, value);
    }
    if (token.kind === 'lp') {
      take();
      const value = parseExpression();
      if (peek()?.kind !== 'rp') throw new Error('Missing parenthesis');
      take();
      return value;
    }
    throw new Error('Incomplete expression');
  };

  if (tokens.length === 0) return 0;
  const value = parseExpression();
  if (index < tokens.length) throw new Error('Incomplete expression');
  return value;
}

export function CBTCalculator({ onUseValue, onClose }: Props) {
  const [expr, setExpr] = useState('');
  const [result, setResult] = useState('0');
  const [just, setJust] = useState(false);
  const [ans, setAns] = useState(0);

  const push = (token: string, replace = false) => {
    setExpr((current) => (replace || (just && /^[0-9.π]/.test(token)) ? token : `${current}${token}`));
    setJust(false);
  };

  const equals = () => {
    const source = expr.trim();
    if (!source) return;
    try {
      const value = evaluateExpression(source, ans);
      const text = formatResult(value);
      setResult(text);
      if (Number.isFinite(value)) setAns(value);
      setJust(true);
    } catch {
      setResult('Error');
      setJust(true);
    }
  };

  const keys: Array<{ label: string; action: () => void; tone?: 'op' | 'fn' | 'eq' | 'clear' }> = [
    { label: '(', action: () => push('('), tone: 'fn' },
    { label: ')', action: () => push(')'), tone: 'fn' },
    { label: 'π', action: () => push('π'), tone: 'fn' },
    { label: 'DEL', action: () => { setExpr((current) => current.slice(0, -1)); setJust(false); }, tone: 'clear' },
    { label: 'sin', action: () => push('sin('), tone: 'fn' },
    { label: 'cos', action: () => push('cos('), tone: 'fn' },
    { label: 'tan', action: () => push('tan('), tone: 'fn' },
    { label: 'log', action: () => push('log('), tone: 'fn' },
    { label: 'ln', action: () => push('ln('), tone: 'fn' },
    { label: '√', action: () => push('sqrt('), tone: 'fn' },
    { label: 'x²', action: () => push('^2'), tone: 'fn' },
    { label: 'xʸ', action: () => push('^'), tone: 'fn' },
    { label: '1/x', action: () => push('^(-1)'), tone: 'fn' },
    { label: '±', action: () => push('-'), tone: 'fn' },
    { label: 'EXP', action: () => push('e'), tone: 'fn' },
    { label: 'Ans', action: () => push('Ans'), tone: 'fn' },
    { label: '7', action: () => push('7') },
    { label: '8', action: () => push('8') },
    { label: '9', action: () => push('9') },
    { label: '÷', action: () => push('÷'), tone: 'op' },
    { label: '4', action: () => push('4') },
    { label: '5', action: () => push('5') },
    { label: '6', action: () => push('6') },
    { label: '×', action: () => push('×'), tone: 'op' },
    { label: '1', action: () => push('1') },
    { label: '2', action: () => push('2') },
    { label: '3', action: () => push('3') },
    { label: '−', action: () => push('−'), tone: 'op' },
    { label: '0', action: () => push('0') },
    { label: '.', action: () => push('.') },
    { label: '%', action: () => push('%'), tone: 'op' },
    { label: '+', action: () => push('+'), tone: 'op' },
  ];

  const shown = just || expr === '' ? result : expr;

  return (
    <div
      role="dialog"
      aria-label="Scientific calculator, degree mode"
      className="w-[292px] overflow-hidden rounded-lg border border-slate-700 bg-slate-800 shadow-lg"
    >
      <div className="flex h-8 items-center justify-between px-2">
        <span className="text-[11px] font-semibold tracking-wide text-slate-100">Scientific · DEG</span>
        <button type="button" onClick={onClose} className="h-6 rounded px-1.5 text-[11px] text-slate-300">
          Close
        </button>
      </div>
      <div className="mx-2 mb-2 flex h-14 flex-col justify-end rounded bg-slate-950 px-2 py-1 text-right">
        <span className="truncate font-mono text-[10px] text-slate-400">{expr || ' '}</span>
        <span className="truncate font-mono text-xl text-emerald-400 tabular-nums">{shown}</span>
      </div>
      <div className="grid grid-cols-4 gap-1 px-2 pb-2">
        {keys.map((key) => (
          <button
            key={key.label}
            type="button"
            onClick={key.action}
            className={`h-9 rounded text-[12px] font-semibold ${
              key.tone === 'eq'
                ? 'bg-accent text-on-accent'
                : key.tone === 'op'
                  ? 'bg-slate-600 text-white'
                  : key.tone === 'fn'
                    ? 'bg-slate-700 text-slate-100'
                    : key.tone === 'clear'
                      ? 'bg-rose-700 text-white'
                      : 'bg-slate-200 text-slate-900'
            }`}
          >
            {key.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            setExpr('');
            setResult('0');
            setJust(false);
          }}
          className="h-9 rounded bg-rose-700 text-[12px] font-semibold text-white"
        >
          AC
        </button>
        <button
          type="button"
          onClick={equals}
          className="col-span-3 h-9 rounded bg-accent text-[12px] font-bold text-on-accent"
        >
          =
        </button>
      </div>
      {onUseValue && (
        <div className="border-t border-slate-700 px-2 py-1.5 text-right">
          <button
            type="button"
            onClick={() => {
              if (just) {
                onUseValue(result === 'Error' ? '' : result);
                return;
              }
              if (!expr.trim()) {
                onUseValue(result === 'Error' ? '' : result);
                return;
              }
              try {
                onUseValue(formatResult(evaluateExpression(expr, ans)));
              } catch {
                onUseValue('');
              }
            }}
            className="h-7 rounded bg-emerald-600 px-2 text-[11px] font-semibold text-on-accent"
          >
            Use value
          </button>
        </div>
      )}
    </div>
  );
}
