/**
 * @file src/core/conditional-format.ts
 * @description Manages conditional formatting rules for spreadsheet cells in Deckboss.ai.
 */

/**
 * Defines the visual formatting to be applied to a cell.
 */
export interface CellFormat {
  backgroundColor?: string;
  textColor?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  fontSize?: number;
  border?: string;
  icon?: string;
}

/**
 * Represents a single condition within a formatting rule.
 */
export interface Condition {
  type: 'greater' | 'less' | 'equal' | 'not-equal' | 'contains' | 'blank' | 'not-blank' | 'text-length' | 'duplicate' | 'formula' | 'above-average' | 'below-average' | 'top-10-percent';
  value: any;
  operator?: 'and' | 'or'; // How this condition combines with the next one. Defaults to 'and'.
}

/**
 * Represents a complete conditional formatting rule.
 */
export interface FormatRule {
  id: string;
  name: string;
  range: string; // e.g., "A1:B10", "C:C"
  conditions: Condition[];
  format: CellFormat;
  priority: number; // Lower number means higher priority.
  active: boolean;
}

/**
 * Context passed to the evaluate method for complex conditions.
 */
export interface EvaluationContext {
  /**
   * A function that returns all values for a given range.
   * Required for conditions like 'duplicate', 'above-average', etc.
   */
  getRangeValues: (range: string) => any[];
}

/**
 * Manages the creation, evaluation, and storage of conditional formatting rules.
 */
export class ConditionalFormat {
  private rules = new Map<string, FormatRule>();

  private static presets: Record<string, Omit<FormatRule, 'id' | 'priority' | 'active' | 'range' | 'name'>> = {
    'Highlight Duplicates': {
      conditions: [{ type: 'duplicate', value: true }],
      format: { backgroundColor: '#FFC7CE', textColor: '#9C0006' },
    },
    'Text Contains': {
      conditions: [{ type: 'contains', value: 'Example' }],
      format: { backgroundColor: '#FFEB9C', textColor: '#9C6500' },
    },
    'Above Average': {
      conditions: [{ type: 'above-average', value: null }],
      format: { backgroundColor: '#C6EFCE', textColor: '#006100' },
    },
    'Below Average': {
      conditions: [{ type: 'below-average', value: null }],
      format: { backgroundColor: '#FFC7CE', textColor: '#9C0006' },
    },
    'Top 10%': {
      conditions: [{ type: 'top-10-percent', value: null }],
      format: { bold: true, textColor: '#006100' },
    },
    'Red-Yellow-Green (Green)': {
      conditions: [{ type: 'greater', value: 80 }],
      format: { backgroundColor: '#C6EFCE', textColor: '#006100' },
    },
    'Red-Yellow-Green (Yellow)': {
      conditions: [{ type: 'greater', value: