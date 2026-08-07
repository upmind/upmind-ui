// -----------------------------------------------------------------------------
/**
 * @fileoverview client-email criteria — the two page shapes the W4 write-through
 * did not reach (FE-3071 B1-R5 / B2-R5)
 *
 * ## Job To Be Done
 * `list({ criteria })` moves its cursor through the criteria, so the model and
 * the wire state one page. Two shapes sit outside that walk and are proven here,
 * both through the REAL composable against the RECORDED pages:
 *
 * - a declared schema whose `pagination` branch has nowhere for a cursor to
 *   land. `hasNextPage` is derived from `total`/`limit`, not from the schema, so
 *   it reads TRUE and the module renders an enabled Next control; the page must
 *   then actually move rather than the write being stripped in silence;
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
import type { Email, QueryModel, QuerySchema } from "../client-email.types";
import type { IEmail } from "@upmind-automation/types";
import "./setup.integration";

// -----------------------------------------------------------------------------

type CriteriaList = WithCriteria<ListQuery<IEmail[], Email[]>, QueryModel>;
type CriteriaInfinite = WithCriteria<
  InfiniteListQuery<IEmail[], Email[]>,
  QueryModel
>;

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
  it("an enabled next-page control moves the page on the wire and in the published pagination", async () => {
    const { clientId } = await seedClientSession();
    installPagedEmailsHandler(server, clientId);
    const observed = observeEmailRequests();

    const query = useQuery().list({
      url: useQuery().useUrl(`clients/${clientId}/emails`),
      queryKey: ["criteria-cursorless-schema"],
      withAccessToken: true,
      criteria: { schema: schemaWithoutCursor() }
    }) as unknown as CriteriaList;

    await vi.waitFor(() => expect(query.pagination.value.total).toBe(3));

    query.setCriteria({ pagination: { limit: 2 } });

    await vi.waitFor(() => {
      expect(observedLimits(observed)).toContain("2");
      expect(query.pagination.value.pages).toBe(2);
      expect(query.meta.value.hasNextPage).toBe(true);
      expect(query.isFetching.value).toBe(false);
    });

    query.fetchNextPage();

    await vi.waitFor(() => expect(query.pagination.value.page).toBe(2));
    observed.stop();
    expect(observedOffsets(observed)).toContain("2");
  });
});

describe("client-email listInfinite({ criteria: { model } }) — the model never states a page the wire is not on (FE-3071 B2-R5)", () => {
  it("a seeded pagination.offset either reaches the FIRST request or is never published", async () => {
    const { clientId } = await seedClientSession();
    installPagedEmailsHandler(server, clientId);
    const observed = observeEmailRequests();

    const query = useQuery().listInfinite({
      url: useQuery().useUrl(`clients/${clientId}/emails`),
      queryKey: ["criteria-infinite-seeded-page"],
      withAccessToken: true,
      criteria: {
        schema: useQuerySchema(),
        model: { pagination: { limit: 2, offset: 2 } }
      }
    }) as unknown as CriteriaInfinite;

    await vi.waitFor(() => expect(observed.all().length).toBeGreaterThan(0));
    observed.stop();

    const first = new URL(observed.first().url).searchParams;
    expect(first.get("limit")).toBe("2");
    expect(first.get("offset")).toBe(
      String(query.criteria.value.pagination?.offset ?? 0)
    );
  });
});
