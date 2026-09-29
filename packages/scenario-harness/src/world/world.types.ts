import type { ScopeActor } from "./scope-actor";

/** Names a recorded journey; each world resolves it via the `defineJourney` fixture pool. */
export type SeedRef = { journey: string };

export type WorldScope = {
  actor: ScopeActor;
  /**
   * The entity the actor acts FOR. The `id` is present for a RETARGET member
   * and absent for a SELECTOR one — the two patterns a scope matrix declares
   * per member (ADR-001 amendment 2026-09-15). Mirrors headless's own
   * `ScopeContext` over this package's vue-free source; no type is minted here.
   * Resolved via `graphify-out/graph.json` to
   * `packages/headless/src/modules/scope/scope.types.ts`.
   */
  context?: { type: string; id?: string };
  /**
   * The ONE record a single read fetches — the builder's own `.withId(id)`.
   * A sibling of `context`, never a rename: a context names an entity the
   * actor acts FOR, a record id names the instance read, and the two compose
   * (FE-3095). Mirrors the labs port's `id` (`useModulePort.types.ts`).
   */
  id?: string;
  brandId?: string;
  seed?: SeedRef;
};

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
 * with (or typed against) the consumer's own `ScenarioRegistry<K, …>`.
 */
export type World<K extends string = string> = {
  boot(key: K, scope: WorldScope): Promise<void>;
  /**
   * The optional `key` addresses ONE of the cells the scenario has booted — its
   * scenario key. A scenario holds one live cell PER key; booting a key replaces
   * only that key's cell, and cells under different keys (a list and any number
   * of editors) live together. `key` picks which one fires. Absent, the
   * last-booted cell fires (the single-cell scenario's whole API unchanged).
   */
  fire(actionId: string, input?: unknown, key?: K): Promise<void>;
  /**
   * Fires an action but does NOT await its completion, leaving it in flight so
   * the NEXT step can observe mid-save meta (e.g. `isProcessing` true). Pair with
   * {@link settle} to await it afterwards. The recording it drives is typically
   * held open with `replayStep`'s `delayMs`, so the in-flight window has length.
   *
   * @example
   * await world.fireHold("update");           // save starts, response held
   * await world.expectMeta({ isProcessing: true });
   * await world.settle();                      // release and await the save
   */
  fireHold?(actionId: string, input?: unknown, key?: K): Promise<void>;
  /** Awaits the action a prior {@link fireHold} left in flight on the addressed cell. */
  settle?(key?: K): Promise<void>;
  // `Record`, never `Partial<Record<…>>` — `Partial` over an index signature
  // only widens the value type to `boolean | number | undefined`, so a typo'd
  // or absent-flag expectation (`{ isAuthenitcated: undefined }`) would
  // typecheck and then vacuously pass at runtime (`undefined !== undefined`
  // is false). Every expectation must be a real boolean or a real number.
  //
  // A boolean expectation is graded against the live value COERCED to a
  // boolean; a number expectation is graded against the unwrapped live value
  // EXACTLY (a count member such as `consolidatableCount` reads as itself, not
  // as `!!count`). `key` addresses one live cell, as in {@link World.fire}.
  expectMeta(
    expected: Record<string, boolean | number>,
    key?: K
  ): Promise<void>;
  expectContext?(expected: Record<string, unknown>, key?: K): Promise<void>;
  /**
   * Fails if `value` appears ANYWHERE in what the addressed cell publishes — its
   * whole context AND meta, serialised and searched as a substring. The
   * absence proof a secret needs: a link token, an emailed one-time value or a
   * plaintext must never leak into a published layer (client-notifications
   * AC-18). `key` addresses one live cell, as in {@link World.expectMeta}.
   */
  expectAbsent?(value: string, key?: K): Promise<void>;
  dispose(): Promise<void>;
};
