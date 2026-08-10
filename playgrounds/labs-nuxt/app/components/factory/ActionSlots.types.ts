// -----------------------------------------------------------------------------
/**
 * @module factory/ActionSlots
 * @description Type definitions for ActionSlots — every action, rendered
 * identically across the always-visible, overflow and context-menu placements.
 */

// -----------------------------------------------------------------------------

/** One `snapshot.actions` member, pre-bound to its trigger by the calling surface. */
export type ActionSlotItem = {
  name: string;
  label: string;
  disabled?: boolean;
  onSelect: () => void;
};

export type ActionSlotsProps = {
  /** Every action, shown in all three placements — context-menu never gates reachability. */
  actions: ActionSlotItem[];
};
