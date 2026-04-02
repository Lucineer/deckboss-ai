// src/core/cell-protocol.ts

export interface CellMessage {
  id: string;
  from: string;
  to: string;
  type: 'request' | 'response' | 'event' | 'stream';
  payload: any;
  timestamp: number;
  correlationId?: string;
}

export interface CellSubscription {
  subscriber: string;
  publisher: string;
  eventType: string;
  filter?: (msg: CellMessage) => boolean;
}

export interface CellBus {
  messages: CellMessage[];
  subscriptions: CellSubscription[];
  members: Set<string>;
}

export class CellProtocol {
  private bus: Map<string, CellBus> = new Map();
  private pendingMessages: Map<string, CellMessage[]> = new Map();
  private cellBusMap: Map<string, Set<string>> = new Map();
  
  private generateId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
  }

  createBus(name: string): void {
    if (!this.bus.has(name)) {
      this.bus.set(name, { messages: [], subscriptions: [], members: new Set() });
    }
  }

  joinBus(cellId: string, busName: string): void {
    this.createBus(busName);
    const bus = this.bus.get(busName)!;
    bus.members.add(cellId);
    
    if (!this.cellBusMap.has(cellId)) {
      this.cellBusMap.set(cellId, new Set());
      this.pendingMessages.set(cellId, []);
    }
    this.cellBusMap.get(cellId)!.add(busName);
  }

  leaveBus(cellId: string, busName: string): void {
    this.bus.get(busName)?.members.delete(cellId);
    this.cellBusMap.get(cellId)?.delete(busName);
    
    // Clean up subscriptions on leave
    const bus = this.bus.get(busName);
    if (bus) {
      bus.subscriptions = bus.subscriptions.filter(
        s => s.subscriber !== cellId && s.publisher !== cellId
      );
    }
  }

  getBusMembers(busName: string): string[] {
    return Array.from(this.bus.get(busName)?.members ?? []);
  }

  send(from: string, to: string, type: CellMessage['type'], payload: any): CellMessage {
    const msg: CellMessage = {
      id: this.generateId(),
      from, to, type, payload,
      timestamp: Date.now()
    };
    
    const pending = this.pendingMessages.get(to);
    if (pending) {
      pending.push(msg);
    }
    
    // Record in shared bus history if both cells share a bus
    const fromBuses = this.cellBusMap.get(from);
    const toBuses = this.cellBusMap.get(to);
    if (fromBuses && toBuses) {
      for (const busName of fromBuses) {
        if (toBuses.has(busName)) {
          this.bus.get(busName)?.messages.push(msg);
          break;
        }
      }
    }
    
    this.processSubscriptions(msg);
    return msg;
  }

  broadcast(from: string, type: CellMessage['type'], payload: any): CellMessage[] {
    const buses = this.cellBusMap.get(from);
    if (!buses) return [];

    const messages: CellMessage[] = [];
    
    for (const busName of buses) {
      const bus = this.bus.get(busName);
      if (!bus) continue;

      for (const member of bus.members) {
        if (member !== from) {
          const msg = this.send(from, member, type, payload);
          messages.push(msg);
        }
      }
    }
    
    return messages;
  }

  subscribe(subscriber: string, publisher: string, eventType: string, filter?: (msg: CellMessage) => boolean): CellSubscription {
    const sub: CellSubscription = { subscriber, publisher, eventType, filter };
    
    // Add to all shared buses
    const subBuses = this.cellBusMap.get(subscriber);
    const pubBuses = this.cellBusMap.get(publisher);
    
    if (subBuses && pubBuses) {
      for (const busName of subBuses) {
        if (pubBuses.has(busName)) {
          this.bus.get(busName)?.subscriptions.push(sub);
          break;
        }
      }
    }
    
    return sub;
  }

  unsubscribe(subscriber: string, eventType: string): void {
    for (const bus of this.bus.values()) {
      bus.subscriptions = bus.subscriptions.filter(
        s => !(s.subscriber === subscriber && s.eventType === eventType)
      );
    }
  }

  receive(cellId: string): CellMessage[] {
    const pending = this.pendingMessages.get(cellId) || [];
    this.pendingMessages.set(cellId, []);
    return pending;
  }

  async request(from: string, to: string, payload: any, timeout: number = 5000): Promise<CellMessage> {
    const correlationId = this.generateId();
    
    const req: CellMessage = {
      id: this.generateId(),
      from, to,
      type: 'request',
      payload,
      timestamp: Date.now(),
      correlationId
    };

    // Directly inject to pending to strictly handle correlation
    const pending = this.pendingMessages.get(to);
    if (pending) pending.push(req);

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Request timed out: ${correlationId}`)), timeout);

      const interval = setInterval(() => {
        const responseQueue = this.pendingMessages.get(from);
        if (responseQueue) {
          const index = responseQueue.findIndex(
            m => m.correlationId === correlationId && m.type === 'response'
          );
          
          if (index !== -1) {
            clearTimeout(timer);
            clearInterval(interval);
            const [response] = responseQueue.splice(index, 1);
            resolve(response);
          }
        }
      }, 50);
    });
  }

  stream(from: string, to: string, payload: any): void {
    this.send(from, to, 'stream', payload);
  }

  getHistory(busName: string, limit: number = 100): CellMessage[] {
    const msgs = this.bus.get(busName)?.messages ?? [];
    return msgs.slice(-limit);
  }

  getPendingCount(cellId: string): number {
    return this.pendingMessages.get(cellId)?.length ?? 0;
  }

  clearMessages(cellId: string): void {
    this.pendingMessages.set(cellId, []);
  }

  serialize(busName: string): string {
    const bus = this.bus.get(busName);
    if (!bus) return '{}';
    return JSON.stringify({
      messages: bus.messages,
      subscriptions: bus.subscriptions,
      members: Array.from(bus.members)
    });
  }

  deserialize(json: string): void {
    try {
      const data = JSON.parse(json);
      if (data.members) {
        const busName = `restored-${this.generateId()}`;
        this.createBus(busName);
        const bus = this.bus.get(busName)!;
        
        bus.messages = data.messages || [];
        bus.subscriptions = data.subscriptions || [];
        bus.members = new Set(data.members);
        
        // Hydrate indexes
        for (const member of bus.members) {
          this.joinBus(member, busName);
        }
      }
    } catch (error) {
      console.error('CellProtocol: Failed to deserialize bus data', error);
    }
  }

  private processSubscriptions(msg: CellMessage): void {
    const buses = this.cellBusMap.get(msg.from);
    if (!buses) return;

    for (const busName of buses) {
      const subs = this.bus.get(busName)?.subscriptions ?? [];
      
      for (const sub of subs) {
        if (sub.publisher === msg.from && sub.subscriber !== msg.from) {
          if (sub.eventType === msg.type || sub.eventType === '*') {
            if (!sub.filter || sub.filter(msg)) {
              const pending = this.pendingMessages.get(sub.subscriber);
              if (pending) pending.push(msg);
            }
          }
        }
      }
    }
  }
}