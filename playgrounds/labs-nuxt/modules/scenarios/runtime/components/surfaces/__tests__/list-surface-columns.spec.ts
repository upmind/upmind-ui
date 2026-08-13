// -----------------------------------------------------------------------------
/**
 * @module surfaces/__tests__/list-surface-columns.spec
 * @description `R6-25` · `R6-35` — which columns the table is DRAWING. Three
 * claims, in the order the ruling states them: the declaration's element list is
 * the default visible set, every declared column stays offerable whether it is
 * drawn or not, and the visible set is URL state — it round-trips, it pastes,
 * and a colleague opening the link lands on the same table.
 *
 * The url is real and in web history mode: a set held in a component ref looks
 * identical on screen, so only the query string can tell the two apart.
 *
 * ## What Breaks If These Fail
 * The picker becomes a one-way door, the page lands showing one column, or the
 * whole capability quietly degrades to a local ref that nothing can share.
 *
 * Negative controls: `list-surface-columns.default-set.must-fail.patch`,
 * `list-surface-columns.options-visible-only.must-fail.patch`,
 * `list-surface-columns.url-state.must-fail.patch`.
 */

import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { computed, defineComponent, h, nextTick, ref } from "vue";
import { createI18n } from "vue-i18n";
import { RouterView, createRouter, createWebHistory } from "vue-router";
import {
  useQuerySchema,
  useQueryUischema
} from "@upmind-automation/headless/testing/client-email/internal-kit";
import action from "@upmind-automation/i18n/core/action-en.json";
import text from "@upmind-automation/i18n/core/text-en.json";
import labsEn from "../../../../../../app/assets/locales/en/labs.json";
import { usePlaygroundUrlState } from "../../../../../../app/composables/usePlaygroundUrlState";
import {
  defaultRow,
  unverifiedRow
} from "../../../../../../tests/support/recorded-emails";
import clientEmails from "../../../../useClientEmails/client-email.scenario";
import { RESOLVED_HANDOFFS } from "../../__tests__/resolved-handoffs";
import { ListSurface } from "../index";
import { DECLARED_HEADERS } from "./table-geometry";
import { dropRight, initial, join, keys, map, split } from "lodash-es";
import type { SurfaceActions } from "../surface.types";

// -----------------------------------------------------------------------------

const PATH = "/useClientEmails/";
const TRIGGER = '[data-test-key="columns"]';
const ITEM = '[data-test-key="column"]';

const rows = [defaultRow, unverifiedRow];

const ACTIONS: SurfaceActions = {
  remove: vi.fn(),
  setDefault: vi.fn(),
  verify: vi.fn()
};

const messages = { en: { action, labs: labsEn, text } };

const settle = async () => {
  await nextTick();
  await new Promise(resolve => setTimeout(resolve, 30));
  await nextTick();
};

const Page = defineComponent({
  setup() {
    const model = ref<Record<string, unknown>>({});

    return () =>
      h(ListSurface, {
        snapshot: {
          actions: keys(ACTIONS),
          context: { data: rows },
          meta: { isEmpty: false, isFiltered: false }
        },
        actions: ACTIONS,
        presentation: clientEmails.presentation,
        handoffs: RESOLVED_HANDOFFS,
        table: {
          read: () => ({
            filter: {},
            sort: [],
            pagination: { page: 1, perPage: 10, total: rows.length }
          }),
          emit: vi.fn()
        },
        criteria: {
          schema: useQuerySchema(),
          uischema: useQueryUischema(),
          model: computed(() => model.value),
          set: vi.fn()
        }
      });
  }
});

/**
 * The url writer is ONE process-wide bag, so a case that does not state its own
 * visible set inherits the previous one's. Every case therefore states it —
 * `undefined` for the default, which is what a fresh visit carries.
 */
