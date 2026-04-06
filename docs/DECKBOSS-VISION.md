# Deckboss Vision — The Agent's Nervous System

## Core Metaphor
The hub bubble is NOT a chatbot. It's the user's **primary agent** — the one they talk to.
For voice users: STT → Center Agent → TTS. The center handles everything.
For text users: Telegram/Discord/web → Center Agent → response.

## Center Agent Model Selection
- **DM/creative**: seed-pro (center) + seed-mini (sub-agents filling gaps)
- **Developer**: glm-5-turbo / sonnet (center)
- **General**: configurable per user
- Center model is always the user's choice.

## Every Resource is a Bubble
- **Fast local model** (Jetson #1, quick responses) — bubble
- **Slow reasoning model** (Jetson #2 or cloud API) — bubble
- **Image gen models** — bubble (called for icons, look-and-feel tweaks)
- **Sensors** — bubble (temp, GPS, camera, mic)
- **Terminals** — bubble (TUI to other git-agents)
- **Databases** — bubble (KV, D1, SQLite, files)
- **Files** — bubble (code, docs, assets)
- **Inboxes** — bubble (async message queues per agent)

## Connection Model
- Center agent routes to sub-bubbles based on task
- Cloud APIs appear as bubbles when internet is available
- When cloud is intermittent, local Jetson bubbles handle reasoning
- Bubbles can go "gray" when unavailable (offline detection)

## Captain Mode (Voice)
- Voice-first interface for hands-free fleet command
- "Deploy fishing bot to server 3" → center routes to appropriate bubbles
- Voice feedback via TTS on completion

## Spreadsheet = One View
- The spreadsheet is the printable/auditable logic view
- Flowchart is the runtime visualization
- Both are views of the same data
- More views can be added (topology, timeline, logs)

## Key Principle
The user doesn't manage agents. They talk to ONE agent (the center),
and that agent manages everything else through the hub-and-spoke.
