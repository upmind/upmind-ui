// -----------------------------------------------------------------------------
/**
 * @fileoverview LookupRenderer component tests (client-notes-product-lookup B4–B7)
 *
 * ## Job To Be Done
 * A `Lookup` whose `options.lookup` carries a live service renders as a
 * server-driven remote-select: it drives `useLookup(service(), { searchScope })`,
 * forwards the typed term to `search`, renders the service's items, offers a
 * renderer-owned "Load more" that calls `loadMore` (gated on `hasMore`, disabled
 * while loading), writes the chosen value back through `onInput`, and shows an
 * already-linked product's label before any search. A control with NO service
 * falls back to a plain input and never touches `useLookup`.
 *
 * ## What Breaks If These Fail
 * The editor's product select can no longer search or page the client's
 * products, silently drops the current link on open, or throws when a schema
 * omits the service — the exact regressions this story exists to prevent.
 *
 * `useLookup` (the headless adapter) is the mocked seam: this file proves the
 * RENDERER's wiring to it, not the adapter's paging (that is the headless
 * integration suite, `client-notes.lookups.int.test.ts`).
 */

import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, ref } from "vue";
import { createI18n } from "vue-i18n";
import { UpmForm } from "../../index";
import { useFormI18n } from "../../useFormI18n";
import { messages } from "./filter.harness";
import { find, map } from "lodash-es";
import type { VueWrapper } from "@vue/test-utils";

const { useLookupMock } = vi.hoisted(() => ({ useLookupMock: vi.fn() }));

vi.mock("@upmind-automation/headless", async orig => {
  const actual = await orig<Record<string, unknown>>();
  return { ...actual, useLookup: useLookupMock };
});

type LookupItem = { value: string; label: string };
type Meta = {
  isLoading: boolean;
  hasMore: boolean;
  hasErrors: boolean;
  isEmpty: boolean;
};
type Handle = {
  items: { value: LookupItem[] };
  total: { value: number };
  meta: { value: Meta };
  error: { value: unknown };
  search: ReturnType<typeof vi.fn>;
  loadMore: ReturnType<typeof vi.fn>;
  refresh: ReturnType<typeof vi.fn>;
};

function makeHandle(over: Partial<Handle> = {}): Handle {
  return {
    items: ref<LookupItem[]>([
      { value: "a", label: "Alpha" },
      { value: "b", label: "Beta" }
    ]),
    total: ref<number>(5),
    meta: ref<Meta>({
      isLoading: false,
      hasMore: true,
      hasErrors: false,
      isEmpty: false
    }),
    error: ref(undefined),
    search: vi.fn(),
    loadMore: vi.fn(),
    refresh: vi.fn(),
    ...over
  } as Handle;
}

const CONTROL_SCOPE = "#/properties/contract_product_id";

function mountControl(
  options: Record<string, unknown> | undefined,
  model0: Record<string, unknown> = {}
): { wrapper: VueWrapper; model: () => Record<string, unknown> } {
  const model = ref<Record<string, unknown>>(model0);
  const i18n = createI18n({ legacy: false, locale: "en", messages });
  const schema = {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    properties: {
      contract_product_id: { type: ["string", "null"], title: "Linked product" }
    }
  };
  // No options means no lookup at all: a plain `Control`, never this renderer.
  const element = options
    ? { type: "Lookup", scope: CONTROL_SCOPE, options }
    : { type: "Control", scope: CONTROL_SCOPE };
  const uischema = { type: "VerticalLayout", elements: [element] };

  const harness = defineComponent({
    setup() {
      const translator = useFormI18n();
      return () =>
        h(UpmForm, {
          noActions: true,
          touched: true,
          schema,
          uischema,
          modelValue: model.value,
          "onUpdate:modelValue": (next: Record<string, unknown>) =>
            (model.value = next),
          i18n: translator.value
        });
    }
  });

  const wrapper = mount(harness, {
    attachTo: document.body,
    global: { plugins: [i18n] }
  });
  return { wrapper, model: () => model.value };
}

const flush = () => new Promise(resolve => setTimeout(resolve, 60));

/** Every option the open popover currently draws, teleported to the body. */
const renderedItems = () => [
  ...document.body.querySelectorAll('[data-test-key="combobox-item"]')
];

/** The renderer-owned "Load more" button — teleported into the popover with the
 *  results — or `undefined` when it is not drawn. */
const loadMoreButton = (): HTMLElement | undefined =>
  [...document.body.querySelectorAll('[data-test-key="button"]')].find(button =>
    /more/i.test(button.textContent ?? "")
  ) as HTMLElement | undefined;

async function openCombobox(wrapper: VueWrapper): Promise<void> {
  const input = wrapper.find('[data-test-key="combobox-input"]');
  await input.trigger("focus");
  await input.trigger("click");
  await vi.waitFor(() => {
    expect(renderedItems().length).toBeGreaterThan(0);
  });
}

const withService = (over: Record<string, unknown> = {}) => ({
  lookup: { service: () => ({}), searchScope: "filters.search.like", ...over }
});

// -----------------------------------------------------------------------------

