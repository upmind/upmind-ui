// --- utils

import { isEmpty } from "lodash-es";
import { Fragment, useSlots } from "vue";
import type { RendererElement, RendererNode, VNode } from "vue";

/**
 * Determines if a given slot is empty.
 *
 * This function checks if the specified slot in the `slots` object is empty.
 * It first retrieves the slot elements using the provided slot name. If no elements are found,
 * it returns `true`. Otherwise, it checks if the slot is either not present or all its nodes are
 * either comments or fragments with empty children.
 *
 * @param slot - The name of the slot to check.
 * @param slots - The object containing all available slots.
 * @returns `true` if the slot is empty, otherwise `false`.
 */
export function isEmptySlot(slot: string, slots: any): boolean {
  const slotFn = slots?.[slot];
  if (!slotFn) return true;

  const vnodes = slotFn();
  if (!vnodes || vnodes.length === 0) return true;

  return vnodes.every((vnode: VNode) => {
    // Ignore comments
    if (vnode.type === Comment) return true;
    // Ignore fragments with empty children
    if (vnode.type === Fragment && isEmpty(vnode.children)) return true;
    // Otherwise, it's meaningful content

    // console.debug("VNode found in slot:", slot, vnode);
    return false;
  });
}
