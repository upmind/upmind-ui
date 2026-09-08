import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import PortalContent from "~/portal/content/PortalContent.vue";
import { ROW_LAYOUT, ROW_SURFACE } from "~/portal/content/types";
import { BUTTON_MODULE_VARIANT } from "~/portal/modules/button/types";
import {
  BUTTON_MODULE_ID,
  PAGINATION_MODULE_ID,
  moduleRef
} from "~/portal/registry";
import { resolve } from "~/portal/resolve";

/**
 * The row surface, heading and footer (`content/types.ts`) — the three shapes
 * every reference portal repeats around its content. Asserted on the RENDERED
 * DOM, never on the resolved config read back at itself: a heading that
 * resolves but never reaches the page is the failure this guards.
 *
 * Paired blind with tests/row-surface-bare.must-fail.patch.
 */
function mountRows(rows: ReturnType<typeof resolve>["content"]["rows"]) {
  return mount(PortalContent, { props: { rows } });
}

// A fixture with the full vocabulary — a brand panel wearing a footer pager,
// then plain sections — so the framework proof no longer rides any shipped
// brand's copy (Rockzone, which carried it, retired into hostgrid).
function fixtureRows() {
  return resolve({
    primitives: {},
    content: {
      rows: [
        {
          layout: ROW_LAYOUT.FULL,
          surface: ROW_SURFACE.BRAND,
          header: {
            title: "Recent Progress",
            actions: rowButton("All progress")
          },
          footer: moduleRef(PAGINATION_MODULE_ID, {
            props: {
              total: 40,
              itemsPerPage: 10,
              label: "Progress pages",
              info: "This Week · W20"
            }
          }),
          slots: [rowButton("Progress body")]
        },
        {
          layout: ROW_LAYOUT.FULL,
          surface: ROW_SURFACE.SECTION,
          header: { title: "My Sessions", actions: rowButton("Browse") },
          slots: [rowButton("Sessions body")]
        },
        {
          layout: ROW_LAYOUT.FULL,
          surface: ROW_SURFACE.SECTION,
          header: { title: "Recent orders", actions: rowButton("View all") },
          slots: [rowButton("Orders body")]
        },
        {
          layout: ROW_LAYOUT.FULL,
          surface: ROW_SURFACE.SECTION,
          header: { title: "Saved Classes", actions: rowButton("All saved") },
          slots: [rowButton("Saved body")]
        }
      ]
    },
    groups: [],
    customAreas: []
  }).content.rows;
}

function rowButton(label: string) {
  return moduleRef(BUTTON_MODULE_ID, {
    variant: BUTTON_MODULE_VARIANT.SINGLE,
    props: { label }
  });
}

describe("row surface — a heading and its actions reach the page", () => {
  beforeEach(() => {
    Object.assign(globalThis, { useRoute: () => ({ path: "/" }) });
  });
  afterEach(() => {
    Reflect.deleteProperty(globalThis, "useRoute");
  });

  it("renders every configured row heading as text", () => {
    const wrapper = mountRows(fixtureRows());

    for (const title of [
      "Recent Progress",
      "My Sessions",
      "Recent orders",
      "Saved Classes"
    ]) {
      expect(wrapper.text()).toContain(title);
    }
  });

  it("renders each heading's own trailing controls beside it", () => {
    const wrapper = mountRows(fixtureRows());

    // one per row, each the reference's own copy — not a shared default
    for (const label of ["All progress", "Browse", "View all", "All saved"]) {
      expect(wrapper.text()).toContain(label);
    }
  });

  it("renders the brand panel's footer pager, with its configured info", () => {
    const wrapper = mountRows(fixtureRows());

    expect(wrapper.find('[data-test-key="portal-pagination"]').exists()).toBe(
      true
    );
    expect(wrapper.text()).toContain("This Week · W20");
  });

  it("marks each row with the surface it was configured with", () => {
    const wrapper = mountRows(fixtureRows());
    const surfaces = wrapper
      .findAll('[data-test-key="portal-section"]')
      .map(node => node.attributes("data-test-value"));

    expect(surfaces).toEqual(["brand", "section", "section", "section"]);
  });

  it("renders a row that declares no surface, heading or footer BARE — no wrapper at all", () => {
    const rows = resolve({
      primitives: {},
      content: {
        rows: [
          {
            layout: ROW_LAYOUT.FULL,
            slots: [
              moduleRef(BUTTON_MODULE_ID, {
                variant: BUTTON_MODULE_VARIANT.SINGLE,
                props: { label: "Bare row control" }
              })
            ]
          }
        ]
      },
      groups: [],
      customAreas: []
    }).content.rows;

    const wrapper = mountRows(rows);

    // the module still renders...
    expect(wrapper.text()).toContain("Bare row control");
    // ...but nothing wraps it, so every row written before this existed is
    // unchanged rather than silently gaining an empty card.
    expect(wrapper.find('[data-test-key="portal-section"]').exists()).toBe(
      false
    );
  });

  it("puts a configured surface on a row even when it carries no heading", () => {
    const rows = resolve({
      primitives: {},
      content: {
        rows: [
          {
            layout: ROW_LAYOUT.FULL,
            surface: ROW_SURFACE.PANEL,
            slots: [
              moduleRef(BUTTON_MODULE_ID, {
                variant: BUTTON_MODULE_VARIANT.SINGLE,
                props: { label: "Panelled control" }
              })
            ]
          }
        ]
      },
      groups: [],
      customAreas: []
    }).content.rows;

    const wrapper = mountRows(rows);
    const section = wrapper.find('[data-test-key="portal-section"]');

    expect(section.exists()).toBe(true);
    expect(section.attributes("data-test-value")).toBe("panel");
    expect(wrapper.text()).toContain("Panelled control");
  });
});