describe("LookupRenderer — the contract-product remote-select control", () => {
  beforeEach(() => {
    // jsdom implements no layout, so reka's highlight-scroll would reject.
    Element.prototype.scrollIntoView = vi.fn();
    useLookupMock.mockImplementation(() => makeHandle());
  });

  afterEach(() => {
    useLookupMock.mockReset();
    document.body.innerHTML = "";
  });

  it("B6 — drives useLookup with the control's own service and search scope", async () => {
    const handle = makeHandle();
    useLookupMock.mockReturnValue(handle);
    const service = vi.fn(() => ({ __service: true }));
    mountControl(withService({ service }));
    await flush();

    expect(service).toHaveBeenCalled();
    expect(useLookupMock).toHaveBeenCalledTimes(1);
    expect(useLookupMock.mock.calls[0][0]).toEqual({ __service: true });
    expect(useLookupMock.mock.calls[0][1]).toMatchObject({
      searchScope: "filters.search.like"
    });
  });

  it("B6/AC8 — a plain control with no lookup renders a plain input and never calls useLookup", async () => {
    const { wrapper } = mountControl(undefined);
    await flush();

    expect(useLookupMock).not.toHaveBeenCalled();
    expect(wrapper.find('[data-test-key="input"]').exists()).toBe(true);
    expect(wrapper.find('[data-test-key="combobox-input"]').exists()).toBe(
      false
    );
  });

  it("AC8 static — a lookup bag with options but no service renders them client-side and never calls useLookup", async () => {
    const { wrapper } = mountControl({
      lookup: {
        options: [
          { value: "x", label: "Static X" },
          { value: "y", label: "Static Y" }
        ]
      }
    });
    await openCombobox(wrapper);

    expect(useLookupMock).not.toHaveBeenCalled();
    expect(map(renderedItems(), node => node.textContent?.trim())).toEqual([
      "Static X",
      "Static Y"
    ]);
  });

  it("B4 — typing forwards the term to useLookup().search", async () => {
    const handle = makeHandle();
    useLookupMock.mockReturnValue(handle);
    const { wrapper } = mountControl(withService());
    await openCombobox(wrapper);

    await wrapper.find('[data-test-key="combobox-input"]').setValue("hosting");

    await vi.waitFor(() => {
      expect(handle.search).toHaveBeenCalledWith("hosting");
    });
  });

  it("B5 — renders the service's items, and draws the appended page when the service grows", async () => {
    const handle = makeHandle();
    useLookupMock.mockReturnValue(handle);
    const { wrapper } = mountControl(withService());
    await openCombobox(wrapper);

    expect(map(renderedItems(), node => node.textContent?.trim())).toEqual([
      "Alpha",
      "Beta"
    ]);

    handle.items.value = [
      ...handle.items.value,
      { value: "c", label: "Gamma" }
    ];
    await vi.waitFor(() => {
      expect(renderedItems().length).toBe(3);
    });
    expect(map(renderedItems(), node => node.textContent?.trim())).toContain(
      "Gamma"
    );
  });

  it("B5 — offers Load more while pages remain, calls loadMore, and withdraws it when none remain", async () => {
    const handle = makeHandle();
    useLookupMock.mockReturnValue(handle);
    const { wrapper } = mountControl(withService());
    await openCombobox(wrapper);

    const button = loadMoreButton();
    expect(button, "Load more absent while hasMore is true").toBeTruthy();

    button!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(handle.loadMore).toHaveBeenCalledTimes(1);

    handle.meta.value = { ...handle.meta.value, hasMore: false };
    await vi.waitFor(() => {
      expect(loadMoreButton()).toBeUndefined();
    });
  });

  it("B5 — Load more is disabled while a page is loading", async () => {
    const handle = makeHandle();
    useLookupMock.mockReturnValue(handle);
    const { wrapper } = mountControl(withService());
    await openCombobox(wrapper);

    expect(loadMoreButton()!.getAttribute("disabled")).toBeNull();

    handle.meta.value = { ...handle.meta.value, isLoading: true };
    await vi.waitFor(() => {
      expect(loadMoreButton()!.getAttribute("disabled")).toBe("");
    });
  });

  it("B7 — an already-linked product shows its label before any search", async () => {
    const handle = makeHandle({ items: ref<LookupItem[]>([]) });
    useLookupMock.mockReturnValue(handle);
    const { wrapper } = mountControl(
      withService({ current: { value: "cur", label: "Current Product" } }),
      { contract_product_id: "cur" }
    );
    await flush();

    const input = wrapper.find('[data-test-key="combobox-input"]')
      .element as HTMLInputElement;
    expect(input.value).toBe("Current Product");
    expect(handle.search).not.toHaveBeenCalled();
  });

  it("selecting an option writes its value back through onInput", async () => {
    const handle = makeHandle();
    useLookupMock.mockReturnValue(handle);
    const { wrapper, model } = mountControl(withService());
    await openCombobox(wrapper);

    const beta = find(
      renderedItems(),
      node => node.getAttribute("data-test-value") === "b"
    ) as HTMLElement;
    beta.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));
    beta.dispatchEvent(new MouseEvent("pointerup", { bubbles: true }));
    beta.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    await vi.waitFor(() => {
      expect(model().contract_product_id).toBe("b");
    });
  });
});
