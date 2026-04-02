// src/core/chart-renderer.ts

/**
 * Interface for chart data.
 * Labels are typically for the X-axis categories.
 * Datasets contain the series data, each with a label, an array of numbers, and an optional color.
 */
export interface ChartData {
  labels: string[];
  datasets: Array<{ label: string; data: number[]; color?: string }>;
}

/**
 * Interface for chart configuration.
 * Defines chart type, dimensions, display options, and a color palette.
 */
export interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'area' | 'scatter';
  title?: string;
  width: number;
  height: number;
  showLegend: boolean;
  showGrid: boolean;
  colors?: string[]; // Optional custom color palette for the chart
}

/**
 * Result interface for the scaleToFit method.
 * Provides calculated data ranges and plot area dimensions.
 */
export interface ScaleOutput {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  plotWidth: number;
  plotHeight: number;
  plotX: number; // X-coordinate of the top-left corner of the plot area
  plotY: number; // Y-coordinate of the top-left corner of the plot area
}

// --- Constants for SVG rendering ---
const DEFAULT_COLORS = [
  '#f59e0b', // amber-500
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#84cc16'  // lime-500
];

const PADDING = {
  TOP: 40,
  RIGHT: 40,
  BOTTOM: 60, // More space for X-axis labels
  LEFT: 70    // More space for Y-axis labels
};

const FONT_SIZE_TITLE = 20;
const FONT_SIZE_LABELS = 12;
const FONT_SIZE_LEGEND = 12;

const GRID_COLOR = '#e5e7eb'; // gray-200
const AXIS_COLOR = '#6b7280'; // gray-500
const TEXT_COLOR = '#1f2937'; // gray-900
const LINE_STROKE_WIDTH = 2;
const POINT_RADIUS = 4;

/**
 * ChartRenderer class for generating SVG charts from spreadsheet cell data.
 * Uses pure string concatenation for SVG generation.
 */
export class ChartRenderer {

  private defaultColors: string[];

  constructor() {
    this.defaultColors = DEFAULT_COLORS;
  }

  /**
   * 9. getColorPalette(n): string[] — generate n distinct colors
   * Returns a palette of n colors, cycling through the default colors if n > default palette length.
   */
  public getColorPalette(n: number, customColors?: string[]): string[] {
    const palette = customColors && customColors.length > 0 ? customColors : this.defaultColors;
    const colors: string[] = [];
    for (let i = 0; i < n; i++) {
      colors.push(palette[i % palette.length]);
    }
    return colors;
  }

  /**
   * 10. formatValue(n, format): string — number formatting
   * Basic number formatting. 'format' is currently ignored for simplicity,
   * but could be extended to handle 'currency', 'percent', etc.
   */
  public formatValue(n: number, format?: string): string {
    // Basic formatting, could be extended based on 'format' string
    if (typeof n !== 'number' || isNaN(n)) {
      return '';
    }
    return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }

  /**
   * Helper to calculate min/max values and plot area dimensions.
   * This is the internal implementation for `scaleToFit`.
   */
  private _calculateScaleInfo(data: ChartData, config: ChartConfig): ScaleOutput {
    let yMin = 0;
    let yMax = 0;

    if (data.datasets.length > 0) {
      // Find global min/max for Y-axis across all datasets
      const allValues = data.datasets.flatMap(ds => ds.data);
      if (allValues.length > 0) {
        yMin = Math.min(...allValues);
        yMax = Math.max(...allValues);
      }
    }

    // Ensure yMin is 0 if all values are positive for bar/area charts
    if (config.type === 'bar' || config.type === 'area') {
      yMin = Math.min(0, yMin);
    }

    // Add some padding to yMax for better visualization
    const yRange = yMax - yMin;
    yMax += yRange * 0.1; // 10% padding on top
    if (yMin !== 0) { // If yMin is not 0, add padding to bottom too
      yMin -= yRange * 0.1;
    }
    // Ensure yMin doesn't go below 0 if all values are positive
    if (yMin < 0 && yMax > 0 && config.type !== 'scatter') { // Scatter can have negative X/Y
      yMin = Math.min(yMin, 0);
    } else if (yMin > 0 && config.type !== 'scatter') {
      yMin = 0; // Start Y-axis from 0 for most charts if all values are positive
    }


    const plotX = PADDING.LEFT;
    const plotY = PADDING.TOP;
    const plotWidth = config.width - PADDING.LEFT - PADDING.RIGHT;
    const plotHeight = config.height - PADDING.TOP - PADDING.BOTTOM;

    return { xMin: 0, xMax: data.labels.length - 1, yMin, yMax, plotWidth, plotHeight, plotX, plotY };
  }

