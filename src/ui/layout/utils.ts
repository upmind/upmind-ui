// --- utils
import { isEmpty } from "lodash-es";
import { useSlots } from "vue";
import type { RendererElement, RendererNode, VNode } from "vue";

export function isEmptySlot(slot: string, slots: any): boolean {
  return (
    !slots?.[slot] ||
    slots[slot]().every(
      (
        vnode: VNode<
          RendererNode,
          RendererElement,
          {
            [key: string]: any;
          }
        >
      ) => {
        return (
          vnode.type === Comment ||
          (typeof vnode.type === "symbol" &&
            vnode.type.toString() === "Symbol(v-fgt)" &&
            isEmpty(vnode?.children))
        );
      }
    )
  );
}
