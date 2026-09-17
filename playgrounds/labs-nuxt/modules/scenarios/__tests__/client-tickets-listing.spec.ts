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
 * Whether the API ACCEPTS the parameters that leave. The bench replays
 * recordings and answers 200 to anything, so it cannot grade a server's opinion
 * of any filter column. What it CAN grade, and does below, is which keys leave:
 * the schema-spelled stray this listing used to send beside the real key
 * (`filter[statusCode|…]`, a column the API does not have — measured against
 * staging 2026-09-17 as a 500) is asserted ABSENT, not merely un-asserted.
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
import { filter, find, last, map } from "lodash-es";
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

/**
 * The status control's three positions, in the order a hand reads them. It is a
 * filter-bar control like any other now, so it is addressed the same way: the
 * form item its leaf keys, then the segmented positions inside it.
 */
function statusPositions(): ReturnType<VueWrapper["findAll"]> {
  return control("filters-is-closed-eq").findAll(
    '[data-test-key="toggle-group-item"]'
  );
}

/** The position under a NAME — the label a hand actually clicks. */
function statusPosition(name: string): ReturnType<VueWrapper["find"]> {
  return (
    find(statusPositions(), node => node.text().trim() === name) ??
    wrapper!.find('[data-test-key="position-not-drawn"]')
  );
}

// -----------------------------------------------------------------------------

describe("client tickets listing — the Active/Closed status filter (AC1 · AC2)", () => {
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
    "draws the three positions IN the filter bar, labelled from the catalogue rather than a raw key",
    async () => {
      await mountListing();

      // Inside the bar, not a strip above it: the same idiom every other
      // filter takes, so one job has one control.
      expect(
        wrapper!
          .find('[data-test-key="filters"]')
          .find('[data-test-value="filters-is-closed-eq"]')
          .exists()
      ).toBe(true);

      expect(map(statusPositions(), node => node.text().trim())).toEqual([
        "Active",
        "Closed",
        "All"
      ]);
      // A raw i18n key on screen is the blank-label defect this pass closed.
      expect(wrapper!.text()).not.toContain("form.ticket_status_filter");
    },
    CASE
  );

  it(
    "AC2 — Closed puts filter[status.code]=ticket_closed on the wire, and nothing beside it",
    async () => {
      const { seen } = await mountListing();

      const before = seen().length;
      await statusPosition("Closed").trigger("click");
      await nextRequest(seen, before);

      expect(lastUrl(seen)).toContain("filter[status.code]=ticket_closed");
      // The closed position is the `eq` leaf ALONE: an `neq` riding beside it
      // would narrow to "closed and not closed" and return nothing.
      expect(lastUrl(seen)).not.toContain("filter[status.code|neq]");
      // And no schema-spelled stray: `isClosed` is not a column this API has,
      // and the pair answers 500 on staging.
      expect(lastUrl(seen)).not.toContain("filter[isClosed");
    },
    CASE
  );

  it(
    "AC1 — Active puts filter[status.code|neq]=ticket_closed on the wire, and nothing beside it",
    async () => {
      const { seen } = await mountListing();

      const before = seen().length;
      await statusPosition("Active").trigger("click");
      await nextRequest(seen, before);

      expect(lastUrl(seen)).toContain("filter[status.code|neq]=ticket_closed");
      // The bare `eq` spelling must be gone, or both narrowings would be in
      // effect — the whole reason one leaf drives two operators.
      expect(lastUrl(seen)).not.toMatch(/filter\[status\.code\]=/);
      expect(lastUrl(seen)).not.toContain("filter[isClosed");
    },
    CASE
  );

  it(
    "All clears the narrowing — NEITHER status key leaves",
    async () => {
      const { seen } = await mountListing();

      let before = seen().length;
      await statusPosition("Closed").trigger("click");
      await nextRequest(seen, before);
      expect(lastUrl(seen)).toContain("filter[status.code]=ticket_closed");

      // The third position is a real write, not the absence of one: it must
      // REMOVE a live narrowing, which the boot state would pass trivially.
      before = seen().length;
      await statusPosition("All").trigger("click");
      await nextRequest(seen, before);

      expect(lastUrl(seen)).not.toContain("filter[status.code");
      expect(lastUrl(seen)).not.toContain("filter[isClosed");
    },
    CASE
  );

  it(
    "swapping positions REPLACES the narrowing rather than stacking the two operators",
    async () => {
      const { seen } = await mountListing();

      let before = seen().length;
      await statusPosition("Closed").trigger("click");
      await nextRequest(seen, before);
      expect(lastUrl(seen)).toContain("filter[status.code]=ticket_closed");

      before = seen().length;
      await statusPosition("Active").trigger("click");
      await nextRequest(seen, before);

      expect(lastUrl(seen)).toContain("filter[status.code|neq]=ticket_closed");
      expect(lastUrl(seen)).not.toMatch(/filter\[status\.code\]=/);
    },
    CASE
  );

  it(
    "the chosen position is READ off the live criteria, never off a click it stored",
    async () => {
      const { port, seen } = await mountListing();

      const before = seen().length;
      // Written through the composable, NOT through the control — the control
      // must follow the model, so a url replay or a Clear all moves it too.
      port.criteria!.set({ filters: { isClosed: { eq: true } } });
      await nextRequest(seen, before);
      await wrapper!.vm.$nextTick();

      expect(
        map(
          filter(
            statusPositions(),
            node => node.attributes("aria-pressed") === "true"
          ),
          node => node.text().trim()
        )
      ).toEqual(["Closed"]);
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
      await statusPosition("Closed").trigger("click");
      await nextRequest(seen, before);

      expect(find(seen(), url => url.includes("/api/admin/"))).toBeUndefined();
    },
    CASE
  );
});
