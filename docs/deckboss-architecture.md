> *Written by Gemini 3.1 Pro*

# Deckboss.ai — Software Architecture Document

**Version:** 1.0
**License:** MIT
**Core Concept:** A cellular agent spreadsheet where every cell can be an autonomous AI agent ("Claw"), built on top of the Univer framework.

---

## 1. SYSTEM ARCHITECTURE

Deckboss.ai utilizes a modular, local-first architecture designed to run in the browser, on the edge, or as a compiled standalone application. Heavy compute and AI orchestration are offloaded to Web Workers to keep the Univer UI thread strictly at 60fps.

### 1.1 Monorepo Structure (pnpm workspaces)

```text
deckboss/
├── packages/
│   ├── core/       # Headless spreadsheet engine wrapper, state machine, graph execution
│   ├── cells/      # Cell definitions (Standard, Claw, UI, Runtime)
│   ├── claws/      # AI agent logic, LLM integrations, skills, learning loop
│   ├── ui/         # Univer integration, Chatbot Panel, custom renderers
│   ├── worker/     # Web Worker entry points for off-thread Claw execution
│   └── cli/        # Build system, compilation pipeline (Sheet -> App)
├── apps/
│   ├── web/        # Main browser application (Vite + React)
│   ├── desktop/    # Electron wrapper
│   └── edge/       # Cloudflare Workers deployment target
└── package.json
```

### 1.2 Technology Choices
*   **Language:** TypeScript (Strict mode).
*   **Spreadsheet Engine:** Univer (Open source, highly extensible).
*   **Concurrency:** Web Workers (Comlink for RPC between main thread and workers).
*   **Local Storage:** IndexedDB (via `idb`) for cell state; SQLite via WASM (`wa-sqlite`) for Claw memory and vector embeddings.
*   **Cloud Storage:** Cloudflare D1 (SQL) and Vectorize.
*   **Bundler:** Vite (development/web), esbuild (CLI/Compilation).

---

## 2. CELL ENGINE

The Cell Engine extends Univer's standard data model. In Deckboss, a cell is a reactive state machine.

### 2.1 Key Interfaces

```typescript
type CellID = string; // e.g., "Sheet1!A1"

interface BaseCell {
  id: CellID;
  type: 'standard' | 'claw' | 'ui';
  value: any;
  dependencies: CellID[]; // Cells this cell watches
}

interface StandardCell extends BaseCell {
  type: 'standard';
  formula?: string;
}

interface ClawCell extends BaseCell {
  type: 'claw';
  dna: ClawDNA;
  state: RuntimeState;
  memoryId: string; // Ref to SQLite memory table
}

interface UICell extends BaseCell {
  type: 'ui';
  component: string; // e.g., "Button", "Chart", "Input"
  props: Record<string, any>;
}

enum RuntimeState {
  IDLE = 'idle',
  THINKING = 'thinking',
  AWAITING_INPUT = 'awaiting_input',
  ERROR = 'error'
}

enum LifecyclePhase {
  CREATE = 0,     // Instantiated
  CONFIGURE = 1,  // DNA injected
  ACTIVATE = 2,   // Connected to dependency graph
  LEARN = 3,      // Running learning loops
  SPECIALIZE = 4, // Prompts optimized based on history
  MASTER = 5      // High confidence, frozen prompt, fast execution
}
```

### 2.2 Cell Communication
*   **Direct Reference:** Standard Univer formula references (`=B1`).
*   **Cascade:** Reactive graph execution. If A1 updates, Claw B1 triggers automatically.
*   **Heartbeat:** Cron-driven execution (e.g., `Tick: 1m`).
*   **A2A (Agent-to-Agent):** Claws can message each other directly bypassing the visual grid using a Pub/Sub event bus in the `core` package.

---

## 3. CLAW ENGINE

The Claw Engine lives primarily in the `worker` package. It manages the LLM interactions, tool usage, and memory.

### 3.1 Claw DNA

```typescript
interface ClawDNA {
  purpose: string;       // "Extract company names from text"
  inputSpec: JSONSchema; // Expected input format
  outputSpec: JSONSchema;// Expected output format (enforced via structured outputs)
  constraints: string[]; // "Do not hallucinate", "Return null if not found"
  modelPrefs: string[];  // ['gpt-4o', 'claude-3-haiku', 'local-llama-3']
  skills: string[];      // ['web_search', 'read_cell', 'fetch_api']
  outputMethod: OutputMethod; 
}

type OutputMethod = 'keep-recent' | 'summarize' | 'tally' | 'recipe-book' | 'cascade' | 'archive';
```

### 3.2 The Learning Loop (Pseudocode)

When a Claw is in the `LEARN` lifecycle phase, it evaluates its own performance to optimize its prompt and parameters.

