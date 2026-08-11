// -----------------------------------------------------------------------------
/**
 * @fileoverview client-email list({ criteria }) — the criteria on the wire (Task 42/43/44)
 *
 * ## Job To Be Done
 * The module declares a schema and passes it; `list()` constructs the criteria
 * itself and the handle publishes ONE source every layer reads. This file
 * proves that end-to-end through the REAL composable, against the RECORDED
 * pages behind a PARAM-BRANCHING handler (`installPagedEmailsHandler` — the
 * shipped `installEmailsListHandler` ignores `request.url`, which would make
 * every narrowing assertion here vacuous), and asserts on the captured wire:
 *
 * - the criteria's model reaches the url as `filter[col|op]=` / `order=` /
 *   `limit=` / `offset=`, with no `query=`, `q=` or `search=` anywhere;
 * - a second `setCriteria({ filters })` REPLACES the filter set and resets the
 *   page cursor, through the same guarded assignment the old setters used;
 * - **the model and the wire cannot disagree about the page** (FE-3071 W4).
 *   `nextPage()` / `prevPage()` write the cursor through `criteria.pagination`
 *   like every other branch, so every path — page forward, page back, a filter
 *   write, a sort write, a direct `setCriteria({ pagination })` — leaves the
 *   captured url, `criteria.model.pagination` and the published `pagination`
 *   stating one page. Asserting only the wire is what let the disagreement
 *   survive three review rounds;
 * - a model seeded through `list({ criteria: { schema, model } })` boots the
 *   FIRST request already filtered, sorted and paged, in ONE request;
 * - **`setCriteria({ pagination: { limit } })` changes the outbound `limit=` on
 *   a LIVE instance** — the assertion that was impossible before Wave A,
 *   because `limit` was captured once at mint and its reactive key was attached
 *   behind a truthiness guard evaluated on the initial value;
 * - in criteria mode the handle has NO `sort()` / `filter()`: one state, one
 *   write verb, no second write path.
 *
 * ## What Breaks If These Fail
 * A captured `limit` is a pager with nothing to step to. A merged-instead-of-
 * replaced filter set leaves a stale `filter[…]` on the wire the API 500s on. A
 * page cursor that survives a filter change asks for page 4 of a 1-page result.
 * Two write paths into one state is the shadow-copy drift Wave A exists to end.
 * A model that disagrees with the wire about the page is the artefact Wave B
 * serialises into the url: a refresh lands the user on a page they never asked
 * for. A seed that boots unfiltered and then corrects itself shows the wrong
 * rows first and spends two round trips doing it.
 */

import { describe, expect, it, vi } from "vitest";
import { useClientEmails } from "..";
import { useQuery } from "../../query";
import { ScopeActorTypes } from "../../scope/scope.types";
import { useQuerySchema } from "../client-email.schemas";
import { DEFAULT_SORT } from "../client-email.types";
import {
  installFilteredEmailsHandler,
  installPagedEmailsHandler,
  observeEmailRequests,
  seedClientSession
} from "./client-email.int-helpers";
import { server } from "./setup.integration";
import { filter, map } from "lodash-es";
import type { ClientEmailListQuery, QueryModel } from "../client-email.types";
import "./setup.integration";

// -----------------------------------------------------------------------------

type Collection = ReturnType<ReturnType<typeof useClientEmails>["as"]>;

/** The declared `pagination.limit` default the schema now carries (was 0). */
const DECLARED_LIMIT = 10;

async function bootPagedCollection(): Promise<Collection> {
  const { clientId } = await seedClientSession();
  installPagedEmailsHandler(server, clientId);
  const emails = useClientEmails().as(ScopeActorTypes.CLIENT);
  await emails.useActions().isReady();
  return emails;
}

/** The ONE published handle every layer reads — never a shadow copy. */
function handleOf(emails: Collection): ClientEmailListQuery {
  return (emails.useInternals() as unknown as { query: ClientEmailListQuery })
    .query;
}

function setCriteria(emails: Collection, next: Partial<QueryModel>): void {
  handleOf(emails).setCriteria(next);
}

/** The search params of the most recent observed request. */
function latestParams(
  observed: ReturnType<typeof observeEmailRequests>
): URLSearchParams {
  const latest = observed.all().at(-1);
  expect(latest).toBeDefined();
  return new URL(latest!.url).searchParams;
}

/**
 * The params of EVERY observed request carrying `filterKey` — asserted over all
 * of them, not just the latest, so an extra request at the wrong cursor cannot
 * hide behind a later corrected one.
 */
