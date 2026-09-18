import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import type { RowSurface } from "~/portal/content/types";
import PortalContent from "~/portal/content/PortalContent.vue";
import { ROW_LAYOUT, ROW_SURFACE } from "~/portal/content/types";
import { BANNER_VARIANT } from "~/portal/modules/banner/types";
import { BANNER_MODULE_ID, moduleRef } from "~/portal/registry";
import { resolve } from "~/portal/resolve";

/**
 * Which ground an alert is drawn over decides how it is drawn.
 *
 * `Alert`'s default `muted` appearance fills with the intent's soft tint —
 * `rgb(247,249,255)` for `info`. The portal's page ground is
 * `rgb(249,249,252)`. Two points apart, with no border, the notice reads as a
 * smudge; inside a panel, over white, the same fill reads correctly.
 *
 * So the rule is about the ROW, not the message: a row that paints a ground of
 * its own keeps the fill, and a row that leaves the page ground showing takes
 * the `outline` appearance instead — a neutral surface with an intent border.
 * `section` counts as the page ground: it is the ghost card, a heading with no
 * chrome.
 *
 * Asserted on the rendered DOM through the real row chain, because the rule
 * lives in a provide/inject between `PortalSection` and the module inside it —
 * reading the config back at itself would prove nothing about what paints.
 */
function bannerRow(surface?: RowSurface) {
  return {
    layout: ROW_LAYOUT.FULL,
    ...(surface === undefined ? {} : { surface }),
    slots: [
      moduleRef(BANNER_MODULE_ID, {
        variant: BANNER_VARIANT.NOTICE,
        props: {
          title: "Email history",
          message: "Messages can take five minutes to appear.",
          tone: "info",
          label: "Delivery notice",
          dismissLabel: "Dismiss"
        }
      })
    ]
  };
}

function alertClassesFor(surface?: RowSurface) {
  const resolved = resolve({
    primitives: {},
    content: { rows: [bannerRow(surface)] }
  });
  const wrapper = mount(PortalContent, {
    props: { rows: resolved.content.rows }
  });
  const alert = wrapper.find('[data-test-key="alert"]');
  expect(alert.exists()).toBe(true);
  return alert.classes();
}

describe("an alert takes its appearance from the ground it is drawn over", () => {
  it("takes the outline appearance on a row that paints nothing", () => {
    const classes = alertClassesFor();

    expect(classes).toContain("bg-surface");
    expect(classes).toContain("border");
  });

  it("takes it on a `section` row too, which is the ghost card", () => {
    const classes = alertClassesFor(ROW_SURFACE.SECTION);

    expect(classes).toContain("bg-surface");
  });

  it("keeps the soft fill inside a panel, which paints its own white", () => {
    const classes = alertClassesFor(ROW_SURFACE.PANEL);

    expect(classes).toContain("bg-info-muted");
    expect(classes).not.toContain("bg-surface");
  });

  it("keeps it on a muted panel as well", () => {
    const classes = alertClassesFor(ROW_SURFACE.MUTED);

    expect(classes).toContain("bg-info-muted");
  });
});
