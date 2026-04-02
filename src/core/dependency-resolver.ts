// src/core/dependency-resolver.ts

export interface CellDependency {
  cellRef: string;
  dependsOn: string[];
  dependedBy: string[];
  hasCycle: boolean;
}

export interface ExecutionOrder {
  order: string[];
  parallel: string[][];
  hasCycles: boolean;
  cycleCells: string[];
}

type DfsColor = 0 | 1 | 2; // 0: White, 1: Gray, 2: Black

export class DependencyResolver {
  private deps: Map<string, CellDependency> = new Map();

  public addDependency(cellRef: string, dependsOn: string): void {
    if (cellRef === dependsOn) return; // Prevent self-loops
    if (!this.deps.has(cellRef)) this.deps.set(cellRef, this.createCell(cellRef));
    const parent = this.deps.get(cellRef)!;
    if (!parent.dependsOn.includes(dependsOn)) parent.dependsOn.push(dependsOn);

    if (!this.deps.has(dependsOn)) this.deps.set(dependsOn, this.createCell(dependsOn));
    const child = this.deps.get(dependsOn)!;
    if (!child.dependedBy.includes(cellRef)) child.dependedBy.push(cellRef);
  }

  public removeDependency(cellRef: string, dependsOn: string): void {
    const parent = this.deps.get(cellRef);
    const child = this.deps.get(dependsOn);
    if (parent) parent.dependsOn = parent.dependsOn.filter(d => d !== dependsOn);
    if (child) child.dependedBy = child.dependedBy.filter(d => d !== cellRef);
  }

  public getDependencies(cellRef: string): string[] {
    return this.deps.get(cellRef)?.dependsOn ?? [];
  }

  public getDependents(cellRef: string): string[] {
    return this.deps.get(cellRef)?.dependedBy ?? [];
  }

  public getExecutionOrder(allCells: string[]): ExecutionOrder {
    // Initialize graph including cells with zero dependencies
    const inDegree: Record<string, number> = {};
    const adj: Record<string, string[]> = {};
    
    for (const cell of allCells) {
      inDegree[cell] = 0;
      adj[cell] = [];
      if (!this.deps.has(cell)) this.deps.set(cell, this.createCell(cell));
    }

    for (const cell of allCells) {
      const deps = this.deps.get(cell)!.dependsOn.filter(d => allCells.includes(d));
      inDegree[cell] = deps.length;
      for (const dep of deps) {
        adj[dep].push(cell);
      }
    }

    // Kahn's Algorithm
    const queue: string[] = Object.keys(inDegree).filter(k => inDegree[k] === 0);
    const order: string[] = [];
    const parallel: string[][] = [];

    while (queue.length > 0) {
      const currentParallel = [...queue];
      parallel.push(currentParallel);
      const nextQueue: string[] = [];

      for (const curr of currentParallel) {
        order.push(curr);
        for (const neighbor of adj[curr]) {
          inDegree[neighbor]--;
          if (inDegree[neighbor] === 0) nextQueue.push(neighbor);
        }
      }
      queue.length = 0;
      queue.push(...nextQueue);
    }

    const cycleCells = allCells.filter(c => !order.includes(c));
    cycleCells.forEach(c => { if (this.deps.has(c)) this.deps.get(c)!.hasCycle = true; });

    return { order, parallel, hasCycles: cycleCells.length > 0, cycleCells };
  }

  public detectCycles(): string[][] {
    const color: Record<string, DfsColor> = {};
    const cycles: string[][] = [];
    const cells = Array.from(this.deps.keys());
    cells.forEach(c => color[c] = 0);

    const dfs = (node: string, path: string[]): void => {
      color[node] = 1; // Gray
      path.push(node);

      for (const neighbor of this.deps.get(node)?.dependsOn ?? []) {
        if (!color[neighbor] && color[neighbor] !== 0) continue; 
        if (color[neighbor] === 0) {
          dfs(neighbor, path);
        } else if (color[neighbor] === 1) {
          // Cycle found
          const cycleStart = path.indexOf(neighbor);
          if (cycleStart !== -1) cycles.push(path.slice(cycleStart));
        }
      }

      path.pop();
      color[node] = 2; // Black
    };

    for (const cell of cells) {
      if (color[cell] === 0) dfs(cell, []);
    }
    
    return cycles;
  }

  public hasCycles(): boolean {
    return this.detectCycles().length > 0;
  }

  public breakCycle(cellRef: string): void {
    const cell = this.deps.get(cellRef);
    if (cell && cell.dependsOn.length > 0) {
      this.removeDependency(cellRef, cell.dependsOn[0]);
    }
  }

  public getDependencyGraph(): Record<string, string[]> {
    const graph: Record<string, string[]> = {};
    for (const [k, v] of this.deps.entries()) graph[k] = [...v.dependsOn];
    return graph;
  }

  public getReverseGraph(): Record<string, string[]> {
    const graph: Record<string, string[]> = {};
    for (const [k, v] of this.deps.entries()) graph[k] = [...v.dependedBy];
    return graph;
  }

  public removeCell(cellRef: string): void {
    const deps = this.getDependencies(cellRef);
    const dependedBy = this.getDependents(cellRef);
    deps.forEach(d => this.removeDependency(cellRef, d));
    dependedBy.forEach(d => this.removeDependency(d, cellRef));
    this.deps.delete(cellRef);
  }

  public clear(): void {
    this.deps.clear();
  }

  public getSize(): number {
    return this.deps.size;
  }

  public serialize(): string {
    const arr = Array.from(this.deps.entries());
    return JSON.stringify(arr);
  }

  public deserialize(json: string): void {
    this.deps.clear();
    try {
      const arr = JSON.parse(json) as [string, CellDependency][];
      for (const [k, v] of arr) this.deps.set(k, v);
    } catch (e) {
      throw new Error("Failed to deserialize dependency graph");
    }
  }

  private createCell(cellRef: string): CellDependency {
    return { cellRef, dependsOn: [], dependedBy: [], hasCycle: false };
  }
}