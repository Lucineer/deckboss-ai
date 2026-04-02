/**
 * @file src/core/conditional-format.ts
 * @description Manages conditional formatting rules for spreadsheet cells in Deckboss.ai.
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

export interface Condition {
  type: 'greater' | 'less' | 'equal' | 'not-equal' | 'contains' | 'blank' | 'not-blank' | 'text-length' | 'duplicate' | 'formula' | 'above-average' | 'below-average' | 'top-10-percent';
  value: any;
  operator?: 'and' | 'or';
}

export interface FormatRule {
  id: string;
  name: string;
  range: string;
  conditions: Condition[];
  format: CellFormat;
  priority: number;
  active: boolean;
}

export interface EvaluationContext {
  getRangeValues: (range: string) => any[];
}

export class ConditionalFormat {
  private rules = new Map<string, FormatRule>();

  addRule(rule: FormatRule): void { this.rules.set(rule.id, rule); }
  getRule(id: string): FormatRule | undefined { return this.rules.get(id); }
  getAllRules(): FormatRule[] { return [...this.rules.values()].sort((a, b) => a.priority - b.priority); }
  deleteRule(id: string): boolean { return this.rules.delete(id); }

  evaluate(cellValue: any, context?: EvaluationContext): CellFormat | null {
    for (const rule of this.getAllRules()) {
      if (!rule.active) continue;
      if (this.evaluateConditions(cellValue, rule.conditions, context)) {
        return rule.format;
      }
    }
    return null;
  }

  private evaluateConditions(value: any, conditions: Condition[], context?: EvaluationContext): boolean {
    return conditions.every(cond => {
      switch (cond.type) {
        case 'greater': return typeof value === 'number' && value > cond.value;
        case 'less': return typeof value === 'number' && value < cond.value;
        case 'equal': return value === cond.value;
        case 'not-equal': return value !== cond.value;
        case 'contains': return typeof value === 'string' && value.includes(cond.value);
        case 'blank': return value === null || value === undefined || value === '';
        case 'not-blank': return value !== null && value !== undefined && value !== '';
        default: return false;
      }
    });
  }
}
