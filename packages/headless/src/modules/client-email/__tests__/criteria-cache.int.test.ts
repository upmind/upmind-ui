// -----------------------------------------------------------------------------
/**
 * @fileoverview The criteria cache — what a re-selected combination costs, and
 * what stands on screen while a new one loads (Wave C · G1 / C3)
 *
 * ## Job To Be Done
 * A combination of `(filters, sort, limit, offset)` is its own cache entry.
 * Returning to one already fetched must PAINT from that entry rather than from
 * a fresh response, moving to a new one must keep the previous rows on screen
 * rather than flashing empty, and a response for an abandoned combination must
 * never land on the current one.
 *
 * Every claim is measured on the WIRE — the requests msw actually observed —
 * and on the published rows at the instant they change, because the defect this
 * closes was invisible in the component's own state: the rows looked right and
 * the API was hit every single time.
 *
 * ## What Breaks If These Fail
 * `resetQueries` DELETES the entry rather than marking it stale, so paging back
 * and forth re-fetches the same page forever and empties the table on every
 * step — the "it used to cache" regression, and a flash of empty on every
 * filter change. A prefix-wide `invalidateQueries` on a branch change is the
 * same defect one step quieter: the rows survive but every sibling combination
 * refetches on revisit (P1-R1). The request COUNTS are law at
 * `criteria-cache-law.int.test.ts`; what stands on screen is law here.
 *
 * ## Provenance
 * Both handlers branch on the request's OWN params and answer from the
 * recorded captures (`installPagedEmailsHandler` · `installFilteredEmailsHandler`);
 * `installEmailsListHandler` ignores the url, which would make every assertion
 * below vacuous.
 */

import { describe, expect, it, vi } from "vitest";
import { watch } from "vue";
import { useQuery } from "../../query";
import { ScopeActorTypes } from "../../scope/scope.types";
import { useQuerySchema } from "../client-email.schemas";
import { useClientEmails } from "../index";
import {
  installFilteredEmailsHandler,
  installPagedEmailsHandler,
  observeEmailRequests,
  recorded,
  seedClientSession
} from "./client-email.int-helpers";
import { server } from "./setup.integration";
import { every, filter, isEmpty, last, map, some } from "lodash-es";
import type { ListQuery, WithCriteria } from "../../query/query.types";
import type { Email, QueryModel, SortEntry } from "../client-email.types";
import type { IEmail } from "@upmind-automation/types";
import "./setup.integration";

// -----------------------------------------------------------------------------

type CriteriaList = WithCriteria<ListQuery<IEmail[], Email[]>, QueryModel>;

/** The recorded walk: three rows served as two pages of two. */
const PAGE_SIZE = 2;
const PAGE_ONE_OFFSET = "0";
const PAGE_TWO_OFFSET = "2";
const RECORDED_TOTAL = 3;

/** The `order=` the module's declared sort default puts on every boot request. */
const BOOT_ORDER = "-created_at";

/**
 * A sort write and the `order=` it produces — the settle control for a claim
 * about what did NOT reach the wire. Its request is one no earlier step can be
 * confused with, so waiting for it proves the observation window stayed open.
 */
const SETTLE_SORT: SortEntry = { field: "email", dir: "asc" };
const SETTLE_ORDER = "email";

const VERIFIED = { verified: { eq: true } };
const UNVERIFIED = { verified: { eq: false } };

/** How long the slow arm of the out-of-order race holds its response. */
const SLOW_MS = 400;
const IN_FLIGHT_MS = 300;

const idsOf = (rows: { id: string }[]) => map(rows, "id");

const recordedIds = {
  pageOne: () => idsOf(recorded.pageOne().data),
  pageTwo: () => idsOf(recorded.pageTwo().data),
  corpus: () => [...recordedIds.pageOne(), ...recordedIds.pageTwo()],
  verified: () =>
    idsOf(
      filter([...recorded.pageOne().data, ...recorded.pageTwo().data], {
        verified: true
      })
    ),
  unverified: () =>
    idsOf(
      filter([...recorded.pageOne().data, ...recorded.pageTwo().data], {
        verified: false
      })
    )
};

function listWithCriteria(
  clientId: string,
  queryKey: string,
  model?: Partial<QueryModel>
): CriteriaList {
  return useQuery().list({
    url: useQuery().useUrl(`clients/${clientId}/emails`),
    queryKey: [queryKey],
    withAccessToken: true,
    criteria: { schema: useQuerySchema(), model }
  }) as unknown as CriteriaList;
}

/**
 * Every value `data` has held, captured synchronously as it changes. A cache
 * that is DELETED rather than invalidated shows up here as an empty entry
 * between two populated ones — a transition no `await`ed read can catch, since
 * the next response fills it back in.
 */
