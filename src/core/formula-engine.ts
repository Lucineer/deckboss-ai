/**
 * FormulaEngine — Spreadsheet formula parser and evaluator for Deckboss.ai
 * Supports standard functions and CLAW_ special functions
 */

export interface CellRef { col: string; row: number }
export interface FormulaResult {
  value: number | string | boolean | null;
  error?: string;
  deps: CellRef[];
}

type Token =
  | { type: 'number'; value: number }
  | { type: 'string'; value: string }
  | { type: 'cell'; col: string; row: number }
  | { type: 'range'; from: CellRef; to: CellRef }
  | { type: 'op'; value: string }
  | { type: 'lparen' }
  | { type: 'rparen' }
  | { type: 'comma' }
  | { type: 'ident'; value: string };

export class FormulaEngine {
  private vars: Map<string, unknown> = new Map();

  evaluate(formula: string, context: Record<string, unknown> = {}): FormulaResult {
    const deps: CellRef[] = [];
    try {
      if (!formula.startsWith('=')) return { value: formula, deps };
      const expr = formula.slice(1);
      const tokens = this.tokenize(expr, deps);
      const parser = new Parser(tokens, context, this.vars, deps);
      const result = parser.parseExpression();
      return { value: result, deps };
    } catch (e) {
      return { value: null, error: e instanceof Error ? e.message : String(e), deps };
    }
  }

  setVariable(name: string, value: unknown): void { this.vars.set(name, value); }
  getVariable(name: string): unknown { return this.vars.get(name); }

  getDependencies(formula: string): CellRef[] {
    const result = this.evaluate(formula);
    return result.deps;
  }

  private tokenize(expr: string, deps: CellRef[]): Token[] {
    const tokens: Token[] = [];
    let i = 0;
    while (i < expr.length) {
      if (/\s/.test(expr[i])) { i++; continue; }
      if (/[0-9.]/.test(expr[i])) {
        let num = '';
        while (i < expr.length && /[0-9.]/.test(expr[i])) num += expr[i++];
        tokens.push({ type: 'number', value: parseFloat(num) });
      } else if (expr[i] === '"') {
        let str = '';
        i++;
        while (i < expr.length && expr[i] !== '"') str += expr[i++];
        i++;
        tokens.push({ type: 'string', value: str });
      } else if (/[A-Z]/i.test(expr[i])) {
        let ident = '';
        while (i < expr.length && /[A-Z0-9_]/i.test(expr[i])) ident += expr[i++];
        const cellMatch = ident.match(/^([A-Z]+)(\d+)$/);
        if (cellMatch && parseInt(cellMatch[2]) > 0) {
          const ref: CellRef = { col: cellMatch[1].toUpperCase(), row: parseInt(cellMatch[2]) };
          deps.push(ref);
          tokens.push({ type: 'cell', ...ref });
        } else {
          tokens.push({ type: 'ident', value: ident.toUpperCase() });
        }
      } else if (expr[i] === ':') {
        i++;
        let ident = '';
        while (i < expr.length && /[A-Z0-9]/i.test(expr[i])) ident += expr[i++];
        const match = ident.match(/^([A-Z]+)(\d+)$/);
        if (match && tokens.length > 0) {
          const prev = tokens[tokens.length - 1];
          if (prev.type === 'cell') {
            const from: CellRef = { col: prev.col, row: prev.row };
            const to: CellRef = { col: match[1].toUpperCase(), row: parseInt(match[2]) };
            tokens.pop();
            for (let r = from.row; r <= to.row; r++)
              for (let c = from.col.charCodeAt(0) - 65; c <= to.col.charCodeAt(0) - 65; c++)
                deps.push({ col: String.fromCharCode(65 + c), row: r });
            tokens.push({ type: 'range', from, to });
          }
        }
      } else if ('+-*/^&<>='.includes(expr[i]) && (i + 1 >= expr.length || expr[i + 1] !== '=')) {
        tokens.push({ type: 'op', value: expr[i++] });
      } else if (expr[i] === '(') { tokens.push({ type: 'lparen' }); i++; }
      else if (expr[i] === ')') { tokens.push({ type: 'rparen' }); i++; }
      else if (expr[i] === ',') { tokens.push({ type: 'comma' }); i++; }
      else if (expr.substring(i, i + 2) === '>=') { tokens.push({ type: 'op', value: '>=' }); i += 2; }
      else if (expr.substring(i, i + 2) === '<=') { tokens.push({ type: 'op', value: '<=' }); i += 2; }
      else if (expr.substring(i, i + 2) === '<>') { tokens.push({ type: 'op', value: '<>' }); i += 2; }
      else i++;
    }
    return tokens;
  }

