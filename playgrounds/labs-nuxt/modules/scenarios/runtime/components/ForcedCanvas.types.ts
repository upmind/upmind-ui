/**
 * @graphify-citation `graphify-out/graph.json` (2026-08-11, 6795 nodes) — no
 * `ForcedCanvas` / `ForceController` / forced-affordance node exists anywhere in
 * the tree, and the only `canvas` nodes are `client-vue`'s `CanvasCard.layout`
 * and its session template, which are page CARDS rather than a frame around a
 * page. The preset vocabulary is NOT minted here: `ForcePreset` and
 * `FORCE_URL_PRESETS` are minted once in `composables/useForcedState.types.ts`
 * and consumed. See `graphify-out/GRAPH_REPORT.md`.
 */
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/ForcedCanvas.types
 * @description The forced affordance's contract — what the frame is told, and
 * what each preset is CALLED. Both halves of the affordance read the names from
 * here (the controller offers them, the frame says which one is on), so the
 * picker and the chip can never call one state two things.
 */

import type { ForcePreset } from "../composables/useForcedState.types";

// -----------------------------------------------------------------------------

/**
 * One i18n key per preset (`S21` — a rendered name is a key, never a literal).
 * `replay` is keyed like the rest even though the picker never offers it: the
 * player arms it, and the frame still has to name what it is showing.
 */
export const FORCE_PRESET_LABELS: Record<ForcePreset, string> = {
  empty: "labs.force_preset_empty",
  "error-action": "labs.force_preset_error_action",
  "error-collection": "labs.force_preset_error_collection",
  loading: "labs.force_preset_loading",
  replay: "labs.force_preset_replay"
};

/**
 * The presets that CANNOT show themselves the moment they are armed, and what
 * the frame says instead (`R7-5`).
 *
 * Every other preset answers the collection READ, so the page re-asks through
 * the new transport and the state is on screen at once. `error-action` answers a
 * WRITE: nothing is written until a hand fires a row action, so the surface is
 * honestly unchanged until one is. The frame therefore says so out loud rather
 * than leaving an armed preset looking like a control that did nothing — a page
 * that fired the write ITSELF to make the state appear would be inventing an
 * action nobody asked for, against whichever row it guessed.
 */
export const FORCE_PRESET_HINTS: Partial<Record<ForcePreset, string>> = {
  "error-action": "labs.force_preset_error_action_pending"
};

export type ForcedCanvasProps = {
  /**
   * The preset actually armed — `useForcedState`'s own `preset`, handed in
   * rather than read here. The frame is presentational: the page that composes
   * it holds the one forced-state handle, so the frame cannot disagree with the
   * worker about what is being served, and an armed state stays renderable
   * while the corpus seam is unresolved (`ESC6`).
   */
  preset?: ForcePreset;
};