function publishedRows(read: () => { id: string }[]): {
  snapshots: () => string[][];
  since: (index: number) => string[][];
  count: () => number;
} {
  const snapshots: string[][] = [idsOf(read())];
  watch(
    () => read(),
    rows => snapshots.push(idsOf(rows)),
    { flush: "sync" }
  );

  return {
    snapshots: () => snapshots,
    since: (index: number) => snapshots.slice(index),
    count: () => snapshots.length
  };
}

const paramsOf = (
  observed: ReturnType<typeof observeEmailRequests>,
  key: string
): (string | null)[] =>
  map(observed.all(), request => new URL(request.url).searchParams.get(key));

// -----------------------------------------------------------------------------

describe("a page already fetched costs nothing to return to (G1 · C3)", () => {
  it("re-selects the previous page with no request at all, painting its own rows", async () => {
    const { clientId } = await seedClientSession();
    installPagedEmailsHandler(server, clientId);
    const observed = observeEmailRequests();
    const query = listWithCriteria(clientId, "cache-page-revisit", {
      pagination: { limit: PAGE_SIZE }
    });

    await vi.waitFor(() =>
      expect(query.pagination.value.total).toBe(RECORDED_TOTAL)
    );
    const rows = publishedRows(() => query.data.value as { id: string }[]);
    const paintedAt = query.dataUpdatedAt.value;

    query.fetchNextPage();
    await vi.waitFor(() =>
      expect(idsOf(query.data.value as { id: string }[])).toEqual(
        recordedIds.pageTwo()
      )
    );

    query.fetchPreviousPage();
    await vi.waitFor(() =>
      expect(idsOf(query.data.value as { id: string }[])).toEqual(
        recordedIds.pageOne()
      )
    );

    // The published page is back on page one with the FIRST fetch's own
    // timestamp: nothing re-fetched it, so nothing re-stamped it.
    expect(query.dataUpdatedAt.value).toBe(paintedAt);
    expect(query.pagination.value.page).toBe(1);

    // The settle: a write no earlier step can produce, so any request the
    // revisit leaked would already sit ahead of it in the sequence.
    query.setCriteria({ sort: [SETTLE_SORT] });
    await vi.waitFor(() =>
      expect(last(paramsOf(observed, "order"))).toBe(SETTLE_ORDER)
    );
    observed.stop();

    expect(paramsOf(observed, "offset")).toEqual([
      PAGE_ONE_OFFSET,
      PAGE_TWO_OFFSET,
      PAGE_ONE_OFFSET
    ]);
    expect(paramsOf(observed, "order")).toEqual([
      BOOT_ORDER,
      BOOT_ORDER,
      SETTLE_ORDER
    ]);
    expect(some(rows.snapshots(), isEmpty)).toBe(false);
  });

  it("keeps the previous page's rows on screen until the next page's land", async () => {
    const { clientId } = await seedClientSession();
    installPagedEmailsHandler(server, clientId, { delayMs: IN_FLIGHT_MS });
    const query = listWithCriteria(clientId, "cache-page-in-flight", {
      pagination: { limit: PAGE_SIZE }
    });

    await vi.waitFor(
      () => expect(query.pagination.value.total).toBe(RECORDED_TOTAL),
      { timeout: 2000 }
    );
    const rows = publishedRows(() => query.data.value as { id: string }[]);
    const before = rows.count();

    query.fetchNextPage();
    await vi.waitFor(() => expect(query.isFetching.value).toBe(true), {
      timeout: IN_FLIGHT_MS,
      interval: 5
    });

    expect(idsOf(query.data.value as { id: string }[])).toEqual(
      recordedIds.pageOne()
    );

    await vi.waitFor(
      () =>
        expect(idsOf(query.data.value as { id: string }[])).toEqual(
          recordedIds.pageTwo()
        ),
      { timeout: 2000 }
    );

    // Page one's rows gave way directly to page two's: no empty state was ever
    // published in between.
    expect(rows.since(before)).toEqual([recordedIds.pageTwo()]);
  });
});

