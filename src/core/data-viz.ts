interface ChartData { label: string; value: number; values?: number[]; color?: string }
interface Config { type: string; title?: string; data: ChartData[]; width?: number; height?: number; showLabels?: boolean; showLegend?: boolean }
const C = ['#4F46E5','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#06B6D4','#84CC16'];

export class DataViz {
  private c(i: number): string { return C[i % C.length]; }
  render(cfg: Config): string {
    const w = cfg.width || 400, h = cfg.height || 300;
    const svg = (inner: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${cfg.title ? `<text x="${w/2}" y="20" text-anchor="middle" font-size="14" font-weight="bold">${cfg.title}</text>` : ''}${inner}</svg>`;
    const fn: Record<string, (c: Config) => string> = { bar: this.bar, line: this.line, pie: this.pie, donut: this.donut, area: this.area, scatter: this.scatter, radar: this.radar, heatmap: this.heatmap, gauge: this.gauge };
    return svg((fn[cfg.type] || fn.bar).call(this, cfg));
  }
  bar(cfg: Config): string {
    const w = cfg.width || 400, h = cfg.height || 300, top = 30, bot = 40, pad = 40;
    const max = Math.max(...cfg.data.map(d => d.value), 1);
    const bw = Math.max(8, (w - pad * 2) / cfg.data.length - 4);
    return cfg.data.map((d, i) => {
      const bh = (d.value / max) * (h - top - bot);
      const x = pad + i * ((w - pad * 2) / cfg.data.length) + 2;
      const y = h - bot - bh;
      return `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" fill="${d.color || this.c(i)}" rx="2"/><text x="${x + bw/2}" y="${h - bot + 15}" text-anchor="middle" font-size="10">${d.label}</text>${cfg.showLabels !== false ? `<text x="${x + bw/2}" y="${y - 5}" text-anchor="middle" font-size="9">${d.value}</text>` : ''}`;
    }).join('');
  }
  line(cfg: Config): string {
    const w = cfg.width || 400, h = cfg.height || 300, top = 30, bot = 40, pad = 40;
    const max = Math.max(...cfg.data.map(d => d.value), 1);
    const pts = cfg.data.map((d, i) => {
      const x = pad + (i / (cfg.data.length - 1 || 1)) * (w - pad * 2);
      const y = h - bot - (d.value / max) * (h - top - bot);
      return { x, y, d };
    });
    return `<polyline points="${pts.map(p => `${p.x},${p.y}`).join(' ')}" fill="none" stroke="${this.c(0)}" stroke-width="2"/>` +
      pts.map(p => `<circle cx="${p.x}" cy="${p.y}" r="3" fill="${this.c(0)}"/><text x="${p.x}" y="${p.y - 8}" text-anchor="middle" font-size="9">${p.d.value}</text>`).join('') +
      pts.map((p, i) => `<text x="${p.x}" y="${h - bot + 15}" text-anchor="middle" font-size="10">${p.d.label}</text>`).join('');
  }
  pie(cfg: Config): string {
    const cx = (cfg.width || 400) / 2, cy = (cfg.height || 300) / 2, r = 100;
    const total = cfg.data.reduce((s, d) => s + d.value, 0) || 1;
    let angle = -Math.PI / 2;
    return cfg.data.map((d, i) => {
      const sweep = (d.value / total) * Math.PI * 2;
      const x1 = cx + r * Math.cos(angle), y1 = cy + r * Math.sin(angle);
      const x2 = cx + r * Math.cos(angle + sweep), y2 = cy + r * Math.sin(angle + sweep);
      const large = sweep > Math.PI ? 1 : 0;
      const mid = angle + sweep / 2;
      const lx = cx + (r + 20) * Math.cos(mid), ly = cy + (r + 20) * Math.sin(mid);
      angle += sweep;
      return `<path d="M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z" fill="${d.color || this.c(i)}"/><text x="${lx}" y="${ly}" text-anchor="middle" font-size="10">${d.label} ${Math.round(d.value/total*100)}%</text>`;
    }).join('');
  }
  donut(cfg: Config): string {
    const cx = (cfg.width || 400) / 2, cy = (cfg.height || 300) / 2, ro = 100, ri = 60;
    const total = cfg.data.reduce((s, d) => s + d.value, 0) || 1;
    let angle = -Math.PI / 2;
    const paths = cfg.data.map((d, i) => {
      const sweep = (d.value / total) * Math.PI * 2;
      const x1o = cx + ro * Math.cos(angle), y1o = cy + ro * Math.sin(angle);
      const x2o = cx + ro * Math.cos(angle + sweep), y2o = cy + ro * Math.sin(angle + sweep);
      const x1i = cx + ri * Math.cos(angle + sweep), y1i = cy + ri * Math.sin(angle + sweep);
      const x2i = cx + ri * Math.cos(angle), y2i = cy + ri * Math.sin(angle);
      const large = sweep > Math.PI ? 1 : 0;
      angle += sweep;
      return `<path d="M${x1o},${y1o} A${ro},${ro} 0 ${large},1 ${x2o},${y2o} L${x1i},${y1i} A${ri},${ri} 0 ${large},0 ${x2i},${y2i} Z" fill="${d.color || this.c(i)}"/>`;
    }).join('');
    return paths + `<text x="${cx}" y="${cy + 5}" text-anchor="middle" font-size="14" font-weight="bold">${total}</text>`;
  }
  area(cfg: Config): string {
    const w = cfg.width || 400, h = cfg.height || 300, top = 30, bot = 40, pad = 40;
    const max = Math.max(...cfg.data.map(d => d.value), 1);
    const pts = cfg.data.map((d, i) => ({ x: pad + (i / (cfg.data.length - 1 || 1)) * (w - pad * 2), y: h - bot - (d.value / max) * (h - top - bot) }));
    const line = pts.map(p => `${p.x},${p.y}`).join(' ');
    return `<polygon points="${line} ${pts[pts.length-1].x},${h-bot} ${pts[0].x},${h-bot}" fill="${this.c(0)}33"/><polyline points="${line}" fill="none" stroke="${this.c(0)}" stroke-width="2"/>`;
  }
  scatter(cfg: Config): string {
    const w = cfg.width || 400, h = cfg.height || 300, pad = 40;
    const maxV = Math.max(...cfg.data.map(d => d.value), 1);
    return cfg.data.map((d, i) => {
      const x = pad + (i / (cfg.data.length - 1 || 1)) * (w - pad * 2);
      const y = h - pad - (d.value / maxV) * (h - pad * 2);
      return `<circle cx="${x}" cy="${y}" r="5" fill="${d.color || this.c(i)}" opacity="0.8"/>`;
    }).join('');
  }
  radar(cfg: Config): string {
    const cx = (cfg.width || 400) / 2, cy = (cfg.height || 300) / 2, r = 100;
    const n = cfg.data.length;
    if (!cfg.data[0]?.values) return '<text>No values array</text>';
    const maxV = Math.max(...cfg.data.flatMap(d => d.values || [0]), 1);
    const axes = cfg.data.map((d, i) => {
      const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
      const ex = cx + r * Math.cos(angle), ey = cy + r * Math.sin(angle);
      return `<line x1="${cx}" y1="${cy}" x2="${ex}" y2="${ey}" stroke="#ccc" stroke-width="0.5"/><text x="${ex + 5 * Math.cos(angle)}" y="${ey + 5 * Math.sin(angle)}" font-size="10">${d.label}</text>`;
    });
    const pts = cfg.data.map((d, i) => {
      const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
      const v = (d.values?.[0] || 0) / maxV;
      return `${cx + r * v * Math.cos(angle)},${cy + r * v * Math.sin(angle)}`;
    });
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#ddd"/>` + axes.join('') + `<polygon points="${pts.join(' ')}" fill="${this.c(0)}44" stroke="${this.c(0)}" stroke-width="2"/>`;
  }
  heatmap(cfg: Config): string {
    const w = cfg.width || 400, h = cfg.height || 300;
    const max = Math.max(...cfg.data.map(d => d.value), 1);
    const cols = Math.ceil(Math.sqrt(cfg.data.length));
    const cs = Math.min((w - 40) / cols, (h - 60) / Math.ceil(cfg.data.length / cols));
    return cfg.data.map((d, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const intensity = d.value / max;
      const r = Math.round(255 * intensity), b = Math.round(255 * (1 - intensity));
      return `<rect x="${40 + col * cs}" y="${30 + row * cs}" width="${cs}" height="${cs}" fill="rgb(${r},100,${b})"/><text x="${40 + col * cs + cs/2}" y="${30 + row * cs + cs/2 + 4}" text-anchor="middle" font-size="8">${d.value}</text>`;
    }).join('');
  }
  gauge(cfg: Config): string {
    const cx = (cfg.width || 400) / 2, cy = (cfg.height || 300) - 40, r = 100;
    const val = cfg.data[0]?.value || 0;
    const pct = Math.min(100, Math.max(0, val));
    const angle = (pct / 100) * Math.PI;
    const x = cx + r * Math.cos(Math.PI - angle), y = cy - r * Math.sin(Math.PI - angle);
    const color = pct < 30 ? '#EF4444' : pct < 70 ? '#F59E0B' : '#10B981';
    return `<path d="M${cx-r},${cy} A${r},${r} 0 0,1 ${cx+r},${cy}" fill="none" stroke="#e5e7eb" stroke-width="15" stroke-linecap="round"/>` +
      (pct > 0 ? `<path d="M${cx-r},${cy} A${r},${r} 0 ${angle > Math.PI ? 1 : 0},1 ${x},${y}" fill="none" stroke="${color}" stroke-width="15" stroke-linecap="round"/>` : '') +
      `<text x="${cx}" y="${cy - 20}" text-anchor="middle" font-size="24" font-weight="bold">${val}</text>`;
  }
  legend(data: ChartData[]): string { return data.map((d, i) => `<span style="display:inline-flex;align-items:center;margin-right:12px"><span style="width:10px;height:10px;border-radius:50%;background:${d.color || this.c(i)};margin-right:4px"></span>${d.label}</span>`).join(''); }
}