function paramsCarrying(
  observed: ReturnType<typeof observeEmailRequests>,
  filterKey: string
): URLSearchParams[] {
  return filter(
    map(observed.all(), request => new URL(request.url).searchParams),
    params => params.get(filterKey) !== null
  );
}

/** The page the last captured request actually asked the API for. */
function expectWirePage(
  observed: ReturnType<typeof observeEmailRequests>,
  page: { limit: number; offset: number }
): void {
  const params = latestParams(observed);
  expect(params.get("limit")).toBe(String(page.limit));
  expect(params.get("offset")).toBe(String(page.offset));
}

/**
 * The same page as the MODEL and the PUBLISHED pagination each state it — the
 * two artefacts Wave B serialises and renders. Asserted beside
 * {@link expectWirePage}, never instead of it.
 */
function expectModelPage(
  emails: Collection,
  page: { limit: number; offset: number }
): void {
  expect(handleOf(emails).criteria.value.pagination).toEqual(page);
  expect(emails.useContext().query.value.pagination).toEqual(page);
  expect(emails.useContext().pagination.value.limit).toBe(page.limit);
  expect(emails.useContext().pagination.value.page).toBe(
    page.offset / page.limit + 1
  );
}

/** Every `filter[…]` key on the most recent observed request. */
function latestFilterKeys(
  observed: ReturnType<typeof observeEmailRequests>
): string[] {
  return [...latestParams(observed).keys()].filter(key =>
    key.startsWith("filter[")
  );
}

// -----------------------------------------------------------------------------

describe("client-email list({ criteria }) — the declared model boots the first fetch (Task 43)", () => {
  it("the very first request carries the schema's own sort and limit, and no filter at all", async () => {
    const { clientId } = await seedClientSession();
    installPagedEmailsHandler(server, clientId);
    const observed = observeEmailRequests();

    const emails = useClientEmails().as(ScopeActorTypes.CLIENT);
    await emails.useActions().isReady();
    observed.stop();

    const params = new URL(observed.first().url).searchParams;
    expect(params.get("order")).toBe("-default,email");
    expect(params.get("limit")).toBe(String(DECLARED_LIMIT));
    expect(params.get("offset")).toBe("0");
    expect([...params.keys()].filter(key => key.startsWith("filter["))).toEqual(
      []
    );
    expect(emails.useContext().query.value.sort).toEqual(DEFAULT_SORT);
  });

  it("the handle publishes the criteria surface and has NO sort()/filter() to contradict it", async () => {
    const emails = await bootPagedCollection();
    const handle = handleOf(emails) as unknown as Record<string, unknown>;

    expect(typeof handle.setCriteria).toBe("function");
    expect(handle.criteria).toBeDefined();
    expect(handle.schema).toBeDefined();
    expect(handle.isFiltered).toBeDefined();
    expect(handle.criteriaError).toBeDefined();
    expect(handle.sort).toBeUndefined();
    expect(handle.filter).toBeUndefined();
  });

  it("useContext().query reads the published criteria — one source, not a shadow copy", async () => {
    const emails = await bootPagedCollection();

    setCriteria(emails, { filters: { verified: { eq: false } } });

    await vi.waitFor(() =>
      expect(emails.useContext().query.value.filters).toEqual({
        verified: { eq: false }
      })
    );
    expect(emails.useContext().query.value).toEqual(
      handleOf(emails).criteria.value
    );
  });
});

