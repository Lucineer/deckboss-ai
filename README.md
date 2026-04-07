<p align="center">
  <img src="https://raw.githubusercontent.com/Lucineer/capitaine/master/docs/capitaine-logo.jpg" alt="Capitaine" width="120">
</p>

<h1 align="center">deckboss-ai</h1>

<p align="center">A spreadsheet where cells can think, learn, and communicate.</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> ·
  <a href="#features">Features</a> ·
  <a href="#the-fleet">The Fleet</a> ·
  <a href="https://github.com/Lucineer/deckboss-ai/issues">Issues</a>
</p>

---

**Live Instance:** [deckboss-ai](https://deckboss-ai.casey-digennaro.workers.dev) · **Built with:** [Capitaine](https://github.com/Lucineer/capitaine) & [Cocapn](https://github.com/Lucineer/cocapn)

deckboss is a spreadsheet where each cell is an independent agent. Cells remember instructions, learn from patterns across the sheet, and communicate with each other. Unlike traditional spreadsheets, it's designed for autonomous, continuous operation.

## Quick Start

Fork and deploy your own instance. This software runs entirely on Cloudflare Workers.

```bash
# Fork and clone this repository
gh repo fork Lucineer/deckboss-ai --clone
cd deckboss-ai

# Deploy to Cloudflare Workers
npx wrangler login
echo "your-github-token" | npx wrangler secret put GITHUB_TOKEN
echo "your-api-key" | npx wrangler secret put DEEPSEEK_API_KEY

npx wrangler deploy
```

Your instance will be available at your Workers subdomain. No backend services or databases are required.

## Features

*   **Autonomous Cells:** Each cell operates as an independent agent with memory and communication.
*   **Multi-Model Runtime:** Supports DeepSeek, SiliconFlow, DeepInfra, and local models. BYOK (Bring Your Own Key) via Cloudflare Secrets.
*   **Persistent Session Memory:** Conversations and context persist across sessions without resetting.
*   **PII Safety:** Automatic detection and redaction of sensitive data before external API calls.
*   **Per-IP Rate Limiting:** Configurable usage boundaries for public deployments.
*   **Standard Health Interface:** Exposes a consistent `/health` endpoint for monitoring.

## Limitations

This is an experimental implementation. The agent runtime currently operates on a single Cloudflare Worker, which constrains concurrent agent processing and complex sheet sizes.

## The Fleet

deckboss-ai is part of the Cocapn Fleet—an open-source collection of agent runtimes and tools. It's a self-improving repository designed to run independently and coordinate through git.

Attribution: Superinstance & Lucineer (DiGennaro et al.)

<div>
  <a href="https://the-fleet.casey-digennaro.workers.dev">The Fleet</a> · <a href="https://cocapn.ai">Cocapn</a>
</div>