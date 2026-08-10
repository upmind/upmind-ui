/**
 * @module factory/__tests__/filter-bar-clear
 * @description DIAGNOSIS probe (P1-R7, step 0): what the filter bar forwards
 * when a column is CLEARED, and what it re-seeds the form with afterwards.
 *
 * The core clear law passes in headless (`criteria-clear.int.test.ts`) and the
 * renderer's ✕ empties its leaf (`filter-clear.test.ts`), so the remaining
 * candidates between them are this bar's forward and its re-seed. Both are
 * measured here: the cleared model reaching `criteria.set` verbatim, and the
 * `modelValue` the form is handed once the composable answers.
 *
 * The component project aliases client-vue to a prop/emit-faithful `UpmForm`
 * double, so this measures the FORWARD only — never the renderer's own emit.
 */

import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { computed, ref } from "vue";
import { UpmForm } from "@upmind-automation/client-vue";
import {
  useQuerySchema,
  useQueryUischema
} from "@upmind-automation/headless-test-kit/client-email.internal-kit";
import FilterBar from "../FilterBar.vue";
import type { ModulePortCriteria } from "../../../composables/factory/useModulePort.types";

const SET_FILTER = { filters: { verified: { eq: false } } };
const CLEARED_LEAF = { filters: { verified: {} } };

function mountBar(seed: Record<string, unknown>) {
  const model = ref<Record<string, unknown>>(seed);
  const set = vi.fn((next: Record<string, unknown>) => {
    model.value = { ...model.value, ...next };
  });
  const criteria: ModulePortCriteria = {
    schema: useQuerySchema(),
    uischema: useQueryUischema(),
    model: computed(() => model.value),
    set
  };
  const wrapper = mount(FilterBar, { props: { criteria } });
  return { wrapper, set, model, form: () => wrapper.findComponent(UpmForm) };
}

describe("PROBE — the filter bar's clear forward (P1-R7)", () => {
  it("forwards a cleared leaf to criteria.set verbatim", async () => {
    const { form, set } = mountBar(SET_FILTER);

    form().vm.$emit("update:modelValue", CLEARED_LEAF);
    await Promise.resolve();

    expect(set).toHaveBeenCalledTimes(1);
    expect(set.mock.calls[0][0]).toEqual(CLEARED_LEAF);
  });

  it("re-seeds the form with the CLEARED model the composable published", async () => {
    const { form, model } = mountBar(SET_FILTER);

    form().vm.$emit("update:modelValue", CLEARED_LEAF);
    model.value = { filters: {} };
    await Promise.resolve();

    expect(form().props("modelValue")).toEqual({ filters: {} });
  });
});
