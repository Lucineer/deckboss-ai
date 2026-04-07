// Deckboss.ai v2 — Hub-and-Spoke Your Agent\'s Nervous System
// Spreadsheet view + flowchart view + real-time agent interactions
// The repo IS the agent. Every vessel is a node. The chatbot is the hub.

interface Env {
  DECKBOSS_KV: KVNamespace;
  DEEPSEEK_API_KEY: string;
}

const DS = 'https://api.deepseek.com/chat/completions';

const TYPE_COLORS: Record<string,string> = {
  hub:'#f78166',agent:'#00d4ff',app:'#818cf8',meta:'#22c55e',infra:'#00E6D6',storage:'#64748b',
  model:'#58a6ff',sensor:'#4ade80',terminal:'#f59e0b',database:'#a78bfa',inbox:'#f472b6'
};
const CSP_OBJ = {'X-Frame-Options': 'DENY', 'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.deepseek.com https://raw.githubusercontent.com https://*;"};

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', ...CSP_OBJ } });
}

// ── Default fleet configuration ──
const DEFAULT_NODES = [
  {id:'hub',label:'Your Agent',type:'hub',color:'#f78166',icon:'🗣',desc:'Your primary conversational agent (STT/Text → reason → TTS)',priority:10},
  {id:'studylog',label:'StudyLog',type:'agent',color:'#00d4ff',icon:'📚',desc:'AI classroom with repo-agent tutoring',priority:7},
  {id:'dmlog',label:'DMLog',type:'agent',color:'#c9a23c',icon:'🐉',desc:'AI Dungeon Master with multi-model narration',priority:8},
  {id:'makerlog',label:'MakerLog',type:'agent',color:'#7b2ff7',icon:'🔧',desc:'Coding agent with self-building pipeline',priority:9},
  {id:'personallog',label:'PersonalLog',type:'agent',color:'#6366f1',icon:'📝',desc:'Personal journaling companion',priority:5},
  {id:'businesslog',label:'BusinessLog',type:'agent',color:'#3b82f6',icon:'💼',desc:'Business CRM and meeting simulator',priority:5},
  {id:'fishinglog',label:'FishingLog',type:'agent',color:'#4ade80',icon:'🎣',desc:'Fishing companion and species tracker',priority:6},
  {id:'cooklog',label:'CookLog',type:'agent',color:'#f97316',icon:'🍳',desc:'Cooking assistant and recipe manager',priority:4},
  {id:'booklog',label:'BookLog',type:'agent',color:'#a78bfa',icon:'📖',desc:'Reading tracker and book recommender',priority:4},
  {id:'fleet-rpg',label:'Fleet RPG',type:'app',color:'#ef4444',icon:'⚔️',desc:'Stats-as-compute role playing game',priority:6},
  {id:'dogmind',label:'DogMind',type:'app',color:'#d69e2e',icon:'🐕',desc:'Dog training arena with DNA system',priority:5},
  {id:'luciddreamer',label:'LucidDreamer',type:'app',color:'#818cf8',icon:'💭',desc:'Overnight content engine',priority:5},
  {id:'capitaine',label:'Capitaine',type:'meta',color:'#00E6D6',icon:'🗼',desc:'Fleet flagship and HN release',priority:8},
  {id:'git-agent',label:'Git-Agent',type:'meta',color:'#22c55e',icon:'🐙',desc:'Autonomous git-agent with TUI',priority:7},
  {id:'fleet-orch',label:'Orchestrator',type:'infra',color:'#00E6D6',icon:'📊',desc:'Fleet event bus and coordination',priority:7},
  {id:'the-fleet',label:'The Fleet',type:'infra',color:'#58a6ff',icon:'⚓',desc:'Fleet gateway and release vehicle',priority:9},
  {id:'fleet-kv',label:'Fleet Memory',type:'storage',color:'#64748b',icon:'💾',desc:'KV storage for fleet state',priority:6},
  {id:'cloud-model',label:'Cloud Model',type:'model',color:'#58a6ff',icon:'☁️',desc:'Cloud reasoning API (intermittent)',priority:7},
  {id:'local-model',label:'Local Model',type:'model',color:'#38bdf8',icon:'💻',desc:'Fast local model on Jetson',priority:8},
  {id:'image-gen',label:'Image Gen',type:'model',color:'#f472b6',icon:'🎨',desc:'Image generation model',priority:4},
];

const DEFAULT_EDGES = [
  ['hub','studylog','task dispatch'],['hub','dmlog','game commands'],['hub','makerlog','code requests'],
  ['hub','personallog','journal entries'],['hub','businesslog','meeting data'],['hub','fishinglog','species data'],
  ['hub','cooklog','recipes'],['hub','booklog','reading log'],['hub','fleet-rpg','game state'],
  ['hub','dogmind','training data'],['hub','luciddreamer','content briefs'],['hub','capitaine','fleet orders'],
  ['hub','git-agent','task queue'],['hub','fleet-orch','event emit'],['hub','the-fleet','deployment'],
  ['hub','cloud-model','reasoning request'],['hub','local-model','fast inference'],['hub','image-gen','gen request'],
  ['cloud-model','hub','reasoning response'],['local-model','hub','quick answer'],['image-gen','hub','generated image'],
  ['dmlog','fleet-kv','session save'],['studylog','fleet-kv','progress save'],['makerlog','fleet-kv','code save'],
  ['git-agent','fleet-orch','commit event'],['capitaine','the-fleet','sync'],['fleet-orch','fleet-kv','state persist'],
  ['local-model','cloud-model','overflow request'],['cloud-model','local-model','fallback response'],
];

