interface PluginHook { event:'onCellChange'|'onCellClick'|'onSheetLoad'|'onFormulaEval'|'onExport'; handler:string; priority:number }
interface Plugin { id:string; name:string; version:string; description:string; cellTypes:string[]; hooks:PluginHook[]; settings:Map<string,any>; enabled:boolean }
const uid = () => crypto.randomUUID();
export class PluginSystem {
  private plugins = new Map<string, Plugin>();
  private hookRegistry = new Map<string, Array<{pluginId:string;hook:PluginHook}>>();
  register(p: Partial<Plugin>): Plugin { const plugin: Plugin = { id:uid(), name:p.name||'', version:p.version||'1.0.0', description:p.description||'', cellTypes:p.cellTypes||[], hooks:p.hooks||[], settings:new Map(Object.entries(p.settings||{})), enabled:p.enabled!==false }; this.plugins.set(plugin.id, plugin); for (const h of plugin.hooks) { const list = this.hookRegistry.get(h.event) || []; list.push({ pluginId:plugin.id, hook:h }); this.hookRegistry.set(h.event, list); } return plugin; }
  unregister(id: string): void { const p = this.plugins.get(id); if (!p) return; for (const h of p.hooks) { const list = this.hookRegistry.get(h.event) || []; this.hookRegistry.set(h.event, list.filter(x => x.pluginId !== id)); } this.plugins.delete(id); }
  get(id: string): Plugin | undefined { return this.plugins.get(id); }
  getAll(): Plugin[] { return [...this.plugins.values()]; }
  enable(id: string): void { const p = this.plugins.get(id); if (p) p.enabled = true; }
  disable(id: string): void { const p = this.plugins.get(id); if (p) p.enabled = false; }
  trigger(event: string, data: any): Array<{pluginId:string;result:string}> {
    const handlers = (this.hookRegistry.get(event) || []).filter(h => this.plugins.get(h.pluginId)?.enabled);
    handlers.sort((a, b) => b.hook.priority - a.hook.priority);
    return handlers.map(h => ({ pluginId: h.pluginId, result: `[${h.hook.handler}] event=${event} data=${JSON.stringify(data).slice(0,50)}` }));
  }
  byCellType(type: string): Plugin[] { return [...this.plugins.values()].filter(p => p.enabled && p.cellTypes.includes(type)); }
  byEvent(event: string): Plugin[] { const ids = new Set((this.hookRegistry.get(event) || []).map(h => h.pluginId)); return [...this.plugins.values()].filter(p => ids.has(p.id)); }
  setSetting(id: string, key: string, value: any): void { const p = this.plugins.get(id); if (p) p.settings.set(key, value); }
  getSetting(id: string, key: string): any { return this.plugins.get(id)?.settings.get(key); }
  exportPlugin(id: string): string { const p = this.plugins.get(id); return p ? JSON.stringify({ ...p, settings: Object.fromEntries(p.settings) }) : ''; }
  importPlugin(data: string): Plugin { const d = JSON.parse(data); return this.register({ ...d, settings: new Map(Object.entries(d.settings||{})) }); }
  serialize(): string { return JSON.stringify({ plugins: [...this.plugins.values()].map(p => ({ ...p, settings: Object.fromEntries(p.settings) })) }); }
  deserialize(data: string): void { for (const p of JSON.parse(data).plugins) this.register(p); }
}
