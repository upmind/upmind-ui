// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/surfaces/DetailSurface.types
 * @description Type definitions for the Detail archetype surface.
 */

// `DetailUischema` is minted once in `runtime/scenario.types.ts` and consumed
// here — see its `graphify-out/graph.json` (2026-08-14) citation.
import type { SurfaceProps } from "./surface.types";
import type { DetailUischema } from "../../scenario.types";

// -----------------------------------------------------------------------------

export type DetailSurfaceProps = SurfaceProps & {
  /**
   * The scenario's own read declaration: which fields draw, in order, through
   * the same declared-cell renderers the table uses. Absent, the record is
   * dumped raw via `ContextPanel` — the single-read archetype's own default.
   * See the `graphify-out/` citation in `scenario.types.ts` for the minted-here
   * note on `DetailUischema`.
   */
  presentation?: DetailUischema;
};
