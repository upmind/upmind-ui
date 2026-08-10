// -----------------------------------------------------------------------------
/**
 * @fileoverview client-email-history — the criteria wire, cache law and surface
 *
 * ## Job To Be Done
 * Drive the REAL `useClientReceivedEmails()` against MSW-replayed staging
 * recordings and prove the migration off the raw options arm and off the four
 * legacy key spellings this module used to send. Every declared column now
 * leaves in the ONE `filter[col|op]` form: the free-text search as
 * `filter[subject|like]=%…%` (was a bare `subject=` AND a bare `query=`), the
 * two booleans as `filter[sent|eq]` / `filter[bounced|eq]` carrying `1`/`0`
 * (were operator-less `filter[sent]` / `filter[bounced]`), and
 * `filter[error_id|neq]` unchanged. The declared `created_at desc` default is
 * the sort floor, and the `sort(property, direction)` façade is gone.
 *
 * ## What Breaks If These Fail
 * A boolean filter losing its `false` case is the invisible one: the "not
 * bounced" tab silently shows everything. A surviving bare `subject=` means the
 * module kept two spellings for one intent, which is the second source of truth
 * the P1-R9 ruling deleted.
 */

import { describe, expect, it, vi } from "vitest";
import { useClientReceivedEmails } from "..";
import {
  distinctCombinations,
  observeRequests,
  seedClientSession
} from "../../../__tests__/criteria-int-kit";
import { SortDirection } from "../../query";
import { SENT_EMAIL_DEFAULT_SORT } from "../client-email-history.types";
import {
  installEmailHistoryHandler,
  recordedNeedle
} from "./client-email-history.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

/** The `pagination.limit` default `useQuerySchema()` declares — unpaged. */
const DECLARED_LIMIT = "0";

/** Every legacy spelling this module used to send for one of these intents. */
const LEGACY_KEYS = [
  "query",
  "subject",
  "filter[sent]",
  "filter[bounced]",
  "q",
  "search"
];

type Collection = ReturnType<typeof useClientReceivedEmails>;

async function bootCollection(
  initial?: Parameters<typeof useClientReceivedEmails>[0]
): Promise<Collection> {
  await seedClientSession(server);
  installEmailHistoryHandler(server);
  const emails = useClientReceivedEmails(initial);
  await emails.isReady();
  return emails;
}

/** Every legacy key across every observed request — must always be empty. */
function legacyKeysSeen(
  observed: ReturnType<typeof observeRequests>
): string[] {
  return observed
    .all()
    .flatMap(request =>
      [...new URL(request.url).searchParams.keys()].filter(key =>
        LEGACY_KEYS.includes(key)
      )
    );
}

/**
 * The first ROW read. `withSplitCount` fetches the total on its own request
 * (`limit=count`) before the rows, so `first()` is not the read whose window
 * and sort this collection is asserting about.
 */
function firstRowRequest(
  observed: ReturnType<typeof observeRequests>
): URLSearchParams {
  const request = observed
    .all()
    .find(entry => new URL(entry.url).searchParams.get("limit") !== "count");
  expect(request).toBeDefined();
  return new URL(request!.url).searchParams;
}

// -----------------------------------------------------------------------------

describe("client-email-history — the declared window and sort boot the collection", () => {
  it("boots on the schema's own created_at desc default, carried as order=-created_at", async () => {
    await seedClientSession(server);
    installEmailHistoryHandler(server);
    const observed = observeRequests(server, "/email_history");

    const emails = useClientReceivedEmails();
    await emails.isReady();
    observed.stop();

    const params = firstRowRequest(observed);
    expect(params.get("order")).toBe("-created_at");
    expect(params.get("limit")).toBe(DECLARED_LIMIT);
    expect(emails.criteria.value.sort).toEqual(SENT_EMAIL_DEFAULT_SORT);
    expect(legacyKeysSeen(observed)).toEqual([]);
  });

  it("fetches its total on a separate count read that carries the SAME criteria", async () => {
    await seedClientSession(server);
    installEmailHistoryHandler(server);
    const observed = observeRequests(server, "/email_history");

    const emails = useClientReceivedEmails({ filters: { sent: { eq: true } } });
    await emails.isReady();
    observed.stop();

    const count = observed
      .all()
      .find(entry => new URL(entry.url).searchParams.get("limit") === "count");
    expect(count).toBeDefined();
    expect(new URL(count!.url).searchParams.get("filter[sent|eq]")).toBe("1");
  });

  it("re-sorts to the other declared field and drops one the schema does not declare", async () => {
    const emails = await bootCollection();
    const observed = observeRequests(server, "/email_history");

    emails.setCriteria({
      sort: [{ field: "subject", dir: SortDirection.ASC }]
    });
    await vi.waitFor(() => expect(observed.lastParam("order")).toBe("subject"));

    emails.setCriteria({
      sort: [{ field: "bounced_at", dir: SortDirection.ASC }]
    } as never);
    await new Promise(resolve => setTimeout(resolve, 250));
    observed.stop();

    for (const request of observed.all()) {
      expect(new URL(request.url).searchParams.get("order")).not.toBe(
        "bounced_at"
      );
    }
  });
});

