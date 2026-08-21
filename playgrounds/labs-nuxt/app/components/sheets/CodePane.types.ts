/**
 * @graphify-citation `graphify-out/graph.json` (2026-08-10, 6795 nodes) —
 * queried for `codepane` · `snippet` · `clipboard` · `fence`: the only matches
 * anywhere in the tree are the docs pipeline's own (`labelFences()`,
 * `scanMarkedSnippets()`, the docs-corpus `snippet.ts` fixture), so no
 * code-pane or copy-as-code node exists to consume and `CodePaneProps` is
 * minted. What it does NOT mint: the scope is `ScopeConfig`, the playground's
 * own url-derived scope shape (`app/composables/scope`), and the request state
 * is `ModulePortCriteria`, the seam port's own criteria handle — both consumed
 * rather than re-declared. See `graphify-out/GRAPH_REPORT.md`.
 */
// -----------------------------------------------------------------------------
/**
 * @module sheets/CodePane.types
 * @description Type definitions for the Code pane — everything the call that
 * reproduces the page needs: which composable it boots, at which scope, and the
 * request state currently narrowing it.
 */

import type { ModulePortCriteria } from "../../../modules/scenarios/runtime/composables/useModulePort.types";
import type { ScopeConfig } from "../../composables/scope";

// -----------------------------------------------------------------------------

export type CodePaneProps = {
  /**
   * The composable the page boots, which IS its directory, its url segment and
   * its route name — `RegisteredScenario.route` (`D1`). The same string the
   * page header draws, so the snippet can never name a different composable
   * from the title above it.
   */
  name: string;
  /**
   * The scope the call is made at — the actor, and the record it is acting for
   * when the url names one. Read from the url, never held here: the snippet is
   * a rendering of the live page, so a scope change navigates and re-renders it
   * rather than being tracked.
   */
  scope: ScopeConfig;
  /**
   * The cell's own live request state. Absent for a module that owns none, and
   * the snippet then carries the call alone — there is no narrowing to inline.
   * The handle rather than a copy of its model: `model` is the composable's own
   * computed, so the fence recomputes from the same criteria the filter bar
   * writes (`AC3.3` — a computed, never a refresh).
   */
  criteria?: ModulePortCriteria;
};