  /**
   * 14. scaleToFit(data, width, height): {scale, offset} — calculate scaling
   * Calculates the data range (min/max) and the dimensions of the actual plotting area
   * within the SVG canvas, considering padding.
   */
  public scaleToFit(data: ChartData, width: number, height: number): ScaleOutput {
    // This public method just wraps the internal calculation.
    // The 'scale' and 'offset' in the requirements are implicitly handled by
    // the plotWidth, plotHeight, plotX, plotY, and the min/max values.
    // Actual scaling functions (data value -> pixel) are derived from this internally.
    return this._calculateScaleInfo(data, {
      type: 'bar', // Type doesn't matter for basic min/max calculation here
      width, height, showLegend: false, showGrid: false, colors: []
    });
  }

  /**
   * 13. addTitle(svg, title): string — append title
   * Adds a title to the SVG.
   */
  public addTitle(title: string, config: ChartConfig): string {
    if (!title) return '';
    const x = config.width / 2;
    const y = PADDING.TOP / 2 + FONT_SIZE_TITLE / 3; // Center vertically in top padding
    return `<text x="${x}" y="${y}" font-family="sans-serif" font-size="${FONT_SIZE_TITLE}" fill="${TEXT_COLOR}" text-anchor="middle">${title}</text>`;
  }

  /**
   * 11. addLegend(svg, datasets): string — append legend to SVG
   * Adds a legend to the top-right of the chart area.
   */
  public addLegend(datasets: Array<{ label: string; color?: string }>, config: ChartConfig): string {
    if (!config.showLegend || datasets.length === 0) return '';

    const legendX = config.width - PADDING.RIGHT + 10; // Position outside right padding
    let legendY = PADDING.TOP; // Start from top padding

    const legendItems = datasets.map((dataset, i) => {
      const color = dataset.color || this.getColorPalette(datasets.length, config.colors)[i];
      const itemY = legendY + i * (FONT_SIZE_LEGEND + 8); // 8px spacing
      return `
        <rect x="${legendX}" y="${itemY - FONT_SIZE_LEGEND / 2}" width="10" height="10" fill="${color}" />
        <text x="${legendX + 15}" y="${itemY + FONT_SIZE_LEGEND / 3}" font-family="sans-serif" font-size="${FONT_SIZE_LEGEND}" fill="${TEXT_COLOR}">${dataset.label}</text>
      `;
    }).join('');

    return `<g class="chart-legend">${legendItems}</g>`;
  }

  /**
   * 12. addGrid(svg, config): string — append grid lines
   * Adds horizontal and vertical grid lines to the chart.
   */
  public addGrid(data: ChartData, config: ChartConfig, scaleInfo: ScaleOutput): string {
    if (!config.showGrid) return '';

    const { xMin, xMax, yMin, yMax, plotWidth, plotHeight, plotX, plotY } = scaleInfo;
    let gridLines = '';

    // Horizontal grid lines (Y-axis)
    const numYLines = 5; // Number of horizontal grid lines
    for (let i = 0; i <= numYLines; i++) {
      const y = plotY + plotHeight - (i / numYLines) * plotHeight;
      const value = yMin + (i / numYLines) * (yMax - yMin);
      gridLines += `<line x1="${plotX}" y1="${y}" x2="${plotX + plotWidth}" y2="${y}" stroke="${GRID_COLOR}" stroke-width="1" />`;
      gridLines += `<text x="${plotX - 10}" y="${y + FONT_SIZE_LABELS / 3}" font-family="sans-serif" font-size="${FONT_SIZE_LABELS}" fill="${TEXT_COLOR}" text-anchor="end">${this.formatValue(value)}</text>`;
    }

    // Vertical grid lines (X-axis)
    const numXLines = data.labels.length;
    if (numXLines > 0) {
      const xStep = plotWidth / (numXLines - (config.type === 'bar' ? 0 : 1)); // Adjust for bar chart vs line/scatter
      for (let i = 0; i < numXLines; i++) {
        const x = plotX + (config.type === 'bar' ? (i * xStep + xStep / 2) : (i * xStep));
        if (config.type === 'bar' || i < numXLines - 1) { // Don't draw last vertical line for line/scatter if it's outside
          gridLines += `<line x1="${x}" y1="${plotY}" x2="${x}" y2="${plotY + plotHeight}" stroke="${GRID_COLOR}" stroke-width="1" />`;
        }
        gridLines += `<text x="${plotX + i * (plotWidth / (numXLines - 1))}" y="${plotY + plotHeight + FONT_SIZE_LABELS + 5}" font-family="sans-serif" font-size="${FONT_SIZE_LABELS}" fill="${TEXT_COLOR}" text-anchor="middle">${data.labels[i]}</text>`;
      }
    }

    // X-axis line
    gridLines += `<line x1="${plotX}" y1="${plotY + plotHeight}" x2="${plotX + plotWidth}" y2="${plotY + plotHeight}" stroke="${AXIS_COLOR}" stroke-width="1" />`;
    // Y-axis line
    gridLines += `<line x1="${plotX}" y1="${plotY}" x2="${plotX}" y2="${plotY + plotHeight}" stroke="${AXIS_COLOR}" stroke-width="1" />`;

    return `<g class="chart-grid-axes">${gridLines}</g>`;
  }

