import { softActualize, confidenceScore } from './lib/soft-actualize.js';
// deckboss-ai/src/worker.ts

import { FormulaEngine } from './core/formula-engine';
import { CellRuntime } from './core/cell-runtime';
import { CellProtocol } from './core/cell-protocol';
import { SpreadsheetEngine } from './core/spreadsheet-engine';
import { DataIO } from './core/data-io';
import { DataViz } from './core/data-viz';
import { ChartRenderer } from './core/chart-renderer';
import { ConditionalFormat } from './core/conditional-format';
import { PluginSystem } from './core/plugin-system';
import { UniverBridge } from './core/univer-bridge';
import { DependencyResolver } from './core/dependency-resolver';
import { loadBYOKConfig, callLLM, generateSetupHTML } from './lib/byok.js';

// Top-level Engine Instantiation
const formulaEngine = new FormulaEngine();
const dependencyResolver = new DependencyResolver();
const cellRuntime = new CellRuntime(formulaEngine, dependencyResolver);
const cellProtocol = new CellProtocol(cellRuntime);
const spreadsheetEngine = new SpreadsheetEngine(cellProtocol);
const dataIO = new DataIO();
const dataViz = new DataViz();
const chartRenderer = new ChartRenderer(dataViz);
const conditionalFormat = new ConditionalFormat();
const pluginSystem = new PluginSystem();
const univerBridge = new UniverBridge(spreadsheetEngine);
// collaboration and validation modules pending

// Hono/Itty Router compatible API handler
const CSP_HEADER = { 'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.openai.com https://api.anthropic.com https://generativelanguage.googleapis.com https://api.deepseek.com https://api.groq.com https://api.mistral.ai https://openrouter.ai https://api.z.ai https://*;" };

function jsonRes(data: any, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data), { ...init, headers: { 'Content-Type': 'application/json', ...CSP_HEADER, ...(init?.headers || {}) } });
}

function landing(): string {
  return `<!DOCTYPE html><html><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>Deckboss.ai — The AI Spreadsheet Agent</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui;background:#0a0a1a;color:#e0e0e0}.hero{background:linear-gradient(135deg,#f59e0b,#ef4444);padding:4rem 2rem;text-align:center}.hero h1{font-size:3rem;background:linear-gradient(90deg,#fbbf24,#ef4444);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:1rem}.hero p{color:#94a3b8;font-size:1.1rem;max-width:600px;margin:0 auto}.footer{text-align:center;padding:2rem;color:#334;font-size:.8rem;border-top:1px solid #111}</style></head><body>
<div class="hero"><h1>Deckboss.ai</h1><p>The AI Spreadsheet Agent — formulas, charts, conditional formatting, imports, and exports, all powered by intelligence.</p></div>
<div class="footer">Deckboss.ai — Part of the Cocapn Ecosystem</div>
</body></html>`;
}

