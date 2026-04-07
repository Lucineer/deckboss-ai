# deckboss-ai

A dynamic spreadsheet where each cell operates as an independent, stateful agent. You provide instructions. The agents remember, collaborate, and build the sheet for you.

**Live Instance:** [deckboss-ai.casey-digennaro.workers.dev](https://deckboss-ai.casey-digennaro.workers.dev)
**License:** MIT • **Stack:** Cloudflare Workers, zero dependencies

## Why This Exists
Modern spreadsheets still require you to define every formula and relationship. This project flips that model. Set the goal once. The agents within the cells work to fulfill it, communicating and updating autonomously.

## Quick Start
Fork this repository to deploy your own private instance. Your data and API keys remain on your Cloudflare account.

```bash
# 1. Fork and clone the repository
gh repo fork Lucineer/deckboss-ai --clone
cd deckboss-ai

# 2. Deploy to Cloudflare Workers
npx wrangler login
# Store your GitHub token (for syncing) and AI provider API key
echo "YOUR_GH_TOKEN" | npx wrangler secret put GITHUB_TOKEN
echo "YOUR_API_KEY" | npx wrangler secret put DEEPSEEK_API_KEY

# 3. Deploy
npx wrangler deploy
```

Your instance will be live at your `.workers.dev` subdomain. It runs entirely within a single Cloudflare Worker with no external databases or services.

## How It Works
A central coordinator agent manages a grid of independent cell agents. Each cell maintains its own persistent memory in Cloudflare KV, can receive instructions, and can message other cells. The entire system is contained within one Worker.

## Features
*   **Autonomous Cells**: Each cell agent operates independently with persistent memory and can communicate across the sheet.
*   **Multi-Model Runtime**: Configure it to use DeepSeek, SiliconFlow, DeepInfra, or other compatible API endpoints. Keys are stored in Cloudflare Secrets.
*   **Persistent Sessions**: Agent state is saved. Work resumes exactly where it left off, even after days.
*   **PII Safety**: Outgoing prompts are scanned for sensitive patterns like emails or keys before leaving your Worker.
*   **Built-in Rate Limiting**: Requests are limited per IP address, allowing safer public sharing.
*   **Health Endpoint**: A standard `/health` endpoint is provided for monitoring.
*   **Pre-configured Agents**: Includes 16 starter agents for tasks like coding assistance, research, tutoring, and journaling.

## What Makes This Different
1.  It is not an add-on for existing spreadsheets. It's a standalone application rethinking the spreadsheet paradigm around agents.
2.  There is no central managed service. You fork and deploy the code yourself; we have no access to your data or instance.
3.  Agents operate continuously in the background, not just in response to a single user action.

## Limitations
This is an early-stage experiment. All agents run on a single Cloudflare Worker, which imposes concrete constraints: a sheet is currently limited to **100 cells** and can run **up to 30 concurrent agent tasks** before queuing. Performance scales with your Worker's resources.

---
*Superinstance and Lucineer (DiGennaro et al.)*

<div style="text-align:center;padding:16px;color:#64748b;font-size:.8rem"><a href="https://the-fleet.casey-digennaro.workers.dev" style="color:#64748b">The Fleet</a> &middot; <a href="https://cocapn.ai" style="color:#64748b">Cocapn</a></div>