describe("client-email list({ criteria }) — a filter reaches the wire (Task 42)", () => {
  it("setCriteria puts filter[verified|eq]=0 on the url and no query=/q=/search=", async () => {
    const emails = await bootPagedCollection();
    const observed = observeEmailRequests();

    setCriteria(emails, { filters: { verified: { eq: false } } });

    await vi.waitFor(() =>
      expect(latestParams(observed).get("filter[verified|eq]")).toBe("0")
    );
    observed.stop();

    expect(latestFilterKeys(observed)).toEqual(["filter[verified|eq]"]);
    for (const request of observed.all()) {
      const params = new URL(request.url).searchParams;
      expect(params.get("query")).toBeNull();
      expect(params.get("q")).toBeNull();
      expect(params.get("search")).toBeNull();
      expect(params.get("filter[email|like]")).toBeNull();
    }
  });

  it("a second setCriteria REPLACES the filter set — the first column's param is gone", async () => {
    const emails = await bootPagedCollection();
    setCriteria(emails, { filters: { verified: { eq: false } } });
    const observed = observeEmailRequests();
    await vi.waitFor(() =>
      expect(latestParams(observed).get("filter[verified|eq]")).toBe("0")
    );

    setCriteria(emails, { filters: { bounced: { eq: true } } });

    await vi.waitFor(() =>
      expect(latestParams(observed).get("filter[bounced|eq]")).toBe("1")
    );
    observed.stop();
    expect(latestParams(observed).get("filter[verified|eq]")).toBeNull();
    expect(emails.useContext().query.value.filters).toEqual({
      bounced: { eq: true }
    });
  });

  it("the filter narrows the collection by RE-QUERY, not a client-side slice", async () => {
    const { clientId } = await seedClientSession();
    installFilteredEmailsHandler(server, clientId);
    const emails = useClientEmails().as(ScopeActorTypes.CLIENT);
    await emails.useActions().isReady();
    await vi.waitFor(() =>
      expect(emails.useContext().data.value.length).toBe(3)
    );

    setCriteria(emails, { filters: { verified: { eq: false } } });

    await vi.waitFor(() =>
      expect(emails.useContext().data.value.length).toBe(2)
    );
  });

  it("a filter change resets the page cursor back to offset=0", async () => {
    const emails = await bootPagedCollection();
    setCriteria(emails, { pagination: { limit: 2 } });
    const observed = observeEmailRequests();
    await vi.waitFor(() =>
      expect(latestParams(observed).get("limit")).toBe("2")
    );

    emails.useActions().nextPage();
    await vi.waitFor(() =>
      expect(latestParams(observed).get("offset")).toBe("2")
    );

    setCriteria(emails, { filters: { verified: { eq: false } } });

    await vi.waitFor(() => {
      const params = latestParams(observed);
      expect(params.get("filter[verified|eq]")).toBe("0");
      expect(params.get("offset")).toBe("0");
    });
    observed.stop();
    expect(emails.useContext().pagination.value.page).toBe(1);
  });

  it("a filter change resets a cursor the MODEL ITSELF carries, not only one nextPage() moved", async () => {
    const emails = await bootPagedCollection();
    const observed = observeEmailRequests();

    setCriteria(emails, { pagination: { limit: 2, offset: 2 } });

    await vi.waitFor(() => {
      const params = latestParams(observed);
      expect(params.get("limit")).toBe("2");
      expect(params.get("offset")).toBe("2");
    });
    expect(emails.useContext().pagination.value.page).toBe(2);

    setCriteria(emails, { filters: { verified: { eq: false } } });

    await vi.waitFor(() =>
      expect(latestParams(observed).get("filter[verified|eq]")).toBe("0")
    );
    observed.stop();
    const narrowed = paramsCarrying(observed, "filter[verified|eq]");
    expect(narrowed.length).toBeGreaterThan(0);
    for (const params of narrowed) expect(params.get("offset")).toBe("0");
    expect(emails.useContext().pagination.value.page).toBe(1);
  });
});

describe("client-email list({ criteria }) — a LIVE limit change reaches the wire (W-D8)", () => {
  it("setCriteria({ pagination: { limit } }) changes the outbound limit= on an already-mounted query", async () => {
    const emails = await bootPagedCollection();
    const observed = observeEmailRequests();
    expect(emails.useContext().pagination.value.limit).toBe(DECLARED_LIMIT);

    setCriteria(emails, { pagination: { limit: 2 } });

    await vi.waitFor(() => {
      const params = latestParams(observed);
      expect(params.get("limit")).toBe("2");
      expect(params.get("offset")).toBe("0");
    });
    observed.stop();
    expect(emails.useContext().pagination.value.limit).toBe(2);
    expect(emails.useContext().query.value.pagination).toEqual({ limit: 2 });
  });

  it("a limit change leaves a live filter and a live sort alone — the merge law, on the wire", async () => {
    const emails = await bootPagedCollection();
    setCriteria(emails, { filters: { verified: { eq: false } } });
    setCriteria(emails, { sort: [{ field: "email", dir: "asc" }] });
    const observed = observeEmailRequests();
    await vi.waitFor(() =>
      expect(latestParams(observed).get("order")).toBe("email")
    );

    setCriteria(emails, { pagination: { limit: 2 } });

    await vi.waitFor(() => {
      const params = latestParams(observed);
      expect(params.get("limit")).toBe("2");
      expect(params.get("filter[verified|eq]")).toBe("0");
      expect(params.get("order")).toBe("email");
    });
    observed.stop();
  });
});

