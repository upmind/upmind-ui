/**
 * @graphify-citation `graphify-out/graph.json` (2026-08-08, 19273 nodes) — no
 * `ScenarioBinding` / `ScenarioScopedCell` / `FourLayerComposable` / `registry`
 * node exists anywhere in the tree; `ScenarioRegistry` in
 * `@upmind-automation/scenario-harness` is the harness's key→thunk map and
 * carries no pairing, scope or handoff, so it is consumed here rather than
 * duplicated. See `graphify-out/GRAPH_REPORT.md`.
 */
// -----------------------------------------------------------------------------
/**
 * @module factory/registry.types
 * @description The scenario CONTRACT's shapes (ruling S-D4). Everything
 * scenario-specific — which composable a key boots, the scope it boots at, the
 * editor a row hands off to, and the row identifier when it is not `id` — is
 * declared once by the consumer, here. Core is agnostic of UI, routes and
 * hrefs (S-D3), so none of this may live in `packages/headless`.
 */

import type { LiveCompositionCell } from "./useCompositionPort.types";
import type { ScopeActorTypes } from "@upmind-automation/headless";
import type { ScenarioKey } from "@upmind-automation/headless/scenarios";

// -----------------------------------------------------------------------------

/** The default row identifier when a binding declares none. */
export const DEFAULT_ROW_IDENTIFIER = "id";

/**
 * A four-layer cell once an actor is named — plus the optional `.for()` step
 * for a matrix that declares contexts for that actor.
 */
export type ScenarioScopedCell = LiveCompositionCell & {
  for?(type: string, id: string): LiveCompositionCell;
  /** The module's own internals — reachable only where the raw cell is held. */
  useInternals?(): Record<string, unknown>;
};

/**
 * A scoped four-layer composable as the registry declares it — the BUILDER
 * (`useClientEmails`), never a booted cell, so enumerating the registry
 * instantiates no scope.
 */
export type FourLayerComposable = (...args: never[]) => {
  as(actor: ScopeActorTypes): ScenarioScopedCell;
};

/** Where a row action hands off to, and which row property supplies the target's id. */
export type ScenarioHandoff = {
  target: ScenarioKey;
  contextType: string;
  /** A JSON Pointer into the ROW, validated against the row schema — never a live composable reference. */
  contextFrom: string;
};

/**
 * One scenario, declared by the consumer.
 *
 * `useList` is the composable the key itself boots; `useMutate` is the editor
 * its rows hand off to. A key that IS an editor declares only `useList` — the
 * pairing is a relation between two keys, not a property of one.
 */
export type ScenarioBinding = {
  useList: FourLayerComposable;
  useMutate?: FourLayerComposable;
  /** How the cell is booted. `.as('self')` is a compile error on the client-email matrices. */
  scope: { actor: ScopeActorTypes; contextType?: string };
  /** The row property carrying a row's identity, when it is not {@link DEFAULT_ROW_IDENTIFIER}. */
  identifier?: string;
  handoff?: Record<string, ScenarioHandoff>;
};
