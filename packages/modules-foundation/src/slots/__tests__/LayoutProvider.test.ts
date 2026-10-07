/**
 * @fileoverview LayoutProvider: the main component's named slots fill the page's layout
 *
 * ## Job To Be Done
 * A self-closing layout gets the main component's own named slot in every slot
 * the main component gives; a slot the page writes on its layout replaces only
 * that slot, and the main component's slot comes back when the page stops
 * writing it. The slots stay current as the main component's values and the
 * page change. The layout vnode keeps the page's ref, scope id and directives.
 *
 * ## What Breaks If These Fail
 * A self-closing page draws an empty layout, a page override is lost or pushes
 * out the slots around it, a slot keeps stale values, or the page loses its
 * ref, scoped styles or directives on the layout.
 */

import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import {
  createCommentVNode,
  createTextVNode,
  defineComponent,
  Fragment,
  h
} from "vue";
import FrameLayout from "./FrameLayout.vue";
import MainOrganism from "./MainOrganism.vue";
import OverridePage from "./OverridePage.vue";
import ShortPage from "./ShortPage.vue";
import { get, map } from "lodash-es";
import type { VueWrapper } from "@vue/test-utils";
import type { VNodeChild } from "vue";

// -----------------------------------------------------------------------------

const framesOf = (wrapper: VueWrapper) =>
  map(wrapper.findAll("[data-frame]"), frame => frame.attributes("data-frame"));

const piecesOf = (wrapper: VueWrapper) =>
  map(wrapper.findAll("[data-piece]"), piece => piece.attributes("data-piece"));

const plansOf = (wrapper: VueWrapper) =>
  map(wrapper.findAll("[data-piece]"), piece => piece.attributes("data-plan"));

const mainWith = (content: () => VNodeChild) =>
  defineComponent({
    setup: () => () => h(MainOrganism, null, { default: content })
  });

const PlanPage = defineComponent({
  props: { plan: { type: String, required: true } },
  setup: props => () =>
    h(
      MainOrganism,
      { plan: props.plan },
      { default: () => h(FrameLayout, { title: "Domain" }) }
    )
});

const EVERY_DEFAULT = [
  "default-product-details",
  "default-image",
  "default-pricing"
];

// -----------------------------------------------------------------------------

describe("LayoutProvider, on the slots it fills", () => {
  it("fills every slot of a self-closing layout with the main component's slot", () => {
    const page = mount(ShortPage);

    expect(framesOf(page)).toEqual(["product-details", "image", "pricing"]);
    expect(piecesOf(page)).toEqual(EVERY_DEFAULT);
  });

  it("lets a page slot replace the main component's slot, and keeps the others", () => {
    const page = mount(OverridePage, { props: { fills: ["pricing"] } });

    expect(framesOf(page)).toEqual(["product-details", "image", "pricing"]);
    expect(piecesOf(page)).toEqual([
      "default-product-details",
      "default-image",
      "page-pricing"
    ]);
  });

  it("hands the layout a page slot the main component does not give", () => {
    const page = mount(OverridePage, { props: { fills: ["terms"] } });

    expect(framesOf(page)).toEqual([
      "product-details",
      "image",
      "pricing",
      "terms"
    ]);
    expect(piecesOf(page)).toEqual([...EVERY_DEFAULT, "page-terms"]);
  });
});

describe("LayoutProvider, as the main component and the page change", () => {
  it("renders each of its slots with the main component's values", () => {
    const page = mount(PlanPage, { props: { plan: "Pro" } });

    expect(piecesOf(page)).toEqual(EVERY_DEFAULT);
    expect(plansOf(page)).toEqual(["Pro", "Pro", "Pro"]);
  });

  it("re-renders its slots when the main component's value changes", async () => {
    const page = mount(PlanPage, { props: { plan: "Starter" } });

    expect(plansOf(page)).toEqual(["Starter", "Starter", "Starter"]);

    await page.setProps({ plan: "Pro" });

    expect(plansOf(page)).toEqual(["Pro", "Pro", "Pro"]);
  });

  it("puts its own slot back when the page stops writing that slot, and the page's when it writes it again", async () => {
    const page = mount(OverridePage, { props: { fills: ["image"] } });

    expect(piecesOf(page)).toEqual([
      "default-product-details",
      "page-image",
      "default-pricing"
    ]);

    await page.setProps({ fills: [] });

    expect(piecesOf(page)).toEqual(EVERY_DEFAULT);

    await page.setProps({ fills: ["image"] });

    expect(piecesOf(page)).toEqual([
      "default-product-details",
      "page-image",
      "default-pricing"
    ]);
  });

  it("updates a page slot when the page re-renders for another reason", async () => {
    const page = mount(OverridePage, { props: { fills: ["pricing"] } });

    await page.setProps({ title: "Hosting" });

    expect(page.find("h1").text()).toBe("Hosting");
    expect(page.find('[data-piece="page-pricing"]').text()).toBe("Hosting");
    expect(framesOf(page)).toEqual(["product-details", "image", "pricing"]);
  });
});

describe("LayoutProvider, on what the page's content holds", () => {
  it("looks through nested Fragments to the layout inside them", () => {
    const Root = mainWith(() =>
      h(Fragment, null, [
        h(Fragment, null, [h(FrameLayout, { title: "Domain" })])
      ])
    );

    expect(framesOf(mount(Root))).toEqual([
      "product-details",
      "image",
      "pricing"
    ]);
  });

  it("passes elements, comments and text beside the layout through untouched", () => {
    const Root = mainWith(() => [
      createTextVNode("Choose a term"),
      createCommentVNode("no banner"),
      h("aside", { "data-banner": "" }, [h("strong", "Sale")]),
      h(FrameLayout, { title: "Domain" })
    ]);

    const page = mount(Root);

    expect(page.text()).toContain("Choose a term");
    expect(page.html()).toContain("<!--no banner-->");
    expect(page.find("[data-banner] strong").text()).toBe("Sale");
    expect(page.find("[data-banner] [data-piece]").exists()).toBe(false);
    expect(framesOf(page)).toEqual(["product-details", "image", "pricing"]);
  });
});

describe("LayoutProvider, on the layout vnode the page wrote", () => {
  it("keeps the page's script-setup ref on the layout, before and after an update", async () => {
    const page = mount(OverridePage);

    expect(page.vm.layout?.$el).toBe(page.find("[data-layout]").element);

    await page.setProps({ fills: ["image"] });

    expect(page.vm.layout?.$el).toBe(page.find("[data-layout]").element);
  });

  it("keeps the page's scope id, so its scoped styles reach the layout", () => {
    const scopeId: unknown = get(OverridePage, "__scopeId");
    const page = mount(OverridePage);

    expect(scopeId).toMatch(/^data-v-/);
    expect(page.find("[data-layout]").attributes(String(scopeId))).toBe("");
  });

  it("keeps the page's directives on the layout", () => {
    const page = mount(OverridePage);

    expect(page.find("[data-layout]").attributes("data-marked")).toBe("");
  });
});