  /**
   * 1. renderBarChart(data, config): string — SVG bar chart
   */
  public renderBarChart(data: ChartData, config: ChartConfig): string {
    const scaleInfo = this._calculateScaleInfo(data, config);
    const { yMin, yMax, plotWidth, plotHeight, plotX, plotY } = scaleInfo;

    const barWidth = plotWidth / (data.labels.length * data.datasets.length) * 0.8; // 80% width
    const groupWidth = plotWidth / data.labels.length; // Width for each label group
    const barSpacing = groupWidth * 0.1 / (data.datasets.length > 1 ? data.datasets.length - 1 : 1); // Space between bars in a group

    let bars = '';
    data.datasets.forEach((dataset, datasetIndex) => {
      const color = dataset.color || this.getColorPalette(data.datasets.length, config.colors)[datasetIndex];
      dataset.data.forEach((value, i) => {
        const xGroupStart = plotX + i * groupWidth;
        const x = xGroupStart + (datasetIndex * (barWidth + barSpacing)) + groupWidth * 0.1; // Offset for group and bar within group
        const barHeight = (value / (yMax - yMin)) * plotHeight;
        const y = plotY + plotHeight - barHeight; // SVG y-coordinates are from top

        bars += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${color}" />`;
      });
    });

    return this.wrapSvg(
      config,
      this.addGrid(data, config, scaleInfo) +
      `<g class="chart-bars">${bars}</g>` +
      this.addTitle(config.title || '', config) +
      this.addLegend(data.datasets, config)
    );
  }

  /**
   * 2. renderLineChart(data, config): string — SVG line chart with points
   */
  public renderLineChart(data: ChartData, config: ChartConfig): string {
    const scaleInfo = this._calculateScaleInfo(data, config);
    const { yMin, yMax, plotWidth, plotHeight, plotX, plotY } = scaleInfo;

    let linesAndPoints = '';
    data.datasets.forEach((dataset, datasetIndex) => {
      const color = dataset.color || this.getColorPalette(data.datasets.length, config.colors)[datasetIndex];
      let pathD = '';
      let points = '';

      dataset.data.forEach((value, i) => {
        const x = plotX + (i / (data.labels.length - 1)) * plotWidth;
        const y = plotY + plotHeight - ((value - yMin) / (yMax - yMin)) * plotHeight;

        if (i === 0) {
          pathD += `M ${x} ${y}`;
        } else {
          pathD += ` L ${x} ${y}`;
        }
        points += `<circle cx="${x}" cy="${y}" r="${POINT_RADIUS}" fill="${color}" stroke="white" stroke-width="1" />`;
      });
      linesAndPoints += `<path d="${pathD}" fill="none" stroke="${color}" stroke-width="${LINE_STROKE_WIDTH}" />`;
      linesAndPoints += `<g class="chart-points">${points}</g>`;
    });

    return this.wrapSvg(
      config,
      this.addGrid(data, config, scaleInfo) +
      `<g class="chart-lines">${linesAndPoints}</g>` +
      this.addTitle(config.title || '', config) +
      this.addLegend(data.datasets, config)
    );
  }

  /**
   * 3. renderPieChart(data, config): string — SVG pie/donut chart
   */
  public renderPieChart(data: ChartData, config: ChartConfig): string {
    // Pie charts typically use a single dataset or sum all datasets
    // For simplicity, we'll use the first dataset's data.
    if (!data.datasets || data.datasets.length === 0 || data.datasets[0].data.length === 0) {
      return this.wrapSvg(config, `<text x="${config.width / 2}" y="${config.height / 2}" text-anchor="middle" fill="${TEXT_COLOR}">No data for Pie Chart</text>`);
    }

    const dataset = data.datasets[0];
    const total = dataset.data.reduce((sum, val) => sum + Math.abs(val), 0); // Use absolute values for pie
    if (total === 0) {
      return this.wrapSvg(config, `<text x="${config.width / 2}" y="${config.height / 2}" text-anchor="middle" fill="${TEXT_COLOR}">No data for Pie Chart</text>`);
    }

    const centerX = config.width / 2;
    const centerY = config.height / 2;
    const radius = Math.min(config.width, config.height) / 2 - PADDING.TOP; // Adjust radius for padding