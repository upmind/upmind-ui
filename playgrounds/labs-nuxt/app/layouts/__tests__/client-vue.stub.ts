// -----------------------------------------------------------------------------
/**
 * @module layouts/__tests__/client-vue.stub
 * @description The `client-vue` chrome the app auto-imports, reduced to its SLOT
 * BOUNDARIES — the double `default-layout.spec.ts` reads WHICH slot the layout
 * handed a surface to.
 *
 * Two reasons the real components cannot serve here. `UpmHeader` mounts
 * `HeaderBrand.vue`, which reads brand image state a bare vitest graph never
 * boots (`packages/client-vue/src/components/header/Header.vue` →
 * `HeaderBrand.vue:41`); and a rendered slot leaves no mark, so nothing in the
 * DOM says which of the header's two slots the bar arrived through.
 *
 * `HEADER_SLOTS` is the header's own published set — `branding` and `actions`,
 * and only those (`Header.vue:25,43`). The double names both unconditionally:
 * the real header gates each on its own `meta`, and a slot that renders nothing
 * would otherwise read the same as a slot the layout never filled.
 */

import { defineComponent, h } from "vue";
import { map } from "lodash-es";
import type { Slots } from "vue";

// -----------------------------------------------------------------------------

const HEADER_SLOTS = ["branding", "actions"];

const marked = (key: string, value?: string) => ({
  "data-test-key": key,
  ...(value === undefined ? {} : { "data-test-value": value })
});

/** A boundary that renders nothing of its own beyond the slot it is given. */
const passthrough = (key: string) =>
  defineComponent({
    inheritAttrs: false,
    setup:
      (_props, { slots }) =>
      () =>
        h("div", marked(key), slots.default?.())
  });

const headerSlot = (name: string, slots: Slots) =>
  h("div", marked("chrome-header-slot", name), slots[name]?.());

export const UpmHeader = defineComponent({
  name: "UpmHeader",
  inheritAttrs: false,
  setup:
    (_props, { slots }) =>
    () =>
      h(
        "header",
        marked("chrome-header"),
        map(HEADER_SLOTS, name => headerSlot(name, slots))
      )
});

export const UpmPage = passthrough("chrome-page");

export const UpmMain = passthrough("chrome-main");

export const UpmRoot = passthrough("chrome-root");

export const UpmOverlayController = defineComponent({
  name: "UpmOverlayController",
  setup: () => () => h("div", marked("chrome-overlays"))
});
