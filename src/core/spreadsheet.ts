// src/core/spreadsheet.ts

export type CellType = 'standard' | 'claw' | 'runtime' | 'ui' | 'twin' | 'gate';
export type CellValue = string | number | boolean | null | CellReference;

export interface CellReference { 
  ref: string; 
}

export interface Cell {
  id: string;
  row: number;
  col: number;
  ref: string;
  type: CellType;
  value: CellValue;
  formula?: string;
  agentId?: string;
  agentMemory?: string[];
  agentPersonality?: string;
  agentProvider?: string;
  agentModel?: string;
  agentApiKey?: string;
  processId?: string;
  processStatus?: 'idle' | 'running' | 'error' | 'done';
  processOutput?: string;
  uiHtml?: string;
  uiCompiled?: boolean;
  twinSourceName?: string;
  twinAccuracy?: number;
  gateUrl?: string;
  gateConnected?: boolean;
  gateLastSync?: number;
  lastModified: number;
  modifiedBy: 'user' | 'agent' | 'system';
}

export interface Sheet {
  id: string;
  name: string;
  cells: Map<string, Cell>;
  columns: number;
  rows: number;
  createdAt: number;
  updatedAt: number;
}

export class SpreadsheetEngine {
  public createSheet(name: string, rows: number, cols: number): Sheet {
    return {
      id: crypto.randomUUID(),
      name,
      rows,
      columns: cols,
      cells: new Map(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }

  public getCell(sheet: Sheet, ref: string): Cell | undefined {
    return sheet.cells.get(ref.toUpperCase());
  }

  public setCell(sheet: Sheet, ref: string, updates: Partial<Cell>): Cell {
    const upperRef = ref.toUpperCase();
    const coords = this.refToCoords(upperRef);
    const existing = sheet.cells.get(upperRef);

    const cellData: Cell = {
      id: existing?.id || crypto.randomUUID(),
      row: coords.row,
      col: coords.col,
      ref: upperRef,
      type: updates.type || existing?.type || 'standard',
      value: updates.value !== undefined ? updates.value : existing?.value ?? null,
      formula: updates.formula !== undefined ? updates.formula : existing?.formula,
      lastModified: Date.now(),
      modifiedBy: updates.modifiedBy || 'user',
      ...updates
    };

    sheet.cells.set(upperRef, cellData);
    sheet.updatedAt = Date.now();
    return cellData;
  }

  public getSheetData(sheet: Sheet): CellValue[][] {
    const grid: CellValue[][] = [];
    for (let r = 0; r < sheet.rows; r++) {
      const row: CellValue[] = [];
      for (let c = 0; c < sheet.columns; c++) {
        const ref = this.coordsToRef(r, c);
        const cell = sheet.cells.get(ref);
        row.push(cell ? cell.value : null);
      }
      grid.push(row);
    }
    return grid;
  }

  public getAgentCells(sheet: Sheet): Cell[] {
    return Array.from(sheet.cells.values()).filter(c => c.type === 'claw');
  }

  public getRuntimeCells(sheet: Sheet): Cell[] {
    return Array.from(sheet.cells.values()).filter(c => c.type === 'runtime');
  }

  public serialize(sheet: Sheet): string {
    return JSON.stringify({
      ...sheet,
      cells: Array.from(sheet.cells.entries())
    });
  }

  public deserialize(json: string): Sheet {
    const parsed = JSON.parse(json);
    const cellsMap = new Map<string, Cell>(parsed.cells);
    return {
      ...parsed,
      cells: cellsMap
    };
  }

  public refToCoords(ref: string): { row: number; col: number } {
    const match = ref.match(/^([A-Z]+)(\d+)$/);
    if (!match) throw new Error(`Invalid cell reference: ${ref}`);
    
    const colStr = match[1];
    const rowStr = match[2];
    
    let col = 0;
    for (let i = 0; i < colStr.length; i++) {
      col = col * 26 + (colStr.charCodeAt(i) - 64);
    }
    
    return { row: parseInt(rowStr, 10) - 1, col: col - 1 };
  }

  public coordsToRef(row: number, col: number): string {
    let colStr = '';
    let c = col + 1;
    
    while (c > 0) {
      c--;
      colStr = String.fromCharCode(65 + (c % 26)) + colStr;
      c = Math.floor(c / 26);
    }
    
    return `${colStr}${row + 1}`;
  }

  public evaluateFormulas(sheet: Sheet): void {
    for (const [ref, cell] of sheet.cells.entries()) {
      if (cell.formula) {
        try {
          const value = this.evaluateFormula(sheet, cell.formula);
          cell.value = value;
          cell.lastModified = Date.now();
          sheet.cells.set(ref, cell);
        } catch (err) {
          cell.value = `#ERROR: ${err instanceof Error ? err.message : 'Unknown'}`;
          sheet.cells.set(ref, cell);
        }
      }
    }
    sheet.updatedAt = Date.now();
  }

  // --- Internal Formula Engine ---

  private evaluateFormula(sheet: Sheet, formula: string): CellValue {
    if (!formula.startsWith('=')) return formula;
    
    let expr = formula.substring(1).trim();
    expr = this.resolveRefsAndRanges(sheet, expr);
    return this.parseExpression(expr);
  }

  private resolveRefsAndRanges(sheet: Sheet, expr: string): string {
    // Handle Ranges first (e.g., A1:A3)
    const rangeRegex = /\b([A-Z]+)(\d+):([A-Z]+)(\d+)\b/g;
    expr = expr.replace(rangeRegex, (_, startCol, startRow, endCol, endRow) => {
      const start = this.refToCoords(`${startCol}${startRow}`);
      const end = this.refToCoords(`${endCol}${endRow}`);
      const vals: string[] = [];
      
      for (let r = start.row; r <= end.row; r++) {
        for (let c = start.col; c <= end.col; c++) {
          vals.push(this.getCellNumericValue(sheet, r, c));
        }
      }
      return vals.join(',');
    });

    // Handle Individual Refs (e.g., A1)
    const refRegex = /\b([A-Z]+)(\d+)\b/g;
    expr = expr.replace(refRegex, (_, col, row) => {
      const coords = this.refToCoords(`${col}${row}`);
      return this.getCellNumericValue(sheet, coords.row, coords.col);
    });

    return expr;
  }

  private getCellNumericValue(sheet: Sheet, row: number, col: number): string {
    const ref = this.coordsToRef(row, col);
    const cell = sheet.cells.get(ref);
    if (!cell || cell.value === null) return '0';
    if (typeof cell.value === 'number') return cell.value.toString();
    if (typeof cell.value === 'boolean') return cell.value ? '1' : '0';
    if (!isNaN(Number(cell.value))) return cell.value.toString();
    return `"${cell.value}"`; // String fallback for expressions
  }

  private parseExpression(expr: string): CellValue {
    // Match Functions
    const funcMatch = expr.match(/^(SUM|AVG|COUNT|IF|REF)\((.+)\)$/i);
    if (funcMatch) {
      const func = funcMatch[1].toUpperCase();
      const args = this.splitArguments(funcMatch[2]);
      return this.evaluateFunction(func, args);
    }

    // Simple Math (Addition/Subtraction as base level)
    const tokens = this.splitArguments(expr, false); 
    let result = parseFloat(this.parseExpression(tokens[0]) as string);
    
    for (let i = 1; i < tokens.length; i += 2) {
      const op = tokens[i].trim();
      const nextVal = parseFloat(this.parseExpression(tokens[i+1]) as string);
      if (op === '+') result += nextVal;
      else if (op === '-') result -= nextVal;
      else if (op === '*') result *= nextVal;
      else if (op === '/') result = nextVal === 0 ? 0 : result / nextVal; 
    }

    if (!isNaN(result)) return result;
    
    // Fallback String Evaluation
    try {
      const cleanExpr = expr.replace(/"/g, '');
      if (cleanExpr.includes('==')) return cleanExpr.split('==')[0].trim() === cleanExpr.split('==')[1].trim();
      if (cleanExpr.includes('>')) return Number(cleanExpr.split('>')[0]) > Number(cleanExpr.split('>')[1]);
      if (cleanExpr.includes('<')) return Number(cleanExpr.split('<')[0]) < Number(cleanExpr.split('<')[1]);
    } catch (e) { /* fall through */ }

    return expr.replace(/"/g, '');
  }

  private splitArguments(argsStr: string, splitByComma = true): string[] {
    const args: string[] = [];
    let current = '';
    let depth = 0;
    let inStr = false;

    for (let i = 0; i < argsStr.length; i++) {
      const char = argsStr[i];
      if (char === '"') inStr = !inStr;
      if (!inStr) {
        if (char === '(') depth++;
        if (char === ')') depth--;
        
        if (splitByComma && char === ',' && depth === 0) {
          args.push(current.trim());
          current = '';
          continue;
        }
        // Math operators
        if (!splitByComma && depth === 0 && (char === '+' || char === '-' || char === '*' || char === '/')) {
          if (current.trim()) args.push(current.trim());
          args.push(char);
          current = '';
          continue;
        }
      }
      current += char;
    }
    if (current.trim()) args.push(current.trim());
    
    return args;
  }

  private evaluateFunction(func: string, rawArgs: string[]): CellValue {
    // Resolve nested args
    const args = rawArgs.map(a => this.parseExpression(a));

    switch (func) {
      case 'SUM':
        return args.reduce((sum: number, val) => sum + (Number(val) || 0), 0);
      case 'AVG':
        const nums = args.map(Number).filter(n => !isNaN(n));
        return nums.length ? nums.reduce((s: number, n: number) => s + n, 0) / nums.length : 0;
      case 'COUNT':
        return args.filter(a => a !== null && a !== '0' && a !== '').length;
      case 'IF':
        return args[0] === true || args[0] === 'true' || Number(args[0]) > 0 ? args[1] : args[2];
      case 'REF':
        return args[0]; // Already resolved via REF structure
      default:
        return `#INVALID_FUNC`;
    }
  }
}