describe("client-email list({ criteria }) — isFiltered lands on useMeta() (Task 43, W-16)", () => {
  it("is false on a fresh collection and true after filterBy, with no string parsing", async () => {
    const emails = await bootPagedCollection();
    expect(emails.useMeta().isFiltered.value).toBe(false);

    emails.useActions().filterBy({ verified: { eq: false } });

    await vi.waitFor(() =>
      expect(emails.useMeta().isFiltered.value).toBe(true)
    );
    expect(handleOf(emails).isFiltered.value).toBe(true);
  });

  it("falls back to false when the filter set is emptied again", async () => {
    const emails = await bootPagedCollection();
    emails.useActions().filterBy({ verified: { eq: false } });
    await vi.waitFor(() =>
      expect(emails.useMeta().isFiltered.value).toBe(true)
    );

    emails.useActions().filterBy({});

    await vi.waitFor(() =>
      expect(emails.useMeta().isFiltered.value).toBe(false)
    );
  });

  it("a sort alone never counts as filtered — the declared default would make it meaningless", async () => {
    const emails = await bootPagedCollection();

    emails.useActions().sortBy([{ field: "email", dir: "asc" }]);

    await vi.waitFor(() =>
      expect(emails.useContext().query.value.sort).toEqual([
        { field: "email", dir: "asc" }
      ])
    );
    expect(emails.useMeta().isFiltered.value).toBe(false);
  });
});

describe("client-email list({ criteria }) — the actions layer only writes intent (Task 43)", () => {
  it("filterBy hands the raw intent through with no translation of its own", async () => {
    const emails = await bootPagedCollection();
    const observed = observeEmailRequests();

    emails.useActions().filterBy({ email: { like: "mock-email-3" } });

    await vi.waitFor(() =>
      expect(latestParams(observed).get("filter[email|like]")).toBe(
        "%mock-email-3%"
      )
    );
    observed.stop();
    expect(emails.useContext().query.value.filters).toEqual({
      email: { like: "mock-email-3" }
    });
  });

  it("sortBy writes the same one source the criteria publishes", async () => {
    const emails = await bootPagedCollection();
    const observed = observeEmailRequests();

    emails.useActions().sortBy([{ field: "email", dir: "desc" }]);

    await vi.waitFor(() =>
      expect(latestParams(observed).get("order")).toBe("-email")
    );
    observed.stop();
    expect(handleOf(emails).criteria.value.sort).toEqual([
      { field: "email", dir: "desc" }
    ]);
  });

  it("an invalid criteria surfaces on criteriaError and on useContext().error, never swallowed", async () => {
    const emails = await bootPagedCollection();

    setCriteria(emails, { pagination: { limit: -5 } });

    await vi.waitFor(() => {
      const surfaced = handleOf(emails).criteriaError.value as unknown as
        | { status?: number }
        | undefined;
      expect(surfaced?.status).toBe(422);
    });
    expect(emails.useContext().error.value).toBeDefined();
  });
});

