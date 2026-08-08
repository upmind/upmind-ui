// -----------------------------------------------------------------------------
/**
 * @module factory/useCompositionPort.types
 * @description Type definitions for the composition-port adapter — the
 * shape of a live 4-layer scoped composable cell `useCompositionPort` reads,
 * and the seam it hands back (design.md FE-2977 §Block A).
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

/** A single `useMeta()` flag — MUST deref to a sync boolean (ADR-027 Am.11). */
export type LiveMetaFlag = boolean | Ref<boolean> | ComputedRef<boolean>;

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
