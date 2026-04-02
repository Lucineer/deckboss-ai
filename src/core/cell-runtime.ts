// cell-runtime.ts

export interface CellExecution {
  cellRef: string;
  type: string;
  output: any;
  error?: string;
  duration: number;
  ts: number;
}

export interface ClawConfig {
  provider: 'openai' | 'anthropic';
  apiKey: string;
  baseUrl: string;
  model: string;
  maxTokens?: number;
}

export interface RuntimeConfig {
  sandboxed: boolean;
}

export interface UIConfig {
  style: 'dark' | 'light';
}

export interface TwinConfig {
  sourceName: string;
  personalityTraits: string[];
  accuracy: number;
}

export interface GateConfig {
  url: string;
  method: string;
  headers?: Record<string, string>;
  bodyTemplate?: string;
}

type CellConfig = ClawConfig | RuntimeConfig | UIConfig | TwinConfig | GateConfig;

export class CellRuntime {
  private history: Map<string, CellExecution[]> = new Map();

  async execute(cellRef: string, type: string, input: any, config: CellConfig): Promise<CellExecution> {
    const start = Date.now();
    let output: any = null;

    try {
      switch (type) {
        case 'standard':
          output = input;
          break;
        case 'claw':
          output = await this.runClaw(String(input), config as ClawConfig);
          break;
        case 'runtime':
          output = await this.runRuntime(String(input), config as RuntimeConfig);
          break;
        case 'ui':
          output = this.compileUI(input, config as UIConfig);
          break;
        case 'twin':
          output = await this.runTwin(String(input), config as TwinConfig);
          break;
        case 'gate':
          output = await this.runGate(input, config as GateConfig);
          break;
        default:
          output = input;
      }

      const execution: CellExecution = {
        cellRef,
        type,
        output,
        duration: Date.now() - start,
        ts: Date.now()
      };

      this.recordHistory(execution);
      return execution;

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      
      const execution: CellExecution = {
        cellRef,
        type,
        output: null,
        error: errorMessage,
        duration: Date.now() - start,
        ts: Date.now()
      };

      this.recordHistory(execution);
      return execution;
    }
  }

  private recordHistory(execution: CellExecution): void {
    const cellHistory = this.history.get(execution.cellRef) || [];
    cellHistory.push(execution);
    this.history.set(execution.cellRef, cellHistory);
  }

  private async runClaw(input: string, config: ClawConfig): Promise<string> {
    if (!config.apiKey) {
      throw new Error('Claw cell requires an API key.');
    }
    if (!config.model) {
      throw new Error('Claw cell requires a model definition.');
    }

    const maxTokens = config.maxTokens || 1024;

    if (config.provider === 'anthropic') {
      return this.callAnthropic(input, config, maxTokens);
    }
    
    return this.callOpenAI(input, config, maxTokens);
  }

  private async callOpenAI(input: string, config: ClawConfig, maxTokens: number): Promise<string> {
    const url = `${config.baseUrl}/chat/completions`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: input }],
        max_tokens: maxTokens
      })
    });

    if (!resp.ok) {
      throw new Error(`OpenAI API error: ${resp.status} ${await resp.text()}`);
    }

    const data = await resp.json();
    return data.choices?.[0]?.message?.content?.trim() || 'No response';
  }

  private async callAnthropic(input: string, config: ClawConfig, maxTokens: number): Promise<string> {
    const url = `${config.baseUrl}/messages`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: input }]
      })
    });

    if (!resp.ok) {
      throw new Error(`Anthropic API error: ${resp.status} ${await resp.text()}`);
    }

    const data = await resp.json();
    return data.content?.[0]?.text?.trim() || 'No response';
  }

  private async runRuntime(input: string, config: RuntimeConfig): Promise<any> {
    if (!config.sandboxed) {
      throw new Error('Runtime cell execution is not permitted outside the sandbox.');
    }
    
    try {
      const fn = new Function('input', `"use strict"; return (${input});`);
      return fn(input);
    } catch (err) {
      throw new Error(`Runtime execution failed: ${(err as Error).message}`);
    }
  }

  private compileUI(input: any, config: UIConfig): string {
    if (!input || typeof input !== 'object') {
      throw new Error('UI cell requires valid object input to compile.');
    }

    const type = input.type || 'card';
    const data = input.data || {};
    const style = config.style || 'dark';

    const attrs = `class="cell-ui cell-${type}" data-style="${style}"`;
    const content = JSON.stringify(data, null, 2);

    return `<div ${attrs}>${content}</div>`;
  }

  private async runTwin(input: string, config: TwinConfig): Promise<{response: string; confidence: number}> {
    if (!config.sourceName) {
      throw new Error('Twin cell requires a sourceName.');
    }

    const traits = config.personalityTraits || [];
    const confidence = config.accuracy || 0.5;
    
    // Simulate personality-driven response modification
    let prefix = '';
    if (traits.includes('formal')) prefix = 'Indeed, ';
    else if (traits.includes('casual')) prefix = 'Oh totally, ';
    else if (traits.includes('analytical')) prefix = 'Based on the data, ';

    const response = `As ${config.sourceName}, I would say: ${prefix}${input}`;
    return { response, confidence };
  }

  private async runGate(input: any, config: GateConfig): Promise<any> {
    if (!config.url) {
      throw new Error('Gate cell requires a target URL.');
    }

    let body: string | undefined;
    if (config.bodyTemplate) {
      try {
        // Safely substitute input into the template string
        body = config.bodyTemplate.replace(/\{\{\s*input\s*\}\}/g, JSON.stringify(input));
      } catch (err) {
        throw new Error('Failed to parse Gate body template.');
      }
    } else {
      body = JSON.stringify(input);
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(config.headers || {})
    };

    const resp = await fetch(config.url, {
      method: config.method || 'POST',
      headers,
      body
    });

    if (!resp.ok) {
      throw new Error(`Gate network error: ${resp.status} ${await resp.text()}`);
    }

    try {
      return await resp.json();
    } catch {
      // Fallback for non-JSON responses (e.g., plain text)
      return { rawResponse: await resp.text() };
    }
  }

  getHistory(cellRef?: string): CellExecution[] {
    if (cellRef) {
      return this.history.get(cellRef) || [];
    }
    return [...this.history.values()].flat();
  }

  clearHistory(cellRef?: string): void {
    if (cellRef) {
      this.history.delete(cellRef);
    } else {
      this.history.clear();
    }
  }
}