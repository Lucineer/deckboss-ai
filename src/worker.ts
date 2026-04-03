import { evapPipeline, getEvapReport, getLockStats } from './lib/evaporation-pipeline.js';
import { softActualize, confidenceScore } from './lib/soft-actualize.js';
import { deadbandCheck, deadbandStore } from './lib/deadband.js';
import { loadStats, recordHit, recordMiss } from './lib/response-logger.js';
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
import { getTracker } from './lib/confidence-tracker.js';
import { getRouter } from './lib/model-router.js';

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
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Deckboss.ai — Watch Cells Think for Themselves</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui;background:#0a0a1a;color:#e0e0e0}.hero{background:linear-gradient(135deg,#58a6ff11,#f7816611,#0a0a1a);padding:5rem 2rem 3rem;text-align:center}.hero h1{font-size:3rem;background:linear-gradient(90deg,#58a6ff,#f78166);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:.5rem}.hero .tagline{color:#8b949e;font-size:1.1rem;max-width:550px;margin:0 auto 1.5rem}.fork-btns{display:flex;gap:.8rem;justify-content:center;flex-wrap:wrap}.fork-btns a{padding:.5rem 1.2rem;background:rgba(88,166,255,.1);border:1px solid #58a6ff33;border-radius:8px;color:#58a6ff;text-decoration:none;font-size:.85rem}.demo-section{max-width:850px;margin:0 auto 3rem;padding:0 1rem}.demo-label{color:#f78166;font-size:.8rem;text-transform:uppercase;letter-spacing:2px;margin-bottom:1rem;display:flex;align-items:center;gap:.5rem}.demo-label::before,.demo-label::after{content:'';flex:1;height:1px;background:#58a6ff22}.spreadsheet{background:#161b22;border:1px solid #30363d;border-radius:12px;overflow:hidden;font-size:.85rem}.sheet-header{background:#21262d;padding:.6rem 1rem;color:#8b949e;font-size:.75rem;display:flex;justify-content:space-between;align-items:center}.sheet-header .title{color:#58a6ff;font-weight:600}.sheet-header .status{color:#f78166;font-size:.7rem;display:flex;align-items:center;gap:.3rem}.sheet-header .status::before{content:'';width:6px;height:6px;border-radius:50%;background:#f78166;animation:pulse 2s infinite}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}table{width:100%;border-collapse:collapse}.th{background:#21262d;color:#8b949e;font-weight:600;text-align:left;padding:.5rem .8rem;font-size:.75rem;border-bottom:1px solid #30363d}.td{padding:.5rem .8rem;border-bottom:1px solid #21262d;color:#c9d1d9}.tr:hover{background:#161b22}.cell-agent{background:#f7816611;border:1px solid #f7816633;border-radius:4px;padding:.3rem .5rem;display:inline-block;font-size:.75rem;color:#f78166;margin:.1rem 0}.cell-agent .agent-icon{margin-right:.3rem}.cell-formula{color:#58a6ff;font-family:monospace;font-size:.78rem}.cell-value{color:#c9d1d9;font-weight:600}.cell-delta{font-size:.7rem}.cell-delta.up{color:#3fb950}.cell-delta.down{color:#f85149}.byok{max-width:600px;margin:0 auto 2rem;padding:0 1rem}.byok h3{color:#58a6ff;margin-bottom:.8rem;font-size:1rem}.byok-row{display:flex;gap:.5rem}.byok-row input{flex:1;padding:.6rem 1rem;background:#161b22;border:1px solid #30363d;border-radius:8px;color:#e0e0e0}.byok-row button{padding:.6rem 1.5rem;background:linear-gradient(135deg,#58a6ff,#f78166);color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer}.fork-bar{max-width:800px;margin:0 auto 3rem;padding:0 1rem;background:#161b22;border:1px solid #30363d;border-radius:12px;padding:1.5rem}.fork-bar h3{color:#f78166;margin-bottom:.8rem;font-size:1rem}.deploy-box{background:#0a0a1a;border:1px solid #30363d;border-radius:8px;padding:1rem;position:relative}.deploy-box code{font-family:monospace;font-size:.78rem;color:#58a6ff;display:block;white-space:pre-wrap}.copy-btn{position:absolute;top:.5rem;right:.5rem;background:#30363d;border:none;border-radius:4px;color:#58a6ff;padding:.2rem .5rem;font-size:.7rem;cursor:pointer}.footer{text-align:center;padding:2rem;color:#30363d;font-size:.8rem;border-top:1px solid #21262d}</style></head><body><div class="hero"><h1>Deckboss.ai</h1><p class="tagline">Watch cells think for themselves — the AI spreadsheet that negotiates, forecasts, and reasons.</p><div class="fork-btns"><a href="https://github.com/superinstance/deckboss-ai" target="_blank">⭐ Star</a><a href="https://github.com/superinstance/deckboss-ai/fork" target="_blank">🍴 Fork</a></div></div><div class="demo-section"><div class="demo-label">Live Demo — Budget Tracker with Agent Cells</div><div class="spreadsheet"><div class="sheet-header"><span class="title">Q2 2025 Budget — Live</span><span class="status">3 agents active</span></div><table><tr class="tr"><td class="th">Line Item</td><td class="th">Jan</td><td class="th">Feb</td><td class="th">Mar</td><td class="th">Agent</td></tr><tr class="tr"><td class="td">AWS Hosting</td><td class="td"><span class="cell-value">$4,200</span></td><td class="td"><span class="cell-value">$4,200</span></td><td class="td"><span class="cell-value">$3,850</span> <span class="cell-delta up">-8.3%</span></td><td class="td"><span class="cell-agent"><span class="agent-icon">🤝</span> Negotiator: Contacted AWS for reserved instance pricing. Recommended 1-year commit → saves $1,080/yr</span></td></tr><tr class="tr"><td class="td">SaaS Tools</td><td class="td"><span class="cell-value">$2,100</span></td><td class="td"><span class="cell-value">$2,340</span> <span class="cell-delta down">+11.4%</span></td><td class="td"><span class="cell-value">$2,340</span></td><td class="td"><span class="cell-agent"><span class="agent-icon">🤝</span> Negotiator: Found 3 unused seats on Figma + Slack. Cancelled → saves $180/mo</span></td></tr><tr class="tr"><td class="td">Revenue</td><td class="td"><span class="cell-value">$42k</span></td><td class="td"><span class="cell-value">$45k</span> <span class="cell-delta up">+7.1%</span></td><td class="td"><span class="cell-value">$48k</span> <span class="cell-delta up">+6.7%</span></td><td class="td"><span class="cell-agent"><span class="agent-icon">📊</span> Forecaster: Projecting $52k for Apr based on pipeline. 78% confidence interval: $48k-$56k</span></td></tr><tr class="tr"><td class="td">Net Margin</td><td class="td"><span class="cell-value">$35.7k</span></td><td class="td"><span class="cell-value">$38.5k</span></td><td class="td"><span class="cell-value">$41.8k</span> <span class="cell-delta up">+8.6%</span></td><td class="td"><span class="cell-formula">=Revenue - (AWS + SaaS + Payroll)</span></td></tr><tr class="tr"><td class="td">Payroll</td><td class="td"><span class="cell-value">$28k</span></td><td class="td"><span class="cell-value">$28k</span></td><td class="td"><span class="cell-value">$28k</span></td><td class="td"><span class="cell-value" style="color:#8b949e">Fixed</span></td></tr></table></div></div><div class="byok"><h3>🔑 Bring Your Own Key — Start Building</h3><div class="byok-row"><input id="key" placeholder="sk-... your API key" type="password"><button onclick="window.location.href='/setup?key='+document.getElementById('key').value">Open Spreadsheet →</button></div></div><div class="fork-bar"><h3>⚡ Fork & Deploy</h3><div class="deploy-box"><button class="copy-btn" onclick="navigator.clipboard.writeText(this.parentElement.querySelector('code').textContent);this.textContent='Copied!'">Copy</button><code>git clone https://github.com/superinstance/deckboss-ai.git
cd deckboss-ai
npm install
npx wrangler deploy</code></div></div><div class="footer">Deckboss.ai — Part of the Cocapn Ecosystem</div></body></html>`;
}

const api = {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method.toUpperCase();

    if (method === 'OPTIONS') {
      return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type,Authorization' } });
    }

    if (path === '/') return new Response(landing(), { headers: { 'Content-Type': 'text/html;charset=utf-8' } });

    if (method === 'GET' && path === '/setup') {
      return new Response(generateSetupHTML('deckboss-ai'), { headers: { 'Content-Type': 'text/html;charset=utf-8', ...CSP_HEADER } });
    }

    // --- Phase 1B: Confidence tracking ---
    if (path === '/api/confidence') {
      const tracker = getTracker();
      if (method === 'GET') return jsonRes(tracker.getAll());
      if (method === 'POST') {
        const { topic, success } = await request.json();
        tracker.record(topic, typeof success === 'boolean' ? success : true);
        await (env as any).MEMORY?.put?.('confidence-state', tracker.serialize());
        return jsonRes(tracker.get(topic));
      }
    }

    if (method === 'GET' && path === '/api/efficiency') { return jsonRes(await loadStats((env as any).MEMORY)); }

    if (method === 'POST' && path === '/api/chat') {
      try {
        const body = await request.json();
        const apiKey = (env as any)?.OPENAI_API_KEY || (env as any)?.ANTHROPIC_API_KEY || (env as any)?.GEMINI_API_KEY;
        if (!apiKey) return jsonRes({ error: 'No API key configured. Visit /setup to configure.' }, { status: 503 });


        const cached = await deadbandCheck((env as any).MEMORY, lastMsg, 'deckboss');
        if (cached) { await recordHit((env as any).MEMORY); return jsonRes({ response: cached.response, fromCache: true }); }

        const tracker = getTracker();
        const router = getRouter();
        const saved = await (env as any).MEMORY?.get?.('confidence-state');
        if (saved) tracker.deserialize(saved);

        const msgs = body.messages || [{ role: 'user', content: body.message || '' }];
        const lastMsg = msgs.filter((m: any) => m.role === 'user').pop()?.content ?? '';
        const topic = tracker.classify(lastMsg);
        const conf = tracker.get(topic);
        const decision = router.route(topic, conf.score, conf.count);

        const sysContent = `You are Deckboss.ai, a helpful AI spreadsheet agent.\n[Model routing: tier ${decision.tier} — ${decision.reason}]`;
        const messages = [{ role: 'system', content: sysContent }, ...msgs];
        const resp = await callLLM(apiKey, messages);

        tracker.record(topic, true);
        await (env as any).MEMORY?.put?.('confidence-state', tracker.serialize());
        await recordMiss((env as any).MEMORY);

        return jsonRes({ response: resp, _tier: decision.tier, _topic: topic, _confidence: conf.score });
      } catch (e: any) { return jsonRes({ error: e.message }, { status: 500 }); }
    }

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

    return new Response('{"error":"Not Found"}', { status: 404, headers: { 'Content-Type': 'application/json' } });
  }
};

export default api;
