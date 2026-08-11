/**
 * @graphify-citation `graphify-out/graph.json` (2026-08-10, 19273 nodes) — no
 * `ActionSlotItem` node exists beyond this file's own, and no
 * `ActionPlacementTypes` node exists anywhere; the placement enum is minted
 * once in `runtime/scenario.types.ts` and consumed here rather than
 * re-declared, and the colour/variant props are
 * `@upmind-automation/upmind-ui`'s own `ButtonProps`. See
 * `graphify-out/GRAPH_REPORT.md`.
 */
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/ActionSlots.types
 * @description Type definitions for ActionSlots — every action drawn as the
 * scenario declared it, in the placement the scenario declared.
 */

import type { ActionPlacementTypes } from "../scenario.types";
import type { ButtonProps } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------

/** One declared action, pre-bound to its trigger by the calling surface. */
export type ActionSlotItem = {
  name: string;
  label: string;
  icon?: string;
  color?: ButtonProps["color"];
  variant?: ButtonProps["variant"];
  /** Where the scenario placed it. Absent, it falls to the overflow. */
  placement?: ActionPlacementTypes;
  disabled?: boolean;
  onSelect: () => void;
};

export type ActionSlotsProps = {
  /** Every available action; this component only decides WHERE each is drawn. */
  actions: ActionSlotItem[];
  /**
   * Beside a row, where the icon is the control: the declared label draws as
   * the tooltip and the accessible name instead of beside the icon.
   */
  iconOnly?: boolean;
};
