// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/PanelHeader.types
 * @description Type definitions for a panel's heading. The control shape is
 * `ActionSlotItem`, minted once in `ActionSlots.types.ts` and consumed here.
 */

import type { ActionSlotItem } from "./ActionSlots.types";

// -----------------------------------------------------------------------------

export type PanelHeaderProps = {
  /** The panel's heading, already translated. */
  name: string;
  /** The collection's own header controls, already bound by the surface. */
  actions?: ActionSlotItem[];
  /** A scenario is driving the panel, so its controls say why they will not fire. */
  locked?: boolean;
};
