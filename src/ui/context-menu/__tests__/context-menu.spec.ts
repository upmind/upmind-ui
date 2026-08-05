import { mount, type VueWrapper } from "@vue/test-utils";
import { describe, it, expect, afterEach, beforeAll } from "vitest";
import { defineComponent, h } from "vue";
import type { ContextMenuItemProps } from "../../../index";

let barrel: typeof import("../../../index");

beforeAll(async () => {
  // lottie-web (icon-animated's dep) probes canvas support at import time;
  // jsdom has no native 2D context, so a bare barrel import throws before
  // any test runs. Stub only what that probe touches, then import for real.
  HTMLCanvasElement.prototype.getContext = (() => ({
    fillStyle: "",
    fillRect: () => {}
  })) as unknown as typeof HTMLCanvasElement.prototype.getContext;

  barrel = await import("../../../index");
});

describe("context-menu", () => {
  let wrapper: VueWrapper | undefined;

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
  });

  it("resolves the context-menu family from the package barrel", () => {
    expect(barrel.ContextMenu).toBeTruthy();
    expect(barrel.ContextMenuRoot).toBeTruthy();
    expect(barrel.ContextMenuTrigger).toBeTruthy();
    expect(barrel.ContextMenuPortal).toBeTruthy();
    expect(barrel.ContextMenuContent).toBeTruthy();
    expect(barrel.ContextMenuItem).toBeTruthy();
  });

  it("reveals its item only once the trigger receives a contextmenu event", async () => {
    const Host = defineComponent({
      setup() {
        return () =>
          h(barrel.ContextMenuRoot, null, {
            default: () => [
              h(barrel.ContextMenuTrigger, null, {
                default: () => "Right click me"
              }),
              h(barrel.ContextMenuPortal, null, {
                default: () =>
                  h(barrel.ContextMenuContent, null, {
                    default: () =>
                      h(
                        barrel.ContextMenuItem,
                        { value: "resend" },
                        { default: () => "Resend verification" }
                      )
                  })
              })
            ]
          });
      }
    });

    wrapper = mount(Host, { attachTo: document.body });

    expect(document.body.textContent).not.toContain("Resend verification");

    await wrapper.get("span").trigger("contextmenu");

    expect(document.body.textContent).toContain("Resend verification");
  });

  it("mounts the data-driven convenience component from its items prop", () => {
    const items: ContextMenuItemProps[] = [
      { label: "Resend verification", value: "resend" },
      { label: "Delete", value: "delete" }
    ];

    wrapper = mount(barrel.ContextMenu, {
      props: { items },
      attachTo: document.body
    });

    expect(wrapper.exists()).toBe(true);
  });
});