  serialize(): string {
    return JSON.stringify({ vars: Object.fromEntries(this.vars) });
  }
  deserialize(data: string): void {
    const parsed = JSON.parse(data);
    this.vars = new Map(Object.entries(parsed.vars || {}));
  }
}

class Parser {
  private pos = 0;
  constructor(
    private tokens: Token[],
    private context: Record<string, unknown>,
    private vars: Map<string, unknown>,
    private deps: CellRef[],
  ) {}

  private peek(): Token | undefined { return this.tokens[this.pos]; }
  private consume(): Token { return this.tokens[this.pos++]; }
  private expect(type: Token['type']): Token {
    const t = this.consume();
    if (!t || t.type !== type) throw new Error(`Expected ${type}, got ${t?.type}`);
    return t;
  }

  parseExpression(): unknown {
    let left = this.parseTerm();
    while (this.peek()?.type === 'op' && ['+', '-', '&'].includes(this.peek()!.value)) {
      const op = this.consume()!.value;
      const right = this.parseTerm();
      if (op === '+') left = this.num(left) + this.num(right);
      else if (op === '-') left = this.num(left) - this.num(right);
      else if (op === '&') left = String(left ?? '') + String(right ?? '');
    }
    return left;
  }

  private parseTerm(): unknown {
    let left = this.parseFactor();
    while (this.peek()?.type === 'op' && ['*', '/', '^'].includes(this.peek()!.value)) {
      const op = this.consume()!.value;
      const right = this.parseFactor();
      if (op === '*') left = this.num(left) * this.num(right);
      else if (op === '/') { if (this.num(right) === 0) throw new Error('DIV/0'); left = this.num(left) / this.num(right); }
      else if (op === '^') left = Math.pow(this.num(left), this.num(right));
    }
    return left;
  }

  private parseFactor(): unknown {
    if (this.peek()?.type === 'op' && this.peek()!.value === '-') {
      this.consume();
      return -this.num(this.parseAtom());
    }
    return this.parseAtom();
  }

  private parseAtom(): unknown {
    const t = this.peek();
    if (!t) throw new Error('Unexpected end');
    if (t.type === 'number') { this.consume(); return t.value; }
    if (t.type === 'string') { this.consume(); return t.value; }
    if (t.type === 'cell') {
      this.consume();
      const key = `${t.col}${t.row}`;
      return (this.vars.has(key) ? this.vars.get(key) : this.context[key]) ?? 0;
    }
    if (t.type === 'range') {
      this.consume();
      const vals: number[] = [];
      for (let r = t.from.row; r <= t.to.row; r++)
        for (let c = t.from.col.charCodeAt(0) - 65; c <= t.to.col.charCodeAt(0) - 65; c++) {
          const key = `${String.fromCharCode(65 + c)}${r}`;
          const v = this.vars.has(key) ? this.vars.get(key) : this.context[key];
          vals.push(typeof v === 'number' ? v : 0);
        }
      return vals;
    }
    if (t.type === 'ident') {
      const name = this.consume()!.value;
      if (this.peek()?.type === 'lparen') return this.parseFunction(name);
      return this.vars.get(name) ?? this.context[name] ?? 0;
    }
    if (t.type === 'lparen') {
      this.consume();
      const result = this.parseExpression();
      this.expect('rparen');
      return result;
    }
    throw new Error(`Unexpected token: ${t.type}`);
  }

  private parseFunction(name: string): unknown {
    this.expect('lparen');
    const args: unknown[] = [];
    if (this.peek()?.type !== 'rparen') {
      args.push(this.parseExpression());
      while (this.peek()?.type === 'comma') {
        this.consume();
        args.push(this.parseExpression());
      }
    }
    this.expect('rparen');
    return this.callFunction(name, args);
  }

