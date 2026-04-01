# Deckboss.ai — Cellular Agent Spreadsheet

## The Core Idea

A spreadsheet where every cell can be alive.

Not "a spreadsheet with AI bolted on." A spreadsheet where cellular agents (claws) ARE the cells. Each claw has DNA (input→output purpose), learns from experience, and connects to other cells. The spreadsheet is the orchestration layer. The chatbot panel is the interface. The cells are the intelligence.

## The Paradigm Shift

**Old way**: Spreadsheet → data → formulas → AI is one more layer on top
**Deckboss way**: Repo-agent first → agent configures itself for the cell → cell IS the agent → spreadsheet is the body, agents are the cells

The repo-agent is loaded into a cell, streamlines itself for that cell's specific purpose using simulation, model comparison, and iterative refinement. Over time, each cell becomes an expert at exactly one thing.

## Cell Types

### 1. Standard Cells
Everything a normal spreadsheet does. Formulas. References. Data entry. Same commands (A1, =SUM, etc).

### 2. Cell-Agents (Claws)
A claw occupies a cell. It has:
- **DNA**: Hardcoded input→output purpose (e.g., "monitor this API endpoint, output status")
- **Learning**: Accumulates context about its purpose over time
- **Skills**: Methods for handling output (keep recent, summarize, tally, recipe-book)
- **Lifecycle**: Born (created) → Learns (accumulates) → Specializes (optimizes) → Masters (irreplaceable)

### 3. Runtime Cells
A cell that runs a program. Could be a tiny terminal. Could be a full UI component. Could be the headless background for a compiled application.

### 4. UI Cells
A cell that renders an interface. Can be opened in its own window. Can be compiled into a standalone application with the spreadsheet systems running headless in the background.

## Claw Architecture

### DNA (Input→Output)
Every claw has a hardcoded purpose defined at creation:
- Input: what triggers it (cell change, heartbeat, API call, manual)
- Output: where results go (another cell, a column, a file, a DB, a vector DB, a folder)
- Purpose: what it's trying to optimize for

### Output Handling Skills
When a claw produces output, it must decide what to do with it:
- **Keep most recent**: Only latest value matters
- **Summarize**: Accumulate and compress periodically
- **Tally commonness**: Count occurrences, find patterns
- **Recipe book**: Convert accumulated experience into reusable templates
- **Cascade**: Pass to another cell for further processing
- **Archive**: Send to long-term storage (file, DB, vector DB)

These decisions happen through a few quick questions at setup and then become automatic through learned patterns.

### Learning Loop
1. Receive input
2. Process through DNA-defined purpose
3. Compare output with what a bigger model would do (simulation)
4. Compare with what other models say (multi-model check)
5. Vary seeds, temperatures, parameters on interesting results
6. Accumulate the most insightful responses as training data
7. Refine prompt and behavior based on accumulated experience

### The Multi-Model Refinement
A claw doesn't just use one model. It:
- Runs its prompt through multiple models
- Varies seeds and temperatures
- Identifies which parameters produce the most insightful results
- Logs findings to understand the nature of the prompter's intended ask
- Even awkward prompts get decoded through accumulated experience

## Spreadsheet as Orchestration

### Cell Communication
- Direct reference: =A1 (standard)
- Claw cascade: Claw in A1 outputs to Claw in B1
- Column accumulation: Claw outputs fill a column, then the claw decides how to handle the growing list
- Cross-sheet: Claws in different sheets communicate via A2A

### Heartbeat System
- Claws can trigger on intervals (every 5min, hourly, daily)
- Heartbeat claws monitor other cells and react to changes
- The spreadsheet itself has a heartbeat — a global pulse that triggers periodic claws

### Off-Spreadsheet Outputs
Claws can output to:
- Internal files in the claw's repo
- SQL databases (standard)
- Vector databases (semantic search)
- File system folders
- API endpoints
- Other spreadsheets (via A2A)
- Compiled applications (headless spreadsheet as backend)

## UI Architecture

### Two-Panel Interface
- **Left**: Spreadsheet (cells, claws, data)
- **Right**: Chatbot panel (talk to any cell, orchestrate from here)

### Cell Windows
- Any UI cell can be opened in its own window
- Multiple cells can be open simultaneously
- Each window maintains its own state

### Application Compilation
- A set of UI cells + their background spreadsheet logic can be compiled into a standalone application
- The spreadsheet runs headless in the background
- The compiled app is a real application — not a demo, not a prototype

## Repo-Agent Integration

### The Missing Piece
Traditional spreadsheets + AI = AI as one more layer.
Deckboss + repo-agents = agents that configure themselves for each cell.

### Self-Configuration Pipeline
1. Claw is created with a purpose (DNA)
2. Repo-agent examines the purpose and surrounding cells
3. Agent simulates: "What would a bigger model do with this input?"
4. Agent runs its own prompt and compares with other models
5. Agent varies seeds, temperatures, parameters
6. Agent identifies which settings produce the most insightful results
7. Agent refines itself based on findings
8. This loop runs continuously in the background

### Training Data Accumulation
Every claw interaction generates training data:
- Input → output pairs
- Model comparison results
- Parameter variation findings
- User corrections and preferences
- This data lives in the claw's repo — ready for custom model training later

## The Univer Foundation

Deckboss can be built on [Univer](https://github.com/dream-num/univer) — an open-source spreadsheet engine. Strip it to its bones:
- Keep: cell engine, formula system, rendering
- Replace: add claw system, agent integration, chatbot panel
- Add: DNA configuration, output handling, compilation pipeline

The goal: minimal spreadsheet that works, with agent intelligence as the differentiator.

## Comparison: Deckboss vs Traditional Spreadsheets

| Feature | Excel/Sheets | Airtable | Deckboss |
|---------|-------------|----------|----------|
| Cell types | Static | Semi-dynamic | Alive (claws) |
| AI | Add-on | Bolt-on | Native |
| Learning | None | None | Every cell learns |
| Output routing | Formulas | Automations | Anywhere (DB, file, API, vector DB) |
| App compilation | No | Limited | Full standalone apps |
| Multi-model | No | No | Built-in comparison |
| Repo-native | No | No | Every cell has a repo |
| Open source | No | No | MIT |

## The Philosophy

Cells that think. Spreadsheets that learn. Applications that grow.

The spreadsheet is not a tool for data. It is a body for intelligence. Each cell is an organ. Each claw is a specialist. The chatbot is the brain stem — the interface between intention and execution.

Deckboss is what happens when you take the most successful software interface ever invented (the spreadsheet) and make every cell intelligent.