describe("a filter combination already fetched paints from its own entry (G1 · C3)", () => {
  it("shows the cached rows at their original timestamp and fetches nothing behind them", async () => {
    const { clientId } = await seedClientSession();
    installFilteredEmailsHandler(server, clientId, { delayMs: IN_FLIGHT_MS });
    const observed = observeEmailRequests();
    const query = listWithCriteria(clientId, "cache-filter-revisit");

    await vi.waitFor(
      () =>
        expect(idsOf(query.data.value as { id: string }[])).toEqual(
          recordedIds.corpus()
        ),
      { timeout: 2000 }
    );
    const rows = publishedRows(() => query.data.value as { id: string }[]);

    query.setCriteria({ filters: VERIFIED });
    await vi.waitFor(
      () =>
        expect(idsOf(query.data.value as { id: string }[])).toEqual(
          recordedIds.verified()
        ),
      { timeout: 2000 }
    );
    const verifiedAt = query.dataUpdatedAt.value;

    query.setCriteria({ filters: UNVERIFIED });
    await vi.waitFor(
      () =>
        expect(idsOf(query.data.value as { id: string }[])).toEqual(
          recordedIds.unverified()
        ),
      { timeout: 2000 }
    );
    const beforeRevisit = observed.all().length;

    query.setCriteria({ filters: VERIFIED });
    await vi.waitFor(
      () =>
        expect(idsOf(query.data.value as { id: string }[])).toEqual(
          recordedIds.verified()
        ),
      { timeout: 2000 }
    );

    // Twice the handler's own delay: a refetch the revisit launched would have
    // answered and re-stamped the entry inside this window.
    await new Promise(resolve => setTimeout(resolve, IN_FLIGHT_MS * 2));
    observed.stop();

    expect(query.dataUpdatedAt.value).toBe(verifiedAt);
    expect(query.isFetching.value).toBe(false);
    expect(observed.all().length - beforeRevisit).toBe(0);
    expect(some(rows.snapshots(), isEmpty)).toBe(false);
  });

  it("never lands an abandoned combination's response on the current one", async () => {
    const { clientId } = await seedClientSession();
    installFilteredEmailsHandler(server, clientId, {
      delayMs: params =>
        params.get("filter[verified|eq]") === "1" ? SLOW_MS : 0
    });
    const observed = observeEmailRequests();
    const query = listWithCriteria(clientId, "cache-out-of-order");

    await vi.waitFor(
      () =>
        expect(idsOf(query.data.value as { id: string }[])).toEqual(
          recordedIds.corpus()
        ),
      { timeout: 2000 }
    );
    const rows = publishedRows(() => query.data.value as { id: string }[]);

    query.setCriteria({ filters: VERIFIED });
    query.setCriteria({ filters: UNVERIFIED });

    await vi.waitFor(
      () =>
        expect(idsOf(query.data.value as { id: string }[])).toEqual(
          recordedIds.unverified()
        ),
      { timeout: 2000 }
    );

    // The slow verified response is still in the air here; the settle waits
    // past its delay so its landing has a chance to overwrite the current rows.
    query.setCriteria({ sort: [SETTLE_SORT] });
    await vi.waitFor(
      () => expect(last(paramsOf(observed, "order"))).toBe(SETTLE_ORDER),
      { timeout: 2000 }
    );
    await new Promise(resolve => setTimeout(resolve, SLOW_MS * 2));
    observed.stop();

    expect(idsOf(query.data.value as { id: string }[])).toEqual(
      recordedIds.unverified()
    );
    expect(query.criteria.value.filters).toEqual(UNVERIFIED);
    expect(some(rows.snapshots(), isEmpty)).toBe(false);
  });
});

describe("the collection the canary drives inherits the same law (G1 · C3)", () => {
  it("re-selecting a filter through filterBy paints the cached rows, never an empty table", async () => {
    const { clientId } = await seedClientSession();
    installFilteredEmailsHandler(server, clientId, { delayMs: IN_FLIGHT_MS });
    const emails = useClientEmails().as(ScopeActorTypes.CLIENT);
    const context = emails.useContext();
    const actions = emails.useActions();

    await actions.isReady();
    await vi.waitFor(
      () =>
        expect(idsOf(context.data.value as { id: string }[])).toEqual(
          recordedIds.corpus()
        ),
      { timeout: 2000 }
    );
    const rows = publishedRows(() => context.data.value as { id: string }[]);

    actions.filterBy(VERIFIED);
    await vi.waitFor(
      () =>
        expect(idsOf(context.data.value as { id: string }[])).toEqual(
          recordedIds.verified()
        ),
      { timeout: 2000 }
    );

    actions.filterBy(UNVERIFIED);
    await vi.waitFor(
      () =>
        expect(idsOf(context.data.value as { id: string }[])).toEqual(
          recordedIds.unverified()
        ),
      { timeout: 2000 }
    );
    const before = rows.count();

    actions.filterBy(VERIFIED);
    await vi.waitFor(
      () =>
        expect(idsOf(context.data.value as { id: string }[])).toEqual(
          recordedIds.verified()
        ),
      { timeout: IN_FLIGHT_MS, interval: 5 }
    );

    // The verified rows are back before the refresh can have answered, and the
    // only value published on the way there was those same rows.
    expect(rows.since(before)).toEqual([recordedIds.verified()]);
    expect(every(rows.snapshots(), snapshot => !isEmpty(snapshot))).toBe(true);
  });
});
