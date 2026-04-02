interface Cell { value: any; formula: string; computed: any; deps: string[]; dirty: boolean }
interface Sheet { name: string; cells: Map<string, Cell>; w: number; h: number }

export class SpreadsheetEngine {
  private sheets = new Map<string, Sheet>();
  private active = 'Sheet1';
  private formulas = new Map<string, Function>();

  constructor() {
    // Built-in formulas
    const fns: Record<string, Function> = {
      SUM: (a: number[]) => a.reduce((s, v) => s + (Number(v) || 0), 0),
      AVG: (a: number[]) => { const n = a.filter(v => !isNaN(Number(v))); return n.length ? n.reduce((s, v) => s + Number(v), 0) / n.length : 0; },
      COUNT: (a: any[]) => a.filter(v => v !== '' && v != null).length,
      MAX: (a: number[]) => Math.max(...a.map(Number).filter(n => !isNaN(n))),
      MIN: (a: number[]) => Math.min(...a.map(Number).filter(n => !isNaN(n))),
      ABS: (a: number[]) => Math.abs(a[0]),
      ROUND: (a: number[]) => Math.round(a[0] * Math.pow(10, a[1] || 0)) / Math.pow(10, a[1] || 0),
      SQRT: (a: number[]) => Math.sqrt(Number(a[0])),
      POWER: (a: number[]) => Math.pow(a[0], a[1]),
      CEIL: (a: number[]) => Math.ceil(a[0]),
      FLOOR: (a: number[]) => Math.floor(a[0]),
      PI: () => Math.PI,
      NOW: () => new Date().toISOString(),
      TODAY: () => new Date().toISOString().split('T')[0],
      RAND: () => Math.random(),
      UPPER: (a: string[]) => String(a[0]).toUpperCase(),
      LOWER: (a: string[]) => String(a[0]).toLowerCase(),
      TRIM: (a: string[]) => String(a[0]).trim(),
      LEN: (a: string[]) => String(a[0]).length,
      CONCAT: (a: string[]) => a.join(''),
      IF: (a: any[]) => a[0] ? a[1] : a[2],
      AND: (a: boolean[]) => a.every(Boolean),
      OR: (a: boolean[]) => a.some(Boolean),
      NOT: (a: boolean[]) => !a[0],
    };
    for (const [k, fn] of Object.entries(fns)) this.formulas.set(k, fn);
  }

  colLetter(c: number): string { let s = ''; c++; while (c > 0) { c--; s = String.fromCharCode(65 + (c % 26)) + s; c = Math.floor(c / 26); } return s; }
  letterCol(s: string): number { let n = 0; for (let i = 0; i < s.length; i++) n = n * 26 + (s.charCodeAt(i) - 64); return n - 1; }
  cellRef(r: number, c: number): string { return this.colLetter(c) + (r + 1); }
  parseRef(ref: string): [number, number] { const m = ref.match(/^([A-Z]+)(\d+)$/); return m ? [parseInt(m[2]) - 1, this.letterCol(m[1])] : [0, 0]; }

  createSheet(name: string, w = 26, h = 100): Sheet {
    const s: Sheet = { name, cells: new Map(), w, h }; this.sheets.set(name, s); return s;
  }
  getSheet(name?: string): Sheet { return this.sheets.get(name || this.active) || this.createSheet(name || this.active); }
  setActive(name: string): void { this.active = name; }
  deleteSheet(name: string): void { if (name !== this.active) this.sheets.delete(name); }

  getCell(r: number, c: number, sheet?: string): Cell { const key = `${r},${c}`; return this.getSheet(sheet).cells.get(key) || { value: '', formula: '', computed: '', deps: [], dirty: false }; }

  setCell(r: number, c: number, value: any, sheet?: string): void {
    const s = this.getSheet(sheet); const key = `${r},${c}`;
    const cell: Cell = { value, formula: '', computed: value, deps: [], dirty: false };
    s.cells.set(key, cell);
  }

  setFormula(r: number, c: number, formula: string, sheet?: string): void {
    const s = this.getSheet(sheet); const key = `${r},${c}`;
    const deps: string[] = [];
    const refMatches = formula.match(/[A-Z]+\d+/g) || [];
    for (const ref of refMatches) { const [dr, dc] = this.parseRef(ref); deps.push(`${dr},${dc}`); }
    s.cells.set(key, { value: formula, formula, computed: null, deps, dirty: true });
  }

