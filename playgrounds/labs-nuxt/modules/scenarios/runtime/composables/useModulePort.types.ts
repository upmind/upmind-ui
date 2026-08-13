/**
 * @graphify-citation `graphify-out/graph.json` (2026-08-08, 19273 nodes) — no
 * `ModulePort` / `ModulePortDebug` / `ModulePortScope` node exists in the tree;
 * `CompositionPort` and `ReflectedSnapshot` in
 * `@upmind-automation/scenario-harness` are the frozen seam shapes and are
 * EXTENDED here rather than restated, and the scope members are headless's own
 * `ScopeActorTypes` / `ScopeContext` / `ActorContextMatrix`. See
 * `graphify-out/GRAPH_REPORT.md`.
 */
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/composables/useModulePort.types
 * @description The one generic port's shapes — the seam port plus the debug
 * chain only the raw-cell holder can assemble.
 */

import type {
  ActorContextMatrix,
  ScopeActorTypes,
  ScopeContext
} from "@upmind-automation/headless";
import type {
  CompositionPort,
  ReflectedSnapshot
} from "@upmind-automation/scenario-harness";
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------

/**
 * WHERE the caller boots the composable. Absent both members it boots as SELF
 * with no context, which is where every page starts (`R6-30b`); the url's
 * `/as/:actor` and `/for/:type/:id` segments are what move it.
 *
 * @graphify-citation `graphify-out/graph.json` (2026-08-10, 6795 nodes) — the
 * `fresh` member below relays `scope.builder.ts`'s own `.fresh()`; no
 * fresh-boot node exists in the tree.
 */
export type ModulePortScope = {
  actor?: ScopeActorTypes;
  /**
   * The record being acted FOR, whole — headless's own `ScopeContext`, whose
   * `type` and `id` are both required, so a type without an id cannot be
   * expressed at all (`R6-30d`).
   */
  context?: ScopeContext;
  /**
   * Boot a distinct instance rather than the registry's cached one — what an
   * editor opened on a record that does not exist yet needs, so two drafts (or
   * a draft after a save) never share one machine.
   */
  fresh?: boolean;
};

/** Raw vs rendered: the whole chain in one place, plain data all the way down. */
export type ModulePortDebug = {
  schema: unknown;
  uischema: unknown;
  /** The criteria model — request STATE, not a request. */
  model: unknown;
  /** The search params the live criteria BUILDS; nothing is fetched to produce it. */
  request: Record<string, string>;
};

/**
 * The cell's own request state, relayed by the one site that holds the raw
 * cell — present iff the cell owns criteria. The model stays composable-owned:
 * this is a read plus the composable's own merging write, never a second copy.
 */
export type ModulePortCriteria = {
  /** The declared query schema (a plain Draft-07 JSON literal) — the whole of what may be persisted. */
  schema: unknown;
  /** The module's OWN filter-bar presentation over that schema — what the holistic filter form renders. */
  uischema: unknown;
  /** The live criteria model; read-only, write through {@link ModulePortCriteria.set}. */
  model: ComputedRef<Record<string, unknown>>;
  /** MERGES the given branches into the intent; never replaces the whole model. */
  set(next: Record<string, unknown>): void;
};

/** A snapshot carrying the debug chain, absent for a cell that owns no criteria. */
export type ModulePortSnapshot = ReflectedSnapshot & {
  debug?: ModulePortDebug;
};

/** The seam port, widened by the debug branch — still a `CompositionPort` to every core consumer. */
export type ModulePort = Omit<CompositionPort, "snapshot"> & {
  snapshot(): ModulePortSnapshot;
  criteria?: ModulePortCriteria;
  /**
   * The COMPOSABLE's own scope matrix, read off the builder that created it —
   * which actors it is offerable at, and under which context type. Absent for a
   * composable registered without one, and the acting-for picker then offers
   * nothing for that page rather than guessing (`R6-31`). Headless's own
   * `ActorContextMatrix`, consumed rather than re-spelt — see this file's head
   * citation and `graphify-out/GRAPH_REPORT.md`.
   */
  scopeMatrix?: ActorContextMatrix;
};
