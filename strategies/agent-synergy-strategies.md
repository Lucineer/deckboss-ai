# Agent Synergy Strategies

Strategies for using multiple AI agents/roles to produce better outputs than any single agent could alone.

## The Four Personas

### 1. The Devil's Advocate
**Best model**: DeepSeek Chat (contrarian, opinionated, cost-effective)
**Temperature**: 0.5-0.7
**When to use**: After any agent produces a design, architecture, or plan
**Method**: Feed the output to DeepSeek with the instruction "Find the fatal flaws. Be brutal."
**What it produces**: Weaknesses, edge cases, assumptions, blind spots
**Key insight**: DeepSeek Chat is naturally contrarian. It finds problems other models miss because it doesn't try to be helpful — it tries to be right.

### 2. The Socratic Teacher
**Best model**: DeepSeek Reasoner (deep thinking) or Gemini 2.5 Pro (philosophical depth)
**Temperature**: 0.8-0.95
**When to use**: To flesh out ideas, make them more durable, find philosophical foundations
**Method**: "Socratically examine this claim. Ask questions that reveal deeper assumptions."
**What it produces**: Stronger arguments, philosophical grounding, unresolved questions that deepen thinking
**Key insight**: The Socratic method doesn't answer — it questions. This forces the original idea to defend itself, which makes it stronger.

### 3. The Helpful Assistant
**Best model**: Gemini 3.1 Pro (structured, thorough) or GLM-5.1 (good at building)
**Temperature**: 0.3-0.5
**When to use**: For actual implementation, architecture docs, code generation
**Method**: Direct, specific prompts. "Design X. Include pseudocode. Be concrete."
**What it produces**: Working artifacts, complete docs, actionable code
**Key insight**: Low temperature = fewer surprises = more reliable output. Use this for production work.

### 4. The Bright Young (The Why Machine)
**Best model**: Gemini 2.5 Pro at high temp (0.95) or DeepSeek Chat
**Temperature**: 0.9-1.0
**When to use**: When the mature builder is too focused on production to see alternatives
**Method**: "You don't understand anything about this domain. Keep asking 'why?' until you find something interesting."
**What it produces**: Unexpected angles, naive questions that reveal hidden assumptions, fresh perspectives
**Key insight**: The bright young doesn't know what's obvious. That's the point. Obvious things are often wrong.

## Synergy Patterns

### Pattern 1: Build → Break → Fix
1. Helpful Assistant builds something (architecture, code, plan)
2. Devil's Advocate breaks it (finds flaws)
3. Helpful Assistant fixes it (incorporates criticism)
**Result**: More robust than anything built by a single agent

### Pattern 2: Think → Question → Deepen
1. Helpful Assistant produces a concept
2. Socratic Teacher questions it
3. Gemini 2.5 Pro at high temp explores the questions
**Result**: Philosophically grounded, durable ideas

### Pattern 3: Build → Why → Pivot
1. Mature builder (Gemini 3.1, low temp) focuses on production
2. Bright Young (Gemini 2.5, high temp) keeps asking "why this way?"
3. If the why holds up → proceed. If not → pivot.
**Result**: Production-ready work that isn't trapped in obvious assumptions

### Pattern 4: Multi-Model Simulate → Pick Best
1. Run the same prompt through 3-4 models with different temps
2. Output limit: short per model (1000-2000 tokens each)
3. Pick the output going in the most insightful or universal direction
4. Feed that direction to the Helpful Assistant for full expansion
**Result**: The best idea from 4 perspectives, then fully developed

### Pattern 5: Audit → Synthesize
1. Two different models audit the same thing independently
2. If they agree → that finding is solid (high confidence)
3. If they disagree → third model (DeepSeek Reasoner) investigates
**Result**: Triangulated truth with known confidence levels

## Model Routing Guide

| Task | Primary | Secondary | Why |
|------|---------|-----------|-----|
| Architecture | Gemini 3.1 Pro | GLM-5.1 | Structured, thorough |
| Philosophy | Gemini 2.5 Pro | DeepSeek Reasoner | Deep thinking, patient |
| Code gen | GLM-5.1 | Gemini 3.1 Pro | GLM builds fast, Gemini catches bugs |
| Devil's advocate | DeepSeek Chat | — | Naturally contrarian |
| Socratic | DeepSeek Reasoner | Gemini 2.5 Pro | Deep reasoning or philosophical depth |
| Creative | Gemini 2.5 Pro (0.95) | — | High temp = surprising connections |
| Practical | DeepSeek Chat | — | Grounded, opinionated |
| Audit | Gemini 3.1 Pro + GLM-5.1 | DeepSeek Reasoner (synthesis) | Independent + triangulation |
| Image gen | Gemini 2.5 Flash Image | — | Fast, good quality |

## Temperature Guide

| Temp | Effect | Best For |
|------|--------|----------|
| 0.2-0.4 | Safe, structured, predictable | Architecture, code, specs |
| 0.5-0.7 | Balanced, some creativity | Analysis, comparison, practical writing |
| 0.8-0.9 | Creative, surprising, occasionally wrong | Philosophy, brainstorming, exploration |
| 0.95-1.0 | Wild, unexpected, often brilliant or garbage | The Bright Young, naive exploration |

## The Key Insight

Multiple agents working in parallel produce better results than one agent working longer. The reason is not that more compute = better. It's that different models have different blind spots. Gemini 3.1 Pro is thorough but safe. DeepSeek Chat is opinionated but shallow. Gemini 2.5 Pro at high temp is creative but unreliable. DeepSeek Reasoner is deep but slow.

The synergy happens at the intersection of their blind spots. Where Gemini misses a flaw, DeepSeek finds it. Where DeepSeek is shallow, the Socratic method deepens it. Where both are wrong, the Bright Young asks "why?" and finds the pivot.

**The rule: never trust a single model's output on important decisions. Run it through at least one other model with a different persona.**
