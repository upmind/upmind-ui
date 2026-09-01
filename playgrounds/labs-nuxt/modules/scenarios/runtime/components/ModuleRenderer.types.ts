/**
 * @graphify-citation `graphify-out/graph.json` (2026-08-10, 6795 nodes) — no
 * `ScenarioPresentation` / `ResolvedHandoff` node exists anywhere in the tree;
 * both are minted once in `runtime/scenario.types.ts` and consumed here rather
 * than re-declared. See `graphify-out/GRAPH_REPORT.md`. Re-queried 2026-08-13
 * over the same `graphify-out/graph.json` for a replay-LOCK shape (`lock*`):
 * the twelve matches are all `block*` parser helpers, so nothing exists to
 * consume — and nothing is minted either, the lock being a boolean relayed on.
 */
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/ModuleRenderer.types
 * @description Type definitions for ModuleRenderer — the archetype dispatcher.
 */

// `ResolvedDetail` added below is minted once in `runtime/scenario.types.ts`
// and consumed here — see its `graphify-out/graph.json` (2026-08-14) citation.
import type { ModulePort } from "../composables/useModulePort.types";
import type {
  ResolvedDetail,
  ResolvedHandoff,
  ScenarioPresentation
} from "../scenario.types";
import type { ModuleDescriptor } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

export type ModuleRendererProps<K extends string = string> = {
  /** The reflected IR — read-only; `descriptor.archetype.archetype` is the one dispatch key. */
  descriptor: ModuleDescriptor<K>;
  /**
   * The live port the descriptor was reflected from, as the ONE builder
   * publishes it (`useModulePort`) — the seam `CompositionPort` widened by the
   * criteria and debug branches the raw-cell holder relays. Typed at the
   * builder's surface, never re-narrowed to the frozen core shape, or the
   * criteria a list surface is handed cannot be named.
   */
  port: ModulePort;
  /** How the scenario declared itself DRAWN — relayed, never interpreted here. */
  presentation?: ScenarioPresentation;
  /** The scenario's declared handoffs, already resolved to their targets — relayed. */
  handoffs?: Record<string, ResolvedHandoff>;
  /**
   * The scenario's read composable, resolved to its target — relayed to the
   * List surface, which opens the read overlay with it. Absent, the overlay
   * renders the clicked row's own data. See the `graphify-out/` citation on
   * `ResolvedDetail` in `scenario.types.ts`.
   */
  detail?: ResolvedDetail;
  /**
   * A scenario is driving the page, so the surface under it is a playback
   * (`R6-23`) — relayed like everything else here. Only the List surface reads
   * it: it is the one the ruling enumerates controls for.
   */
  locked?: boolean;
  /**
   * The module's own recorded refusal sentence while the page is forced into
   * `error-action` — relayed to the List surface, which draws its first
   * actionable row already refused with it. A forced state is the state and
   * renders on arming, with no interaction at all (operator ruling,
   * 2026-08-28).
   *
   * @graphify-citation `graphify query "is there an existing contract or field
   * carrying a recorded write refusal fixture or a refusal sentence for a forced
   * row"` (2026-08-28, FE-3113 O) — the only matches are the test lane's own
   * refusal-sentence helpers, which app runtime may not consume. Nothing is
   * minted: this relays a string, exactly as `locked` relays a boolean. See
   * `graphify-out/GRAPH_REPORT.md`.
   */
  forcedRefusal?: string;
};
