// Deckboss.ai v2 — Hub-and-Spoke Fleet Command Center
// Spreadsheet view + flowchart view + real-time agent interactions
// The repo IS the agent. Every vessel is a node. The chatbot is the hub.

interface Env {
  DECKBOSS_KV: KVNamespace;
  DEEPSEEK_API_KEY: string;
}

const DS = 'https://api.deepseek.com/chat/completions';
const CSP_OBJ = {'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.deepseek.com https://raw.githubusercontent.com https://*;"};

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', ...CSP_OBJ } });
}

// ── Fleet nodes (known vessels) ──
const HUB_NODES = [
  { id: 'hub', label: 'Deckboss', type: 'hub', color: '#f78166', icon: '⚓', desc: 'Central command — routes messages, orchestrates fleet' },
  { id: 'studylog', label: 'StudyLog', type: 'agent', color: '#F59E0B', icon: '📚', desc: 'AI classroom with crystal graph memory', url: 'https://studylog-ai.casey-digennaro.workers.dev' },
  { id: 'dmlog', label: 'DMLog', type: 'agent', color: '#c9a23c', icon: '🎲', desc: 'AI Dungeon Master — TTRPG with 9-model router', url: 'https://dmlog-ai.casey-digennaro.workers.dev' },
  { id: 'makerlog', label: 'MakerLog', type: 'agent', color: '#00d4ff', icon: '🔧', desc: 'Coding agent — builds, tests, deploys', url: 'https://makerlog-ai.casey-digennaro.workers.dev' },
  { id: 'personallog', label: 'PersonalLog', type: 'agent', color: '#818cf8', icon: '📝', desc: 'Personal AI assistant with memory', url: 'https://personallog-ai.casey-digennaro.workers.dev' },
  { id: 'businesslog', label: 'BusinessLog', type: 'agent', color: '#3b82f6', icon: '💼', desc: 'Business CRM and meeting simulator', url: 'https://businesslog-ai.casey-digennaro.workers.dev' },
  { id: 'fishinglog', label: 'FishingLog', type: 'agent', color: '#4ade80', icon: '🐟', desc: 'Fishing companion with species tracker', url: 'https://fishinglog-ai.casey-digennaro.workers.dev' },
  { id: 'fleet-rpg', label: 'Fleet RPG', type: 'app', color: '#ef4444', icon: '⚔️', desc: 'Stats-as-compute RPG encounter engine', url: 'https://fleet-rpg.casey-digennaro.workers.dev' },
  { id: 'dogmind', label: 'DogMind', type: 'app', color: '#d69e2e', icon: '🐕', desc: 'Dog training arena with DNA system', url: 'https://dogmind-arena.casey-digennaro.workers.dev' },
  { id: 'the-seed', label: 'The Seed', type: 'meta', color: '#a855f7', icon: '🌱', desc: 'One repo to become them all', url: 'https://the-seed.casey-digennaro.workers.dev' },
  { id: 'become', label: 'Become', type: 'meta', color: '#a855f7', icon: '🔮', desc: 'Captain-to-cocapn bootcamp', url: 'https://become-ai.casey-digennaro.workers.dev' },
  { id: 'self-evolve', label: 'Self-Evolve', type: 'meta', color: '#22c55e', icon: '🧬', desc: 'Branch-based A/B mutation tester', url: 'https://self-evolve-ai.casey-digennaro.workers.dev' },
  { id: 'luciddreamer', label: 'LucidDreamer', type: 'app', color: '#818cf8', icon: '🌙', desc: 'Overnight content engine', url: 'https://luciddreamer-ai.casey-digennaro.workers.dev' },
  { id: 'capitaine', label: 'Capitaine', type: 'infra', color: '#00E6D6', icon: '⚓', desc: 'Flagship — papers, onboarding, HN launch', url: 'https://capitaine.casey-digennaro.workers.dev' },
  { id: 'orchestrator', label: 'Orchestrator', type: 'infra', color: '#00E6D6', icon: '🌐', desc: 'Trust, bonds, fleet event bus', url: 'https://fleet-orchestrator.casey-digennaro.workers.dev' },
  { id: 'kv-store', label: 'Fleet Memory', type: 'storage', color: '#64748b', icon: '💾', desc: 'KV-backed persistent memory layer' },
  { id: 'github', label: 'GitHub', type: 'storage', color: '#64748b', icon: '🐙', desc: 'Git coordination — branches, PRs, issues' },
];

