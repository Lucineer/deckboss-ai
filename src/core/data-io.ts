interface ImportResult { rows:number; cols:number; errors:string[]; duration:number }
export class DataIO {
  private getEngine: ()=>any;
  constructor(engineFn: ()=>any) { this.getEngine = engineFn; }
  private parseRows(text: string, delim: string): any[][] { return text.trim().split('\n').map(r => r.split(delim).map(c => { const n = Number(c); return isNaN(n) ? c.trim() : n; })); }
  importCSV(csv: string): ImportResult { const start = Date.now(); const rows = this.parseRows(csv, ','); this.loadToEngine(rows); return { rows: rows.length, cols: rows[0]?.length||0, errors:[], duration: Date.now()-start }; }
  exportCSV(): string { const e = this.getEngine(); if (!e) return ''; const data = e.getRange?.(0, 0, 99, 25) || [[]]; return data.map((r: any[]) => r.map((c: any) => typeof c === 'string' && c.includes(',') ? `"${c}"` : String(c ?? '')).join(',')).join('\n'); }
  importJSON(json: string): ImportResult { const start = Date.now(); try { const data = JSON.parse(json); const rows = Array.isArray(data[0]) ? data : [Object.values(data)]; this.loadToEngine(rows); return { rows: rows.length, cols: rows[0]?.length||0, errors:[], duration: Date.now()-start }; } catch(e: any) { return { rows:0, cols:0, errors:[e.message], duration: Date.now()-start }; } }
  exportJSON(pretty = false): string { const e = this.getEngine(); if (!e) return '[]'; const data = e.getRange?.(0, 0, 99, 25) || []; return JSON.stringify(data, null, pretty ? 2 : 0); }
  importMarkdown(table: string): ImportResult { const rows = table.trim().split('\n').filter(r => !r.match(/^\|[\s-:|]+\|$/)).map(r => r.split('|').slice(1, -1).map(c => { const n = Number(c.trim()); return isNaN(n) ? c.trim() : n; })); this.loadToEngine(rows); return { rows: rows.length, cols: rows[0]?.length||0, errors:[], duration: 0 }; }
  exportMarkdown(): string { const e = this.getEngine(); if (!e) return ''; const data = e.getRange?.(0, 0, 50, 25) || [[]]; return data.map((r: any[]) => '| ' + r.map((c: any) => String(c ?? '')).join(' | ') + ' |').join('\n'); }
  importTSV(tsv: string): ImportResult { const start = Date.now(); const rows = this.parseRows(tsv, '\t'); this.loadToEngine(rows); return { rows: rows.length, cols: rows[0]?.length||0, errors:[], duration: Date.now()-start }; }
  exportTSV(): string { const e = this.getEngine(); if (!e) return ''; const data = e.getRange?.(0, 0, 99, 25) || [[]]; return data.map((r: any[]) => r.map((c: any) => String(c ?? '')).join('\t')).join('\n'); }
  detectFormat(content: string): string { const t = content.trim(); if (t.startsWith('[') || t.startsWith('{')) return 'json'; if (t.includes('\t') && !t.includes(',')) return 'tsv'; if (t.includes('|') && t.includes('---')) return 'markdown'; if (t.split(',').length > 2) return 'csv'; return 'unknown'; }
  autoImport(content: string): ImportResult { const fmt = this.detectFormat(content); if (fmt === 'csv') return this.importCSV(content); if (fmt === 'json') return this.importJSON(content); if (fmt === 'tsv') return this.importTSV(content); if (fmt === 'markdown') return this.importMarkdown(content); return { rows:0, cols:0, errors:['Unknown format'], duration:0 }; }
  private loadToEngine(rows: any[][]): void { const e = this.getEngine(); if (!e) return; rows.forEach((r, ri) => r.forEach((c, ci) => { try { e.setCell?.(ri, ci, c); } catch {} })); }
}
