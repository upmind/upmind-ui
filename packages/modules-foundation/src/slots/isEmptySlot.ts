import { Comment, Fragment, type Slots, type VNode } from "vue";
import { isEmpty } from "lodash-es";

/**
 * Determines if a given slot is empty.
 *
 * Returns `true` when the slot is absent, renders no vnodes, or renders only
 * comments / empty fragments; `false` once it has meaningful content.
 *
 * @param slot - The name of the slot to check.
 * @param slots - The object containing all available slots.
 */
export function isEmptySlot(slot: string, slots: Slots): boolean {
  const slotFn = slots?.[slot];
  if (!slotFn) return true;

  const vnodes = slotFn();
  if (!vnodes || vnodes.length === 0) return true;

  return vnodes.every((vnode: VNode) => {
    if (vnode.type === Comment) return true;
    if (vnode.type === Fragment && isEmpty(vnode.children)) return true;
    return false;
  });
}
