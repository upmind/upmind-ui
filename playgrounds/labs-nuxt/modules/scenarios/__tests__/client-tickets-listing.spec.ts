// @vitest-environment happy-dom
// -----------------------------------------------------------------------------
/**
 * @fileoverview The ticket LISTING's filter controls, each driven to the wire
 * (FE-3226 · AC1/AC2/AC3/AC5/AC6)
 *
 * ## Job To Be Done
 * `client-ticket-page.spec.ts` and `client-ticket-controls.spec.ts` prove the
 * per-ticket MANAGER. Nothing proved the COLLECTION page: the scenario the
 * playground renders for `useClientTickets`, with the module's own criteria
 * schema mounted behind its filter bar. Two operator-reported defects lived
 * exactly there, and both are shaped so that a declaration-only assertion would
 * have stayed green through them:
 *
 *   - The headline narrowing — my ACTIVE tickets versus my CLOSED ones (AC1 /
 *     AC2) — had no control at all. `statusCode` was in the criteria SCHEMA and
 *     in no uischema, so a hand could not reach it. It is now a declared tab
 *     pair (`client-tickets.presentation.ts`), and this file grades it the only
 *     way a filter can be graded: by clicking it and reading the request that
 *     left.
 *   - The search box rendered, took keystrokes, and narrowed NOTHING. The bar
 *     wrote only the `filters` branch back through `setCriteria`, and the
 *     module declares its quick search over the TOP-LEVEL `query` branch
 *     (`tickets.schemas.ts:124`), so every keystroke was dropped between the
 *     form and the composable.
 *
 * So every assertion below is a WIRE assertion. A control existing is never the
 * claim; the parameter that reached the server is.
 *
 * ## What Breaks If These Fail
 * A client cannot separate their open tickets from their closed ones — the
 * collection's whole reason for existing. Or a filter control looks live, takes
 * input, and the list never changes: the FE-2824 class exactly, a surface that
 * reads as capability and moves no data.
 *
 * ## Provenance
 * Every body is the `tickets` module's own COMMITTED capture
 * (`get-tickets-with-staged-imports-1`), replayed over MSW through the real
 * `useClientTickets` stack behind a real client session. Nothing is authored,
 * no fixture is modified, and no response is composed. The bench asserts the
 * REQUEST, so the body's only job is to let the query settle.
 *
 * ## NOT proven here, and named rather than implied
 * Whether the API ACCEPTS the extra `filter[statusCode|…]` parameter the query
 * core emits beside the module's re-spelled `filter[status.code…]` (see the
 * `statusCode` docblock in `tickets.services.ts` — R9). The bench replays
 * recordings and answers 200 to anything, so it cannot grade a server's opinion
 * of an unknown filter column. The assertions below therefore grade that the
 * CORRECT parameter is present and correctly operator-ed, never that it is the
 * only one.
 */

import { join } from "node:path";
import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { h } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import { useClientTickets } from "@upmind-automation/headless";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import ListSurface from "../runtime/components/surfaces/ListSurface.vue";
import { useModulePort } from "../runtime/composables/useModulePort";
import declaration from "../useClientTickets/client-tickets.scenario";
import {
  installTicketsListBody,
  seedClientSession,
  teardownSession
} from "./client-ticket-page.harness";
import { find, last } from "lodash-es";
import type { ModulePort } from "../runtime/composables/useModulePort.types";
import type { VueWrapper } from "@vue/test-utils";
import type { Component } from "vue";

// -----------------------------------------------------------------------------

const SETTLE = 15000;
const CASE = 40000;

const ticketsRecordingsDir = join(
  process.cwd(),
  "..",
  "..",
  "packages/headless/src/modules/tickets/__tests__/fixtures"
);

/** The module's own committed collection capture — the bench's only body. */
const recordedList = (): Record<string, unknown> =>
  getFixtureBody("get-tickets-with-staged-imports-1", {
    recordingsDir: ticketsRecordingsDir
  }) as Record<string, unknown>;

/** A reference the recorded list actually carries, so the filter is a real one. */
const recordedReference = (): string =>
  (recordedList() as unknown as { data: Array<{ reference: string }> }).data[0]!
    .reference;

// -----------------------------------------------------------------------------

let wrapper: VueWrapper | undefined;

