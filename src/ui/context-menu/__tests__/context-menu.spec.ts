import { mount, type VueWrapper } from "@vue/test-utils";
import { describe, it, expect, afterEach, beforeAll, vi } from "vitest";
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

  it("renders every visible item's label from the items prop", async () => {
    const items: ContextMenuItemProps[] = [
      { label: "Resend verification", value: "resend" },
      { label: "Delete", value: "delete" }
    ];

    wrapper = mount(barrel.ContextMenu, {
      props: { items, label: "Actions" },
      attachTo: document.body
    });

    await wrapper.get("span").trigger("contextmenu");

    expect(document.body.textContent).toContain("Resend verification");
    expect(document.body.textContent).toContain("Delete");
    expect(wrapper.findAllComponents(barrel.ContextMenuItem)).toHaveLength(
      items.length
    );
  });

  it("does not render an item marked hidden", async () => {
    const items: ContextMenuItemProps[] = [
      { label: "Resend verification", value: "resend" },
      { label: "Delete", value: "delete", hidden: true }
    ];

    wrapper = mount(barrel.ContextMenu, {
      props: { items, label: "Actions" },
      attachTo: document.body
    });

    await wrapper.get("span").trigger("contextmenu");

    expect(document.body.textContent).toContain("Resend verification");
    expect(document.body.textContent).not.toContain("Delete");
    expect(wrapper.findAllComponents(barrel.ContextMenuItem)).toHaveLength(1);
  });

  it("invokes only the selected item's own handler", async () => {
    const resendHandler = vi.fn();
    const deleteHandler = vi.fn();
    const items: ContextMenuItemProps[] = [
      { label: "Resend verification", value: "resend", handler: resendHandler },
      { label: "Delete", value: "delete", handler: deleteHandler }
    ];

    wrapper = mount(barrel.ContextMenu, {
      props: { items, label: "Actions" },
      attachTo: document.body
    });

    await wrapper.get("span").trigger("contextmenu");

    const menuItems = wrapper.findAllComponents(barrel.ContextMenuItem);
    await menuItems[1].vm.$emit("select", new Event("select"));

    expect(deleteHandler).toHaveBeenCalledTimes(1);
    expect(resendHandler).not.toHaveBeenCalled();
  });
});
