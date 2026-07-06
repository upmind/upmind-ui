// -----------------------------------------------------------------------------
/**
 * @module session-store/__tests__/fake-broadcast-channel
 * @description Non-data BroadcastChannel transport stub (ADR-025 A1.2) used by
 * `session-store.sync.int.test.ts` to simulate cross-tab messaging within a
 * single JS realm — two live store instances in one realm are not possible
 * (module singleton per realm), so this class stands in for the browser's
 * cross-tab transport. It carries no BE data and no business logic: it only
 * records what was sent (`sentLog`) and delivers a structured-clone copy to
 * other same-name instances, mirroring the real BroadcastChannel contract.
 */

type FakeBroadcastMessage = { name: string; data: unknown };

// -----------------------------------------------------------------------------

export class FakeBroadcastChannel {
  static registry: Map<string, Set<FakeBroadcastChannel>> = new Map();
  static sentLog: FakeBroadcastMessage[] = [];

  name: string;
  onmessage: ((event: MessageEvent) => void) | null = null;
  private listeners: Set<(event: MessageEvent) => void> = new Set();

  constructor(name: string) {
    this.name = name;
    const instances = FakeBroadcastChannel.registry.get(name) ?? new Set();
    instances.add(this);
    FakeBroadcastChannel.registry.set(name, instances);
  }

  postMessage(data: unknown): void {
    FakeBroadcastChannel.sentLog.push({ name: this.name, data });
    const cloned = structuredClone(data);
    const instances = FakeBroadcastChannel.registry.get(this.name) ?? new Set();
    queueMicrotask(() => {
      instances.forEach(instance => {
        if (instance === this) return;
        const event = { data: cloned } as MessageEvent;
        instance.onmessage?.(event);
        instance.listeners.forEach(listener => listener(event));
      });
    });
  }

  addEventListener(
    type: "message",
    listener: (event: MessageEvent) => void
  ): void {
    if (type === "message") this.listeners.add(listener);
  }

  removeEventListener(
    type: "message",
    listener: (event: MessageEvent) => void
  ): void {
    if (type === "message") this.listeners.delete(listener);
  }

  close(): void {
    FakeBroadcastChannel.registry.get(this.name)?.delete(this);
  }

  /** Test-hygiene reset — clears static state between tests. Not part of the
   * real BroadcastChannel contract; scaffolding only. */
  static reset(): void {
    FakeBroadcastChannel.registry.clear();
    FakeBroadcastChannel.sentLog = [];
  }
}
