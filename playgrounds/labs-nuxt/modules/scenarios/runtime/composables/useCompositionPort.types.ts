// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/composables/useCompositionPort.types
 * @description Type definitions for the composition-port adapter — the
 * shape of a live 4-layer scoped composable cell `useCompositionPort` reads,
 * and the seam it hands back.
 */

import type { ControlledTableChannel } from "@upmind-automation/scenario-harness";
import type { ComputedRef, Ref } from "vue";

// -----------------------------------------------------------------------------

/**
 * One live action, as a real composable declares it — each with its OWN input
 * type (`remove(id)`, `ensure(model)`), not the port's opaque single input.
 *
 * @graphify-citation `graphify-out/graph.json` (2026-08-06) — every `action`
 * node is a per-module factory (`createClientEmailsActions`,
 * `createAuthActions`, …); no generic callable-action type exists to consume,
 * so naming the one this file already declared inline is warranted.
 */
export type LiveAction = (...args: never[]) => unknown;

/** The live `useActions()` return of an already-scoped composable cell. */
export type LiveActions = Record<string, LiveAction>;

/** The live `useContext()` return — top-level refs/computeds over plain values, unwrapped by the adapter. */
export type LiveContext = Record<string, unknown>;

/**
 * A single `useMeta()` member — MUST deref SYNCHRONOUSLY (ADR-027 Am.11); the
 * invariant is sync-ness, not the type. A count (e.g. `useInvoices().useMeta()
 * .consolidatableCount`) is a first-class member alongside a flag — 2026-09-09
 * operator sign-off, `playgrounds/labs-nuxt/modules/scenarios/runtime/**` —
 * widened from boolean-only so a declared notice can read a real count rather
 * than lose it to a `!!` coercion.
 *
 * @graphify-citation `graphify-out/graph.json` (2026-09-09) — queried
 * "LiveMetaFlag boolean number meta value type": this IS the existing
 * `LiveMetaFlag` node (`useCompositionPort.types.ts:32`), widened in place —
 * not a new type.
 */
export type LiveMetaFlag =
  | boolean
  | number
  | Ref<boolean | number>
  | ComputedRef<boolean | number>;

/** The live `useMeta()` return. */
export type LiveMeta = Record<string, LiveMetaFlag>;

/**
 * The three named layers `useCompositionPort` reads from an already-scoped
 * composable cell (e.g. `useAuth().as(actor)`) — never the builder itself,
 * so enumerating this shape never side-effectfully instantiates a scope.
 */
export type LiveCompositionCell = {
  useActions(): LiveActions;
  useContext(): LiveContext;
  useMeta(): LiveMeta;
};

/** Optional wiring `useCompositionPort` accepts for a List module that owns table state. */
export type UseCompositionPortOptions = {
  /** A caller-built channel over the composable's own filter/sort/pagination model — never fabricated by the adapter. */
  table?: ControlledTableChannel;
};
