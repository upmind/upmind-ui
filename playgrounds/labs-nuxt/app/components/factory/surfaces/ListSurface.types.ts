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

/**
 * The well-known List action names, grounded against the live client-emails
 * canary port (`useClientEmails.actions.ts`) — a module that doesn't expose
 * one of these simply never surfaces that control; the renderer never
 * invents or guesses a key.
 */
export const LIST_SURFACE_ACTION = {
  DELETE: "remove",
  SET_DEFAULT: "setDefault",
  RESEND: "verify",
  ADD: "ensure"
} as const;

export type ListSurfaceProps = SurfaceProps & {
  /** The controlled-table seam — present iff the module owns table state (`classify`'s `hasTable`); absent modules degrade to a read-only row list. */
  table?: ControlledTableChannel;
};
