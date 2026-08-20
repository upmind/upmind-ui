import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { computed, ref } from "vue";
import { createI18n } from "vue-i18n";
import { internalKits } from "@upmind-automation/headless/testing";
import action from "@upmind-automation/i18n/core/action-en.json";
import form from "@upmind-automation/i18n/core/form-en.json";
import text from "@upmind-automation/i18n/core/text-en.json";
import labsEn from "@upmind-automation/i18n/modules/labs-en.json";
import { declaringChannel } from "../../../../testing/declared-table";
import { defaultRow, unverifiedRow } from "../../../../testing/recorded-emails";
import clientEmails from "../../../../useClientEmails/client-email.scenario";
import { RESOLVED_HANDOFFS } from "../../__tests__/resolved-handoffs";
import DisplayRow from "../../DisplayRow.vue";
import FilterBar from "../../FilterBar.vue";
import RefinementsRow from "../../RefinementsRow.vue";
import { ListSurface } from "../index";
import { map } from "lodash-es";

const { useQuerySchema, useQueryUischema } =
  await internalKits["client-email"]();

const { presentation } = clientEmails;
const rows = [defaultRow, unverifiedRow];
const NARROWED = {
  filters: { verified: { eq: false }, email: { like: "mock" } }
};
const i18n = () =>
  createI18n({
    legacy: false,
    locale: "en",
    messages: { en: { action, form, labs: labsEn, text } }
  });

const criteria = () => {
  const live = ref<Record<string, unknown>>(NARROWED);
  return {
    schema: useQuerySchema(),
    uischema: useQueryUischema(),
    model: computed(() => live.value),
    set: vi.fn()
  };
};

describe("probe", () => {
  it("dumps toolbar row order and sort control", async () => {
    const emit = vi.fn();
    const table = await declaringChannel("client-email", {
      emit,
      sort: [{ field: "email", dir: "asc" }],
      total: rows.length + 1
    });

    const wrapper = mount(ListSurface, {
      attachTo: document.body,
      props: {
        snapshot: {
          actions: ["remove"],
          context: { data: rows },
          meta: { isEmpty: false, isFiltered: false }
        },
        actions: { remove: vi.fn() },
        presentation,
        table,
        criteria: criteria(),
        handoffs: RESOLVED_HANDOFFS
      },
      global: { plugins: [i18n()] }
    });

    const named = {
      FilterBar: wrapper.findComponent(FilterBar),
      RefinementsRow: wrapper.findComponent(RefinementsRow),
      DisplayRow: wrapper.findComponent(DisplayRow)
    };
    for (const [name, found] of Object.entries(named)) {
      console.log("EXISTS", name, found.exists());
    }

    const all = wrapper.element.querySelectorAll("*");
    const order: string[] = [];
    all.forEach(node => {
      for (const [name, found] of Object.entries(named)) {
        if (found.exists() && node === found.element) order.push(name);
      }
    });
    console.log("DOM ORDER", JSON.stringify(order));

    console.log(
      "SORT ON DISPLAY ROW",
      named.DisplayRow.exists() &&
        named.DisplayRow.find('[data-test-key="sort"]').exists()
    );
    console.log(
      "SORT ANYWHERE",
      wrapper.find('[data-test-key="sort"]').exists()
    );

    const sortButton = wrapper.find(
      '[data-test-key="sort"] [data-test-key="button"]'
    );
    if (sortButton.exists()) {
      await sortButton.trigger("click");
      console.log(
        "TOOLBAR EMIT",
        JSON.stringify(map(emit.mock.calls, c => c[0]))
      );
    }
    expect(true).toBe(true);
  });
});
