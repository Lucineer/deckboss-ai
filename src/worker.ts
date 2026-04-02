import { SpreadsheetManager } from "./core/spreadsheet.js";
import { CellRuntime } from "./core/cell-runtime.js";
import { FormulaRegistry } from "./core/formulas.js";
import { CellProtocol } from "./core/cell-protocol.js";
import { BYOKManager } from "./lib/byok.js";

export interface Env {
  MEMORY: KVNamespace;
}

const SYSTEM_PROMPT =
  "You are Deckboss, an AI spreadsheet assistant. You help users manage data, run AI-powered cells, and automate workflows. Be efficient, organized, and powerful.";

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Deckboss.ai — AI Spreadsheet</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#0f0f14;--surface:#1a1a24;--surface2:#22222e;--border:#2e2e3e;--accent:#8b5cf6;--accent2:#a78bfa;--text:#e2e0eb;--muted:#8888a0;--cell-bg:#16161f;--cell-active:#1e1e2c;--green:#34d399;--red:#f87171}
body{font-family:'Inter',system-ui,-apple-system,sans-serif;background:var(--bg);color:var(--text);height:100vh;display:flex;flex-direction:column;overflow:hidden}
header{display:flex;align-items:center;justify-content:space-between;padding:10px 20px;background:var(--surface);border-bottom:1px solid var(--border)}
.logo{font-size:18px;font-weight:700;letter-spacing:-0.5px}.logo span{color:var(--accent)}
.actions{display:flex;gap:8px}
button{background:var(--surface2);color:var(--text);border:1px solid var(--border);padding:6px 14px;border-radius:6px;cursor:pointer;font-size:13px;transition:.15s}
button:hover{background:var(--accent);color:#fff;border-color:var(--accent)}
.toolbar{display:flex;gap:6px;padding:8px 20px;background:var(--surface);border-bottom:1px solid var(--border)}
.toolbar button{font-size:12px;padding:4px 10px}
.spreadsheet{flex:1;display:grid;grid-template-columns:50px 1fr;grid-template-rows:auto 1fr;overflow:hidden}
.col-headers{grid-column:2;display:flex;overflow:hidden}
.col-header{min-width:120px;width:120px;padding:6px 8px;background:var(--surface);border-right:1px solid var(--border);border-bottom:1px solid var(--border);font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase;text-align:center}
.row-labels{grid-column:1;overflow:hidden}
.row-label{height:28px;padding:0 8px;display:flex;align-items:center;justify-content:center;background:var(--surface);border-bottom:1px solid var(--border);font-size:11px;color:var(--muted)}
.grid-container{grid-column:2;grid-row:2;overflow:auto}
table{border-collapse:collapse;width:max-content}
td{min-width:120px;height:28px;padding:0 8px;border-right:1px solid var(--border);border-bottom:1px solid var(--border);background:var(--cell-bg);font-size:13px;cursor:cell;max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
td:hover{background:var(--cell-active)}
td.active{outline:2px solid var(--accent);outline-offset:-2px;z-index:1}
td.ai-cell{border-left:2px solid var(--accent)}
td .ai-badge{font-size:9px;background:var(--accent);color:#fff;padding:1px 4px;border-radius:3px;margin-left:4px}
.formula-bar{display:flex;align-items:center;gap:8px;padding:6px 20px;background:var(--surface);border-bottom:1px solid var(--border)}
.formula-bar label{font-size:12px;color:var(--muted);font-weight:600}
.formula-bar input{flex:1;background:var(--cell-bg);border:1px solid var(--border);color:var(--text);padding:4px 10px;border-radius:4px;font-family:'Fira Code',monospace;font-size:13px}
.formula-bar input:focus{outline:none;border-color:var(--accent)}
.chat-panel{position:fixed;right:0;top:0;bottom:0;width:380px;background:var(--surface);border-left:1px solid var(--border);display:flex;flex-direction:column;transform:translateX(100%);transition:transform .3s;z-index:100}
.chat-panel.open{transform:translateX(0)}
.chat-header{padding:14px 16px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center}
.chat-messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px}
.msg{padding:10px 14px;border-radius:8px;font-size:13px;line-height:1.5;max-width:90%}
.msg.user{background:var(--accent);color:#fff;align-self:flex-end}
.msg.assistant{background:var(--surface2);align-self:flex-start}
.chat-input{display:flex;gap:8px;padding:12px;border-top:1px solid var(--border)}
.chat-input input{flex:1;background:var(--cell-bg);border:1px solid var(--border);color:var(--text);padding:8px 12px;border-radius:6px;font-size:13px}
.chat-input input:focus{outline:none;border-color:var(--accent)}
.status-bar{display:flex;justify-content:space-between;padding:4px 20px;background:var(--surface);border-top:1px solid var(--border);font-size:11px;color:var(--muted)}
</style>
</head>
<body>
<header>
  <div class="logo">Deck<span>boss</span>.ai</div>
  <div class="actions">
    <button onclick="toggleChat()">💬 Chat</button>
    <button onclick="showSetup()">⚙️ BYOK</button>
    <button onclick="location.reload()">↻</button>
  </div>
</header>
<div class="toolbar">
  <button onclick="addRow()">+ Row</button>
  <button onclick="addCol()">+ Column</button>
  <button onclick="markAI()">🤖 AI Cell</button>
  <button onclick="runCell()">▶ Run</button>
  <button onclick="runAll()">▶▶ Run All</button>
  <button onclick="save()">💾 Save</button>
</div>
<div class="formula-bar">
  <label>fx</label>
  <input id="formulaInput" placeholder="Enter formula or value..." onkeydown="if(event.key==='Enter')commitFormula()">
</div>
<div class="spreadsheet" id="spreadsheet"></div>
<div class="status-bar">
  <span id="status">Ready</span>
  <span id="cellInfo">A1</span>
</div>
<div class="chat-panel" id="chatPanel">
  <div class="chat-header">
    <strong>Deckboss AI</strong>
    <button onclick="toggleChat()">✕</button>
  </div>
  <div class="chat-messages" id="chatMessages">
    <div class="msg assistant">Hi! I'm Deckboss. Ask me to analyze data, set up AI cells, or automate your spreadsheet.</div>
  </div>
  <div class="chat-input">
    <input id="chatInput" placeholder="Ask Deckboss..." onkeydown="if(event.key==='Enter')sendChat()">
  </div>
</div>
<script>
const COLS='ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
let data={id:'',title:'Untitled',rows:20,cols:8,cells:{},aiCells:new Set()};
let activeCell={r:0,c:0};
let sheetId=null;

function cellKey(r,c){return COLS[c]+(r+1)}
function getCell(r,c){return data.cells[cellKey(r,c)]||{value:'',formula:''}}

async function init(){
  const saved=await fetch('/api/spreadsheet/new',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:'New Sheet'})}).then(r=>r.json());
  sheetId=saved.id;data.id=sheetId;render();
}

