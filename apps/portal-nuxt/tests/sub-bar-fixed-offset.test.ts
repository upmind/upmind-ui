import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import type { ResolvedShell } from "~/portal/resolve";
import { FIXTURE_MODULE_ID } from "~/portal/registry";
import PortalFrame from "~/portal/shell/PortalFrame.vue";
import { PRIMITIVE_ID } from "~/portal/types";

/**
 * bdd.md B4 — "the stacked bars keep their own space". Each sub-bar's own
 * `top` must resolve from the chrome stacked ABOVE it, not a bar-specific
 * fixed value — paired blind with tests/sub-bar-fixed-offset.must-fail.patch.
 */
function frameProps(shell: ResolvedShell) {
  return {
    shell,
    sidebarLabel: "Primary navigation",
    sidebarCloseLabel: "Close navigation",
    sidebarBackLabel: "Back",
    actionPaneLabel: "Details",
    actionPaneCloseLabel: "Close details",
    skipLabel: "Skip to content"
  };
}

function shellWith(
  bars: readonly ("topbar" | "secondary" | "tertiary")[]
): ResolvedShell {
  const marker = {
    status: "module" as const,
    id: FIXTURE_MODULE_ID,
    variant: "default"
  };
  const primitives: ResolvedShell["primitives"] = {};
  if (bars.includes("topbar"))
    primitives[PRIMITIVE_ID.TOPBAR] = {
      variant: "full",
      slots: { left: marker }
    };
  if (bars.includes("secondary"))
    primitives[PRIMITIVE_ID.SECONDARY] = {
      variant: "default",
      slots: { left: marker }
    };
  if (bars.includes("tertiary"))
    primitives[PRIMITIVE_ID.TERTIARY] = {
      variant: "default",
      slots: { left: marker }
    };
  return { primitives, content: {} };
}

describe("PortalFrame — B4: the running sticky total", () => {
  afterEach(() => {
    Reflect.deleteProperty(globalThis, "useRoute");
  });

  it("each sub-bar's top is the running offset of the chrome above it, not a fixed value", () => {
    Object.assign(globalThis, { useRoute: () => ({ path: "/" }) });
    const wrapper = mount(PortalFrame, {
      props: frameProps(shellWith(["topbar", "secondary", "tertiary"]))
    });

    const secondary = wrapper.find('[data-level="secondary"]');
    const tertiary = wrapper.find('[data-level="tertiary"]');

    // Each bar reads its position off the running var, never a static top-N.
    expect(secondary.classes()).toContain("top-(--shell-sticky-offset)");
    expect(tertiary.classes()).toContain("top-(--shell-sticky-offset)");

    // The offset each bar declares locally is a running sum, distinct per
    // level — a fixed offset would collapse these to the same expression.
    const secondaryOffset = secondary.attributes("style");
    const tertiaryOffset = tertiary.attributes("style");
    expect(secondaryOffset).toContain(
      "--shell-sticky-offset: var(--shell-header-h);"
    );
    expect(tertiaryOffset).toContain(
      "--shell-sticky-offset: calc(var(--shell-header-h) + 1 * var(--shell-subbar-h));"
    );
    expect(secondaryOffset).not.toBe(tertiaryOffset);
  });

  it("removing the tertiary bar shortens the total without perturbing the secondary bar's own offset", () => {
    Object.assign(globalThis, { useRoute: () => ({ path: "/" }) });
    const threeBar = mount(PortalFrame, {
      props: frameProps(shellWith(["topbar", "secondary", "tertiary"]))
    });
    const twoBar = mount(PortalFrame, {
      props: frameProps(shellWith(["topbar", "secondary"]))
    });

    expect(twoBar.find('[data-level="tertiary"]').exists()).toBe(false);
    expect(twoBar.find('[data-level="secondary"]').attributes("style")).toBe(
      threeBar.find('[data-level="secondary"]').attributes("style")
    );
  });
});