```typescript
async function clawLearningLoop(claw: ClawCell, input: any): Promise<any> {
  const memoryDB = await getSQLiteConnection();
  
  // 1. INPUT: Format data according to DNA
  const context = buildContext(input, claw.dna);
  
  // 2. MULTI-MODEL REFINEMENT: Run against multiple models/prompts in parallel
  const variations = generatePromptVariations(claw.dna.purpose);
  const executions = variations.map(prompt => 
    executeLLM({ prompt, context, models: claw.dna.modelPrefs })
  );
  
  const results = await Promise.allSettled(executions);
  
  // 3. COMPARE & REFINE: Evaluate results against OutputSpec and Constraints
  let bestResult = null;
  let highestScore = 0;
  
  for (const res of results) {
    if (res.status === 'fulfilled') {
      const score = evaluateResult(res.value, claw.dna.outputSpec, claw.dna.constraints);
      if (score > highestScore) {
        highestScore = score;
        bestResult = res.value;
      }
      // Log all findings for future specialization
      await memoryDB.execute(
        'INSERT INTO claw_evals (claw_id, prompt, model, score, output) VALUES (?, ?, ?, ?, ?)',
        [claw.id, res.value.prompt, res.value.model, score, res.value.output]
      );
    }
  }

  // 4. ACCUMULATE: Update Claw state towards 'MASTER' phase
  if (highestScore > 0.95) {
    await incrementClawConfidence(claw.id);
  }

  // 5. OUTPUT HANDLING
  return handleOutput(bestResult.output, claw.dna.outputMethod);
}
```

---

## 4. CHATBOT PANEL

The Chatbot Panel is a Univer sidebar plugin. It acts as the orchestrator and debugger.

*   **Context Aware:** The chatbot maintains a system prompt containing the current sheet schema, active selection, and registry of existing Claws.
*   **Natural Language Creation:** User types: *"Make column C translate column B to Spanish."* Chatbot translates this to a Deckboss API call: `createClaw({ range: 'C:C', dependencies: ['B:B'], purpose: 'Translate to Spanish' })`.
*   **Visual Debugging:** Asking *"Why did C2 fail?"* prompts the Chatbot to query the SQLite `claw_evals` table and render a diff of the LLM's thought process directly in the chat UI.

---

## 5. COMPILATION PIPELINE

Deckboss allows users to turn a spreadsheet into a standalone application.

1.  **Sheet Selection:** User selects a range or a specific sheet containing `UICell`s (e.g., buttons, input fields) and `ClawCell`s.
2.  **Headless Extraction:** The CLI extracts the Univer workbook JSON state.
3.  **Bundling (esbuild/Vite):** 
    *   The visual Univer grid is stripped out.
    *   `@deckboss/core` is bundled as a headless state machine.
    *   `UICell`s are mapped to standard React/Web Components.
4.  **Output:** A standalone `index.html` + `bundle.js` (or a Dockerfile) where the UI components trigger the headless spreadsheet graph, which in turn triggers the Web Worker Claws.

---

## 6. STORAGE ARCHITECTURE

| Data Type | Local Target | Cloud Target | Purpose |
| :--- | :--- | :--- | :--- |
| **Cell State** | IndexedDB | Cloudflare D1 | Fast, synchronous-feeling UI updates. Stores current values and Univer workbook JSON. |
| **Claw Memory** | SQLite (WASM) | Vectorize / D1 | Stores RAG embeddings, past executions, and learning loop evaluations. |
| **Claw Repos** | Local FS / OPFS | GitHub / Git | Claw DNAs are serialized as YAML. Allows version control of agent logic. |
| **Output Routing**| File System | REST API / SQL | Claws can be configured to push their final outputs to external databases. |

---

## 7. API DESIGN

### 7.1 Inter-Sheet Communication (A2A Protocol)
Claws use a lightweight message-passing protocol to request data from other sheets or compiled Deckboss apps.
```typescript
interface A2AMessage {
  sourceClaw: CellID;
  targetClaw: CellID | 'broadcast';
  intent: 'request_data' | 'trigger_action' | 'share_learning';
  payload: any;
}
```

### 7.2 WebSocket / Worker RPC
Because Claws run in Web Workers, the UI subscribes to their state via RPC.
```typescript
// UI Thread
worker.on('cell:status', (id: CellID, state: RuntimeState) => {
  univerAPI.setCellCustomFormat(id, { loadingSpinner: state === 'thinking' });
});
```

---

## 8. MVP SCOPE (3 Months, 1 Engineer)

To ship successfully with one engineer in 3 months, we must aggressively scope down.

### 8.1 What Ships First (The MVP)
*   **Core:** Basic Univer integration + Web Worker execution environment.
*   **Cells:** `StandardCell` and `ClawCell` (OpenAI only, single model).
*   **Lifecycle:** Simplified to Create -> Configure -> Activate. (No automated learning loop yet).
*   **Storage:** IndexedDB only (Local-first, browser-based).
*   **Chatbot:** Basic sidebar to create Claws via natural language and view execution logs.

### 8.2 What is Deferred (Post-MVP)
*   Compilation Pipeline (Standalone apps).
*   Cloudflare/Docker deployments (Keep it strictly local browser execution first).
*   Multi-model refinement and automated learning loops.
*   Git-backed Claw repos.

### 8.3 The "Oh, I Get It" Demo
**The Automated Sales CRM:**
1.  User pastes a list of 10 company URLs into Column A.
2.  User opens the Chatbot and types: *"Make Column B a Claw that visits the URL in Column A and finds the CEO's name."*
3.  **Visual:** Column B populates with loading spinners. One by one, names appear.
4.  User types: *"Make Column C a Claw that writes a 2-sentence cold email to the CEO in Column B about our product Deckboss."*
5.  **Visual:** Column C populates with emails.
6.  **The Kicker:** The user manually types a new URL into `A11`. Instantly, `B11` spins up, finds the name, which cascades to `C11` spinning up and writing the email. 
7.  The user realizes: **The spreadsheet is no longer just a record of data; it is a living, reactive software pipeline.**