function render(){
  const ss=document.getElementById('spreadsheet');
  let html='<div class="col-headers">';
  for(let c=0;c<data.cols;c++)html+='<div class="col-header">'+COLS[c]+'</div>';
  html+='</div><div class="grid-container"><table>';
  for(let r=0;r<data.rows;r++){
    html+='<tr><td class="row-label" style="min-width:unset;width:50px;background:var(--surface);color:var(--muted);font-size:11px;text-align:center;border-right:1px solid var(--border)">'+(r+1)+'</td>';
    for(let c=0;c<data.cols;c++){
      const k=cellKey(r,c),cell=getCell(r,c),isAI=data.aiCells.has(k);
      const isActive=activeCell.r===r&&activeCell.c===c;
      html+='<td class="'+(isActive?'active ':'')+(isAI?'ai-cell':'')+'" data-r="'+r+'" data-c="'+c+'" onclick="selectCell('+r+','+c+')" ondblclick="editCell('+r+','+c+')">'+(cell.value||'')+(isAI?'<span class="ai-badge">AI</span>':'')+'</td>';
    }
    html+='</tr>';
  }
  html+='</table></div>';
  ss.innerHTML=html;
  document.getElementById('cellInfo').textContent=cellKey(activeCell.r,activeCell.c);
}

function selectCell(r,c){
  activeCell={r,c};
  const cell=getCell(r,c);
  document.getElementById('formulaInput').value=cell.formula||cell.value||'';
  render();
}

async function commitFormula(){
  const k=cellKey(activeCell.r,activeCell.c),val=document.getElementById('formulaInput').value;
  data.cells[k]={value:val,formula:val.startsWith('=')?val:''};
  await fetch('/api/spreadsheet/'+sheetId+'/cell',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({row:activeCell.r,col:activeCell.c,value:val,formula:val.startsWith('=')?val:''})});
  render();
}

function editCell(r,c){selectCell(r,c);document.getElementById('formulaInput').focus()}
function addRow(){data.rows++;render()}
function addCol(){data.cols++;render()}

function markAI(){
  const k=cellKey(activeCell.r,activeCell.c);
  data.aiCells.has(k)?data.aiCells.delete(k):data.aiCells.add(k);
  render();
}

async function runCell(){
  const k=cellKey(activeCell.r,activeCell.c);
  document.getElementById('status').textContent='Running '+k+'...';
  const res=await fetch('/api/spreadsheet/'+sheetId+'/execute',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cells:[k]})}).then(r=>r.json());
  if(res.results)Object.entries(res.results).forEach(([key,val])=>{if(data.cells[key])data.cells[key].value=val});
  render();document.getElementById('status').textContent='Done';
}

async function runAll(){
  document.getElementById('status').textContent='Running all...';
  const res=await fetch('/api/spreadsheet/'+sheetId+'/execute',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cells:Array.from(data.aiCells)})}).then(r=>r.json());
  if(res.results)Object.entries(res.results).forEach(([key,val])=>{if(data.cells[key])data.cells[key].value=val});
  render();document.getElementById('status').textContent='All cells executed';
}

async function save(){
  await fetch('/api/spreadsheet/'+sheetId+'/cell',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({fullData:data})});
  document.getElementById('status').textContent='Saved';
}

function toggleChat(){document.getElementById('chatPanel').classList.toggle('open')}

async function sendChat(){
  const input=document.getElementById('chatInput'),msg=input.value.trim();
  if(!msg)return;
  const msgs=document.getElementById('chatMessages');
  msgs.innerHTML+='<div class="msg user">'+msg+'</div>';
  input.value='';msgs.scrollTop=msgs.scrollHeight;
  try{
    const res=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:msg,sheetId,context:{cells:data.cells,aiCells:Array.from(data.aiCells)}})});
    const data=await res.json();
    msgs.innerHTML+='<div class="msg assistant">'+data.reply+'</div>';
  }catch(e){msgs.innerHTML+='<div class="msg assistant" style="color:var(--red)">Error: '+e.message+'</div>'}
  msgs.scrollTop=msgs.scrollHeight;
}

function showSetup(){window.location.href='/setup'}
init();
</script>
</body>
</html>`;

const SETUP_HTML = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Deckboss — BYOK Setup</title><style>
*