async function open(columns?: string) {
  const search = columns ? `?columns=${columns}` : "";

  window.history.replaceState({}, "", `${PATH}${search}`);
  usePlaygroundUrlState().columns.value = columns;

  const router = createRouter({
    history: createWebHistory(),
    routes: [{ path: "/:pathMatch(.*)*", component: Page }]
  });

  const wrapper = mount(defineComponent({ setup: () => () => h(RouterView) }), {
    attachTo: document.body,
    global: {
      plugins: [router, createI18n({ legacy: false, locale: "en", messages })]
    }
  });

  await router.isReady();
  await settle();

  return wrapper;
}

const headers = (wrapper: Awaited<ReturnType<typeof open>>) =>
  map(wrapper.findAll("thead th"), header => header.text());

/** Everything but the trailing actions anchor, which no declaration names. */
const declaredHeaders = (wrapper: Awaited<ReturnType<typeof open>>) =>
  initial(headers(wrapper));

const columnsParam = () =>
  new URLSearchParams(window.location.search).get("columns");

const openMenu = async (wrapper: Awaited<ReturnType<typeof open>>) => {
  await wrapper.find(TRIGGER).trigger("click");
  await settle();
};

const menuValues = () =>
  map(
    [...document.querySelectorAll<HTMLElement>(ITEM)],
    item => item.dataset.testValue
  );

const itemFor = (value: string) =>
  document.querySelector<HTMLElement>(`${ITEM}[data-test-value="${value}"]`);

beforeEach(() => {
  window.history.replaceState({}, "", PATH);
});

afterEach(() => {
  document.body.innerHTML = "";
  window.history.replaceState({}, "", PATH);
});

// -----------------------------------------------------------------------------

describe("R6-35 the DECLARATION is the default visible set", () => {
  it("lands drawing every column the table uischema declares, in its order", async () => {
    const wrapper = await open();

    expect(declaredHeaders(wrapper)).toEqual(DECLARED_HEADERS);
  });

  it("writes no columns param until the user picks — the default is the declaration", async () => {
    await open();

    expect(columnsParam()).toBeNull();
  });
});

describe("R6-25 the picker offers ONE ENTRY PER DECLARED CONTROL, drawn or not", () => {
  it("offers every declared column while all of them are drawn", async () => {
    const wrapper = await open();
    await openMenu(wrapper);

    expect(menuValues()).toHaveLength(DECLARED_HEADERS.length);
  });

  it("keeps offering a column the user has taken off", async () => {
    const wrapper = await open("email");
    await openMenu(wrapper);

    expect(declaredHeaders(wrapper)).toEqual(["Email address"]);
    expect(menuValues()).toHaveLength(DECLARED_HEADERS.length);
  });

  it("can switch a hidden column back on, so nothing is a one-way door", async () => {
    const wrapper = await open("email");
    await openMenu(wrapper);

    const hidden = menuValues().find(value => value !== "email") as string;
    itemFor(hidden)?.click();
    await settle();

    expect(declaredHeaders(wrapper).length).toBe(2);
  });
});

describe("R6-25 the visible set is URL STATE — it round-trips and it pastes", () => {
  it("draws the columns a pasted link names, and only those", async () => {
    const wrapper = await open("email");

    expect(declaredHeaders(wrapper)).toEqual(["Email address"]);
  });

  it("honours the declaration's ORDER, never the order the url happened to list", async () => {
    const declared = map(
      clientEmails.presentation.table.elements,
      element => element.scope
    );
    const reversed = join(
      map(dropRight(declared, 0), scope =>
        join(
          split(scope, "/").filter(
            part => part !== "#" && part !== "properties"
          ),
          "."
        )
      ).reverse(),
      ","
    );

    const wrapper = await open(reversed);

    expect(declaredHeaders(wrapper)).toEqual(DECLARED_HEADERS);
  });

  it("writes the set into the url when a column is taken off", async () => {
    const wrapper = await open();
    await openMenu(wrapper);

    itemFor(menuValues()[0] as string)?.click();
    await settle();

    expect(columnsParam()).not.toBeNull();
    expect(declaredHeaders(wrapper).length).toBe(DECLARED_HEADERS.length - 1);
  });
});
