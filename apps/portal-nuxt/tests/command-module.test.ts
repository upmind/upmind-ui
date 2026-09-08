import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import type { CommandModuleItem } from "~/portal/modules/command/types";
import { MOCK_ACTION, mockActionValue } from "~/portal/mock/actions";
import CommandModule from "~/portal/modules/command/Command.vue";

/**
 * The `command` module — the app shell's ⌘K launcher. The palette is the one
 * piece of the shell's chrome that is not reachable by pointing at it: the
 * shortcut IS the feature, so it is exercised here as a real document keydown,
 * never by calling the handler. Every pick leaves through the action seam's
 * `select` emit, exactly as the account menu's does.
 *
 * Paired blind with tests/command-module.must-fail.patch.
 */
const ITEMS: readonly CommandModuleItem[] = [
  {
    value: mockActionValue(MOCK_ACTION.NAVIGATE, "/billing"),
    label: "Billing"
  },
  {
    value: mockActionValue(MOCK_ACTION.NAVIGATE, "/support"),
    label: "Support"
  }
];

function mountCommand() {
  return mount(CommandModule, {
    props: {
      label: "Search…",
      title: "Command palette",
      placeholder: "Type a command or search…",
      emptyLabel: "No matches",
      heading: "Go to",
      items: ITEMS
    },
    attachTo: document.body
  });
}

// jsdom has no layout, so reka's scroll-into-view on the highlighted row
// throws where a browser would simply scroll.
Element.prototype.scrollIntoView = () => {};

function pressCommandK() {
  document.dispatchEvent(
    new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true })
  );
}

/** The palette renders through a Teleport, so its rows land on the body, not in the wrapper. */
function paletteText() {
  return document.body.textContent ?? "";
}

describe("command module — the ⌘K launcher", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders a trigger carrying its own copy and the shortcut it answers to", () => {
    const wrapper = mountCommand();
    const trigger = wrapper.get('[data-test-key="portal-command-trigger"]');

    expect(trigger.text()).toContain("Search…");
    // The keycaps are the promise the shortcut below has to keep.
    expect(trigger.text()).toContain("⌘");
    expect(trigger.text()).toContain("K");

    wrapper.unmount();
  });

  it("stays shut until asked, then opens on the shortcut alone", async () => {
    const wrapper = mountCommand();
    expect(paletteText()).not.toContain("Go to");

    pressCommandK();
    await wrapper.vm.$nextTick();

    expect(paletteText()).toContain("Go to");
    for (const item of ITEMS) expect(paletteText()).toContain(item.label);

    wrapper.unmount();
  });

  it("opens from the trigger too, so the shortcut is not the only way in", async () => {
    const wrapper = mountCommand();

    await wrapper
      .get('[data-test-key="portal-command-trigger"]')
      .trigger("click");

    expect(paletteText()).toContain("Go to");

    wrapper.unmount();
  });

  it("emits the picked row's action value, which is what the seam dispatches", async () => {
    const wrapper = mountCommand();
    pressCommandK();
    await wrapper.vm.$nextTick();

    // The library's prop-first `Command` stamps a `command-item` test key on
    // each row; the PARTS form this module composes does not, so the rows are
    // reached by the role reka gives them.
    const rows = document.querySelectorAll('[role="option"]');
    expect(rows.length).toBe(ITEMS.length);
    (rows[0] as HTMLElement).click();
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted("select")?.[0]).toEqual([ITEMS[0]?.value]);

    wrapper.unmount();
  });
});
