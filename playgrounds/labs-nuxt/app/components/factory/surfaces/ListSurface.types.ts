// -----------------------------------------------------------------------------
/**
 * @module factory/surfaces/ListSurface
 * @description Type definitions for the List archetype surface — TanStack
 * controlled/manual-mode binding to `port.table` (design.md FE-2977 §Block D).
 */

import type { SurfaceProps } from "./surface.types";
import type { ControlledTableChannel } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

/** A List row is whatever plain shape the composable's `context.data` carries. */
export type ListRow = Record<string, unknown>;

export type ListSurfaceProps = SurfaceProps & {
  /** The controlled-table seam — present iff the module owns table state (`classify`'s `hasTable`). */
  table: ControlledTableChannel;
};