/**
 * Mounts the REAL `ListSurface` over a REAL `useClientTickets` port, with the
 * scenario's own committed declaration as its presentation — the same three
 * pieces `ScenarioPlayground` puts together for this route. The port is built
 * through `useModulePort`, not hand-rolled, so the criteria channel under test
 * is the one the page uses: the module's schema, its uischema, its live model
 * and its own merging `setCriteria`.
 */
async function mountListing(): Promise<{
  port: ModulePort;
  seen: () => string[];
}> {
  const list = installTicketsListBody(recordedList());
  const port = useModulePort(useClientTickets, {});

  const router = createRouter({
    history: createWebHistory(),
    routes: [{ path: "/:rest(.*)*", component: { render: () => null } }]
  });
  await router.push("/useClientTickets");
  await router.isReady();

  const host: Component = {
    render: () =>
      h(ListSurface, {
        snapshot: port.snapshot(),
        actions: port.actions,
        table: port.table,
        criteria: port.criteria,
        presentation: declaration.presentation
      })
  };

  wrapper = mount(host, {
    attachTo: document.body,
    global: { plugins: [router] }
  });

  await vi.waitFor(() => expect(list.seen().length).toBeGreaterThan(0), {
    timeout: SETTLE
  });
  await vi.waitFor(
    () =>
      expect(wrapper!.find('[data-test-key="filters"]').exists()).toBe(true),
    { timeout: SETTLE }
  );

  return { port, seen: list.seen };
}

/** The last url the collection sent, decoded so a `filter[a.b|op]` reads literally. */
const lastUrl = (seen: () => string[]): string =>
  decodeURIComponent(last(seen()) ?? "");

/** Waits for the collection to issue a request it had not issued before. */
async function nextRequest(
  seen: () => string[],
  before: number
): Promise<void> {
  await vi.waitFor(() => expect(seen().length).toBeGreaterThan(before), {
    timeout: SETTLE
  });
}

/** One declared filter control, by the scope the form keys it with. */
function control(field: string): ReturnType<VueWrapper["find"]> {
  return wrapper!.find(`[data-test-value="${field}"]`);
}

/** The tab pair the scenario declares, in declaration order. */
function tabs(): ReturnType<VueWrapper["findAll"]> {
  return wrapper!.findAll('[data-test-key="criteria-tab"]');
}

// -----------------------------------------------------------------------------

describe("client tickets listing — the active/closed tab pair (AC1 · AC2)", () => {
  beforeEach(async () => {
    await seedClientSession();
  });
  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    document.body.innerHTML = "";
    teardownSession();
  });

  it(
    "draws a tab per declared narrowing, labelled from the catalogue rather than a raw key",
    async () => {
      await mountListing();

      expect(tabs()).toHaveLength(2);
      expect(tabs()[0]!.text()).toBe("Active");
      expect(tabs()[1]!.text()).toBe("Closed");
      // A raw i18n key on screen is the blank-label defect this pass closed.
      expect(wrapper!.text()).not.toContain("text.tickets_");
    },
    CASE
  );

  it(
    "AC2 — the Closed tab puts filter[status.code]=ticket_closed on the wire",
    async () => {
      const { seen } = await mountListing();

      const before = seen().length;
      await tabs()[1]!.trigger("click");
      await nextRequest(seen, before);

      expect(lastUrl(seen)).toContain("filter[status.code]=ticket_closed");
      // The closed tab is the `eq` leaf ALONE: an `neq` riding beside it would
      // narrow to "closed and not closed" and return nothing.
      expect(lastUrl(seen)).not.toContain("filter[status.code|neq]");
    },
    CASE
  );

  it(
    "AC1 — the Active tab puts filter[status.code|neq]=ticket_closed on the wire",
    async () => {
      const { seen } = await mountListing();

      const before = seen().length;
      await tabs()[0]!.trigger("click");
      await nextRequest(seen, before);

      expect(lastUrl(seen)).toContain("filter[status.code|neq]=ticket_closed");
      // The bare `eq` spelling must be gone, or the two tabs would both be in
      // effect — the whole reason the leaf carries two operators.
      expect(lastUrl(seen)).not.toMatch(/filter\[status\.code\]=/);
    },
    CASE
  );

  it(
    "swapping tabs REPLACES the narrowing rather than stacking the two operators",
    async () => {
      const { seen } = await mountListing();

      let before = seen().length;
      await tabs()[1]!.trigger("click");
      await nextRequest(seen, before);
      expect(lastUrl(seen)).toContain("filter[status.code]=ticket_closed");

      before = seen().length;
      await tabs()[0]!.trigger("click");
      await nextRequest(seen, before);

      expect(lastUrl(seen)).toContain("filter[status.code|neq]=ticket_closed");
      expect(lastUrl(seen)).not.toMatch(/filter\[status\.code\]=/);
    },
    CASE
  );

  it(
    "the selected tab is READ off the live criteria, never off a click it stored",
    async () => {
      const { port, seen } = await mountListing();

      const before = seen().length;
      // Written through the composable, NOT through the control — the tab must
      // follow the model, so a url replay or a Clear all moves it too.
      port.criteria!.set({ filters: { statusCode: { eq: "ticket_closed" } } });
      await nextRequest(seen, before);
      await wrapper!.vm.$nextTick();

      expect(tabs()[1]!.attributes("data-state")).toBe("on");
      expect(tabs()[0]!.attributes("data-state")).toBe("off");
    },
    CASE
  );
});

