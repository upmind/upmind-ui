// -----------------------------------------------------------------------------
/**
 * @fileoverview client-email criteria — the three page shapes the W4
 * write-through did not reach (FE-3071 B1-R5 / W-R7-4 / B2-R5)
 *
 * ## Job To Be Done
 * `list({ criteria })` moves its cursor through the criteria, so the model and
 * the wire state one page. Three shapes sit outside that walk, all proven here
 * through the REAL composable against the RECORDED pages:
 *
 * - a declared schema whose `pagination` branch has nowhere for a cursor to
 *   land. `hasNextPage` is derived from `total`/`limit`, not from the schema, so
 *   the module offers a Next control; an offered control must move the page,
 *   and it must move it in one request per step;
 * - a `setCriteria` the declared schema cannot hold at all. `criteriaError` is
 *   where a discarded candidate is read (`QueryCriteriaHandle.criteriaError`,
 *   FB5c) — a write may be refused, never swallowed;
 * - `listInfinite({ criteria: { model } })`, whose cursor is the infinite
 *   query's own `pageParam`. Whichever page the published model states, the
 *   first request must be on it, and a seed it cannot carry must be readable
 *   rather than dropped.
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
import { cloneDeep, isNil, last, map, omit } from "lodash-es";
import type {
  InfiniteListQuery,
  ListQuery,
  WithCriteria
} from "../../query/query.types";
import type { Email, QueryModel, QuerySchema } from "../client-email.types";
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

/**
 * 10 both ways: the `pagination.limit` default the module's schema declares,
 * and — where no branch declares one — the platform's own fallback.
 */
const DEFAULT_LIMIT = 10;

/**
 * A write the declared schema cannot hold: honoured on the wire, or refused
 * and readable on `criteriaError`. Nothing else is lawful.
 */
const LAWFUL_WRITE_FATES = [
  { limit: String(PAGE_SIZE), refusalSurfaced: false },
  { limit: String(DEFAULT_LIMIT), refusalSurfaced: true }
];

/**
 * A seeded page the entry point cannot carry: honoured on the FIRST request, or
 * discarded and readable on `criteriaError`. Silently publishing it is neither.
 */
const LAWFUL_SEED_FATES = [
  { offset: PAGE_TWO_OFFSET, discardSurfaced: false },
  { offset: PAGE_ONE_OFFSET, discardSurfaced: true }
];

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
    await vi.waitFor(() => expect(query.pagination.value.pages).toBe(2));
    expect(query.meta.value.hasNextPage).toBe(true);

    query.fetchNextPage();

    await vi.waitFor(() => expect(query.pagination.value.page).toBe(2));
    observed.stop();

    expect(observedOffsets(observed)).toEqual([
      String(PAGE_ONE_OFFSET),
      String(PAGE_ONE_OFFSET),
      String(PAGE_TWO_OFFSET)
    ]);
    expect(observedLimits(observed)).toEqual([
      String(DEFAULT_LIMIT),
      String(PAGE_SIZE),
      String(PAGE_SIZE)
    ]);
  });
});

describe("client-email list({ criteria }) — a write the schema cannot hold is refused, never swallowed (FE-3071 W-R7-4)", () => {
  it("setCriteria on an undeclared branch either reaches the wire or lands on criteriaError", async () => {
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
      expect(LAWFUL_WRITE_FATES).toContainEqual({
        limit: last(observedLimits(observed)) ?? null,
        refusalSurfaced: !isNil(query.criteriaError.value)
      })
    );
    observed.stop();
  });
});

describe("client-email listInfinite({ criteria: { model } }) — the model never states a page the wire is not on (FE-3071 B2-R5)", () => {
  it("a seeded page reaches the FIRST request, or is discarded where it can be read", async () => {
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

    await vi.waitFor(() => expect(observed.all().length).toBeGreaterThan(0));
    observed.stop();

    const first = new URL(observed.first().url).searchParams;
    expect(first.get("limit")).toBe(String(PAGE_SIZE));
    expect(first.get("offset")).toBe(
      String(query.criteria.value.pagination?.offset ?? PAGE_ONE_OFFSET)
    );
    expect(LAWFUL_SEED_FATES).toContainEqual({
      offset: query.criteria.value.pagination?.offset ?? PAGE_ONE_OFFSET,
      discardSurfaced: !isNil(query.criteriaError.value)
    });
  });
});
