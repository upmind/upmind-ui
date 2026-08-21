// -----------------------------------------------------------------------------
/**
 * @fileoverview client-email criteria — the four page shapes the W4
 * write-through did not reach (FE-3071 B1-R5 / W-R7-4 / B2-R5)
 *
 * ## Job To Be Done
 * `list({ criteria })` moves its cursor through the criteria, so the model and
 * the wire state one page. Four shapes sit outside that walk, all proven here
 * through the REAL composable against the RECORDED pages:
 *
 * - a declared schema whose `pagination` branch has nowhere for a cursor to
 *   land. `hasNextPage` is derived from `total`/`limit`, not from the schema, so
 *   the module offers a Next control; an offered control must move the page,
 *   and it must move it in one request per step;
 * - a `setCriteria` the declared schema cannot hold at all — a write may be
 *   refused on `criteriaError` (`QueryCriteriaHandle.criteriaError`, FB5c) or
 *   honoured on the wire, never swallowed between the two;
 * - the walk running OUT of pages. A control the module withdraws must also
 *   refuse the call behind it, leaving the wire, the published page and the
 *   criteria all where they were;
 * - `listInfinite({ criteria: { model } })`, whose cursor is the infinite
 *   query's own `pageParam`. Whichever page the published model states, the
 *   first request must be on it.
 *
 * ## What Breaks If These Fail
 * Wave B serialises the published page into the url. An enabled control that
 * does nothing is the silent class this wave exists to end, and a model stating
 * a page the wire never asked for puts a user on page 2 of a list rendering from
 * row 0 — on every refresh, permanently.
 */

import { describe, expect, it, vi } from "vitest";
import { useQuery } from "../../query";
import { useQuerySchema } from "../client-email.schemas";
import {
  installPagedEmailsHandler,
  observeEmailRequests,
  seedClientSession
} from "./client-email.int-helpers";
import { server } from "./setup.integration";
import { cloneDeep, map, omit } from "lodash-es";
import type {
  InfiniteListQuery,
  ListQuery,
  WithCriteria
} from "../../query/query.types";
import type {
  Email,
  QueryModel,
  QuerySchema,
  SortEntry
} from "../client-email.types";
import type { IEmail } from "@upmind-automation/types";
import "./setup.integration";

// -----------------------------------------------------------------------------

type CriteriaList = WithCriteria<ListQuery<IEmail[], Email[]>, QueryModel>;
type CriteriaInfinite = WithCriteria<
  InfiniteListQuery<IEmail[], Email[]>,
  QueryModel
>;

/** The recorded walk: three rows served as two pages of two. */
const PAGE_SIZE = 2;
const PAGE_ONE_OFFSET = 0;
const PAGE_TWO_OFFSET = 2;
const RECORDED_TOTAL = 3;
const RECORDED_PAGES = 2;

/**
 * 10 both ways: the `pagination.limit` default the module's schema declares,
 * and — where no branch declares one — the platform's own fallback.
 */
const DEFAULT_LIMIT = 10;

/** The i18n keys the withdrawn pager controls refuse with (`packages/i18n`). */
const NEXT_REFUSED = "text.page_next_not_available";
const PREVIOUS_REFUSED = "text.page_previous_not_available";

/** The `order=` the module's declared sort default puts on every boot request. */
const BOOT_ORDER = "-default,email";

/**
 * A sort write and the `order=` it produces — the settle control for a claim
 * about what did NOT reach the wire. Its request is one the boot cannot be
 * confused with, so waiting for it proves the observation window stayed open,
 * and any request that slipped in between breaks the exact sequence.
 */
const SETTLE_SORT: SortEntry = { field: "email", dir: "asc" };
const SETTLE_ORDER = "email";

/** The module's own declared schema with the cursor property removed. */
function schemaWithoutCursor(): QuerySchema {
  const schema = cloneDeep(useQuerySchema()) as QuerySchema & {
    properties: { pagination: { properties: Record<string, unknown> } };
  };
  schema.properties.pagination.properties = omit(
    schema.properties.pagination.properties,
    "offset"
  );
  return schema;
}

/** The module's own declared schema with no page window declared at all. */
function schemaWithoutPagination(): QuerySchema {
  const schema = cloneDeep(useQuerySchema()) as QuerySchema & {
    properties: Record<string, unknown>;
  };
  schema.properties = omit(schema.properties, "pagination");
  return schema;
}