const api = {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method.toUpperCase();

    if (path === '/') return new Response(landing(), { headers: { 'Content-Type': 'text/html;charset=utf-8' } });

    // --- Health Check ---
    if (method === 'GET' && path === '/health') {
      return jsonRes({ status: 'ok', repo: 'deckboss-ai', version: '1.1.0', agentCount: 1, modules: ['formula','spreadsheet','chart','export','import','conditional-format','seed'], seedVersion: '2024.04', timestamp: Date.now() });
    }

    // --- Seed Route ---
    if (method === 'GET' && path === '/api/seed') {
      return jsonRes({ domain: 'deckboss-ai', description: 'AI spreadsheet agent — formulas, charts, data analysis', seedVersion: '2024.04',
        formulas: ['SUM','AVERAGE','COUNT','VLOOKUP','INDEX/MATCH','IF/IFS','SUMIF','COUNTIF','PivotTable basics'],
        cellTypes: ['string','number','boolean','formula','date','currency','percentage'],
        systemPrompt: 'You are Deckboss, an AI spreadsheet agent. Help with formulas, data analysis, and visualization.' });
    }

    // --- Route: List all sheets ---
    // GET /api/sheets
    if (method === 'GET' && path === '/api/sheets') {
      const sheets = spreadsheetEngine.getAllSheets();
      return jsonRes({ success: true, data: sheets });
    }

    // --- Route: Create sheet ---
    // POST /api/sheets
    if (method === 'POST' && path === '/api/sheets') {
      const body = await request.json() as { name?: string, data?: any };
      const sheet = spreadsheetEngine.createSheet(body.name, body.data);
      return jsonRes({ success: true, data: sheet });
    }

    // --- Route: Evaluate formula ---
    // POST /api/sheets/:id/formula
    let match = path.match(/^\/api\/sheets\/([^/]+)\/formula$/);
    if (method === 'POST' && match) {
      const sheetId = match[1];
      const { formula } = await request.json() as { formula: string };
      const result = formulaEngine.evaluate(formula);
      return jsonRes({ success: true, data: { result } });
    }

    // --- Route: Generate chart config ---
    // POST /api/sheets/:id/chart
    match = path.match(/^\/api\/sheets\/([^/]+)\/chart$/);
    if (method === 'POST' && match) {
      const sheetId = match[1];
      const config = await request.json() as any;
      const chartConfig = chartRenderer.generateConfig(sheetId, config);
      return jsonRes({ success: true, data: chartConfig });
    }

    // --- Route: Validate data ---
    // GET /api/sheets/:id/validation
    match = path.match(/^\/api\/sheets\/([^/]+)\/validation$/);
    if (method === 'GET' && match) {
      const sheetId = match[1];
      const result = dataValidation.validate(sheetId);
      return jsonRes({ success: true, data: result });
    }

    // --- Route: Apply conditional formatting ---
    // POST /api/sheets/:id/conditional
    match = path.match(/^\/api\/sheets\/([^/]+)\/conditional$/);
    if (method === 'POST' && match) {
      const sheetId = match[1];
      const rules = await request.json() as any[];
      const result = conditionalFormat.apply(sheetId, rules);
      return jsonRes({ success: true, data: result });
    }

    // --- Route: Export data ---
    // GET /api/sheets/:id/export?format=csv|json|tsv|md
    match = path.match(/^\/api\/sheets\/([^/]+)\/export$/);
    if (method === 'GET' && match) {
      const sheetId = match[1];
      const format = url.searchParams.get('format') || 'json';
      const sheetData = spreadsheetEngine.getSheetData(sheetId);
      const exported = dataIO.exportData(sheetData, format);
      return jsonRes({ success: true, data: exported });
    }

    // --- Route: Import data ---
    // POST /api/import
    match = path.match(/^\/api\/import$/);
    if (method === 'POST' && match) {
      const { data, format, sheetName } = await request.json() as { data: string, format: 'csv' | 'json' | 'tsv' | 'md', sheetName?: string };
      const parsed = dataIO.importData(data, format);
      const sheet = spreadsheetEngine.createSheet(sheetName || 'Imported', parsed);
      return jsonRes({ success: true, data: sheet });
    }

    // --- Route: Get/Update specific sheet ---
    // GET /api/sheets/:id
    // PUT /api/sheets/:id
    match = path.match(/^\/api\/sheets\/([^/]+)$/);
    if (match) {
      const sheetId = match[1];

      if (method === 'GET') {
        const sheet = spreadsheetEngine.getSheet(sheetId);
        if (!sheet) {
          return jsonRes({ success: false, error: 'Sheet not found' }, { status: 404 });
        }
        return jsonRes({ success: true, data: sheet });
      }

      if (method === 'PUT') {
        const updates = await request.json() as any;
        const updatedSheet = spreadsheetEngine.updateCells(sheetId, updates);
        return jsonRes({ success: true, data: updatedSheet });
      }
    }

    // Fallback for unhandled routes
    return new Response(landing(), { headers: { 'Content-Type': 'text/html;charset=utf-8' } });
  }
};

export default api;
