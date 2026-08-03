import type { ScopeActor } from "./scope-actor";

/** Names a recorded journey; each world resolves it via the `defineJourney` fixture pool. */
export type SeedRef = { journey: string };

export interface WorldScope {
  actor: ScopeActor;
  context?: { type: string; id: string };
  brandId?: string;
  seed?: SeedRef;
}

/**
 * The BDD execution seam a `<module>.steps.ts` speaks through —
 * the seam port wearing scenario clothes. Both executors (Playwright bridge,
 * in-page playground) implement the same surface; every member returns a
 * Promise so the bridge world can round-trip the browser. `expectMeta` and
 * `expectContext` are subset matches over already-evaluated, plain data —
 * never a DOM assertion (ADR-027 d.10's guard).
 *
 * `K` is the consumer's own manifest key union, never a package-baked
 * `ComposableKey` (item 4/4a) — a `World<K>` implementation is constructed
 * with (or typed against) the consumer's own `ComposableRegistry<K, …>`.
 */
export interface World<K extends string = string> {
  boot(key: K, scope: WorldScope): Promise<void>;
  fire(actionId: string, input?: unknown): Promise<void>;
  expectMeta(expected: Partial<Record<string, boolean>>): Promise<void>;
  expectContext?(expected: Record<string, unknown>): Promise<void>;
  dispose(): Promise<void>;
}
