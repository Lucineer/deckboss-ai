/**
 * Deckboss.ai
 * src/core/cell-types.ts
 *
 * This module defines the rich cell type system for the Deckboss spreadsheet.
 * Each cell type has its own rendering logic, parsing, validation, and default value.
 * This allows for cells that are more than just static data, including interactive UI,
 * AI-powered content, and data visualizations.
 */

/**
 * Defines the structure for a rich cell type.
 */
export interface CellTypeDefinition {
  name: string;
  icon: string; // Icon identifier (e.g., for a UI library)
  description: string;
  category: 'standard' | 'ai' | 'code' | 'ui' | 'data' | 'simulation';
  render: (value: any) => string; // Returns an HTML/SVG string for the cell
  parse: (input: string) => any; // Converts user input string to the internal value
  validate: (value: any) => string | null; // Returns an error message string or null if valid
  default: any; // The default value for a new cell of this type
}

// A simple utility to escape HTML and prevent XSS.
// In a production app, a more robust library like DOMPurify would be used.
const escapeHtml = (unsafe: string): string => {
  if (typeof unsafe !== 'string') return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// --- Built-in Type Definitions ---

const STANDARD: CellTypeDefinition = {
  name: 'STANDARD',
  icon: 'text-size',
  description: 'A standard cell for text, numbers, or formulas.',
  category: 'standard',
  render: (value: any) => `<div class="cell-standard">${escapeHtml(String(value ?? ''))}</div>`,
  parse: (input: string) => {
    if (input.trim() === '') return '';
    const num = Number(input);
    return !isNaN(num) && isFinite(num) ? num : input;
  },
  validate: (_value: any) => null,
  default: '',
};

const CLAW: CellTypeDefinition = {
  name: 'CLAW',
  icon: 'sparkles',
  description: 'An AI-powered cell that generates content from a prompt.',
  category: 'ai',
  render: (value: { result: string; status: 'idle' | 'loading' | 'error' }) => {
    if (value.status === 'loading') return `<div class="cell-claw loading"><span></span>Thinking...</div>`;
    if (value.status === 'error') return `<div class="cell-claw error"><span>!</span>Error</div>`;
    return `<div class="cell-claw idle">✨ ${escapeHtml(value.result)}</div>`;
  },
  parse: (input: string) => ({ prompt: input }), // User input modifies the prompt
  validate: (value: { prompt: string }) => value.prompt ? null : 'Prompt cannot be empty.',
  default: { prompt: '', model: 'deckboss-v1', temperature: 0.7, result: '', status: 'idle' },
};

const RUNTIME: CellTypeDefinition = {
    name: 'RUNTIME',
    icon: 'code-bracket',
    description: 'Executes a script and displays the output.',
    category: 'code',
    render: (value: { output: any; status: 'running' | 'error' }) => {
        if (value.status === 'running') return `<div class="cell-runtime running"><span></span>Running...</div>`;
        if (value.status === 'error') return `<div class="cell-runtime error"><span>!</span>Execution Error</div>`;
        const outputStr = JSON.stringify(value.output);
        return `<div class="cell-runtime idle"><code>&gt; ${escapeHtml(outputStr)}</code></div>`;
    },
    parse: (input: string) => ({ code: input }), // User input modifies the code
    validate: (value: { code: string }) => value.code ? null : 'Code cannot be empty.',
    default: { code: 'return 1;', inputBindings: {}, output: null, lastRun: null, status: 'idle' },
};

const UI_BUTTON: CellTypeDefinition = {
    name: 'UI_BUTTON',
    icon: 'cursor-arrow-rays',
    description: 'An interactive button that can trigger actions.',
    category: 'ui',
    render: (value: { label: string }) => `<button class="cell-ui-button">${escapeHtml(value.label)}</button>`,
    parse: (input: string) => ({ label: input }),
    validate: (value: { label: string }) => value.label ? null : 'Button label is required.',
    default: { label: 'Click Me' },
};

const UI_SLIDER: CellTypeDefinition = {
    name: 'UI_SLIDER',
    icon: 'adjustments-horizontal',
    description: 'A slider to select a value within a range.',
    category: 'ui',
    render: (value: { min: number; max: number; step: number; value: number }) => `
        <div class="cell-ui-slider-container">
            <input type="range" min="${value.min}" max="${value.max}" step="${value.step}" value="${value.value}" class="cell-ui-slider">
            <span>${value.value}</span>
        </div>`,
    parse: (input: string) => ({ value: parseFloat(input) || 0 }),
    validate: (v: { value: number; min: number; max: number }) => (v.value >= v.min && v.value <= v.max) ? null : 'Value out of range.',
    default: { min: 0, max: 100, step: 1, value: 50 },
};

const UI_DROPDOWN: CellTypeDefinition = {
    name: 'UI_DROPDOWN',
    icon: 'chevron-down',
    description: 'A dropdown menu to select an option.',
    category: 'ui',
    render: (value: { options: string[]; selected: string }) => {
        const optionsHtml = value.options.map(opt =>
            `<option value="${escapeHtml(opt)}" ${opt === value.selected ? 'selected' : ''}>${escapeHtml(opt)}</option>`
        ).join('');
        return `<select class="cell-ui-dropdown">${optionsHtml}</select>`;
    },
    parse: (input: string) => ({ selected: input }),
    validate: (v: { options: string[]; selected: string }) => v.options.includes(v.selected) ? null : 'Invalid selection.',
    default: { options: ['Option 1', 'Option 2'], selected: 'Option 1' },
};

const UI_TOGGLE: CellTypeDefinition = {
    name: 'UI_TOGGLE',
    icon: 'switch-horizontal',
    description: 'A toggle switch for boolean values.',
    category: 'ui',
    render: (value: boolean) => `
        <label class="cell-ui-toggle">
            <input type="checkbox" ${value ? 'checked' : ''} onclick="return false;">
            <span class="slider"></span>
        </label>`,
    parse: (input: string) => input.toLowerCase() === 'true',
    validate: (v: any) => typeof v === 'boolean' ? null : 'Must be a boolean.',
    default: false,
};

const UI_COLOR: CellTypeDefinition = {
    name: 'UI_COLOR',
    icon: 'swatch',
    description: 'A color picker.',
    category: 'ui',
    render: (value: string) => `<input type="color" class="cell-ui-color" value="${escapeHtml(value)}">`,
    parse: (input: string) => input,

};

export const CELL_TYPES: CellTypeDefinition[] = [STANDARD, CLAW, RUNTIME, UI_BUTTON, UI_SLIDER, UI_DROPDOWN, UI_TOGGLE, UI_COLOR];