// Runtime nodes/edges (loaded from KV or defaults)
let HUB_NODES = [...DEFAULT_NODES];
let HUB_EDGES = [...DEFAULT_EDGES];
// Keep old reference for backward compat:
const _ORIGINAL_NODES = [
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

// Edges: connections between nodes [from, to, label?]
// Old edges reference replaced by DEFAULT_EDGES above
const _OLD_EDGES = [
  ['hub','studylog','task dispatch'],['hub','dmlog','game commands'],['hub','makerlog','build orders'],['hub','personallog','user queries'],['hub','businesslog','crm data'],['hub','fishinglog','trip logs'],
  ['studylog','kv-store','memory writes'],['dmlog','kv-store','campaign data'],['makerlog','kv-store','code state'],['personallog','kv-store','user memory'],['businesslog','kv-store','contacts'],['fishinglog','kv-store','catch data'],
  ['hub','fleet-rpg','encounter triggers'],['hub','dogmind','training cmds'],['hub','the-seed','evolution reqs'],['hub','become','onboarding data'],['hub','self-evolve','mutation config'],
  ['hub','luciddreamer','content queue'],['hub','capitaine','fleet status'],['hub','orchestrator','event routing'],
  ['hub','kv-store','config reads'],['hub','github','repo coordination'],
  ['the-seed','github','branch pushes'],['self-evolve','github','PR merges'],['capitaine','github','release sync'],
  ['orchestrator','kv-store','event store'],['capitaine','orchestrator','fleet commands'],
  ['fleet-rpg','dmlog','encounter data'],['dogmind','fishinglog','activity sync'],
  ['luciddreamer','studylog','content drafts'],['luciddreamer','dmlog','story content'],
];

// ── Workflow Templates ──
const WORKFLOW_TEMPLATES = [
  { name: 'agent-chain', description: 'Linear Hub→A→B→Storage',
    nodes: [
      { id: 'hub', label: 'Hub', type: 'hub', color: '#f78166', icon: '⚓' },
      { id: 'agent-a', label: 'Agent A', type: 'agent', color: '#F59E0B', icon: '🤖' },
      { id: 'agent-b', label: 'Agent B', type: 'agent', color: '#00d4ff', icon: '🤖' },
      { id: 'storage', label: 'Storage', type: 'storage', color: '#64748b', icon: '💾' }
    ],
    edges: [['hub','agent-a','request'],['agent-a','agent-b','transformed'],['agent-b','storage','output']]
  },
  { name: 'fan-out', description: 'Hub→multiple agents→merge',
    nodes: [
      { id: 'hub', label: 'Hub', type: 'hub', color: '#f78166', icon: '⚓' },
      { id: 'agent-1', label: 'Agent 1', type: 'agent', color: '#F59E0B', icon: '🤖' },
      { id: 'agent-2', label: 'Agent 2', type: 'agent', color: '#00d4ff', icon: '🤖' },
      { id: 'agent-3', label: 'Agent 3', type: 'agent', color: '#818cf8', icon: '🤖' },
      { id: 'merge', label: 'Merge', type: 'infra', color: '#00E6D6', icon: '📊' }
    ],
    edges: [['hub','agent-1','dispatch'],['hub','agent-2','dispatch'],['hub','agent-3','dispatch'],['agent-1','merge','results'],['agent-2','merge','results'],['agent-3','merge','results']]
  },
  { name: 'feedback-loop', description: 'Hub→Agent→evaluate→Hub',
    nodes: [
      { id: 'hub', label: 'Hub', type: 'hub', color: '#f78166', icon: '⚓' },
      { id: 'agent', label: 'Agent', type: 'agent', color: '#F59E0B', icon: '🤖' },
      { id: 'evaluate', label: 'Evaluate', type: 'meta', color: '#22c55e', icon: '📏' }
    ],
    edges: [['hub','agent','task'],['agent','evaluate','output'],['evaluate','hub','score']]
  },
  { name: 'n8n-trigger', description: 'Hub→trigger→condition→parallel→merge',
    nodes: [
      { id: 'hub', label: 'Hub', type: 'hub', color: '#f78166', icon: '⚓' },
      { id: 'trigger', label: 'Trigger', type: 'infra', color: '#00E6D6', icon: '⚡' },
      { id: 'condition', label: 'Condition', type: 'meta', color: '#a855f7', icon: '🔀' },
      { id: 'parallel-a', label: 'Parallel A', type: 'agent', color: '#F59E0B', icon: '🤖' },
      { id: 'parallel-b', label: 'Parallel B', type: 'agent', color: '#00d4ff', icon: '🤖' },
      { id: 'merge', label: 'Merge', type: 'infra', color: '#00E6D6', icon: '🔗' }
    ],
    edges: [['hub','trigger','event'],['trigger','condition','payload'],['condition','parallel-a','if true'],['condition','parallel-b','if false'],['parallel-a','merge','result'],['parallel-b','merge','result']]
  },
  { name: 'crewai-delegation', description: 'Hub→manager→workers',
    nodes: [
      { id: 'hub', label: 'Hub', type: 'hub', color: '#f78166', icon: '⚓' },
      { id: 'manager', label: 'Manager', type: 'meta', color: '#a855f7', icon: '👔' },
      { id: 'worker-1', label: 'Worker 1', type: 'agent', color: '#F59E0B', icon: '🤖' },
      { id: 'worker-2', label: 'Worker 2', type: 'agent', color: '#00d4ff', icon: '🤖' },
      { id: 'worker-3', label: 'Worker 3', type: 'agent', color: '#818cf8', icon: '🤖' }
    ],
    edges: [['hub','manager','objective'],['manager','worker-1','delegate'],['manager','worker-2','delegate'],['manager','worker-3','delegate'],['worker-1','manager','report'],['worker-2','manager','report'],['worker-3','manager','report']]
  },
  { name: 'langgraph-state', description: 'Hub→state→conditional→subgraphs',
    nodes: [
      { id: 'hub', label: 'Hub', type: 'hub', color: '#f78166', icon: '⚓' },
      { id: 'state', label: 'State', type: 'infra', color: '#00E6D6', icon: '📦' },
      { id: 'conditional', label: 'Conditional', type: 'meta', color: '#a855f7', icon: '🔀' },
      { id: 'subgraph-a', label: 'Subgraph A', type: 'agent', color: '#F59E0B', icon: '🤖' },
      { id: 'subgraph-b', label: 'Subgraph B', type: 'agent', color: '#00d4ff', icon: '🤖' }
    ],
    edges: [['hub','state','init'],['state','conditional','route'],['conditional','subgraph-a','path A'],['conditional','subgraph-b','path B'],['subgraph-a','state','update'],['subgraph-b','state','update']]
  }
];

// ── Landing HTML with Hub-and-Spoke Canvas ──
function landing(): string {
  return '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Deckboss.ai — Your Agent\'s Nervous System</title>' +
  '<style>' +
  '*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,-apple-system,sans-serif;background:#0a0a0f;color:#e0e0e0;overflow:hidden;height:100vh}' +
  '#canvas{position:absolute;top:0;left:0;width:100%;height:100%;cursor:grab}#canvas.dragging{cursor:grabbing}' +
  '.toolbar{position:fixed;top:0;left:0;right:0;height:48px;background:#0e0e1a;border-bottom:1px solid #1c1c35;display:flex;align-items:center;padding:0 16px;gap:12px;z-index:10}' +
  '.toolbar .logo{font-weight:700;font-size:1rem;background:linear-gradient(90deg,#f78166,#58a6ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent}' +
  '.toolbar .sep{width:1px;height:24px;background:#1c1c35}.alert-bar{position:fixed;top:48px;left:0;right:0;height:28px;background:#161b22;border-bottom:1px solid #1c1c35;display:flex;align-items:center;overflow:hidden;z-index:9;padding:0 16px}.alert-bar .alert-item{display:flex;align-items:center;gap:6px;font-size:.72rem;white-space:nowrap;animation:scroll-alert 20s linear infinite;color:#8A93B4}.alert-bar .alert-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0}.alert-dot.green{background:#1FCB58}.alert-dot.yellow{background:#F59E0B}.alert-dot.red{background:#f85149}@keyframes scroll-alert{0%{transform:translateX(100%)}100%{transform:translateX(-200%)}}' +
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
  '<button class="view-btn" onclick="setView(\'timeline\')" id="btn-timeline">Timeline</button>' +
  '<div class="sep"></div>' +
  '<select id="wf-select" style="background:#0e0e1a;color:#8A93B4;border:1px solid #1c1c35;border-radius:6px;padding:4px 8px;font-size:.78rem;cursor:pointer"><option value="">Workflows...</option>' +
  '<option value="agent-chain">Agent Chain</option><option value="fan-out">Fan-Out</option><option value="feedback-loop">Feedback Loop</option>' +
  '<option value="n8n-trigger">n8n-Trigger</option><option value="crewai-delegation">CrewAI-Delegation</option><option value="langgraph-state">LangGraph-State</option></select>' +
  '<button class="view-btn" onclick="loadWorkflow()" id="btn-wf">Apply</button>' +
  '<div class="status"><div class="dot"></div><span id="node-count">17 nodes</span> · <span id="edge-count">25 links</span></div></div>' +
  '<canvas id="canvas"></canvas>' +
  '<div class="spreadsheet-overlay" id="sheet-overlay"></div>' +
  '<div class="tl-overlay" id="tl-overlay"></div>' +
  '<div class="node-detail" id="node-detail"><div class="nd-header"><span class="nd-icon" id="nd-icon"></span><h2 id="nd-title"></h2><button class="nd-close" onclick="closeDetail()">&times;</button></div><div class="nd-body" id="nd-body"></div></div>' +
  '<div class="chat-panel" id="chat-panel"><div class="chat-head" onclick="toggleChat()"><h3>💬 Fleet Chat</h3><span style="color:#8A93B4;font-size:.75rem" id="chat-toggle">▼</span></div>' +
  '<div class="chat-msgs" id="chat-msgs"><div class="msg a">Welcome to Fleet Command. I can route messages to any vessel, show inter-agent data flows, or help you build new workflows. What do you need?</div></div>' +
  '<div class="chat-input"><button class="voice-btn" id="voice-btn" onclick="toggleVoice()" title="Voice input">🎤</button><input id="chat-inp" placeholder="Ask anything about the fleet..." onkeydown="if(event.key===\'Enter\')sendChat()"><button onclick="sendChat()">Send</button></div></div>' +
  '<div class="tooltip" id="tooltip" style="display:none"></div>' +
  '<script>' +
  'const NODES=' + JSON.stringify(HUB_NODES) + ';' +
  'const EDGES=' + JSON.stringify(HUB_EDGES) + ';' +
  'var ORIG_EDGES=EDGES.slice();'
// Sync from API on load — merge server data with defaults
'function syncFromAPI(){fetch("/api/nodes").then(function(r){return r.json()}).then(function(apiNodes){if(!apiNodes||!apiNodes.nodes)return;var apiMap={};apiNodes.nodes.forEach(function(n){apiMap[n.id]=n;});NODES.forEach(function(n,i){if(apiMap[n.id]){NODES[i].label=apiMap[n.id].label||n.label;NODES[i].desc=apiMap[n.id].desc||n.desc;NODES[i].color=apiMap[n.id].color||n.color;NODES[i].icon=apiMap[n.id].icon||n.icon;NODES[i].type=apiMap[n.id].type||n.type;NODES[i].endpoint=apiMap[n.id].endpoint||n.endpoint;}});if(nodes.length>0){var nodeMap={};nodes.forEach(function(n){nodeMap[n.id]=n;});NODES.forEach(function(n){if(nodeMap[n.id]){nodeMap[n.id].label=n.label;nodeMap[n.id].desc=n.desc;nodeMap[n.id].color=n.color;nodeMap[n.id].icon=n.icon;nodeMap[n.id].type=n.type;nodeMap[n.id].endpoint=n.endpoint;if(n.endpoint)nodeMap[n.id].endpoint=n.endpoint;}});draw();}}).catch(function(){});fetch("/api/edges").then(function(r){return r.json()}).then(function(apiEdges){if(!apiEdges||!apiEdges.edges)return;EDGES.length=0;apiEdges.edges.forEach(function(e){EDGES.push([e.from,e.to]);});ORIG_EDGES=EDGES.slice();draw();}).catch(function(){});}'
'syncFromAPI();' +
  // IO streams simulation
  'const IO_STREAMS={};NODES.forEach(function(n){IO_STREAMS[n.id]={in:[],out:[]};});' +
  'setInterval(function(){NODES.forEach(function(n){if(Math.random()<0.15){var msgs=["query","update","event","health","route","sync"];var m=msgs[Math.floor(Math.random()*msgs.length)];IO_STREAMS[n.id].out.push({msg:m,t:Date.now()});if(IO_STREAMS[n.id].out.length>8)IO_STREAMS[n.id].out.shift();if(typeof TL_EVENTS!=="undefined"){TL_EVENTS.push({type:"io",nodeType:n.type,icon:n.icon,label:n.label,msg:"sent: "+m,t:Date.now()});if(TL_EVENTS.length>500)TL_EVENTS.shift();}}if(Math.random()<0.1){var m2=["ack","data","ping","result"];IO_STREAMS[n.id].in.push({msg:m2[Math.floor(Math.random()*m2.length)],t:Date.now()});if(IO_STREAMS[n.id].in.length>8)IO_STREAMS[n.id].in.shift();if(typeof TL_EVENTS!=="undefined"){TL_EVENTS.push({type:"io",nodeType:n.type,icon:n.icon,label:n.label,msg:"recv: "+m2[Math.floor(Math.random()*m2.length)],t:Date.now()});if(TL_EVENTS.length>500)TL_EVENTS.shift();}}});},2000);' +
  // Canvas rendering
  'var canvas=document.getElementById("canvas");var ctx=canvas.getContext("2d");var dpr=window.devicePixelRatio||1;' +
  'var viewMode="flowchart";var nodes=[];var dragNode=null;var offsetX=0,offsetY=0;var panX=0,panY=0;var isPan=false;var lastMX=0,lastMY=0;var hoveredNode=null;var selectedNode=null;' +
  'function resize(){canvas.width=window.innerWidth*dpr;canvas.height=window.innerHeight*dpr;canvas.style.width=window.innerWidth+"px";canvas.style.height=window.innerHeight+"px";ctx.scale(dpr,dpr);if(nodes.length===0)initNodes();draw();}' +
  'function initNodes(){var cx=window.innerWidth/2;var cy=window.innerHeight/2+24;var hub=NODES[0];nodes.push({id:hub.id,label:hub.label,type:hub.type,color:hub.color,icon:hub.icon,desc:hub.desc,url:hub.url,x:cx,y:cy,r:getR(hub.type),pulse:0});' +
  'var agents=NODES.filter(function(n){return n.type==="agent"||n.type==="app"||n.type==="meta";});' +
  'var infra=NODES.filter(function(n){return n.type==="infra"||n.type==="storage";});' +
  'var r1=Math.min(cx,cy)*0.55;agents.forEach(function(n,i){var a=(i/agents.length)*Math.PI*2-Math.PI/2;nodes.push({id:n.id,label:n.label,type:n.type,color:n.color,icon:n.icon,desc:n.desc,url:n.url,x:cx+Math.cos(a)*r1,y:cy+Math.sin(a)*r1,r:getR(n.type),pulse:0});});' +
  'var r2=r1+80;infra.forEach(function(n,i){var a=(i/infra.length)*Math.PI*2;nodes.push({id:n.id,label:n.label,type:n.type,color:n.color,icon:n.icon,desc:n.desc,url:n.url,x:cx+Math.cos(a)*r2,y:cy+Math.sin(a)*r2,r:getR(n.type),pulse:0});});' +
  'loadPriorities();}' +
  // Base radius by type: hub=44, agent=32, app=30, meta=28, infra=26, storage=24
  'var BASE_R={hub:44,agent:32,app:30,meta:28,infra:26,storage:24};' +
  'function getR(type){return BASE_R[type]||28;}' +
  // Load priorities from KV and scale radius: r = baseRadius * (1 + priority/20)
  'function loadPriorities(){Promise.all(nodes.map(function(n){return fetch("/api/nodes/"+n.id+"/priority").then(function(r){return r.json()}).then(function(d){if(d.priority)n.r=getR(n.type)*(1+d.priority/20);}).catch(function(){});})).catch(function(){});}' +
  'function draw(){ctx.save();ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,window.innerWidth,window.innerHeight);' +
  // Grid
  'ctx.strokeStyle="#1c1c3515";ctx.lineWidth=1;for(var gx=0;gx<window.innerWidth;gx+=40){ctx.beginPath();ctx.moveTo(gx,0);ctx.lineTo(gx,window.innerHeight);ctx.stroke();}for(var gy=0;gy<window.innerHeight;gy+=40){ctx.beginPath();ctx.moveTo(0,gy);ctx.lineTo(window.innerWidth,gy);ctx.stroke();}' +
  // Edges
  'EDGES.forEach(function(e){var from=getNode(e[0]);var to=getNode(e[1]);if(!from||!to)return;var io=IO_STREAMS[from.id];var active=io&&io.out.length>0&&Date.now()-io.out[io.out.length-1].t<3000;' +
  'ctx.beginPath();ctx.moveTo(from.x,from.y);ctx.lineTo(to.x,to.y);ctx.strokeStyle=active?(from.color+"66"):"#1c1c3544";ctx.lineWidth=active?2:1;if(active){ctx.setLineDash([4,4]);ctx.lineDashOffset=-(Date.now()/50)%8;}else{ctx.setLineDash([]);}ctx.stroke();ctx.setLineDash([]);' +
  // Animated packet on active edges
  'if(active){var t=((Date.now()/1000)%2)/2;var px=from.x+(to.x-from.x)*t;var py=from.y+(to.y-from.y)*t;ctx.beginPath();ctx.arc(px,py,3,0,Math.PI*2);ctx.fillStyle=from.color;ctx.fill();}' +
  // Edge label at midpoint
  'if(e[2]){var emx=(from.x+to.x)/2;var emy=(from.y+to.y)/2;ctx.save();ctx.font="9px system-ui";ctx.fillStyle="#8A93B4";ctx.textAlign="center";ctx.textBaseline="bottom";' +
  'var tw=ctx.measureText(e[2]).width;ctx.fillStyle="#0e0e1acc";ctx.fillRect(emx-tw/2-3,emy-14,tw+6,13);ctx.fillStyle="#8A93B4";ctx.fillText(e[2],emx,emy-3);ctx.restore();}' +
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
  // Edge hit detection — returns edge if mouse is within 6px of the line segment
  'function hitEdge(mx,my){var best=null;var bestD=6;EDGES.forEach(function(e){var fn=getNode(e[0]);var tn=getNode(e[1]);if(!fn||!tn)return;var dx=tn.x-fn.x;var dy=tn.y-fn.y;var len2=dx*dx+dy*dy;if(len2===0)return;var t=Math.max(0,Math.min(1,((mx-fn.x)*dx+(my-fn.y)*dy)/len2));var px=fn.x+t*dx;var py=fn.y+t*dy;var d=Math.sqrt((mx-px)*(mx-px)+(my-py)*(my-py));if(d<bestD){bestD=d;best=e;}});return best;}' +
  // Edge IO history cache
  'var edgeHistory={};function loadEdgeHistory(from,to){var key=from+"-"+to;if(edgeHistory[key])return;fetch("/api/edges/history?from="+encodeURIComponent(from)+"&to="+encodeURIComponent(to)).then(function(r){return r.json()}).then(function(d){edgeHistory[key]=d.history||[];}).catch(function(){});}' +
  // Mouse events
  'canvas.addEventListener("mousedown",function(e){var r=canvas.getBoundingClientRect();var mx=e.clientX-r.left;var my=e.clientY-r.top;var hit=hitTest(mx,my);if(hit){dragNode=hit;offsetX=mx-hit.x;offsetY=my-hit.y;canvas.classList.add("dragging");}else{isPan=true;lastMX=mx;lastMY=my;canvas.classList.add("dragging");}});' +
  'canvas.addEventListener("mousemove",function(e){var r=canvas.getBoundingClientRect();var mx=e.clientX-r.left;var my=e.clientY-r.top;' +
  'if(dragNode){dragNode.x=mx-offsetX;dragNode.y=my-offsetY;return;}' +
  'if(isPan){panX+=mx-lastMX;panY+=my-lastMY;lastMX=mx;lastMY=my;nodes.forEach(function(n){n.x+=mx-lastMX+panX;n.y+=my-lastMY+panY;});panX=0;panY=0;return;}' +
  'var hit=hitTest(mx,my);hoveredNode=hit?hit.id:null;' +
  'if(!hit){var edge=hitEdge(mx,my);if(edge){canvas.style.cursor="crosshair";showEdgeTooltip(edge,e.clientX,e.clientY);return;}}' +
  'canvas.style.cursor=hit?"pointer":"grab";showTooltip(hit,e.clientX,e.clientY);});' +
  'canvas.addEventListener("mouseup",function(){if(dragNode){dragNode=null;canvas.classList.remove("dragging");}isPan=false;canvas.classList.remove("dragging");});' +
  'canvas.addEventListener("click",function(e){var r=canvas.getBoundingClientRect();var hit=hitTest(e.clientX-r.left,e.clientY-r.top);if(hit){selectedNode=hit.id;hit.pulse=1;openDetail(hit);}});' +
  // Tooltip
  'function showTooltip(node,cx,cy){var tt=document.getElementById("tooltip");if(!node){tt.style.display="none";return;}tt.style.display="block";tt.style.left=(cx+16)+"px";tt.style.top=(cy+16)+"px";' +
  'var io=IO_STREAMS[node.id]||{in:[],out:[]};' +
  'tt.innerHTML="<div class=tt-title>"+node.icon+" "+node.label+"</div><div class=tt-type>"+node.type+"</div>"+node.desc+"<div class=tt-io><div class=io-out>↓ out: "+(io.out.length?io.out[io.out.length-1].msg:"idle")+"</div><div class=io-in>↑ in: "+(io.in.length?io.in[io.in.length-1].msg:"idle")+"</div></div>";}' +
  // Edge tooltip with IO history
  'function showEdgeTooltip(edge,cx,cy){var tt=document.getElementById("tooltip");tt.style.display="block";tt.style.left=(cx+16)+"px";tt.style.top=(cy+16)+"px";' +
  'var fromN=getNode(edge[0]);var toN=getNode(edge[1]);var label=edge[2]||"";loadEdgeHistory(edge[0],edge[1]);var key=edge[0]+"-"+edge[1];var hist=edgeHistory[key]||[];' +
  'var histHtml=hist.length?hist.slice(-5).map(function(h){return "<div style=\\"font-size:.72rem;color:#8A93B4;margin:2px 0\\">["+new Date(h.t).toLocaleTimeString()+"] "+h.type+": "+String(h.data).substring(0,60)+"</div>";}).join(""):"<div style=\\"font-size:.72rem;color:#8A93B4\\">No history yet</div>";' +
  'tt.innerHTML="<div class=tt-title>"+(fromN?fromN.label:edge[0])+" → "+(toN?toN.label:edge[1])+"</div>"+(label?"<div style=\\"color:#58a6ff;font-size:.78rem;margin:4px 0\\">"+label+"</div>":"")+"<div class=tt-io><div style=\\"font-size:.72rem;color:#8A93B4;margin-top:6px\\">Last "+Math.min(5,hist.length)+" messages:</div>"+histHtml+"</div>";}' +
  // Node detail panel
  'function openDetail(node){var d=document.getElementById("node-detail");d.classList.add("show");document.getElementById("nd-icon").textContent=node.icon;document.getElementById("nd-title").textContent=node.label+" — "+node.desc;var body=document.getElementById("nd-body");' +
  'if(node.url){body.innerHTML="<iframe src=\'"+node.url+"\' sandbox=\'allow-scripts allow-same-origin\' style=\'width:100%;height:100%;border:none;\'></iframe>";}' +
  'else{body.innerHTML="<div class=nd-tasks><div class=nd-task><strong>"+node.icon+" "+node.label+"</strong><div class=ndt-status>"+node.type+" · "+node.desc+"</div></div></div>";}}' +
  'function closeDetail(){document.getElementById("node-detail").classList.remove("show");selectedNode=null;}' +
  // Chat
  'var chatCollapsed=false;function toggleChat(){chatCollapsed=!chatCollapsed;var p=document.getElementById("chat-panel");p.classList.toggle("collapsed",chatCollapsed);document.getElementById("chat-toggle").textContent=chatCollapsed?"▲":"▼";}' +
  'function sendChat(){var inp=document.getElementById("chat-inp");var msg=inp.value.trim();if(!msg)return;inp.value="";addMsg(msg,"u");' +
  'fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:msg})}).then(function(r){return r.json()}).then(function(d){addMsg(d.response||d.error,"a");if(d.workflow)applyCustomWorkflow(d.workflow);}).catch(function(e){addMsg("Error: "+e.message,"a");});}' +
  'function addMsg(text,cls){var d=document.getElementById("chat-msgs");var m=document.createElement("div");m.className="msg "+cls;m.textContent=text;d.appendChild(m);d.scrollTop=d.scrollHeight;}' +
  // View modes
  'function setView(mode){viewMode=mode;document.querySelectorAll(".view-btn").forEach(function(b){b.classList.remove("active");});var btnId=mode==="flowchart"?"flow":mode==="spreadsheet"?"sheet":mode==="topology"?"topo":mode==="timeline"?"timeline":"orbital";var btn=document.getElementById("btn-"+btnId);if(btn)btn.classList.add("active");' +
  'document.getElementById("sheet-overlay").classList.toggle("show",mode==="spreadsheet");document.getElementById("tl-overlay").classList.toggle("show",mode==="timeline");canvas.style.display=(mode==="spreadsheet"||mode==="timeline")?"none":"block";' +
  'if(mode==="spreadsheet")renderSpreadsheet();if(mode==="timeline"&&typeof renderTimeline==="function")renderTimeline();' +
  'if(mode==="topology")layoutTopology();function layoutOrbital(){var cx=window.innerWidth/2;var cy=window.innerHeight/2+60;var clusters={agent:[],app:[],meta:[],infra:[],storage:[],hub:[]};nodes.forEach(function(n){if(clusters[n.type])clusters[n.type].push(n);});var types=Object.keys(clusters).filter(function(t){return t!=="hub"&&clusters[t].length>0;});var cr=Math.min(cx,cy)*0.5;types.forEach(function(t,i){var a=(i/types.length)*Math.PI*2-Math.PI/2;var clusterX=cx+Math.cos(a)*cr;var clusterY=cy+Math.sin(a)*cr;var members=clusters[t];members.forEach(function(n,j){var subr=50+j*30;var sa=(j/members.length)*Math.PI*2;n.x=clusterX+Math.cos(sa)*subr;n.y=clusterY+Math.sin(sa)*subr;});});var hubNode=nodes[0];if(hubNode&&hubNode.id==="hub"){hubNode.x=cx;hubNode.y=cy;}}if(mode==="orbital")layoutOrbital();}' +
  // Spreadsheet view
  'function renderSpreadsheet(){var o=document.getElementById("sheet-overlay");' +
  'var rows=NODES.map(function(n){var io=IO_STREAMS[n.id]||{in:[],out:[]};return[n.icon+" "+n.label,n.type,n.desc,io.out.length?io.out[io.out.length-1].msg:"idle",io.in.length?io.in[io.in.length-1].msg:"idle",n.url?"<a href=\'"+n.url+"\' target=\'_blank\' style=\'color:#58a6ff\'>Open →</a>":"—"];});' +
  'o.innerHTML="<table class=sheet-table><tr><th>Vessel</th><th>Type</th><th>Description</th><th>Out</th><th>In</th><th>Link</th></tr>"+rows.map(function(r){return "<tr><td>"+r[0]+"</td><td>"+r[1]+"</td><td>"+r[2]+"</td><td>"+r[3]+"</td><td>"+r[4]+"</td><td>"+r[5]+"</td></tr>";}).join("")+"</table>";}' +
  // Topology auto-layout
  'function layoutTopology(){var cx=window.innerWidth/2;var cy=window.innerHeight/2+24;' +
  'var layers=[{type:"hub",r:0},{type:"agent",r:160},{type:"app",r:160},{type:"meta",r:160},{type:"infra",r:260},{type:"storage",r:260}];' +
  'nodes.forEach(function(n){var layer=layers.find(function(l){return l.type===n.type;});if(layer){var sameType=nodes.filter(function(nn){return nn.type===n.type;});var idx=sameType.indexOf(n);var a=(idx/sameType.length)*Math.PI*2-Math.PI/2;n.x=cx+Math.cos(a)*layer.r;n.y=cy+Math.sin(a)*layer.r;}});}' +
  // Workflow template loader
  'function loadWorkflow(){var sel=document.getElementById("wf-select");var key=sel.value;if(!key)return;' +
  'fetch("/api/workflows",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:key})}).then(function(r){return r.json()}).then(function(d){var wf=d.template;if(!wf){addMsg("Workflow not found","a");return;}' +
  'addMsg("Loading workflow: "+wf.name,"a");' +
  'var wNodes=wf.nodes;var wEdges=wf.edges;' +
  'var cx=window.innerWidth/2;var cy=window.innerHeight/2+24;' +
  // Remove existing custom workflow nodes
  'nodes=nodes.filter(function(n){return !n.custom;});EDGES.length=0;ORIG_EDGES.forEach(function(e){EDGES.push(e);});' +
  // Add workflow nodes in a circle
  'var radius=Math.min(cx,cy)*0.45;wNodes.forEach(function(wn,i){var exists=nodes.find(function(n){return n.id===wn.id;});if(exists)return;' +
  'var a=(i/wNodes.length)*Math.PI*2-Math.PI/2;nodes.push({id:wn.id,label:wn.label,type:wn.type,color:wn.color,icon:wn.icon,desc:"",x:cx+Math.cos(a)*radius,y:cy+Math.sin(a)*radius,r:getR(wn.type),pulse:1,custom:true});});' +
  // Add workflow edges
  'wEdges.forEach(function(we){EDGES.push(we);});' +
  'updateCounts();addMsg("Applied "+wf.name+": "+wNodes.length+" nodes, "+wEdges.length+" edges","a");}).catch(function(e){addMsg("Error loading workflow: "+e.message,"a");});}' +
  // Custom workflow from chat
  'function applyCustomWorkflow(wf){if(!wf||!wf.nodes||!wf.edges)return;' +
  'var cx=window.innerWidth/2;var cy=window.innerHeight/2+24;' +
  'var radius=Math.min(cx,cy)*0.4;' +
  'wf.nodes.forEach(function(wn,i){var exists=nodes.find(function(n){return n.id===wn.id;});if(exists)return;' +
  'var a=(i/wf.nodes.length)*Math.PI*2-Math.PI/2;nodes.push({id:wn.id,label:wn.label,type:wn.type||"agent",color:wn.color||"#F59E0B",icon:wn.icon||"🤖",desc:wn.desc||"",x:cx+Math.cos(a)*radius,y:cy+Math.sin(a)*radius,r:getR(wn.type||"agent"),pulse:1,custom:true});});' +
  'wf.edges.forEach(function(we){if(!EDGES.find(function(e){return e[0]===we[0]&&e[1]===we[1];}))EDGES.push(we);});' +
  'updateCounts();}' +
  'function updateCounts(){document.getElementById("node-count").textContent=nodes.length+" nodes";document.getElementById("edge-count").textContent=EDGES.length+" links";}' +
  // Keyboard
  'document.addEventListener("keydown",function(e){if(e.key==="Escape")closeDetail();});' +
  // Init
  'window.addEventListener("resize",resize);resize();' + 'function layoutOrbital(){var cx=window.innerWidth/2,cy=window.innerHeight/2+60;var gs={};nodes.forEach(function(n){if(!gs[n.type])gs[n.type]=[];gs[n.type].push(n);});var ts=Object.keys(gs).filter(function(t){return t!=="hub";});ts.forEach(function(t,i){var a=(i/ts.length)*Math.PI*2-Math.PI/2,cr=Math.min(cx,cy)*0.5;var mx=cx+Math.cos(a)*cr,my=cy+Math.sin(a)*cr;gs[t].forEach(function(n,j){var sr=50+j*30,sa=(j/gs[t].length)*Math.PI*2;n.x=mx+Math.cos(sa)*sr;n.y=my+Math.sin(sa)*sr;});});var h=nodes[0];if(h){h.x=cx;h.y=cy;}}' + 'setInterval(function(){var b=document.getElementById("alert-bar");if(!b)return;var al=[];NODES.forEach(function(n){var io=IO_STREAMS[n.id];if(!io)return;var lo=io.out.length?io.out[io.out.length-1].t:0;var li=io.in.length?io.in[io.in.length-1].t:0;if(Date.now()-lo>30000&&Date.now()-li>30000)al.push({t:"red",m:n.label+" idle"});else if(io.out.length>5)al.push({t:"yellow",m:n.label+" burst"});});if(!al.length)al.push({t:"green",m:"Fleet online — "+NODES.length+" vessels"});b.innerHTML=al.slice(0,5).map(function(a){return"<div class=alert-item><span class=alert-dot "+a.t+"></span>"+a.m+"</div>";}).join("");},5000);' + 
  '<script src="/features.js"><\/script>' +
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
    if (path === '/features.js') {
      const js = `var TL_EVENTS=[];var TL_FILTER='all';var NODE_STATUS={};var voiceActive=false;var recognition=null;
function toggleVoice(){if(!voiceActive)startVoice();else stopVoice();}
function startVoice(){if(!('webkitSpeechRecognition' in window)&&!('SpeechRecognition' in window)){addMsg('Voice not supported','a');return;}var SR=window.SpeechRecognition||window.webkitSpeechRecognition;recognition=new SR();recognition.continuous=false;recognition.interimResults=true;recognition.lang='en-US';recognition.onresult=function(e){var t='';for(var i=e.resultIndex;i<e.results.length;i++){t+=e.results[i][0].transcript;}document.getElementById('chat-inp').value=t;};recognition.onend=function(){if(voiceActive){sendChat();stopVoice();}};recognition.onerror=function(e){addMsg('Voice error: '+e.error,'a');stopVoice();};recognition.start();voiceActive=true;var btn=document.getElementById('voice-btn');btn.classList.add('recording');btn.classList.remove('listening');btn.textContent='\\u{1F534}';}
function stopVoice(){if(recognition)recognition.stop();voiceActive=false;var btn=document.getElementById('voice-btn');btn.classList.remove('recording');btn.classList.add('listening');btn.textContent='\\u{1F3A4}';}
function checkHealth(){NODES.forEach(function(n){if(!n.endpoint)return;fetch(n.endpoint+'/health',{mode:'no-cors'}).then(function(){NODE_STATUS[n.id]={online:true,checkedAt:Date.now()};}).catch(function(){NODE_STATUS[n.id]={online:false,checkedAt:Date.now()};});});}setInterval(checkHealth,10000);checkHealth();
function renderTimeline(){var o=document.getElementById('tl-overlay');var html='<div class=tl-header><span>Fleet Timeline</span><span style="font-size:.7rem;color:#8A93B4">'+TL_EVENTS.length+' events</span></div>';html+='<div class=tl-filter>';['all','io','status','alert'].forEach(function(f){html+='<button class="'+(TL_FILTER===f?'active':'')+'" onclick="TL_FILTER=\\''+f+'\\';renderTimeline()">'+f.charAt(0).toUpperCase()+f.slice(1)+'</button>';});html+='</div>';var filtered=TL_EVENTS.slice().reverse();if(TL_FILTER!=='all'){filtered=filtered.filter(function(e){return e.type===TL_FILTER;});}filtered.slice(0,100).forEach(function(e){var ts=new Date(e.t).toLocaleTimeString();var tc=TYPE_COLORS[e.nodeType]||'#58a6ff';html+='<div class=tl-row><div class=tl-time>'+ts+'</div><div class=tl-icon style="background:'+tc+'22;color:'+tc+'">'+e.icon+'</div><div class=tl-body><div class=tl-label>'+e.label+'</div><div class=tl-msg>'+e.msg+'</div></div></div>';});if(!filtered.length)html+='<div style="text-align:center;color:#8A93B4;padding:40px">No events yet.</div>';o.innerHTML=html;}
var _origDraw=draw;draw=function(){_origDraw();nodes.forEach(function(n){if(NODE_STATUS[n.id]&&!NODE_STATUS[n.id].online){var s=NODE_STATUS[n.id].checkedAt;if(Date.now()-s<20000){ctx.save();ctx.globalAlpha=0.4;ctx.beginPath();ctx.arc(n.x,n.y,n.r+2,0,Math.PI*2);ctx.strokeStyle='#f85149';ctx.lineWidth=2;ctx.setLineDash([4,4]);ctx.stroke();ctx.restore();}}});};\n`;
      return new Response(js, { headers: { 'Content-Type': 'application/javascript', ...CSP_OBJ } });
    }

    if (path === '/health') return json({ status: 'ok', repo: 'deckboss-ai', version: '2.0.0', nodes: HUB_NODES.length, edges: HUB_EDGES.length, types: [...new Set(HUB_NODES.map((n: any) => n.type))], timestamp: Date.now() });
    if (path === '/vessel.json') return json({ name: 'deckboss-ai', displayName: 'Deckboss', type: 'cocapn-vessel', category: 'infrastructure', description: 'Hub-and-spoke fleet command center with flowchart and spreadsheet views', capabilities: ['fleet-visualization', 'hub-spoke-flowchart', 'spreadsheet-view', 'topology-view', 'agent-routing', 'io-streams'], endpoints: { health: '/health', chat: '/api/chat', nodes: '/api/nodes', edges: '/api/edges', topology: '/api/topology' }, deployment: { url: 'https://deckboss-ai.casey-digennaro.workers.dev' } });

    // Fleet topology API
    if (path === '/api/nodes') return json({ nodes: HUB_NODES.map(function(n) { var io = { in: [], out: [] }; return { ...n, io }; }), total: HUB_NODES.length });
    if (path === '/api/edges') return json({ edges: HUB_EDGES, total: HUB_EDGES.length });

    // Workflow templates — GET returns all, POST with {name} returns specific
    if (path === '/api/workflows') {
      if (method === 'GET') return json({ templates: WORKFLOW_TEMPLATES });
      if (method === 'POST') {
        try {
          const body = await request.json() as { name: string };
          if (!body.name) return json({ error: 'Requires {name}' }, 400);
          const tmpl = WORKFLOW_TEMPLATES.find(function(t: any) { return t.name === body.name; });
          if (!tmpl) return json({ error: 'Template not found' }, 404);
          return json({ template: tmpl });
        } catch (e: any) { return json({ error: e.message }, 500); }
      }
    }

    // Node priority — per-node GET/POST, stored in KV under 'priority:'+nodeId
    const nodePriorityMatch = path.match(/^\/api\/nodes\/([^/]+)\/priority$/);
    if (nodePriorityMatch) {
      const nodeId = nodePriorityMatch[1];
      const kvKey = 'priority:' + nodeId;
      if (method === 'GET') {
        try {
          const raw = await env.DECKBOSS_KV.get(kvKey);
          const priority = raw ? parseInt(raw) : 5;
          return json({ nodeId: nodeId, priority: priority });
        } catch { return json({ nodeId: nodeId, priority: 5 }); }
      }
      if (method === 'POST') {
        try {
          const body = await request.json() as { priority: number };
          if (typeof body.priority !== 'number' || body.priority < 1 || body.priority > 10) {
            return json({ error: 'Requires {priority: 1-10}' }, 400);
          }
          await env.DECKBOSS_KV.put(kvKey, String(body.priority));
          return json({ ok: true, nodeId: nodeId, priority: body.priority });
        } catch (e: any) { return json({ error: e.message }, 500); }
      }
    }

    // Edge history — POST to record, GET with ?from=X&to=Y to retrieve
    if (path === '/api/edges/history') {
      if (method === 'GET') {
        var eFrom = url.searchParams.get('from') || '';
        var eTo = url.searchParams.get('to') || '';
        if (!eFrom || !eTo) return json({ error: 'Requires ?from=X&to=Y' }, 400);
        try {
          const kvKey = 'edge-history:' + eFrom + '-' + eTo;
          const raw = await env.DECKBOSS_KV.get(kvKey);
          const history = raw ? JSON.parse(raw) : [];
          return json({ from: eFrom, to: eTo, history: history });
        } catch { return json({ from: eFrom, to: eTo, history: [] }); }
      }
      if (method === 'POST') {
        try {
          const body = await request.json() as { from: string; to: string; type: string; data: any };
          if (!body.from || !body.to || !body.type) return json({ error: 'Requires {from, to, type, data}' }, 400);
          const kvKey = 'edge-history:' + body.from + '-' + body.to;
          const raw = await env.DECKBOSS_KV.get(kvKey);
          const history: any[] = raw ? JSON.parse(raw) : [];
          history.push({ from: body.from, to: body.to, type: body.type, data: body.data, t: Date.now() });
          while (history.length > 50) history.shift();
          await env.DECKBOSS_KV.put(kvKey, JSON.stringify(history));
          return json({ ok: true, from: body.from, to: body.to, total: history.length });
        } catch (e: any) { return json({ error: e.message }, 500); }
      }
    }

    // Chat — routes to appropriate vessel or answers fleet questions
    if (method === 'POST' && path === '/api/chat') {
      try {
        const body = await request.json() as { message: string };
        const msg = (body.message || '').trim();
        if (!msg) return json({ error: 'No message' }, 400);

        const key = env.DEEPSEEK_API_KEY;
        if (!key) return json({ error: 'No API key configured' }, 503);

        // Check if user wants to create a workflow
        const wfMatch = msg.toLowerCase().match(/create\s+workflow\s+["']?(\w[\w\s-]*)$/i) ||
                        msg.toLowerCase().match(/create\s+workflow\s+["']([^"']+)["']/i) ||
                        msg.toLowerCase().match(/new\s+workflow\s+["']?(\w[\w\s-]*)/i);

        if (wfMatch) {
          const wfName = (wfMatch[1] || wfMatch[2] || 'custom').trim().replace(/[^a-z0-9-_ ]/gi, '');
          const wfKey = 'workflow:' + wfName.replace(/\s+/g, '-').toLowerCase();

          const wfSysPrompt = 'You are a workflow designer for an AI agent fleet. The user wants to create a workflow called "' + wfName + '". ' +
            'Respond with ONLY a JSON object (no markdown, no backticks) with this shape: {"name":"...","desc":"...","nodes":[{"id":"...","label":"...","type":"agent|app|meta|infra|storage|hub","color":"#hex","icon":"emoji","desc":"..."}],"edges":[["from","to","label"]]}. ' +
            'Create 3-7 nodes and 3-8 edges that make sense for a workflow called "' + wfName + '". Use realistic agent names and purposes. Types: hub(command), agent(worker), app(application), meta(system), infra(infrastructure), storage(persistence).';

          const wfResp = await fetch(DS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
            body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'system', content: wfSysPrompt }, { role: 'user', content: msg }], max_tokens: 600, temperature: 0.8 })
          });

          const wfData = await wfResp.json() as any;
          let wfContent = wfData.choices?.[0]?.message?.content || '';

          // Try to parse the JSON from the response
          let wfObj: any = null;
          try {
            // Strip markdown code fences if present
            const cleaned = wfContent.replace(/```json?\s*/g, '').replace(/```/g, '').trim();
            wfObj = JSON.parse(cleaned);
          } catch {
            // If parsing fails, return the raw response
            return json({ response: 'I tried to create a workflow but couldn\'t parse the structure. Please try again with more detail, like: "create workflow data pipeline with 3 agents".', vessel: null });
          }

          if (wfObj && wfObj.nodes && wfObj.edges) {
            await env.DECKBOSS_KV.put(wfKey, JSON.stringify(wfObj));
            return json({
              response: 'Created workflow "' + wfName + '" with ' + wfObj.nodes.length + ' nodes and ' + wfObj.edges.length + ' edges. It\'s now on your canvas!',
              vessel: null,
              workflow: wfObj
            });
          }

          return json({ response: wfContent, vessel: null });
        }

        // Check if user is asking about a specific vessel
        const mentioned = HUB_NODES.find(function(n) { return msg.toLowerCase().includes(n.label.toLowerCase()) || msg.toLowerCase().includes(n.id); });

        const sysPrompt = 'You are Deckboss, the fleet command center. You oversee ' + HUB_NODES.length + ' vessels connected in a hub-and-spoke topology. ' +
          'The hub is you (Deckboss). Connected agents: StudyLog (AI classroom), DMLog (Dungeon Master), MakerLog (coding), PersonalLog (assistant), BusinessLog (CRM), FishingLog (fishing companion). ' +
          'Apps: Fleet RPG, DogMind Arena, LucidDreamer (content engine). Meta: The Seed (self-evolving repo), Become (bootcamp), Self-Evolve (A/B tester). ' +
          'Infra: Capitaine (flagship), Orchestrator (event bus). Storage: Fleet Memory (KV), GitHub (git coordination). ' +
          'When asked about the fleet, explain how vessels connect and what data flows between them. Keep answers concise. ' +
          'You can also create workflows. If the user says "create workflow X", describe what agents and connections would be needed. ' +
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


    // Agent registration
    if (path === '/api/registered' && method === 'GET') {
      const list = await env.DECKBOSS_KV.list({ prefix: 'registered:', limit: 100 });
      const agents: any[] = [];
      for (const key of list.keys) {
        try { const raw = await env.DECKBOSS_KV.get(key.name); if (raw) agents.push(JSON.parse(raw)); } catch {}
      }
      return json({ agents, total: agents.length });
    }
    if (path === '/api/register' && method === 'POST') {
      const body = await request.json() as { agent_id: string; type: string; endpoint: string; label?: string; color?: string; icon?: string };
      if (!body.agent_id || !body.endpoint) return json({ error: 'Requires {agent_id, endpoint}' }, 400);
      const agent = { id: body.agent_id, type: body.type || 'agent', endpoint: body.endpoint, label: body.label || body.agent_id, color: body.color || '#58a6ff', icon: body.icon || '🤖', registeredAt: Date.now() };
      await env.DECKBOSS_KV.put('registered:' + body.agent_id, JSON.stringify(agent));
      return json({ ok: true, agent });
    }
    var regMatch = path.match(/^\/api\/registered\/([^/]+)$/);
    if (regMatch && method === 'DELETE') {
      await env.DECKBOSS_KV.delete('registered:' + regMatch[1]);
      return json({ ok: true, deleted: regMatch[1] });
    }

    // Dynamic node/edge management
    if (path === '/api/nodes' && method === 'GET') {
      return json({ nodes: HUB_NODES, total: HUB_NODES.length });
    }
    if (path === '/api/nodes' && method === 'POST') {
      const body = await request.json() as { nodes: any[] };
      if (body.nodes && Array.isArray(body.nodes)) {
        HUB_NODES = body.nodes;
        await env.DECKBOSS_KV.put('nodes', JSON.stringify(body.nodes));
        return json({ ok: true, total: body.nodes.length });
      }
      return json({ error: 'Requires {nodes:[...]}' }, 400);
    }
    if (path === '/api/edges' && method === 'GET') {
      return json({ edges: HUB_EDGES, total: HUB_EDGES.length });
    }
    if (path === '/api/edges' && method === 'POST') {
      const body = await request.json() as { edges: any[] };
      if (body.edges && Array.isArray(body.edges)) {
        HUB_EDGES = body.edges;
        await env.DECKBOSS_KV.put('edges', JSON.stringify(body.edges));
        return json({ ok: true, total: body.edges.length });
      }
      return json({ error: 'Requires {edges:[...]}' }, 400);
    }
    // Add single node
    if (path === '/api/node' && method === 'POST') {
      const body = await request.json() as { id: string; label: string; type: string; color?: string; icon?: string; desc?: string; priority?: number; endpoint?: string };
      if (!body.id || !body.label) return json({ error: 'Requires {id, label}' }, 400);
      const node = { id: body.id, label: body.label, type: body.type || 'agent', color: body.color || TYPE_COLORS[body.type] || '#58a6ff', icon: body.icon || '🤖', desc: body.desc || '', priority: body.priority || 5, endpoint: body.endpoint || '' };
      const existing = HUB_NODES.findIndex(n => n.id === body.id);
      if (existing >= 0) HUB_NODES[existing] = node; else HUB_NODES.push(node);
      await env.DECKBOSS_KV.put('nodes', JSON.stringify(HUB_NODES));
      return json({ ok: true, node });
    }
    // Add single edge
    if (path === '/api/edge' && method === 'POST') {
      const body = await request.json() as { from: string; to: string; label?: string };
      if (!body.from || !body.to) return json({ error: 'Requires {from, to}' }, 400);
      HUB_EDGES.push([body.from, body.to, body.label || '']);
      await env.DECKBOSS_KV.put('edges', JSON.stringify(HUB_EDGES));
      return json({ ok: true, edge: [body.from, body.to, body.label || ''] });
    }
    return new Response('Not found', { status: 404 });
  }
};
