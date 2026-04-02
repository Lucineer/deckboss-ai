export class FormulaEngine {
  private cells = new Map<string, any>();
  private deps = new Map<string, Set<string>>();
  isFormula(input: string): boolean { return typeof input === 'string' && input.startsWith('='); }
  setCell(ref: string, value: any): void { this.cells.set(ref.toUpperCase(), value); }
  getCell(ref: string): any { return this.cells.get(ref.toUpperCase()); }
  getDependencies(ref: string): string[] { return [...(this.deps.get(ref.toUpperCase()) || [])]; }
  getReferencedCells(formula: string): string[] { const refs: string[] = []; const re = /\b([A-Z]+)(\d+)\b/g; let m; while ((m = re.exec(formula)) !== null) refs.push(m[0]); return [...new Set(refs)]; }
  evaluate(formula: string, ref?: string): any {
    if (!this.isFormula(formula)) return isNaN(Number(formula)) ? formula : Number(formula);
    let expr = formula.slice(1).toUpperCase();
    const refs = this.getReferencedCells(expr);
    if (ref) this.deps.set(ref.toUpperCase(), new Set(refs));
    for (const r of refs) { const v = this.getCell(r); if (v !== undefined) expr = expr.replace(new RegExp('\\b' + r + '\\b', 'g'), typeof v === 'string' ? `"${v}"` : String(v)); }
    try { return this.evalExpr(expr); } catch { return '#ERROR'; }
  }
  private evalExpr(expr: string): any {
    const fnRe = /^(\w+)\((.*)\)$/s; const fnMatch = expr.match(fnRe);
    if (fnMatch) return this.callFn(fnMatch[1], fnMatch[2]);
    try { const r = Function('"use strict";return (' + expr + ')')(); return r; } catch { return expr; }
  }
  private callFn(name: string, argsStr: string): any {
    const args = this.parseArgs(argsStr);
    const nums = () => args.map(a => typeof a === 'number' ? a : Number(a) || 0);
    switch (name) {
      case 'SUM': return nums().reduce((a, b) => a + b, 0);
      case 'AVG': case 'AVERAGE': { const n = nums(); return n.length ? n.reduce((a, b) => a + b, 0) / n.length : 0; }
      case 'MIN': return Math.min(...nums());
      case 'MAX': return Math.max(...nums());
      case 'COUNT': return nums().length;
      case 'ABS': return Math.abs(nums()[0]);
      case 'ROUND': { const n = nums(); return Number(n[0].toFixed(n[1] || 0)); }
      case 'CEIL': return Math.ceil(nums()[0]);
      case 'FLOOR': return Math.floor(nums()[0]);
      case 'MOD': { const n = nums(); return n[1] ? n[0] % n[1] : 0; }
      case 'POWER': { const n = nums(); return Math.pow(n[0], n[1]); }
      case 'SQRT': return Math.sqrt(nums()[0]);
      case 'CONCAT': case 'CONCATENATE': return args.join('');
      case 'LEN': return String(args[0]).length;
      case 'UPPER': return String(args[0]).toUpperCase();
      case 'LOWER': return String(args[0]).toLowerCase();
      case 'TRIM': return String(args[0]).trim();
      case 'IF': return args[0] ? args[1] : args[2];
      case 'AND': return args.every(Boolean);
      case 'OR': return args.some(Boolean);
      case 'NOT': return !args[0];
      default: return '#NAME?';
    }
  }
  private parseArgs(s: string): any[] {
    const args: any[] = []; let depth = 0; let cur = '';
    for (const ch of s) { if (ch === '(') depth++; if (ch === ')') depth--; if (ch === ',' && depth === 0) { args.push(this.parseArg(cur.trim())); cur = ''; continue; } cur += ch; }
    if (cur.trim()) args.push(this.parseArg(cur.trim()));
    return args;
  }
  private parseArg(a: string): any { if (a.startsWith('"') && a.endsWith('"')) return a.slice(1, -1); const n = Number(a); return isNaN(n) ? a : n; }
  getFormulaList(): string[] { return [...this.cells.entries()].filter(([, v]) => this.isFormula(v)).map(([r, v]) => `${r}: ${v}`); }
  validate(formula: string): string | null { try { this.evaluate(formula); return null; } catch (e: any) { return e.message; } }
  serialize(): string { return JSON.stringify({ cells: [...this.cells.entries()] }); }
  deserialize(data: string): void { this.cells = new Map(JSON.parse(data).cells); }
}