describe("client tickets listing — every declared filter reaches the wire", () => {
  beforeEach(async () => {
    await seedClientSession();
  });
  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    document.body.innerHTML = "";
    teardownSession();
  });

  it(
    "AC5 — the reference box sends the bare-EQUAL filter[reference]",
    async () => {
      const { seen } = await mountListing();
      const reference = recordedReference();

      const before = seen().length;
      await control("filters-reference")
        .find('[data-test-key="input"]')
        .setValue(reference);
      await nextRequest(seen, before);

      expect(lastUrl(seen)).toContain(`filter[reference]=${reference}`);
    },
    CASE
  );

  it(
    "AC3 — the subject box sends filter[subject]",
    async () => {
      const { seen } = await mountListing();

      const before = seen().length;
      await control("filters-subject")
        .find('[data-test-key="input"]')
        .setValue("Fixture");
      await nextRequest(seen, before);

      expect(lastUrl(seen)).toContain("filter[subject]=Fixture");
    },
    CASE
  );

  it(
    "AC3 — the created-at range sends filter[created_at|gte]",
    async () => {
      const { seen } = await mountListing();

      const before = seen().length;
      await control("properties-filters-properties-created-at-from").setValue(
        "2026-01-01T00:00"
      );
      await nextRequest(seen, before);

      expect(lastUrl(seen)).toMatch(/filter\[created_at\|gte\]=2026-01-01/);
    },
    CASE
  );

  it(
    "AC6 — the search box sends the platform quick-search `query`, the branch the bar used to drop",
    async () => {
      const { seen } = await mountListing();

      const before = seen().length;
      await control("query").find('[data-test-key="input"]').setValue("test");
      await nextRequest(seen, before);

      // `query` is NOT a filter — it is the module's own top-level criteria
      // branch, and the bar forwarded only `filters`, so this parameter never
      // left. It is the whole of the "the search does nothing" report.
      expect(lastUrl(seen)).toContain("query=test");
    },
    CASE
  );

  it(
    "every control the module declares is LABELLED — no raw i18n key reaches the screen",
    async () => {
      await mountListing();

      // The reported defect was blank filter labels: the module's uischema
      // named `form.*` keys the catalogue did not carry, so the bar drew
      // controls with nothing on them. A key that does not resolve renders as
      // itself, so the key text appearing IS the defect.
      const bar = wrapper!.find('[data-test-key="filters"]').text();
      expect(bar).not.toMatch(/form\.[a-z_]+/);
      expect(wrapper!.text()).not.toMatch(/\b(text|action|labs)\.[a-z_]+/);

      // And the placeholders the module's own keys carry actually arrived.
      expect(wrapper!.find('[data-test-key="filters"]').html()).toContain(
        "Search tickets..."
      );
      expect(wrapper!.find('[data-test-key="filters"]').html()).toContain(
        "Search by reference..."
      );
    },
    CASE
  );

  it(
    "AC-PATH — every request the listing makes is on the CLIENT path",
    async () => {
      const { seen } = await mountListing();

      const before = seen().length;
      await tabs()[1]!.trigger("click");
      await nextRequest(seen, before);

      expect(find(seen(), url => url.includes("/api/admin/"))).toBeUndefined();
    },
    CASE
  );
});
