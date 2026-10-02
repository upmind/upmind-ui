<template>
  <Render :nodes="fillLayout()" />
</template>

<script setup lang="ts">
import {
  createVNode,
  Fragment,
  isVNode,
  useSlots,
  type FunctionalComponent,
  type VNode,
  type VNodeChild
} from "vue";
import {
  assign,
  eq,
  get,
  invoke,
  isArray,
  isNil,
  isObject,
  isPlainObject,
  map,
  omit,
  pick
} from "lodash-es";

// -----------------------------------------------------------------------------

const slots = useSlots();

// A rebuilt vnode must keep the page's ref, scoped-style id and directives.
const PAGE_FIELDS = ["ref", "scopeId", "dirs"] as const;

/** The page's layout: a component that takes named slots (or none yet). */
function isLayout(vnode: VNode): boolean {
  const isComponent = isObject(vnode.type);
  const hasNamedSlots = isNil(vnode.children) || isPlainObject(vnode.children);
  return isComponent && hasNamedSlots;
}

/** The main component's slots first, the page's own slots on top. */
function fillSlots(layout: VNode): VNode {
  const filled = assign(omit(slots, "default"), layout.children);
  return assign(
    createVNode(layout.type, get(layout, "props"), filled),
    pick(layout, PAGE_FIELDS)
  );
}

function filterChild(child: VNodeChild): VNodeChild {
  if (!isVNode(child)) return child;

  // The main component's <slot> wraps the page's layout in a Fragment.
  if (eq(child.type, Fragment) && isArray(child.children)) {
    const inner = map(child.children, grandchild => filterChild(grandchild));
    return createVNode(Fragment, get(child, "props"), inner);
  }

  if (!isLayout(child)) return child;
  return fillSlots(child);
}

/**
 * Fills the page's layout with the main component's named slots; the page's
 * own layout slots replace them.
 */
function fillLayout(): VNodeChild[] {
  return map(invoke(slots, "default"), child => filterChild(child));
}

// Built here, not in Render: a slot-content update re-renders this component only.
const Render: FunctionalComponent<{ nodes: VNodeChild[] }> = ({ nodes }) =>
  nodes;
</script>
