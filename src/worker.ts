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
const api = {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method.toUpperCase();

    // --- Route: List all sheets ---
    // GET /api/sheets
    if (method === 'GET' && path === '/api/sheets') {
      const sheets = spreadsheetEngine.getAllSheets();
      return Response.json({ success: true, data: sheets });
    }

    // --- Route: Create sheet ---
    // POST /api/sheets
    if (method === 'POST' && path === '/api/sheets') {
      const body = await request.json() as { name?: string, data?: any };
      const sheet = spreadsheetEngine.createSheet(body.name, body.data);
      return Response.json({ success: true, data: sheet });
    }

    // --- Route: Evaluate formula ---
    // POST /api/sheets/:id/formula
    let match = path.match(/^\/api\/sheets\/([^/]+)\/formula$/);
    if (method === 'POST' && match) {
      const sheetId = match[1];
      const { formula } = await request.json() as { formula: string };
      const result = formulaEngine.evaluate(formula);
      return Response.json({ success: true, data: { result } });
    }

    // --- Route: Generate chart config ---
    // POST /api/sheets/:id/chart
    match = path.match(/^\/api\/sheets\/([^/]+)\/chart$/);
    if (method === 'POST' && match) {
      const sheetId = match[1];
      const config = await request.json() as any;
      const chartConfig = chartRenderer.generateConfig(sheetId, config);
      return Response.json({ success: true, data: chartConfig });
    }

    // --- Route: Validate data ---
    // GET /api/sheets/:id/validation
    match = path.match(/^\/api\/sheets\/([^/]+)\/validation$/);
    if (method === 'GET' && match) {
      const sheetId = match[1];
      const result = dataValidation.validate(sheetId);
      return Response.json({ success: true, data: result });
    }

    // --- Route: Apply conditional formatting ---
    // POST /api/sheets/:id/conditional
    match = path.match(/^\/api\/sheets\/([^/]+)\/conditional$/);
    if (method === 'POST' && match) {
      const sheetId = match[1];
      const rules = await request.json() as any[];
      const result = conditionalFormat.apply(sheetId, rules);
      return Response.json({ success: true, data: result });
    }

    // --- Route: Export data ---
    // GET /api/sheets/:id/export?format=csv|json|tsv|md
    match = path.match(/^\/api\/sheets\/([^/]+)\/export$/);
    if (method === 'GET' && match) {
      const sheetId = match[1];
      const format = url.searchParams.get('format') || 'json';
      const sheetData = spreadsheetEngine.getSheetData(sheetId);
      const exported = dataIO.exportData(sheetData, format);
      return Response.json({ success: true, data: exported });
    }

    // --- Route: Import data ---
    // POST /api/import
    match = path.match(/^\/api\/import$/);
    if (method === 'POST' && match) {
      const { data, format, sheetName } = await request.json() as { data: string, format: 'csv' | 'json' | 'tsv' | 'md', sheetName?: string };
      const parsed = dataIO.importData(data, format);
      const sheet = spreadsheetEngine.createSheet(sheetName || 'Imported', parsed);
      return Response.json({ success: true, data: sheet });
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
          return Response.json({ success: false, error: 'Sheet not found' }, { status: 404 });
        }
        return Response.json({ success: true, data: sheet });
      }

      if (method === 'PUT') {
        const updates = await request.json() as any;
        const updatedSheet = spreadsheetEngine.updateCells(sheetId, updates);
        return Response.json({ success: true, data: updatedSheet });
      }
    }

    // Fallback for unhandled routes
    return Response.json({ success: false, error: 'API endpoint not found' }, { status: 404 });
  }
};

export default api;
