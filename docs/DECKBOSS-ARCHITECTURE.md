# Deckboss Architecture — Template-Based Fleet Interface

## Core Principle
Deckboss is a TEMPLATE for fleet interfaces, not a single app.
The spreadsheet, flowchart, and orbital views are all INTERFACES over the same data.

## Data Layer (shared by all views)
- **Nodes**: Stored in KV, loaded at init, dynamic CRUD via API
- **Edges**: Stored in KV, connections between nodes
- **IO Streams**: Per-edge message history
- **Priorities**: Per-node priority (1-10), affects bubble size

## Interface Templates
Each template is a complete HTML page that reads from the same /api/nodes and /api/edges.

### 1. Spreadsheet (Printable, Auditable)
- Table view with columns: Icon, ID, Label, Type, Priority, IO, Endpoint, Description
- Filter by type, search by name
- Export CSV/JSON
- The "logic view" — what a fleet commander prints out

### 2. Flowchart (Runtime Visualization)
- Canvas hub-and-spoke with center = user's agent
- Bubbles grow/shrink by priority
- Animated IO on edges
- Hover = details, Click = agent UI
- The "operations view" — what a fleet commander watches in real-time

### 3. Orbital (Scalable Navigation)
- Clusters agents by type in orbital rings
- Zoom: galaxy → cluster → single agent
- Search beam to find specific agents
- The "navigation view" — what a fleet commander uses with 100+ nodes

### 4. Timeline (Coming Soon)
- Chronological event stream
- Each agent's activity over time
- The "audit view" — what happened and when

## Hub = The User's Agent
The center bubble is NOT a chatbot. It is the user's PRIMARY agent.
- Voice users: STT → Center → TTS
- Text users: Telegram/Discord/web → Center → response
- The center routes to all other bubbles based on task

## Node Types
| Type | Color | Description |
|------|-------|-------------|
| hub | #f78166 | User's primary agent |
| agent | #00d4ff | Cocapn vessel (studylog, dmlog, etc.) |
| app | #818cf8 | Application (fleet-rpg, dogmind, etc.) |
| meta | #22c55e | Meta-agent (capitaine, git-agent) |
| infra | #00E6D6 | Infrastructure (orchestrator, the-fleet) |
| storage | #64748b | Data store (KV, D1, R2) |
| model | #58a6ff | LLM (cloud or local) |
| sensor | #4ade80 | Physical sensor (temp, GPS, camera) |
| terminal | #f59e0b | TUI to git-agent |
| database | #a78bfa | Database (D1, SQLite) |
| inbox | #f472b6 | Async message queue |

## Multi-Model Architecture
A user's agent setup might look like:
- Center: seed-pro (creative DM worldbuilding)
- Sub-agent: seed-mini (filling gaps, fast iterations)
- Image gen: FLUX.1-schnell (icons, look-and-feel)
- Cloud reasoning: DeepSeek-Reasoner (when internet available)
- Local fast: Ollama on Jetson (when cloud intermittent)

Each model is a BUBBLE. The center routes to them as needed.

## API Endpoints (shared data layer)
- GET /api/nodes — all nodes
- POST /api/nodes — replace all nodes
- GET /api/edges — all edges
- POST /api/edges — replace all edges
- POST /api/node — add/update single node
- POST /api/edge — add single edge
- POST /api/nodes/priority — set node priority
- GET /api/workflows — workflow templates
- POST /api/chat — fleet chat
- POST /api/register — register external agent
