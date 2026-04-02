/**
 * Deckboss Worker — Cloudflare Worker for Deckboss.ai
 * AI spreadsheet where cells can be AI agents.
 */
import { loadBYOKConfig, callLLM, generateSetupHTML } from './lib/byok.js';

const SYSTEM_PROMPT = `You are Deckboss, an AI spreadsheet assistant. You help users manage data, run AI-powered cells, and automate workflows. You understand spreadsheet formulas and can explain how CLAW, GATE, TWIN, and UI cells work. Be efficient, organized, and powerful.`;

const CHAT_HTML = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Deckboss.ai</title><style>
*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,sans-serif;background:#0f172a;color:#e2e8f0;min-height:100vh}
.header{background:linear-gradient(135deg,#8b5cf6,#4c1d95);padding:2rem;text-align:center}.header h1{font-size:2rem;color:#f5f3ff}.header p{color:#c4b5fd;margin-top:.5rem}
.container{max-width:900px;margin:0 auto;padding:1rem}.chat{display:flex;flex-direction:column;height:55vh;border:1px solid #1e293b;border-radius:12px;overflow:hidden;background:#0f172a}
.messages{flex:1;overflow-y:auto;padding:1rem}.msg{margin-bottom:1rem;padding:.75rem 1rem;border-radius:8px;max-width:80%}.msg.user{background:#4c1d95;margin-left:auto;color:#c4b5fd}.msg.ai{background:#1e293b;color:#e2e8f0}
.input-area{display:flex;padding:1rem;gap:.5rem;border-top:1px solid #1e293b}textarea{flex:1;background:#1e293b;color:#e2e8f0;border:1px solid #334155;border-radius:8px;padding:.75rem;resize:none;font-family:inherit}button{background:#8b5cf6;color:#f5f3ff;border:none;border-radius:8px;padding:.75rem 1.5rem;cursor:pointer;font-weight:600}button:hover{background:#7c3aed}
.setup-link{text-align:center;margin:1rem}.setup-link a{color:#c4b5fd;text-decoration:none}
.info{background:#1e293b;border-radius:8px;padding:1rem;margin:1rem 0;color:#94a3b8;font-size:.875rem}
.info h3{color:#a78bfa;margin-bottom:.5rem}
</style></head><body><div class="header"><h1>📊 Deckboss.ai</h1><p>AI-powered spreadsheet — cells that think</p></div>
<div class="container"><div class="info"><h3>Cell Types</h3><b>CLAW</b> = AI agent cell &nbsp; <b>GATE</b> = API connector &nbsp; <b>TWIN</b> = Digital twin &nbsp; <b>UI</b> = Visual component &nbsp; <b>STANDARD</b> = Data/formula</div>
<div class="chat"><div class="messages" id="msgs"></div><div class="input-area"><textarea id="input" placeholder="Ask about your spreadsheet..." rows="2"></textarea><button onclick="send()">Send</button></div></div>
<div class="setup-link"><a href="/setup">⚙️ Configure API Key</a></div></div>
<script>
const msgs=document.getElementById('msgs');const input=document.getElementById('input');
function addMsg(role,text){const d=document.createElement('div');d.className='msg '+role;d.textContent=text;msgs.appendChild(d);msgs.scrollTop=msgs.scrollHeight}
async function send(){const text=input.value.trim();if(!text)return;input.value='';addMsg('user',text);
try{const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:[{role:'user',content:text}]})});
const reader=r.body.getReader();const dec=new TextDecoder();let ai='';while(true){const{done,value}=await reader.read();if(done)break;ai+=dec.decode(value);msgs.lastChild.remove();addMsg('ai',ai)}}
catch(e){addMsg('ai','Error: '+e.message)}}
input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}});
addMsg('ai','Hi! I\\'m Deckboss 📊. I help you build AI-powered spreadsheets. Ask me about CLAW cells (AI agents), GATE cells (APIs), TWIN cells (digital twins), or anything else!');
</script></body></html>`;

export default {
  async fetch(request: Request, env: { MEMORY: KVNamespace }): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/' || url.pathname === '') {
      return new Response(CHAT_HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', agent: 'Deckboss', version: '1.0.0' }), { headers: { 'Content-Type': 'application/json' } });
    }
    if (url.pathname === '/setup') {
      return new Response(generateSetupHTML('Deckboss', '#8b5cf6'), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }
    if (url.pathname === '/api/byok' && request.method === 'GET') {
      const config = await loadBYOKConfig(request, env.MEMORY);
      return new Response(JSON.stringify(config), { headers: { 'Content-Type': 'application/json' } });
    }
    if (url.pathname === '/api/byok' && request.method === 'POST') {
      const body = await request.json() as Record<string, string>;
      await env.MEMORY.put('byok-config', JSON.stringify(body));
      return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
    }
    if (url.pathname === '/api/chat' && request.method === 'POST') {
      const { messages } = await request.json() as { messages: Array<{ role: string; content: string }> };
      const config = await loadBYOKConfig(request, env.MEMORY);
      if (!config) {
        return new Response(JSON.stringify({ error: 'No BYOK config. Visit /setup.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
      const allMessages = [{ role: 'system', content: SYSTEM_PROMPT }, ...messages];
      const stream = await callLLM(config, allMessages, { stream: true }) as ReadableStream;
      return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } });
    }
    return new Response('Not found', { status: 404 });
  }
};