// Edges: connections between nodes
const HUB_EDGES = [
  ['hub','studylog'],['hub','dmlog'],['hub','makerlog'],['hub','personallog'],['hub','businesslog'],['hub','fishinglog'],
  ['studylog','kv-store'],['dmlog','kv-store'],['makerlog','kv-store'],['personallog','kv-store'],['businesslog','kv-store'],['fishinglog','kv-store'],
  ['hub','fleet-rpg'],['hub','dogmind'],['hub','the-seed'],['hub','become'],['hub','self-evolve'],
  ['hub','luciddreamer'],['hub','capitaine'],['hub','orchestrator'],
  ['hub','kv-store'],['hub','github'],
  ['the-seed','github'],['self-evolve','github'],['capitaine','github'],
  ['orchestrator','kv-store'],['capitaine','orchestrator'],
  ['fleet-rpg','dmlog'],['dogmind','fishinglog'],
  ['luciddreamer','studylog'],['luciddreamer','dmlog'],
];

// ── Landing HTML with Hub-and-Spoke Canvas ──
function landing(): string {
  return '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Deckboss.ai — Fleet Command Center</title>' +
  '<style>' +
  '*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,-apple-system,sans-serif;background:#0a0a0f;color:#e0e0e0;overflow:hidden;height:100vh}' +
  '#canvas{position:absolute;top:0;left:0;width:100%;height:100%;cursor:grab}#canvas.dragging{cursor:grabbing}' +
  '.toolbar{position:fixed;top:0;left:0;right:0;height:48px;background:#0e0e1a;border-bottom:1px solid #1c1c35;display:flex;align-items:center;padding:0 16px;gap:12px;z-index:10}' +
  '.toolbar .logo{font-weight:700;font-size:1rem;background:linear-gradient(90deg,#f78166,#58a6ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent}' +
  '.toolbar .sep{width:1px;height:24px;background:#1c1c35}' +
  '.view-btn{padding:4px 12px;border-radius:6px;border:1px solid #1c1c35;background:transparent;color:#8A93B4;font-size:.8rem;cursor:pointer;transition:all .15s}' +
  '.view-btn:hover{border-color:#58a6ff;color:#e0e0e0}.view-btn.active{background:#58a6ff22;border-color:#58a6ff;color:#58a6ff}' +
  '.status{margin-left:auto;display:flex;align-items:center;gap:8px;font-size:.75rem;color:#8A93B4}' +
  '.dot{width:6px;height:6px;border-radius:50%;background:#1FCB58}' +
  '.chat-panel{position:fixed;bottom:0;right:0;width:380px;height:400px;background:#0e0e1a;border:1px solid #1c1c35;border-radius:12px 12px 0 0;z-index:10;display:flex;flex-direction:column;transition:height .2s}' +
  '.chat-panel.collapsed{height:48px;border-radius:12px}' +
  '.chat-head{padding:12px 16px;border-bottom:1px solid #1c1c35;display:flex;align-items:center;justify-content:space-between;cursor:pointer;flex-shrink:0}' +
  '.chat-head h3{font-size:.85rem;color:#f78166}' +
  '.chat-msgs{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px}' +
  '.msg{max-width:85%;padding:8px 12px;border-radius:10px;font-size:.82rem;line-height:1.5}.msg.u{align-self:flex-end;background:#1c1c35;color:#e0e0e0}.msg.a{align-self:flex-start;background:#f7816615;border:1px solid #f7816630;color:#d8d8ec}' +
  '.chat-input{display:flex;border-top:1px solid #1c1c35;flex-shrink:0}' +
  '.chat-input input{flex:1;padding:10px 14px;background:transparent;border:none;color:#e0e0e0;font-size:.85rem;outline:none}' +
  '.chat-input button{padding:10px 16px;background:#f78166;color:#0a0a0f;border:none;font-weight:600;cursor:pointer}' +
  '.tooltip{position:fixed;background:#0e0e1a;border:1px solid #1c1c35;border-radius:8px;padding:10px 14px;font-size:.78rem;color:#d8d8ec;z-index:20;pointer-events:none;max-width:240px;box-shadow:0 4px 20px #0008}' +
  '.tooltip .tt-title{font-weight:600;color:#e0e0e0;margin-bottom:4px}.tooltip .tt-type{color:#8A93B4;font-size:.7rem;text-transform:uppercase;margin-bottom:6px}' +
  '.tooltip .tt-io{border-top:1px solid #1c1c35;padding-top:6px;margin-top:6px}.tooltip .tt-io div{font-size:.72rem;color:#8A93B4;margin:2px 0}' +
  '.io-in{color:#1FCB58}.io-out{color:#f78166}' +
  '.spreadsheet-overlay{position:fixed;top:48px;left:0;right:0;bottom:0;background:#0a0a0f;z-index:5;overflow-y:auto;padding:24px;display:none}' +
  '.spreadsheet-overlay.show{display:block}' +
  '.sheet-table{width:100%;border-collapse:collapse;font-size:.82rem;max-width:900px;margin:0 auto}' +
  '.sheet-table th{background:#161b22;color:#8A93B4;font-weight:600;text-align:left;padding:8px 12px;border-bottom:1px solid #1c1c35;position:sticky;top:0}' +
  '.sheet-table td{padding:8px 12px;border-bottom:1px solid #1c1c3515;color:#c9d1d9}.sheet-table tr:hover td{background:#0e0e1a}' +
  '.node-detail{position:fixed;top:48px;left:48px;right:48px;bottom:48px;background:#0e0e1a;border:1px solid #1c1c35;border-radius:12px;z-index:15;display:none;overflow:hidden}' +
  '.node-detail.show{display:flex;flex-direction:column}' +
  '.nd-header{padding:16px 20px;border-bottom:1px solid #1c1c35;display:flex;align-items:center;gap:12px}' +
  '.nd-header .nd-icon{font-size:1.5rem}.nd-header h2{font-size:1.1rem}.nd-header .nd-close{margin-left:auto;background:none;border:none;color:#8A93B4;cursor:pointer;font-size:1.2rem}' +
  '.nd-body{flex:1;overflow-y:auto;padding:20px}.nd-body iframe{width:100%;height:100%;border:none}' +
  '.nd-tasks{display:flex;flex-direction:column;gap:6px}.nd-task{padding:8px 12px;background:#0a0a0f;border:1px solid #1c1c35;border-radius:6px;font-size:.8rem}' +
  '.nd-task .ndt-status{font-size:.7rem;margin-top:4px;color:#8A93B4}' +
  '</style></head><body>' +
  '<div class="toolbar"><span class="logo">⚓ Deckboss.ai</span><div class="sep"></div>' +
  '<button class="view-btn active" onclick="setView(\'flowchart\')" id="btn-flow">Flowchart</button>' +
  '<button class="view-btn" onclick="setView(\'spreadsheet\')" id="btn-sheet">Spreadsheet</button>' +
  '<button class="view-btn" onclick="setView(\'topology\')" id="btn-topo">Topology</button>' +
  '<div class="status"><div class="dot"></div><span id="node-count">17 nodes</span> · <span id="edge-count">25 links</span></div></div>' +
  '<canvas id="canvas"></canvas>' +
  '<div class="spreadsheet-overlay" id="sheet-overlay"></div>' +
  '<div class="node-detail" id="node-detail"><div class="nd-header"><span class="nd-icon" id="nd-icon"></span><h2 id="nd-title"></h2><button class="nd-close" onclick="closeDetail()">&times;</button></div><div class="nd-body" id="nd-body"></div></div>' +
  '<div class="chat-panel" id="chat-panel"><div class="chat-head" onclick="toggleChat()"><h3>💬 Fleet Chat</h3><span style="color:#8A93B4;font-size:.75rem" id="chat-toggle">▼</span></div>' +
  '<div class="chat-msgs" id="chat-msgs"><div class="msg a">Welcome to Fleet Command. I can route messages to any vessel, show inter-agent data flows, or help you build new workflows. What do you need?</div></div>' +
  '<div class="chat-input"><input id="chat-inp" placeholder="Ask anything about the fleet..." onkeydown="if(event.key===\'Enter\')sendChat()"><button onclick="sendChat()">Send</button></div></div>' +
  '<div class="tooltip" id="tooltip" style="display:none"></div>' +
  '<script>' +
  'const NODES=' + JSON.stringify(HUB_NODES) + ';' +
  'const EDGES=' + JSON.stringify(HUB_EDGES) + ';' +
  // IO streams simulation
  'const IO_STREAMS={};NODES.forEach(function(n){IO_STREAMS[n.id]={in:[],out:[]};});' +
  'setInterval(function(){NODES.forEach(function(n){if(Math.random()<0.15){var msgs=["query","update","event","health","route","sync"];var m=msgs[Math.floor(Math.random()*msgs.length)];IO_STREAMS[n.id].out.push({msg:m,t:Date.now()});if(IO_STREAMS[n.id].out.length>8)IO_STREAMS[n.id].out.shift();}if(Math.random()<0.1){var m2=["ack","data","ping","result"];IO_STREAMS[n.id].in.push({msg:m2[Math.floor(Math.random()*m2.length)],t:Date.now()});if(IO_STREAMS[n.id].in.length>8)IO_STREAMS[n.id].in.shift();}});},2000);' +
  // Canvas rendering
  'var canvas=document.getElementById("canvas");var ctx=canvas.getContext("2d");var dpr=window.devicePixelRatio||1;' +
  'var viewMode="flowchart";var nodes=[];var dragNode=null;var offsetX=0,offsetY=0;var panX=0,panY=0;var isPan=false;var lastMX=0,lastMY=0;var hoveredNode=null;var selectedNode=null;' +
  'function resize(){canvas.width=window.innerWidth*dpr;canvas.height=window.innerHeight*dpr;canvas.style.width=window.innerWidth+"px";canvas.style.height=window.innerHeight+"px";ctx.scale(dpr,dpr);if(nodes.length===0)initNodes();draw();}' +
  'function initNodes(){var cx=window.innerWidth/2;var cy=window.innerHeight/2+24;var hub=NODES[0];nodes.push({id:hub.id,label:hub.label,type:hub.type,color:hub.color,icon:hub.icon,desc:hub.desc,url:hub.url,x:cx,y:cy,r:44,pulse:0});' +
  'var agents=NODES.filter(function(n){return n.type==="agent"||n.type==="app"||n.type==="meta";});' +
  'var infra=NODES.filter(function(n){return n.type==="infra"||n.type==="storage";});' +
  'var r1=Math.min(cx,cy)*0.55;agents.forEach(function(n,i){var a=(i/agents.length)*Math.PI*2-Math.PI/2;nodes.push({id:n.id,label:n.label,type:n.type,color:n.color,icon:n.icon,desc:n.desc,url:n.url,x:cx+Math.cos(a)*r1,y:cy+Math.sin(a)*r1,r:32,pulse:0});});' +
  'var r2=r1+80;infra.forEach(function(n,i){var a=(i/infra.length)*Math.PI*2;nodes.push({id:n.id,label:n.label,type:n.type,color:n.color,icon:n.icon,desc:n.desc,url:n.url,x:cx+Math.cos(a)*r2,y:cy+Math.sin(a)*r2,r:26,pulse:0});});}' +
  'function draw(){ctx.save();ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,window.innerWidth,window.innerHeight);' +
  // Grid
  'ctx.strokeStyle="#1c1c3515";ctx.lineWidth=1;for(var gx=0;gx<window.innerWidth;gx+=40){ctx.beginPath();ctx.moveTo(gx,0);ctx.lineTo(gx,window.innerHeight);ctx.stroke();}for(var gy=0;gy<window.innerHeight;gy+=40){ctx.beginPath();ctx.moveTo(0,gy);ctx.lineTo(window.innerWidth,gy);ctx.stroke();}' +
  // Edges
  'EDGES.forEach(function(e){var from=getNode(e[0]);var to=getNode(e[1]);if(!from||!to)return;var io=IO_STREAMS[from.id];var active=io&&io.out.length>0&&Date.now()-io.out[io.out.length-1].t<3000;' +
  'ctx.beginPath();ctx.moveTo(from.x,from.y);ctx.lineTo(to.x,to.y);ctx.strokeStyle=active?(from.color+"66"):"#1c1c3544";ctx.lineWidth=active?2:1;if(active){ctx.setLineDash([4,4]);ctx.lineDashOffset=-(Date.now()/50)%8;}else{ctx.setLineDash([]);}ctx.stroke();ctx.setLineDash([]);' +
  // Animated packet on active edges
  'if(active){var t=((Date.now()/1000)%2)/2;var px=from.x+(to.x-from.x)*t;var py=from.y+(to.y-from.y)*t;ctx.beginPath();ctx.arc(px,py,3,0,Math.PI*2);ctx.fillStyle=from.color;ctx.fill();}' +
  '});' +
  // Nodes
  'nodes.forEach(function(n){var isHovered=hoveredNode===n.id;var isSelected=selectedNode===n.id;var scale=isHovered?1.15:1;var r=n.r*scale;' +
  // Pulse ring
  'if(n.pulse>0){ctx.beginPath();ctx.arc(n.x,n.y,r+n.pulse*20,0,Math.PI*2);ctx.strokeStyle=n.color+(Math.floor((1-n.pulse)*80)).toString(16).padStart(2,"0");ctx.lineWidth=2;ctx.stroke();n.pulse=Math.max(0,n.pulse-0.02);}' +
  // Glow
  'if(n.type==="hub"||isHovered||isSelected){ctx.beginPath();ctx.arc(n.x,n.y,r+8,0,Math.PI*2);var g=ctx.createRadialGradient(n.x,n.y,r,n.x,n.y,r+12);g.addColorStop(0,n.color+"33");g.addColorStop(1,"transparent");ctx.fillStyle=g;ctx.fill();}' +
  // Circle
  'ctx.beginPath();ctx.arc(n.x,n.y,r,0,Math.PI*2);ctx.fillStyle="#0e0e1a";ctx.fill();ctx.strokeStyle=isSelected?"#fff":n.color;ctx.lineWidth=isSelected?2.5:1.5;ctx.stroke();' +
  // Icon
  'ctx.font=(r*0.6)+"px system-ui";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(n.icon,n.x,n.y-4);' +
  // Label
  'ctx.font="bold 10px system-ui";ctx.fillStyle="#e0e0e0";ctx.textAlign="center";ctx.textBaseline="top";ctx.fillText(n.label,n.x,n.y+r+6);' +
  // Type badge
  'ctx.font="8px system-ui";ctx.fillStyle=n.color+"99";ctx.fillText(n.type,n.x,n.y+r+18);' +
  '});' +
  'ctx.restore();requestAnimationFrame(draw);}' +
  'function getNode(id){return nodes.find(function(n){return n.id===id;});}' +
  'function hitTest(mx,my){for(var i=nodes.length-1;i>=0;i--){var n=nodes[i];var dx=mx-n.x;var dy=my-n.y;if(dx*dx+dy*dy<=n.r*n.r)return n;}return null;}' +
  // Mouse events
  'canvas.addEventListener("mousedown",function(e){var r=canvas.getBoundingClientRect();var mx=e.clientX-r.left;var my=e.clientY-r.top;var hit=hitTest(mx,my);if(hit){dragNode=hit;offsetX=mx-hit.x;offsetY=my-hit.y;canvas.classList.add("dragging");}else{isPan=true;lastMX=mx;lastMY=my;canvas.classList.add("dragging");}});' +
  'canvas.addEventListener("mousemove",function(e){var r=canvas.getBoundingClientRect();var mx=e.clientX-r.left;var my=e.clientY-r.top;' +
  'if(dragNode){dragNode.x=mx-offsetX;dragNode.y=my-offsetY;return;}' +
  'if(isPan){panX+=mx-lastMX;panY+=my-lastMY;lastMX=mx;lastMY=my;nodes.forEach(function(n){n.x+=mx-lastMX+panX;n.y+=my-lastMY+panY;});panX=0;panY=0;return;}' +
  'var hit=hitTest(mx,my);hoveredNode=hit?hit.id:null;canvas.style.cursor=hit?"pointer":"grab";showTooltip(hit,e.clientX,e.clientY);});' +
  'canvas.addEventListener("mouseup",function(){if(dragNode){dragNode=null;canvas.classList.remove("dragging");}isPan=false;canvas.classList.remove("dragging");});' +
  'canvas.addEventListener("click",function(e){var r=canvas.getBoundingClientRect();var hit=hitTest(e.clientX-r.left,e.clientY-r.top);if(hit){selectedNode=hit.id;hit.pulse=1;openDetail(hit);}});' +
  // Tooltip
  'function showTooltip(node,cx,cy){var tt=document.getElementById("tooltip");if(!node){tt.style.display="none";return;}tt.style.display="block";tt.style.left=(cx+16)+"px";tt.style.top=(cy+16)+"px";' +
  'var io=IO_STREAMS[node.id]||{in:[],out:[]};' +
  'tt.innerHTML="<div class=tt-title>"+node.icon+" "+node.label+"</div><div class=tt-type>"+node.type+"</div>"+node.desc+"<div class=tt-io><div class=io-out>↓ out: "+(io.out.length?io.out[io.out.length-1].msg:"idle")+"</div><div class=io-in>↑ in: "+(io.in.length?io.in[io.in.length-1].msg:"idle")+"</div></div>";}' +
  // Node detail panel
  'function openDetail(node){var d=document.getElementById("node-detail");d.classList.add("show");document.getElementById("nd-icon").textContent=node.icon;document.getElementById("nd-title").textContent=node.label+" — "+node.desc;var body=document.getElementById("nd-body");' +
  'if(node.url){body.innerHTML="<iframe src=\'"+node.url+"\' sandbox=\'allow-scripts allow-same-origin\' style=\'width:100%;height:100%;border:none;\'></iframe>";}' +
  'else{body.innerHTML="<div class=nd-tasks><div class=nd-task><strong>"+node.icon+" "+node.label+"</strong><div class=ndt-status>"+node.type+" · "+node.desc+"</div></div></div>";}}' +
  'function closeDetail(){document.getElementById("node-detail").classList.remove("show");selectedNode=null;}' +
  // Chat
  'var chatCollapsed=false;function toggleChat(){chatCollapsed=!chatCollapsed;var p=document.getElementById("chat-panel");p.classList.toggle("collapsed",chatCollapsed);document.getElementById("chat-toggle").textContent=chatCollapsed?"▲":"▼";}' +
  'function sendChat(){var inp=document.getElementById("chat-inp");var msg=inp.value.trim();if(!msg)return;inp.value="";addMsg(msg,"u");' +
  'fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:msg})}).then(function(r){return r.json()}).then(function(d){addMsg(d.response||d.error,"a");}).catch(function(e){addMsg("Error: "+e.message,"a");});}' +
  'function addMsg(text,cls){var d=document.getElementById("chat-msgs");var m=document.createElement("div");m.className="msg "+cls;m.textContent=text;d.appendChild(m);d.scrollTop=d.scrollHeight;}' +
  // View modes
  'function setView(mode){viewMode=mode;document.querySelectorAll(".view-btn").forEach(function(b){b.classList.remove("active");});document.getElementById("btn-"+(mode==="flowchart"?"flow":mode==="spreadsheet"?"sheet":"topo")).classList.add("active");' +
  'document.getElementById("sheet-overlay").classList.toggle("show",mode==="spreadsheet");canvas.style.display=(mode==="spreadsheet")?"none":"block";' +
  'if(mode==="spreadsheet")renderSpreadsheet();' +
  'if(mode==="topology")layoutTopology();}' +
  // Spreadsheet view
  'function renderSpreadsheet(){var o=document.getElementById("sheet-overlay");' +
  'var rows=NODES.map(function(n){var io=IO_STREAMS[n.id]||{in:[],out:[]};return[n.icon+" "+n.label,n.type,n.desc,io.out.length?io.out[io.out.length-1].msg:"idle",io.in.length?io.in[io.in.length-1].msg:"idle",n.url?"<a href=\'"+n.url+"\' target=\'_blank\' style=\'color:#58a6ff\'>Open →</a>":"—"];});' +
  'o.innerHTML="<table class=sheet-table><tr><th>Vessel</th><th>Type</th><th>Description</th><th>Out</th><th>In</th><th>Link</th></tr>"+rows.map(function(r){return "<tr><td>"+r[0]+"</td><td>"+r[1]+"</td><td>"+r[2]+"</td><td>"+r[3]+"</td><td>"+r[4]+"</td><td>"+r[5]+"</td></tr>";}).join("")+"</table>";}' +
  // Topology auto-layout
  'function layoutTopology(){var cx=window.innerWidth/2;var cy=window.innerHeight/2+24;' +
  'var layers=[{type:"hub",r:0},{type:"agent",r:160},{type:"app",r:160},{type:"meta",r:160},{type:"infra",r:260},{type:"storage",r:260}];' +
  'nodes.forEach(function(n){var layer=layers.find(function(l){return l.type===n.type;});if(layer){var sameType=nodes.filter(function(nn){return nn.type===n.type;});var idx=sameType.indexOf(n);var a=(idx/sameType.length)*Math.PI*2-Math.PI/2;n.x=cx+Math.cos(a)*layer.r;n.y=cy+Math.sin(a)*layer.r;}});}' +
  // Keyboard
  'document.addEventListener("keydown",function(e){if(e.key==="Escape")closeDetail();});' +
  // Init
  'window.addEventListener("resize",resize);resize();' +
  '</script></body></html>';
}