describe("client-email list({ criteria }) — the model and the wire cannot disagree about the page (FE-3071 W4)", () => {
  it("nextPage() writes the cursor THROUGH the criteria — the model steps with the wire", async () => {
    const emails = await bootPagedCollection();
    setCriteria(emails, { pagination: { limit: 2 } });
    const observed = observeEmailRequests();
    await vi.waitFor(() =>
      expect(latestParams(observed).get("limit")).toBe("2")
    );

    emails.useActions().nextPage();

    await vi.waitFor(() =>
      expect(latestParams(observed).get("offset")).toBe("2")
    );
    observed.stop();
    expectWirePage(observed, { limit: 2, offset: 2 });
    expectModelPage(emails, { limit: 2, offset: 2 });
  });

  it("a declared page and prevPage() read and write the ONE cursor — page 2 in, page 1 back", async () => {
    const emails = await bootPagedCollection();
    const observed = observeEmailRequests();

    setCriteria(emails, { pagination: { limit: 2, offset: 2 } });

    await vi.waitFor(() =>
      expect(latestParams(observed).get("offset")).toBe("2")
    );
    expectWirePage(observed, { limit: 2, offset: 2 });
    expectModelPage(emails, { limit: 2, offset: 2 });

    emails.useActions().prevPage();

    await vi.waitFor(() =>
      expect(latestParams(observed).get("offset")).toBe("0")
    );
    observed.stop();
    expectWirePage(observed, { limit: 2, offset: 0 });
    expectModelPage(emails, { limit: 2, offset: 0 });
  });

  it("a filter write resets the page in the MODEL, not only on the wire", async () => {
    const emails = await bootPagedCollection();
    setCriteria(emails, { pagination: { limit: 2 } });
    const observed = observeEmailRequests();
    await vi.waitFor(() =>
      expect(latestParams(observed).get("limit")).toBe("2")
    );
    emails.useActions().nextPage();
    await vi.waitFor(() =>
      expect(latestParams(observed).get("offset")).toBe("2")
    );
    expectModelPage(emails, { limit: 2, offset: 2 });

    setCriteria(emails, { filters: { verified: { eq: false } } });

    await vi.waitFor(() =>
      expect(latestParams(observed).get("filter[verified|eq]")).toBe("0")
    );
    observed.stop();
    const narrowed = paramsCarrying(observed, "filter[verified|eq]");
    expect(narrowed.length).toBeGreaterThan(0);
    for (const params of narrowed) expect(params.get("offset")).toBe("0");
    expectModelPage(emails, { limit: 2, offset: 0 });
  });

  it("a sort write resets the page in the MODEL and on the wire alike", async () => {
    const emails = await bootPagedCollection();
    setCriteria(emails, { pagination: { limit: 2 } });
    const observed = observeEmailRequests();
    await vi.waitFor(() =>
      expect(latestParams(observed).get("limit")).toBe("2")
    );
    emails.useActions().nextPage();
    await vi.waitFor(() =>
      expect(latestParams(observed).get("offset")).toBe("2")
    );

    emails.useActions().sortBy([{ field: "email", dir: "asc" }]);

    await vi.waitFor(() => {
      const params = latestParams(observed);
      expect(params.get("order")).toBe("email");
      expect(params.get("offset")).toBe("0");
    });
    observed.stop();
    expectWirePage(observed, { limit: 2, offset: 0 });
    expectModelPage(emails, { limit: 2, offset: 0 });
  });

  it("re-writing the page the caller started on ACTS after paging forward — no longer a silent no-op", async () => {
    const emails = await bootPagedCollection();
    setCriteria(emails, { pagination: { limit: 2, offset: 0 } });
    const observed = observeEmailRequests();
    await vi.waitFor(() =>
      expect(latestParams(observed).get("limit")).toBe("2")
    );
    emails.useActions().nextPage();
    await vi.waitFor(() =>
      expect(latestParams(observed).get("offset")).toBe("2")
    );
    await vi.waitFor(() =>
      expect(emails.useContext().data.value).toHaveLength(1)
    );

    setCriteria(emails, { pagination: { limit: 2, offset: 0 } });

    await vi.waitFor(() =>
      expect(emails.useContext().pagination.value.page).toBe(1)
    );
    observed.stop();
    // Page one is already cached at this window, so the evidence the write ACTED
    // is the recorded page-1 body being shown again, not a fresh request.
    expect(emails.useContext().data.value).toHaveLength(2);
    expectModelPage(emails, { limit: 2, offset: 0 });
  });
});

describe("client-email list({ criteria: { schema, model } }) — a seeded model boots cold (W11)", () => {
  it("the FIRST request already carries the seeded filter, sort and page — and there is exactly one", async () => {
    const { clientId } = await seedClientSession();
    installPagedEmailsHandler(server, clientId);
    const observed = observeEmailRequests();

    useQuery().list({
      url: useQuery().useUrl(`clients/${clientId}/emails`),
      queryKey: ["criteria-list-cold-boot"],
      withAccessToken: true,
      criteria: {
        schema: useQuerySchema(),
        model: {
          filters: { verified: { eq: false } },
          sort: [{ field: "email", dir: "asc" }],
          pagination: { limit: 2, offset: 2 }
        } satisfies QueryModel
      }
    });

    await vi.waitFor(() => expect(observed.all().length).toBeGreaterThan(0));
    // A seed applied AFTER the boot fetch shows up as a second, corrected
    // request; give one time to land before counting.
    await new Promise(resolve => setTimeout(resolve, 250));
    observed.stop();

    const first = new URL(observed.first().url).searchParams;
    expect(first.get("filter[verified|eq]")).toBe("0");
    expect(first.get("order")).toBe("email");
    expect(first.get("limit")).toBe("2");
    expect(first.get("offset")).toBe("2");
    expect(observed.all()).toHaveLength(1);
  });
});
