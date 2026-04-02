interface ChartData { labels:string[]; datasets:Array<{label:string;data:number[];color:string}>; title?:string }
export class ChartRenderer {
  private theme = { bg:'#1e1e2e', fg:'#cdd6f4', grid:'#45475a', font:'Inter, system-ui, sans-serif' };
  barChart(data: ChartData, w = 400, h = 300): string {
    const max = Math.max(...data.datasets.flatMap(d => d.data)); const barW = (w-60)/(data.labels.length*data.datasets.length); let bars = '';
    data.datasets.forEach((ds, di) => ds.data.forEach((v, i) => { const x = 50 + (i*data.datasets.length + di)*barW; const barH = (v/max)*(h-80); bars += `<rect x="${x}" y="${h-40-barH}" width="${barW-2}" height="${barH}" fill="${ds.color}" rx="2"/>`; }));
    const labels = data.labels.map((l, i) => `<text x="${50+i*data.datasets.length*(w-60)/data.labels.length+((w-60)/data.labels.length)/2}" y="${h-20}" text-anchor="middle" fill="${this.theme.fg}" font-size="10">${l}</text>`).join('');
    const yLines = Array.from({length:5}, (_, i) => { const v = Math.round(max*i/4); const y = h-40-(h-80)*i/4; return `<line x1="50" y1="${y}" x2="${w-10}" y2="${y}" stroke="${this.theme.grid}" stroke-width="0.5"/><text x="45" y="${y+3}" text-anchor="end" fill="${this.theme.fg}" font-size="9">${v}</text>`; }).join('');
    return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg"><rect width="${w}" height="${h}" fill="${this.theme.bg}"/>${yLines}${bars}${labels}${data.title?`<text x="${w/2}" y="20" text-anchor="middle" fill="${this.theme.fg}" font-size="14" font-weight="bold">${data.title}</text>`:''}</svg>`;
  }
  lineChart(data: ChartData, w = 400, h = 300): string {
    const max = Math.max(...data.datasets.flatMap(d => d.data)); const step = (w-60)/(data.labels.length-1||1);
    const lines = data.datasets.map(ds => { const pts = ds.data.map((v, i) => `${50+i*step},${h-40-(v/max)*(h-80)}`).join(' '); return `<polyline points="${pts}" fill="none" stroke="${ds.color}" stroke-width="2"/>` + ds.data.map((v, i) => `<circle cx="${50+i*step}" cy="${h-40-(v/max)*(h-80)}" r="3" fill="${ds.color}"/>`).join(''); }).join('');
    return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg"><rect width="${w}" height="${h}" fill="${this.theme.bg}"/>${lines}</svg>`;
  }
  pieChart(data: ChartData, w = 400, h = 300): string {
    const total = data.datasets[0].data.reduce((a,b) => a+b, 0); let paths = ''; let angle = 0;
    data.datasets[0].data.forEach((v, i) => { const pct = v/total; const end = angle + pct*360; const startRad = angle*Math.PI/180; const endRad = end*Math.PI/180; const cx=w/2, cy=h/2, r=100; const x1=cx+r*Math.cos(startRad), y1=cy+r*Math.sin(startRad), x2=cx+r*Math.cos(endRad), y2=cy+r*Math.sin(endRad); const large = pct > 0.5 ? 1 : 0; paths += `<path d="M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z" fill="${data.datasets[0].color}" stroke="${this.theme.bg}" stroke-width="2"/>`; angle = end; });
    const legend = data.labels.map((l, i) => `<text x="${w-80}" y="${80+i*20}" fill="${this.theme.fg}" font-size="10">■ ${l}: ${data.datasets[0].data[i]}</text>`).join('');
    return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg"><rect width="${w}" height="${h}" fill="${this.theme.bg}"/>${paths}${legend}</svg>`;
  }
  sparkline(values: number[], w = 200, h = 40): string {
    if (!values.length) return ''; const max = Math.max(...values); const min = Math.min(...values); const range = max-min||1; const step = w/(values.length-1||1);
    const pts = values.map((v, i) => `${i*step},${h-5-((v-min)/range)*(h-10)}`).join(' ');
    return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg"><polyline points="${pts}" fill="none" stroke="${this.theme.fg}" stroke-width="1.5"/></svg>`;
  }
  render(data: ChartData, type: string): string { switch(type) { case 'bar': return this.barChart(data); case 'line': return this.lineChart(data); case 'pie': return this.pieChart(data); case 'sparkline': return this.sparkline(data.datasets[0].data); default: return this.barChart(data); } }
  setTheme(t: Partial<typeof this.theme>): void { Object.assign(this.theme, t); }
}
