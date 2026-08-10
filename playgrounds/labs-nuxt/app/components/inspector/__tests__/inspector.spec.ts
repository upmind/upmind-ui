import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import { Inspector, useInspector } from "../index";
import { filter, find, map } from "lodash-es";
import type { VueWrapper } from "@vue/test-utils";

let wrapper: VueWrapper | undefined;

/**
 * The panel is a sheet: it teleports to `document.body` and renders nothing at
 * all while closed, so a section's content is reachable only once the inspector
 * is open, and only through the document rather than the mount wrapper.
 */
async function openInspector() {
  wrapper = mount(Inspector);
  useInspector().toggle();
  await wrapper.vm.$nextTick();
  await new Promise(resolve => setTimeout(resolve, 0));
}

const badges = () =>
  map(document.body.querySelectorAll('[data-test-key="badge"]'), element => ({
    text: element.textContent ?? "",
    classes: map(element.classList, name => name)
  }));

afterEach(() => {
  const inspector = useInspector();
  if (inspector.isOpen.value) inspector.toggle();
  inspector.clear();
  wrapper?.unmount();
  wrapper = undefined;
  document.body.innerHTML = "";
});

describe("@AC3 Inspector — Meta section delegates to MetaPanel", () => {
  it("renders a registered section's real meta through MetaPanel's badges", async () => {
    useInspector().add({
      key: "inspector-spec",
      factory: () => ({
        name: "Client emails",
        meta: { isLoading: false, hasError: true }
      })
    });

    await openInspector();

    expect(badges()).toHaveLength(2);
    expect(document.body.textContent).toMatch(/Is Loading/i);
    expect(document.body.textContent).toMatch(/Has Error/i);
  });

  it("excludes an '…invalid' meta key from the 'valid' badge colour when mounted through Inspector", async () => {
    useInspector().add({
      key: "inspector-spec-invalid",
      factory: () => ({
        name: "Client emails",
        meta: { isSomethingInvalid: true, isValid: true }
      })
    });

    await openInspector();

    const invalidBadge = find(badges(), badge => /invalid/i.test(badge.text));
    const validBadge = find(
      badges(),
      badge => badge.text.trim() === "Is Valid"
    );

    expect(invalidBadge?.classes).toContain("bg-accent-danger");
    expect(validBadge?.classes).toContain("bg-accent-success");
  });
});

describe("@AC3 Inspector — the panel overlays, it never pushes (P1-R5)", () => {
  it("renders the open panel outside the mounting tree, leaving the page's own flow empty", async () => {
    useInspector().add({
      key: "inspector-spec-overlay",
      factory: () => ({ name: "Client emails", meta: { isLoading: false } })
    });

    await openInspector();

    const panels = filter(
      document.body.querySelectorAll('[data-test-key="sheet-content"]'),
      element => !wrapper!.element.contains(element)
    );

    expect(panels).toHaveLength(1);
    expect(wrapper!.find('[data-test-key="badge"]').exists()).toBe(false);
  });
});