/** One search param across every observed request, in order. */
function observedParams(
  observed: ReturnType<typeof observeEmailRequests>,
  key: string
): (string | null)[] {
  return map(observed.all(), request =>
    new URL(request.url).searchParams.get(key)
  );
}

const observedOffsets = (
  observed: ReturnType<typeof observeEmailRequests>
): (string | null)[] => observedParams(observed, "offset");

const observedLimits = (
  observed: ReturnType<typeof observeEmailRequests>
): (string | null)[] => observedParams(observed, "limit");

const observedOrders = (
  observed: ReturnType<typeof observeEmailRequests>
): (string | null)[] => observedParams(observed, "order");

// -----------------------------------------------------------------------------

describe("client-email list({ criteria }) — a schema with no cursor to write into still pages (FE-3071 B1-R5)", () => {
  it("an offered next-page control moves the page on the wire and in the published pagination, one request per step", async () => {
    const { clientId } = await seedClientSession();
    installPagedEmailsHandler(server, clientId);
    const observed = observeEmailRequests();

    const query = useQuery().list({
      url: useQuery().useUrl(`clients/${clientId}/emails`),
      queryKey: ["criteria-cursorless-schema"],
      withAccessToken: true,
      criteria: { schema: schemaWithoutCursor() }
    }) as unknown as CriteriaList;

    await vi.waitFor(() =>
      expect(query.pagination.value.total).toBe(RECORDED_TOTAL)
    );

    query.setCriteria({ pagination: { limit: PAGE_SIZE } });

    await vi.waitFor(() =>
      expect(observedLimits(observed)).toEqual([
        String(DEFAULT_LIMIT),
        String(PAGE_SIZE)
      ])
    );
    await vi.waitFor(() =>
      expect(query.pagination.value.pages).toBe(RECORDED_PAGES)
    );
    expect(query.meta.value.hasNextPage).toBe(true);

    query.fetchNextPage();

    await vi.waitFor(() =>
      expect(observedOffsets(observed)).toEqual([
        String(PAGE_ONE_OFFSET),
        String(PAGE_ONE_OFFSET),
        String(PAGE_TWO_OFFSET)
      ])
    );
    observed.stop();

    expect(observedLimits(observed)).toEqual([
      String(DEFAULT_LIMIT),
      String(PAGE_SIZE),
      String(PAGE_SIZE)
    ]);
    expect(query.pagination.value.page).toBe(RECORDED_PAGES);
    expect(query.criteria.value.pagination?.offset).toBe(PAGE_TWO_OFFSET);
  });
});

describe("client-email list({ criteria }) — a write the schema cannot hold is refused, never swallowed (FE-3071 W-R7-4)", () => {
  it("setCriteria on an undeclared branch reaches the wire rather than dying silently", async () => {
    const { clientId } = await seedClientSession();
    installPagedEmailsHandler(server, clientId);
    const observed = observeEmailRequests();

    const query = useQuery().list({
      url: useQuery().useUrl(`clients/${clientId}/emails`),
      queryKey: ["criteria-undeclared-branch"],
      withAccessToken: true,
      criteria: { schema: schemaWithoutPagination() }
    }) as unknown as CriteriaList;

    await vi.waitFor(() =>
      expect(query.pagination.value.total).toBe(RECORDED_TOTAL)
    );

    query.setCriteria({ pagination: { limit: PAGE_SIZE } });

    await vi.waitFor(() =>
      expect(observedLimits(observed)).toEqual([
        String(DEFAULT_LIMIT),
        String(PAGE_SIZE)
      ])
    );
    observed.stop();

    expect(query.criteria.value.pagination?.limit).toBe(PAGE_SIZE);
    expect(query.criteriaError.value).toBeUndefined();
  });
});

