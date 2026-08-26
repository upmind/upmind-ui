/**
 * @fileoverview Which slot gates go stale in a computed, and which do not.
 *
 * Two shapes look alike and behave differently, so both are pinned here:
 *
 * - `isEmptySlot(name, slots)` INVOKES the slot, which reads whatever reactive
 *   state the parent's content is gated on. The computed therefore picks that
 *   dependency up transitively and re-derives. Not stale.
 * - `!!slots.name` only tests presence. Vue's `useSlots` is not reactive and no
 *   slot is invoked, so nothing is tracked and the computed caches forever.
 *   That one needs the DS ui's reactive `useSlots`.
 */

import { useSlots as useReactiveSlots } from "@upmind/ui";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { computed, defineComponent, h, useSlots } from "vue";
import { isEmptySlot } from "./isEmptySlot";

// -----------------------------------------------------------------------------

type Gate = "content" | "presence" | "presence-reactive";

function makeChild(gate: Gate) {
  return defineComponent({
    setup() {
      const slots =
        gate === "presence-reactive" ? useReactiveSlots() : useSlots();
      const meta = computed(() => {
        if (gate === "content") return { has: !isEmptySlot("aside", slots) };
        return { has: !!slots.aside };
      });
      return () => h("div", meta.value.has ? "HAS" : "EMPTY");
    }
  });
}

/** Always supplies `aside`; gates only its CONTENT (the `Basket.vue` shape). */
function mountContentGated(Child: ReturnType<typeof makeChild>) {
  return mount(
    defineComponent({
      props: { show: { type: Boolean, default: false } },
      setup(props) {
        return () =>
          h(Child, null, { aside: () => (props.show ? h("p", "x") : []) });
      }
    })
  );
}

/** Supplies `aside` only when asked — the slot NAME comes and goes. */
function mountNameGated(Child: ReturnType<typeof makeChild>) {
  return mount(
    defineComponent({
      props: { show: { type: Boolean, default: false } },
      setup(props) {
        return () =>
          props.show ? h(Child, null, { aside: () => h("p", "x") }) : h(Child);
      }
    })
  );
}

describe("slot gates in a computed", () => {
  it("isEmptySlot re-derives: invoking the slot captures the parent's deps", async () => {
    const wrapper = mountContentGated(makeChild("content"));
    expect(wrapper.text()).toBe("EMPTY");

    await wrapper.setProps({ show: true });
    expect(wrapper.text()).toBe("HAS");

    await wrapper.setProps({ show: false });
    expect(wrapper.text()).toBe("EMPTY");
  });

  it("bare presence goes stale on Vue's useSlots", async () => {
    const wrapper = mountNameGated(makeChild("presence"));
    expect(wrapper.text()).toBe("EMPTY");

    await wrapper.setProps({ show: true });
    expect(wrapper.text()).toBe("EMPTY");
  });

  it("bare presence re-derives on the DS ui's reactive useSlots", async () => {
    const wrapper = mountNameGated(makeChild("presence-reactive"));
    expect(wrapper.text()).toBe("EMPTY");

    await wrapper.setProps({ show: true });
    expect(wrapper.text()).toBe("HAS");
  });
});
