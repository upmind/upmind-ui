// -----------------------------------------------------------------------------
/**
 * @fileoverview Slot-emptiness detection
 *
 * ## Job To Be Done
 * `isEmptySlot` decides whether a slot has meaningful content. Twenty-plus
 * layout gates read it — `hasAside`, `hasFooter`, `hasControls`, `hasTabs`,
 * `hasNavigation` across the layouts, the sticky wrappers and the drawer
 * templates — to decide whether to render a region's chrome at all.
 *
 * The comment case is the reason these exist. A slot whose only content sits
 * behind a false `v-if` renders one comment vnode, and the function must report
 * that as empty. It did not: `Comment` was never imported from Vue, so
 * `vnode.type === Comment` compared against the global DOM `Comment` interface
 * and was false for every vnode ever passed. Every gate built on it was stuck
 * permanently on.
 *
 * ## What Breaks If These Fail
 * Empty aside columns, footers and control rows render their padding, borders
 * and sticky positioning around nothing — a visible empty panel on any page
 * whose optional slot is conditionally withheld.
 */

import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { defineComponent, h, Comment, Fragment } from "vue";
import { isEmptySlot } from "./isEmptySlot";

// -----------------------------------------------------------------------------

/** Reports what `isEmptySlot` saw for `aside` when the parent supplied `slot`. */
function probe(slot?: (props: unknown) => unknown): boolean {
  let seen: boolean | undefined;

  // Read during render, not in setup: isEmptySlot invokes the slot function, and
  // Vue warns when that happens outside the render context.
  const Probe = defineComponent({
    setup(_props, { slots }) {
      return () => {
        seen = isEmptySlot("aside", slots);
        return h("div");
      };
    }
  });

  mount(Probe, { slots: slot ? { aside: slot } : {} });
  return seen!;
}

describe("isEmptySlot", () => {
  it("reports a slot the parent never supplied as empty", () => {
    expect(probe()).toBe(true);
  });

  it("reports a slot whose only content is a false v-if as empty", () => {
    // The regression case: Vue renders `[<!--v-if-->]`, one Comment vnode.
    expect(probe(() => [h(Comment, "v-if")])).toBe(true);
  });

  it("reports a slot rendering an empty fragment as empty", () => {
    expect(probe(() => [h(Fragment, null, [])])).toBe(true);
  });

  it("reports a slot rendering no vnodes at all as empty", () => {
    expect(probe(() => [])).toBe(true);
  });

  it("reports a slot with real content as NOT empty", () => {
    expect(probe(() => [h("p", "Order summary")])).toBe(false);
  });

  it("reports a slot with content beside a comment as NOT empty", () => {
    // A `v-if`/`v-else` pair leaves the comment alongside the rendered branch.
    expect(probe(() => [h(Comment, "v-if"), h("p", "Order summary")])).toBe(
      false
    );
  });
});
