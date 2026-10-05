/**
 * @fileoverview Manage resolve contract (FE-3274)
 *
 * ## Job To Be Done
 * When an item is saved through Manage, the `resolve` event carries the saved
 * item's id, so a consumer can apply the selection even when the id equals
 * the current model value and no `update:modelValue` is emitted.
 *
 * ## What Breaks If These Fail
 * A billing tab cannot write a newly saved default address, company or phone
 * to the basket, and checkout stalls after registration until refresh.
 */
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { computed, defineComponent, h, ref, Suspense } from "vue";
import { createI18n } from "vue-i18n";
import Manage from "../Manage.vue";
import type { MinimalListComposable, MinimalMutateComposable } from "../types";
import type { UISchemaElement } from "@jsonforms/core";

vi.hoisted(() => {
  (
    HTMLCanvasElement.prototype as unknown as { getContext: () => unknown }
  ).getContext = () =>
    new Proxy({}, { get: () => () => ({}), set: () => true });
});

vi.mock("@upmind-automation/headless", async () => {
  const { createAjv } = await import("@jsonforms/core");
  const ajv = createAjv();
  const inert = (): unknown =>
    new Proxy(function () {}, {
      get: (_target, key) =>
        typeof key === "symbol" || key === "then" || key.startsWith("__v")
          ? undefined
          : inert(),
      apply: () => inert(),
      construct: () => inert()
    });
  return new Proxy({} as Record<string, unknown>, {
    has: () => true,
    get: (_target, key) =>
      key === "useValidation"
        ? () => ({ ajv })
        : typeof key === "symbol" || key === "then" || key === "__esModule"
          ? undefined
          : inert()
  });
});

const SAVED_ID = "saved-item";

const useList: MinimalListComposable = () => ({
  isReady: async () => true,
  meta: computed(() => ({
    isEmpty: true,
    isLoading: false,
    isAvailable: true
  })),
  data: computed(() => []),
  default: () => undefined
});

const update = vi.fn(async () => ({ id: SAVED_ID }));

const useMutate: MinimalMutateComposable = () => ({
  isReady: async () => true,
  meta: computed(() => ({
    isAvailable: true,
    isLoading: false,
    isValid: true,
    isDirty: true,
    isProcessing: false,
    hasErrors: false,
    isNew: true,
    isComplete: false
  })),
  model: ref({}),
  schema: computed(() => ({ type: "object", properties: {} })),
  uischema: computed(
    () => ({ type: "VerticalLayout", elements: [] }) as UISchemaElement
  ),
  errors: computed(() => undefined),
  validationErrors: computed(() => []),
  update,
  clear: vi.fn(),
  input: vi.fn(),
  stop: vi.fn()
});

const mounted: VueWrapper[] = [];

afterEach(() => {
  mounted.splice(0).forEach(wrapper => wrapper.unmount());
  vi.clearAllMocks();
});

async function mountManage(modelValue: string | undefined) {
  const resolves: unknown[][] = [];
  const wrapper = mount(
    defineComponent({
      render: () =>
        h(Suspense, null, {
          default: () =>
            h(Manage, {
              manage: { useList, useMutate },
              as: "list",
              forceOpen: true,
              modelValue,
              onResolve: (...args: unknown[]) => resolves.push(args)
            })
        })
    }),
    {
      global: {
        plugins: [
          createI18n({
            legacy: false,
            locale: "en",
            missingWarn: false,
            fallbackWarn: false
          })
        ],
        stubs: { teleport: true }
      }
    }
  );
  mounted.push(wrapper);
  await flushPromises();
  return { wrapper, resolves };
}

describe("Manage", () => {
  it("resolves with the saved item id when the id already equals the model value", async () => {
    const { wrapper, resolves } = await mountManage(SAVED_ID);

    await wrapper.find('[data-test-key="button-manage-save"]').trigger("click");
    await flushPromises();

    expect(update).toHaveBeenCalledTimes(1);
    expect(resolves).toEqual([[true, SAVED_ID]]);
  });
});