describe("client-email list({ criteria }) — the walk runs out of pages honestly (FE-3071 B1-R5)", () => {
  it("a next-page call past the last page is refused, and moves neither the wire nor the published page", async () => {
    const { clientId } = await seedClientSession();
    installPagedEmailsHandler(server, clientId);
    const observed = observeEmailRequests();

    const query = useQuery().list({
      url: useQuery().useUrl(`clients/${clientId}/emails`),
      queryKey: ["criteria-past-the-end"],
      withAccessToken: true,
      criteria: {
        schema: useQuerySchema(),
        model: { pagination: { limit: PAGE_SIZE, offset: PAGE_TWO_OFFSET } }
      }
    }) as unknown as CriteriaList;

    await vi.waitFor(() =>
      expect(query.pagination.value.total).toBe(RECORDED_TOTAL)
    );
    expect(query.pagination.value.page).toBe(RECORDED_PAGES);
    expect(query.meta.value.hasNextPage).toBe(false);

    expect(() => query.fetchNextPage()).toThrowError(NEXT_REFUSED);
    expect(query.pagination.value.page).toBe(RECORDED_PAGES);
    expect(query.criteria.value.pagination?.offset).toBe(PAGE_TWO_OFFSET);

    // The cursor moves synchronously, so the two reads above catch a leak into
    // the model; the wire does not settle in the same tick. The control the
    // module still offers is the settle — a leaked next page would already be
    // captured ahead of it, breaking the sequence.
    query.fetchPreviousPage();

    await vi.waitFor(() =>
      expect(observedOffsets(observed)).toEqual([
        String(PAGE_TWO_OFFSET),
        String(PAGE_ONE_OFFSET)
      ])
    );
    observed.stop();

    expect(observedLimits(observed)).toEqual([
      String(PAGE_SIZE),
      String(PAGE_SIZE)
    ]);
  });

  it("the same refusal guards the bottom of the walk, and the page in between still moves", async () => {
    const { clientId } = await seedClientSession();
    installPagedEmailsHandler(server, clientId);
    const observed = observeEmailRequests();

    const query = useQuery().list({
      url: useQuery().useUrl(`clients/${clientId}/emails`),
      queryKey: ["criteria-before-the-start"],
      withAccessToken: true,
      criteria: {
        schema: useQuerySchema(),
        model: { pagination: { limit: PAGE_SIZE, offset: PAGE_TWO_OFFSET } }
      }
    }) as unknown as CriteriaList;

    await vi.waitFor(() =>
      expect(query.pagination.value.total).toBe(RECORDED_TOTAL)
    );

    query.fetchPreviousPage();

    await vi.waitFor(() =>
      expect(observedOffsets(observed)).toEqual([
        String(PAGE_TWO_OFFSET),
        String(PAGE_ONE_OFFSET)
      ])
    );
    expect(query.pagination.value.page).toBe(1);
    expect(query.meta.value.hasPrevPage).toBe(false);

    expect(() => query.fetchPreviousPage()).toThrowError(PREVIOUS_REFUSED);

    observed.stop();
    expect(observedOffsets(observed)).toEqual([
      String(PAGE_TWO_OFFSET),
      String(PAGE_ONE_OFFSET)
    ]);
    expect(query.criteria.value.pagination?.offset).toBe(PAGE_ONE_OFFSET);
  });
});

describe("client-email listInfinite({ criteria: { model } }) — the model never states a page the wire is not on (FE-3071 B2-R5)", () => {
  it("a seeded page is the page of the FIRST request, with no correcting second one", async () => {
    const { clientId } = await seedClientSession();
    installPagedEmailsHandler(server, clientId);
    const observed = observeEmailRequests();

    const query = useQuery().listInfinite({
      url: useQuery().useUrl(`clients/${clientId}/emails`),
      queryKey: ["criteria-infinite-seeded-page"],
      withAccessToken: true,
      criteria: {
        schema: useQuerySchema(),
        model: {
          pagination: { limit: PAGE_SIZE, offset: PAGE_TWO_OFFSET }
        }
      }
    }) as unknown as CriteriaInfinite;

    await vi.waitFor(() =>
      expect(query.pagination.value.total).toBe(RECORDED_TOTAL)
    );
    expect(query.criteria.value.pagination?.offset).toBe(PAGE_TWO_OFFSET);
    expect(query.criteriaError.value).toBeUndefined();

    // `total` lands inside the FIRST response, so stopping on it would shut the
    // window before a correcting second request could ever arrive. The sort
    // write is the settle: waiting for ITS `order=` holds the window open, and
    // a correction would sit between the two entries of every sequence below.
    query.setCriteria({ sort: [SETTLE_SORT] });

    await vi.waitFor(() =>
      expect(observedOrders(observed)).toEqual([BOOT_ORDER, SETTLE_ORDER])
    );
    observed.stop();

    expect(observedOffsets(observed)).toEqual([
      String(PAGE_TWO_OFFSET),
      String(PAGE_ONE_OFFSET)
    ]);
    expect(observedLimits(observed)).toEqual([
      String(PAGE_SIZE),
      String(PAGE_SIZE)
    ]);
  });
});