  getCellValue(r: number, c: number, sheet?: string): any {
    const cell = this.getCell(r, c, sheet);
    return cell.formula ? cell.computed : cell.value;
  }

  getRange(r1: number, c1: number, r2: number, c2: number, sheet?: string): any[][] {
    const result: any[][] = [];
    for (let r = r1; r <= r2; r++) { const row: any[] = []; for (let c = c1; c <= c2; c++) row.push(this.getCellValue(r, c, sheet)); result.push(row); }
    return result;
  }

  private resolveRef(token: string, sheet: string): any {
    if (/^[A-Z]+\d+$/.test(token)) { const [r, c] = this.parseRef(token); return this.getCellValue(r, c, sheet); }
    if (token.includes(':')) { const [a, b] = token.split(':'); const [r1, c1] = this.parseRef(a); const [r2, c2] = this.parseRef(b); return this.getRange(r1, c1, r2, c2, sheet).flat(); }
    return Number(token);
  }

  recalculate(sheet?: string): void {
    const s = this.getSheet(sheet);
    const visited = new Set<string>();
    const compute = (key: string) => {
      if (visited.has(key)) return; visited.add(key);
      const cell = s.cells.get(key); if (!cell || !cell.formula || !cell.dirty) return;
      for (const dep of cell.deps) compute(dep);
      try {
        let f = cell.formula.substring(1).trim(); // remove =
        // Replace function calls: SUM(A1:A5) → resolve args and call
        const fnMatch = f.match(/^(\w+)\((.+)\)$/);
        if (fnMatch) {
          const fn = this.formulas.get(fnMatch[1]);
          if (fn) { const args = fnMatch[2].split(',').map(a => this.resolveRef(a.trim(), s.name)); cell.computed = fn(args); return; }
        }
        // Simple arithmetic with cell refs
        const tokens = f.split(/([+\-*/()])/).map(t => t.trim());
        const resolved = tokens.map(t => { if (!t || '+-*/()'.includes(t)) return t; return JSON.stringify(this.resolveRef(t, s.name)); });
        cell.computed = Function('"use strict"; return (' + resolved.join(' ') + ')')();
      } catch { cell.computed = '#ERROR'; }
      cell.dirty = false;
    };
    for (const key of s.cells.keys()) { const cell = s.cells.get(key); if (cell?.dirty) compute(key); }
  }

  insertRow(r: number, sheet?: string): void { const s = this.getSheet(sheet); const cells = new Map<string, Cell>(); for (const [key, cell] of s.cells) { const [cr, cc] = key.split(',').map(Number); cells.set(`${cr >= r ? cr + 1 : cr},${cc}`, cell); } s.cells = cells; }
  insertCol(c: number, sheet?: string): void { const s = this.getSheet(sheet); const cells = new Map<string, Cell>(); for (const [key, cell] of s.cells) { const [cr, cc] = key.split(',').map(Number); cells.set(`${cr},${cc >= c ? cc + 1 : cc}`, cell); } s.cells = cells; }
  deleteRow(r: number, sheet?: string): void { const s = this.getSheet(sheet); for (const key of [...s.cells.keys()]) { const [cr] = key.split(',').map(Number); if (cr === r) s.cells.delete(key); else if (cr > r) { const cell = s.cells.get(key)!; s.cells.delete(key); s.cells.set(`${cr - 1},${key.split(',')[1]}`, cell); } } }
  deleteCol(c: number, sheet?: string): void { const s = this.getSheet(sheet); for (const key of [...s.cells.keys()]) { const cc = parseInt(key.split(',')[1]); if (cc === c) s.cells.delete(key); else if (cc > c) { const cell = s.cells.get(key)!; s.cells.delete(key); s.cells.set(`${key.split(',')[0]},${cc - 1}`, cell); } } }
  clearCell(r: number, c: number, sheet?: string): void { this.getSheet(sheet).cells.delete(`${r},${c}`); }

  serialize(): string { return JSON.stringify({ sheets: [...this.sheets.entries()], active: this.active }); }
  deserialize(data: string): void { const d = JSON.parse(data); this.sheets = new Map(d.sheets); this.active = d.active; }
}
