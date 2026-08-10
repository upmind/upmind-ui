/**
 * @module components/emailHistory/__tests__/tab-filters-live
 * @description The tab filters and the search box are ONE criteria branch.
 *
 * Behaviour oracle: the READY-gate browser proof against live
 * `api.staging.upmind.io` (`docs/sdd/FE-2977/evidence/wave-c/converge/browser-proof.md`
 * ADDENDUM (f)/(g)) — each tab reaches the wire as its declared branch, the
 * search term rides the SAME branch (`filter[subject|like]` alongside
 * `filter[sent|eq]`), and clearing the search leaves the tab's columns set.
 *
 * Provenance: no response bodies are authored here. The port stands in for
 * `useClientReceivedEmails` to capture the OUTBOUND criteria writes; the filter
 * shapes asserted are the ones observed on the wire, expressed in the
 * `SentEmailQueryModel["filters"]` form the composable's public type declares.
 */

import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, nextTick, ref, Suspense } from "vue";
import { createI18n } from "vue-i18n";
import { createMemoryHistory, createRouter } from "vue-router";
import { DEBOUNCE_DELAY } from "@upmind-automation/headless";
import action from "@upmind-automation/i18n/core/action-en.json";
import text from "@upmind-automation/i18n/core/text-en.json";
import { filter, findLast, last, map } from "lodash-es";
import type { SentEmailQueryModel } from "@upmind-automation/headless";
import type { VueWrapper } from "@vue/test-utils";

// -----------------------------------------------------------------------------

type Criteria = Partial<SentEmailQueryModel>;

const writes = ref<Criteria[]>([]);

vi.mock("@upmind-automation/headless", async importOriginal => {
  const actual =
    await importOriginal<typeof import("@upmind-automation/headless")>();

  return {
    ...actual,
    useClientReceivedEmails: () => ({
      isReady: () => Promise.resolve(true),
      data: ref([]),
      meta: ref({
        isLoading: false,
        hasError: false,
        isEmpty: true,
        isAvailable: true
      }),
      pagination: ref({
        limit: 10,
        offset: 0,
        total: 0,
        page: 1,
        pages: 1,
        from: 0,
        to: 0
      }),
      setCriteria: (criteria: Criteria) => void writes.value.push(criteria),
      nextPage: () => undefined,
      prevPage: () => undefined
    })
  };
});

const { default: EmailHistoryListing } =
  await import("../EmailHistoryListing.vue");

// --- the writes the component made, as the consumer's contract sees them

const filterWrites = () =>
  map(
    filter(writes.value, criteria => "filters" in criteria),
    criteria => criteria.filters
  );

const lastFilters = () => last(filterWrites());

const SENT = { sent: { eq: true }, bounced: { eq: false } };
const BOUNCED = { bounced: { eq: true } };
const FAILED = { error_id: { neq: "null" } };

// -----------------------------------------------------------------------------

async function mountListing(options: {
  manualFilters?: SentEmailQueryModel["filters"];
  query?: string;
}) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: "/",
        name: "account-email-history",
        component: { render: () => null }
      },
      {
        path: "/:emailId",
        name: "account-email-history-view",
        component: { render: () => null }
      }
    ]
  });
  await router.push("/");
  await router.isReady();

  const i18n = createI18n({
    legacy: false,
    locale: "en",
    messages: { en: { action, text } }
  });

  const manualFilters = ref(options.manualFilters ?? {});
  const query = ref(options.query);

  const harness = defineComponent({
    setup() {
      return () =>
        h(Suspense, null, {
          default: () =>
            h(EmailHistoryListing, {
              manualFilters: manualFilters.value,
              query: query.value,
              "onUpdate:query": (value: string | undefined) =>
                (query.value = value)
            })
        });
    }
  });

  const wrapper = mount(harness, { global: { plugins: [router, i18n] } });
  const settle = async () => {
    await new Promise(resolve => setTimeout(resolve, DEBOUNCE_DELAY + 50));
    await nextTick();
  };
  await settle();

  return { wrapper, manualFilters, query, settle };
}

const searchBox = (wrapper: VueWrapper) => wrapper.find("input#email-search");

// -----------------------------------------------------------------------------

describe("email history — tabs and search are one criteria branch", () => {
  beforeEach(() => (writes.value = []));

  it("writes the selected tab's declared branch merged with the live search term", async () => {
    const { manualFilters, settle } = await mountListing({ query: "invoice" });

    expect(lastFilters()).toEqual({ subject: { like: "invoice" } });

    manualFilters.value = SENT;
    await settle();

    expect(lastFilters()).toEqual({ ...SENT, subject: { like: "invoice" } });
  });

  it("carries the search term across a tab change, and drops the previous tab's columns", async () => {
    const { manualFilters, settle } = await mountListing({
      manualFilters: SENT,
      query: "invoice"
    });

    manualFilters.value = BOUNCED;
    await settle();

    expect(lastFilters()).toEqual({ ...BOUNCED, subject: { like: "invoice" } });
    expect(lastFilters()).not.toHaveProperty("sent");

    manualFilters.value = FAILED;
    await settle();

    expect(lastFilters()).toEqual({ ...FAILED, subject: { like: "invoice" } });
  });

  it("carries the active tab's branch on a search write, and leaves it set when the search is cleared", async () => {
    const { wrapper, settle } = await mountListing({ manualFilters: BOUNCED });

    expect(lastFilters()).toEqual({
      ...BOUNCED,
      subject: { like: undefined }
    });

    await searchBox(wrapper).setValue("invoice");
    await settle();

    expect(lastFilters()).toEqual({ ...BOUNCED, subject: { like: "invoice" } });

    await searchBox(wrapper).setValue("");
    await settle();

    const cleared = findLast(
      filterWrites(),
      filters => !filters?.subject?.like
    );
    expect(cleared).toEqual({ ...BOUNCED, subject: { like: undefined } });
  });

  it("writes the search term alone on the unfiltered tab", async () => {
    const { manualFilters, settle } = await mountListing({
      manualFilters: SENT,
      query: "invoice"
    });

    manualFilters.value = {};
    await settle();

    expect(lastFilters()).toEqual({ subject: { like: "invoice" } });
  });
});