describe("client-email-history — every declared column in the ONE wire form", () => {
  it("sends the free-text search as filter[subject|like], never a bare subject= or query=", async () => {
    const emails = await bootCollection();
    const needle = recordedNeedle();
    const observed = observeRequests(server, "/email_history");

    emails.setCriteria({ filters: { subject: { like: needle } } });

    await vi.waitFor(() =>
      expect(observed.lastParam("filter[subject|like]")).toBe(`%${needle}%`)
    );
    observed.stop();

    expect(legacyKeysSeen(observed)).toEqual([]);
    expect(emails.data.value.length).toBeGreaterThan(0);
  });

  it("sends a true boolean as filter[sent|eq]=1 and narrows the collection", async () => {
    const emails = await bootCollection();
    const before = emails.data.value.length;
    const observed = observeRequests(server, "/email_history");

    emails.setCriteria({ filters: { sent: { eq: true } } });

    await vi.waitFor(() =>
      expect(observed.lastParam("filter[sent|eq]")).toBe("1")
    );
    await vi.waitFor(() =>
      expect(emails.data.value.length).toBeLessThanOrEqual(before)
    );
    observed.stop();
    expect(legacyKeysSeen(observed)).toEqual([]);
  });

  it("sends a FALSE boolean as filter[bounced|eq]=0 rather than dropping it", async () => {
    const emails = await bootCollection();
    const observed = observeRequests(server, "/email_history");

    emails.setCriteria({ filters: { bounced: { eq: false } } });

    await vi.waitFor(() =>
      expect(observed.lastParam("filter[bounced|eq]")).toBe("0")
    );
    observed.stop();
    expect(emails.criteria.value.filters).toEqual({ bounced: { eq: false } });
  });

  it("keeps filter[error_id|neq] — the one column the legacy wire already spelled this way", async () => {
    const emails = await bootCollection();
    const observed = observeRequests(server, "/email_history");

    emails.setCriteria({ filters: { error_id: { neq: "null" } } });

    await vi.waitFor(() =>
      expect(observed.lastParam("filter[error_id|neq]")).toBe("null")
    );
    observed.stop();
    expect(emails.data.value.length).toBeGreaterThan(0);
  });

  it("clears a filter from the next request rather than leaving it stale", async () => {
    const emails = await bootCollection();

    emails.setCriteria({ filters: { sent: { eq: true } } });
    await vi.waitFor(() =>
      expect(emails.criteria.value.filters).toEqual({ sent: { eq: true } })
    );

    const observed = observeRequests(server, "/email_history");
    emails.setCriteria({ filters: {} });

    await vi.waitFor(() =>
      expect(emails.criteria.value.filters).toBeUndefined()
    );
    emails.setCriteria({ pagination: { limit: 2 } });
    await vi.waitFor(() => expect(observed.lastParam("limit")).toBe("2"));
    observed.stop();

    expect(observed.filterKeys()).toEqual([]);
  });
});

describe("client-email-history — the cache law", () => {
  it("issues exactly one request per DISTINCT criteria combination", async () => {
    const emails = await bootCollection();
    const observed = observeRequests(server, "/email_history");

    emails.setCriteria({ filters: { sent: { eq: true } } });
    await vi.waitFor(() =>
      expect(observed.lastParam("filter[sent|eq]")).toBe("1")
    );

    emails.setCriteria({ filters: {} });
    await vi.waitFor(() =>
      expect(emails.criteria.value.filters).toBeUndefined()
    );

    emails.setCriteria({ filters: { sent: { eq: true } } });
    await vi.waitFor(() =>
      expect(emails.criteria.value.filters).toEqual({ sent: { eq: true } })
    );
    await new Promise(resolve => setTimeout(resolve, 250));
    observed.stop();

    expect(observed.all().length).toBe(
      distinctCombinations(observed.all()).length
    );
  });
});

describe("client-email-history — the criteria surface EmailHistoryListing consumes", () => {
  it("publishes the declared schema, the live model and the ONE write verb", async () => {
    const emails = await bootCollection();

    expect(emails.schema).toMatchObject({
      properties: {
        filters: {
          properties: { subject: {}, sent: {}, bounced: {}, error_id: {} }
        },
        sort: {}
      }
    });
    expect(emails.isFiltered.value).toBe(false);

    emails.setCriteria({ filters: { sent: { eq: true } } });

    await vi.waitFor(() => expect(emails.isFiltered.value).toBe(true));
    expect(emails.criteriaError.value).toBeUndefined();
  });

  it("has lost the sort(property, direction) façade and the raw filters bag", async () => {
    const emails = await bootCollection();

    expect(emails).not.toHaveProperty("sort");
    expect(emails).not.toHaveProperty("filters");
    expect(emails).not.toHaveProperty("filter");
    expect(typeof emails.setCriteria).toBe("function");
  });
});