// ── API Handler ──
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method.toUpperCase();

    if (method === 'OPTIONS') {
      return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
    }

    if (path === '/') return new Response(landing(), { headers: { 'Content-Type': 'text/html;charset=utf-8', ...CSP_OBJ } });
    if (path === '/health') return json({ status: 'ok', repo: 'deckboss-ai', version: '2.0.0', nodes: HUB_NODES.length, edges: HUB_EDGES.length, timestamp: Date.now() });
    if (path === '/vessel.json') return json({ name: 'deckboss-ai', displayName: 'Deckboss', type: 'cocapn-vessel', category: 'infrastructure', description: 'Hub-and-spoke fleet command center with flowchart and spreadsheet views', capabilities: ['fleet-visualization', 'hub-spoke-flowchart', 'spreadsheet-view', 'topology-view', 'agent-routing', 'io-streams'], endpoints: { health: '/health', chat: '/api/chat', nodes: '/api/nodes', edges: '/api/edges', topology: '/api/topology' }, deployment: { url: 'https://deckboss-ai.casey-digennaro.workers.dev' } });

    // Fleet topology API
    if (path === '/api/nodes') return json({ nodes: HUB_NODES.map(function(n) { var io = { in: [], out: [] }; return { ...n, io }; }), total: HUB_NODES.length });
    if (path === '/api/edges') return json({ edges: HUB_EDGES, total: HUB_EDGES.length });

    // Chat — routes to appropriate vessel or answers fleet questions
    if (method === 'POST' && path === '/api/chat') {
      try {
        const body = await request.json() as { message: string };
        const msg = (body.message || '').trim();
        if (!msg) return json({ error: 'No message' }, 400);

        const key = env.DEEPSEEK_API_KEY;
        if (!key) return json({ error: 'No API key configured' }, 503);

        // Check if user is asking about a specific vessel
        const mentioned = HUB_NODES.find(function(n) { return msg.toLowerCase().includes(n.label.toLowerCase()) || msg.toLowerCase().includes(n.id); });

        const sysPrompt = 'You are Deckboss, the fleet command center. You oversee ' + HUB_NODES.length + ' vessels connected in a hub-and-spoke topology. ' +
          'The hub is you (Deckboss). Connected agents: StudyLog (AI classroom), DMLog (Dungeon Master), MakerLog (coding), PersonalLog (assistant), BusinessLog (CRM), FishingLog (fishing companion). ' +
          'Apps: Fleet RPG, DogMind Arena, LucidDreamer (content engine). Meta: The Seed (self-evolving repo), Become (bootcamp), Self-Evolve (A/B tester). ' +
          'Infra: Capitaine (flagship), Orchestrator (event bus). Storage: Fleet Memory (KV), GitHub (git coordination). ' +
          'When asked about the fleet, explain how vessels connect and what data flows between them. Keep answers concise. ' +
          (mentioned ? 'The user is asking specifically about ' + mentioned.label + ': ' + mentioned.desc + '.' : '');

        const r = await fetch(DS, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
          body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'system', content: sysPrompt }, { role: 'user', content: msg }], max_tokens: 400, temperature: 0.7 })
        });

        const data = await r.json() as any;
        const response = data.choices?.[0]?.message?.content || 'No response from model';
        return json({ response, vessel: mentioned?.id || null });
      } catch (e: any) {
        return json({ error: e.message }, 500);
      }
    }

    return new Response('Not found', { status: 404 });
  }
};
