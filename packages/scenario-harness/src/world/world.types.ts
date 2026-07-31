import type { ScopeActor } from "./scope-actor";
import type { ComposableKey } from "../registry/registry";

/** Names a recorded journey; each world resolves it via the `defineJourney` fixture pool (design §4). */
export type SeedRef = { journey: string };

export interface WorldScope {
  actor: ScopeActor;
  context?: { type: string; id: string };
  brandId?: string;
  seed?: SeedRef;
}

/**
 * The BDD execution seam a `<module>.steps.ts` speaks through (design §4) —
 * the seam port wearing scenario clothes. Both executors (Playwright bridge,
 * in-page playground) implement the same surface; every member returns a
 * Promise so the bridge world can round-trip the browser. `expectMeta` and
 * `expectContext` are subset matches over already-evaluated, plain data —
 * never a DOM assertion (ADR-027 d.10's guard).
 */
export interface World {
  boot(key: ComposableKey, scope: WorldScope): Promise<void>;
  fire(actionId: string, input?: unknown): Promise<void>;
  expectMeta(expected: Partial<Record<string, boolean>>): Promise<void>;
  expectContext?(expected: Record<string, unknown>): Promise<void>;
  dispose(): Promise<void>;
}
