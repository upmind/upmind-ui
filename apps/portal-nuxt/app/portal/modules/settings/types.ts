// -----------------------------------------------------------------------------
/**
 * @module portal/modules/settings/types
 * @description Prop contract for the `settings` module — the sandbox's own
 * settings dialog, seated by CONFIG like any other module rather than parked
 * in a corner of the viewport. A shape puts it wherever its design already
 * shows a Settings entry.
 */

import type { NavEmphasis } from "../../variants";

export interface SettingsModuleProps {
  /** `bar` matches a chrome bar's nav links; `rail` matches the sidebar's. */
  readonly presentation?: "rail" | "bar";
  /** `bar` only — the same item weighting its neighbouring links use (portal/variants.ts). */
  readonly emphasis?: NavEmphasis;
  /** The sidebar rail's collapsed state; `rail` only. */
  readonly collapsed?: boolean;
}
