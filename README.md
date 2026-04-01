# Deckboss.ai — Cellular Agent Spreadsheet

> *Every cell alive. Every cell learning. Every cell connected.*

## What It Is

A spreadsheet where cells are AI agents (claws). Each claw has a purpose (DNA), learns from experience, and connects to other cells, databases, and APIs. The chatbot panel orchestrates. UI cells compile into standalone applications.

## The Paradigm Shift

**Old way**: Spreadsheet → data → formulas → AI bolted on top
**Deckboss way**: Repo-agent first → agent configures itself for each cell → cell IS the agent

## Cell Types

- **Standard**: Everything a normal spreadsheet does (formulas, references, data)
- **Claws**: AI agents with DNA (input→output purpose), learning, output routing
- **Runtime**: Programs running in cells (terminals, processes)
- **UI**: Rendered interfaces that can be compiled into standalone apps

## Claw Features

- 🧬 **DNA**: Hardcoded input→output purpose at creation
- 🧠 **Learning**: Multi-model comparison, parameter variation, experience accumulation
- 📡 **Output routing**: To other cells, SQL DBs, vector DBs, files, APIs
- 🔧 **Output skills**: Keep recent, summarize, tally, recipe-book, cascade, archive
- 🔄 **Self-refinement**: Compare against bigger models, vary seeds/temps, log findings

## Architecture

Built on [Univer](https://github.com/dream-num/univer), stripped to essentials, agent intelligence as differentiator.

```
deckboss-ai/
├── docs/              # Specs, architecture, strategies
├── src/
│   ├── core/          # Cell engine, registry, lifecycle
│   ├── cells/         # Standard, Claw, Runtime, UI cells
│   ├── claws/         # DNA, learning loop, output skills
│   └── ui/            # Spreadsheet + chatbot panel
└── strategies/        # Agent synergy patterns
```

## Deploy

```bash
git clone https://github.com/Lucineer/deckboss-ai.git
cd deckboss-ai
npm install
npm run dev
```

## Status

📝 Architecture phase. Spec written. Multi-model expansion in progress.

## The Philosophy

The spreadsheet is not a tool for data. It is a body for intelligence. Each cell is an organ. Each claw is a specialist. The chatbot is the brain stem — the interface between intention and execution.

Author: Superinstance
