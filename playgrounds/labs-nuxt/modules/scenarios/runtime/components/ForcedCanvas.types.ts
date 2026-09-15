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
 * here (the scenario menu offers them, the frame says which one is on), so the
 * picker and the chip can never call one state two things.
 */

import type { ForcePreset } from "../composables/useForcedState.types";

// -----------------------------------------------------------------------------

/**
 * The ONE name this app still owns (`S21` — a rendered name is a key, never a
 * literal): `replay` is the state no scenario of a module's feature declares,
 * because the PLAYER arms it, so there is no title to carry and the frame still
 * has to name what it is showing.
 *
 * The four keys beside it are retired (operator ruling, 2026-09-12). A forced
 * state is a scenario of the module's own feature and is named by that
 * scenario's own title, so a catalogue of four names could only ever say
 * something other than what the picker offered. Nothing is minted in their
 * place — see this file's head citation and `graphify-out/GRAPH_REPORT.md`.
 */
export const FORCE_REPLAY_LABEL = "labs.force_preset_replay";

export type ForcedCanvasProps = {
  /**
   * The preset actually armed — `useForcedState`'s own `preset`, handed in
   * rather than read here. The frame is presentational: the page that composes
   * it holds the one forced-state handle, so the frame cannot disagree with the
   * worker about what is being served, and an armed state stays renderable
   * while the corpus seam is unresolved (`ESC6`).
   */
  preset?: ForcePreset;
  /**
   * What the armed state is CALLED — the scenario's own title, handed down by
   * the page. Absent under `replay`, which no feature declares and which the
   * frame names from {@link FORCE_REPLAY_LABEL}.
   */
  label?: string;
};
