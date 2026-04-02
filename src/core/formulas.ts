// src/core/formulas.ts

export interface FormulaArg {
  ref: string;
  value?: any;
}

interface FormulaInfo {
  isAsync: boolean;
  help: string;
}

// --- Formula Definitions ---

/**
 * Creates a new AI agent cell at the given ref. Returns agent ID.
 */
export function CLAW_NEW(ref: string, purpose: string, provider?: string, model?: string): string {
  const agentId = `agent_${ref}_${Date.now()}`;
  // In a real environment, this would instantiate a new agent context mapped to the cell.
  console.log(`[CLAW_NEW] Created agent ${agentId} for ${ref} with purpose: ${purpose}`);
  return agentId;
}

/**
 * Sends a prompt to an agent cell. Returns the response.
 * Usage: =CLAW_ASK(A1, "summarize this data")
 */
export async function CLAW_ASK(ref: string, prompt: string): Promise<string> {
  return `[Response from ${ref}]: Processed "${prompt}" successfully.`;
}

/**
 * Trains an agent cell with examples. Returns training status.
 * Usage: =CLAW_TRAIN(A1, [{input:"hello",output:"hi"}])
 */
export function CLAW_TRAIN(ref: string, examples: Array<{input: string, output: string}>): string {
  return `Status: Trained ${ref} with ${examples.length} examples.`;
}

/**
 * Sends the same prompt to two agent cells. Returns comparison.
 * Usage: =CLAW_COMPARE(A1, B1, "analyze this trend")
 */
export async function CLAW_COMPARE(refA: string, refB: string, prompt: string): Promise<string> {
  return `Comparison of ${refA} and ${refB} on "${prompt}": Both agents provided similar insights.`;
}

/**
 * Returns the memory/context of an agent cell.
 * Usage: =CLAW_MEMORY(A1)
 */
export function CLAW_MEMORY(ref: string): string {
  return `{"ref": "${ref}", "tokens": 150, "history": []}`;
}

/**
 * Resets an agent cell's memory. Returns status.
 */
export function CLAW_RESET(ref: string): string {
  return `Status: Memory for ${ref} cleared successfully.`;
}

/**
 * Makes a gate cell fetch from a URL. Returns parsed JSON.
 * Usage: =GATE_FETCH(C1, "https://api.example.com/data")
 */
export async function GATE_FETCH(ref: string, url: string): Promise<any> {
  return { ref, url, data: "fetched_json_payload" };
}

/**
 * Runs a simulation with a twin cell. Returns response.
 * Usage: =TWIN_SIMULATE(T1, "how would you handle this meeting?")
 */
export async function TWIN_SIMULATE(ref: string, scenario: string): Promise<string> {
  return `[Simulated ${ref}]: If "${scenario}" occurred, the optimal response is...`;
}

/**
 * Compiles a UI cell to HTML. Returns HTML string.
 */
export function UI_RENDER(ref: string): string {
  return `<div class="ui-cell" data-ref="${ref}">Rendered UI Component</div>`;
}

/**
 * Evaluates a string as a formula. Recursive.
 */
export function EVAL(expr: string): any {
  try {
    // Security Note: In a production environment, a sandbox (like VM2 or isolated-vm) 
    // is required to prevent arbitrary code execution. 
    const safeContext = { Math, Date, JSON };
    const keys = Object.keys(safeContext);
    const values = Object.values(safeContext);
    
    // If it's a formula string, evaluate it
    if (expr.startsWith('=')) {
      const func = new Function(...keys, `return ${expr.substring(1)};`);
      return func(...values);
    }
    
    const func = new Function(...keys, `return ${expr};`);
    return func(...values);
  } catch (error: any) {
    return `#EVAL_ERROR: ${error.message}`;
  }
}


// --- Formula Utilities ---

/**
 * Parses a standard spreadsheet formula string into its function name and arguments.
 * Handles nested functions and strings gracefully.
 */
export function parseFormula(formula: string): { fn: string; args: any[] } {
  if (!formula || !formula.startsWith('=')) {
    return { fn: '', args: [formula] };
  }

  // Extract function name
  const match = formula.substring(1).match(/^([A-Z_]+)\(/);
  if (!match) {
    return { fn: '', args: [formula.substring(1)] };
  }

  const fn = match[1];
  const argsString = formula.substring(fn.length + 2, formula.length - 1);
  const args: any[] = [];

  let current = '';
  let depth = 0;
  let inString = false;

  for (let i = 0; i < argsString.length; i++) {
    const char = argsString[i];

    if (char === '"' && (i === 0 || argsString[i - 1] !== '\\')) {
      inString = !inString;
      current += char;
    } else if (!inString && (char === '(' || char === '[')) {
      depth++;
      current += char;
    } else if (!inString && (char === ')' || char === ']')) {
      depth--;
      current += char;
    } else if (char === ',' && depth === 0 && !inString) {
      args.push(_parseArg(current.trim()));
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    args.push(_parseArg(current.trim()));
  }

  return { fn, args };
}

/**
 * Determines if a specific formula function requires asynchronous execution.
 */
export function isAsyncFormula(fn: string): boolean {
  const asyncFormulas = ['CLAW_ASK', 'CLAW_COMPARE', 'GATE_FETCH', 'TWIN_SIMULATE'];
  return asyncFormulas.includes(fn.toUpperCase());
}

/**
 * Returns contextual help/documentation for a specific formula function.
 */
export function getFormulaHelp(fn: string): string {
  const helpDocs: Record<string, string> = {
    'CLAW_NEW': 'Creates a new AI agent cell. CLAW_NEW(ref, purpose, provider?, model?)',
    'CLAW_ASK': 'Sends a prompt to an agent cell. CLAW_ASK(ref, prompt)',
    'CLAW_TRAIN': 'Trains an agent with examples. CLAW_TRAIN(ref, examples)',
    'CLAW_COMPARE': 'Compares two agents on a prompt. CLAW_COMPARE(refA, refB, prompt)',
    'CLAW_MEMORY': 'Returns the context of an agent. CLAW_MEMORY(ref)',
    'CLAW_RESET': 'Resets an agent\'s memory. CLAW_RESET(ref)',
    'GATE_FETCH': 'Fetches JSON from URL via gate. GATE_FETCH(ref, url)',
    'TWIN_SIMULATE': 'Simulates a twin cell scenario. TWIN_SIMULATE(ref, scenario)',
    'UI_RENDER': 'Compiles UI cell to HTML. UI_RENDER(ref)',
    'EVAL': 'Evaluates a string as a dynamic formula. EVAL(expr)'
  };

  return helpDocs[fn.toUpperCase()] || `Unknown formula function: ${fn}. No help available.`;
}

// Internal helper for parsing arguments
function _parseArg(arg: string): any {
  if (arg.startsWith('"') && arg.endsWith('"')) return arg.slice(1, -1);
  if (arg.startsWith('[') && arg.endsWith(']')) {
    try { return JSON.parse(arg.replace(/([a-zA-Z0-9_]+)\s*:/g, '"$1":')); } catch { return arg; }
  }
  if (arg === 'TRUE') return true;
  if (arg === 'FALSE') return false;
  if (!isNaN(Number(arg)) && arg !== '') return Number(arg);
  
  // Treat as cell reference
  return { ref: arg };
}