  private callFunction(name: string, args: unknown[]): unknown {
    const nums = () => args.map(a => typeof a === 'number' ? a : parseFloat(String(a)) || 0);
    const flat = (a: unknown) => Array.isArray(a) ? a.flat().map(Number) : [Number(a) || 0];
    const flatAll = () => args.flatMap(flat);
    switch (name) {
      case 'SUM': return flatAll().reduce((a, b) => a + b, 0);
      case 'AVG': case 'AVERAGE': { const v = flatAll(); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0; }
      case 'MIN': return Math.min(...flatAll());
      case 'MAX': return Math.max(...flatAll());
      case 'COUNT': return flatAll().filter(n => !isNaN(n)).length;
      case 'COUNTIF': { const vals = flat(args[0]); const cond = String(args[1]); return vals.filter(v => this.matchCondition(v, cond)).length; }
      case 'ABS': return Math.abs(nums()[0]);
      case 'ROUND': { const n = nums(); return parseFloat((n[0] ?? 0).toFixed(n[1] ?? 0)); }
      case 'CEIL': return Math.ceil(nums()[0]);
      case 'FLOOR': return Math.floor(nums()[0]);
      case 'SQRT': return Math.sqrt(nums()[0]);
      case 'POW': { const n = nums(); return Math.pow(n[0], n[1]); }
      case 'CONCAT': case 'CONCATENATE': return args.map(String).join('');
      case 'LEN': return String(args[0] ?? '').length;
      case 'LEFT': return String(args[0] ?? '').slice(0, nums()[1] || 1);
      case 'RIGHT': return String(args[0] ?? '').slice(-(nums()[1] || 1));
      case 'MID': { const s = String(args[0] ?? ''); const n = nums(); return s.slice(n[1] - 1, n[1] - 1 + (n[2] || 1)); }
      case 'UPPER': return String(args[0] ?? '').toUpperCase();
      case 'LOWER': return String(args[0] ?? '').toLowerCase();
      case 'NOW': return new Date().toISOString();
      case 'TODAY': return new Date().toISOString().split('T')[0];
      case 'YEAR': return new Date(String(args[0])).getFullYear();
      case 'MONTH': return new Date(String(args[0])).getMonth() + 1;
      case 'DAY': return new Date(String(args[0])).getDate();
      case 'IF': return this.truthy(args[0]) ? args[1] : (args[2] ?? false);
      case 'AND': return args.every(a => this.truthy(a));
      case 'OR': return args.some(a => this.truthy(a));
      case 'NOT': return !this.truthy(args[0]);
      // CLAW_ functions (return strings for AI integration)
      case 'CLAW_ASK': return `[CLAW_ASK: ${args[0] ?? ''}]`;
      case 'CLAW_RUN': return `[CLAW_RUN: ${args[0] ?? ''}]`;
      case 'GATE_CHECK': return `[GATE_CHECK: ${args[0] ?? ''}]`;
      case 'GATE_TRANSFORM': return `[GATE_TRANSFORM: ${args[0] ?? ''}, ${args[1] ?? ''}]`;
      case 'TWIN_SIMULATE': return `[TWIN_SIMULATE: ${args[0] ?? ''}]`;
      case 'UI_ALERT': return `[UI_ALERT: ${args[0] ?? ''}]`;
      case 'UI_CHART': return `[UI_CHART: ${args[0] ?? ''}]`;
      default: throw new Error(`Unknown function: ${name}`);
    }
  }

  private truthy(v: unknown): boolean {
    if (typeof v === 'boolean') return v;
    if (typeof v === 'number') return v !== 0;
    return !!v;
  }

  private num(v: unknown): number {
    if (typeof v === 'number') return v;
    const n = parseFloat(String(v));
    return isNaN(n) ? 0 : n;
  }

  private matchCondition(value: number, condition: string): boolean {
    const m = condition.match(/^([><=!]+)(.+)$/);
    if (!m) return value === parseFloat(condition);
    const op = m[1], target = parseFloat(m[2]);
    switch (op) {
      case '>': return value > target;
      case '<': return value < target;
      case '>=': return value >= target;
      case '<=': return value <= target;
      case '<>': case '!=': return value !== target;
      case '=': return value === target;
      default: return false;
    }
  }
}
