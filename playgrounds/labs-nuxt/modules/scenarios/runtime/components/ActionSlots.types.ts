/**
 * @graphify-citation `graphify-out/graph.json` (2026-08-10, 19273 nodes) — no
 * `ActionSlotItem` node exists beyond this file's own, and no
 * `ActionPlacementTypes` node exists anywhere; the placement enum is minted
 * once in `runtime/scenario.types.ts` and consumed here rather than
 * re-declared, and the colour/variant props are
 * `@upmind-automation/upmind-ui`'s own `ButtonProps`. See
 * `graphify-out/GRAPH_REPORT.md`. Re-queried 2026-08-13 over the same
 * `graphify-out/graph.json` for a replay-LOCK shape (`lock*`): the twelve
 * matches are all `block*` parser helpers, so nothing exists to consume — and
 * nothing is minted either, the lock being a boolean on the props already here.
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
  /** In flight — the control says so itself, in the Button's own treatment. */
  loading?: boolean;
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
  /**
   * A scenario is driving the surface, so every control here is held to what
   * the script fires (`R6-23`). The caller has already disabled the items; what
   * this adds is the REASON, said where the hand lands — a control that refuses
   * without saying why reads as broken rather than as intentional.
   */
  locked?: boolean;
  /**
   * Drawn as a footer group rather than beside a row: the cluster takes the
   * width it is given and its controls share it, through the Button's own
   * `block` treatment.
   */
  stretch?: boolean;
};
