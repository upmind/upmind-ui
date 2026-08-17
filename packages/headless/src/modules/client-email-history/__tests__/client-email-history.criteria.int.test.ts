// -----------------------------------------------------------------------------
/**
 * @fileoverview client-email-history — the criteria surface (AC-6 sort, AC-7
 * search, AC-8 narrow) and the ONE write verb
 *
 * ## Job To Be Done
 * Drive the REAL four-layer `useClientReceivedEmails().as('client')` against
 * MSW-replayed, staging-captured fixtures and prove the CLOSED criteria
 * surface: every read-back is the OUTBOUND REQUEST (verify-reality-check),
 * never the response payload alone. `setCriteria` — off `useActions()` — is
 * the ONE write verb; the withdrawn `sort(property, direction)` / `filters.*`
 * façade is gone. Every declared column leaves in the ONE `filter[col|op]`
 * form the recorded captures carry: the free-text search as
 * `filter[subject|like]=%…%`, the booleans as `filter[sent|eq]` /
 * `filter[bounced|eq]` (`1`/`0`), `filter[error_id|neq]` as-is; sort as
 * `order=` off the declared `created_at desc` default.
 *
 * The playground/renderer can only derive its filter bar + search box off the
 * PUBLISHED surface, so the last block proves `useContext().schemas.query`
 * ({schema, uischema}) and the live `useContext().query` model — the JTBD
 * hinge — beside the façade's absence.
 *
 * ## What Breaks If These Fail
 * A boolean filter losing its `false` case is the invisible one: the "not
 * bounced" tab silently shows everything. A filter baked once at construction
 * cannot move after boot, so switching tab keeps showing the first tab's rows
 * (the live E3 defect). Two write paths into one criteria state is the
 * shadow-copy the P1-R9 ruling deleted.
 */

import { describe, expect, it, vi } from "vitest";
import { useClientReceivedEmails } from "..";
import { SortDirection } from "../../query";
import { ScopeActorTypes } from "../../scope/scope.types";
import { SENT_EMAIL_DEFAULT_SORT } from "../client-email-history.types";
import {
  clientEmailHistoryScopeKeys,
  installEmailHistoryHandlers,
  observeEmailHistoryRequests,
  seedClientSession
} from "./client-email-history.int-helpers";
import "./setup.integration";

// -----------------------------------------------------------------------------

type Collection = ReturnType<ReturnType<typeof useClientReceivedEmails>["as"]>;

async function bootCollection(): Promise<Collection> {
  await seedClientSession();
  installEmailHistoryHandlers();
  const emails = useClientReceivedEmails().as(ScopeActorTypes.CLIENT);
  await emails.useActions().isReady();
  return emails;
}

/** The decoded search params of the most recent observed request. */
function latestParams(
  observed: ReturnType<typeof observeEmailHistoryRequests>
): URLSearchParams {
  const latest = observed.all().at(-1);
  expect(latest).toBeDefined();
  return new URL(latest!.url).searchParams;
}

/** Every `filter[…]` key on the most recent observed request. */
function latestFilterKeys(
  observed: ReturnType<typeof observeEmailHistoryRequests>
): string[] {
  return [...latestParams(observed).keys()].filter(key =>
    key.startsWith("filter[")
  );
}

// -----------------------------------------------------------------------------

describe("client-email-history criteria — the declared sort boots the collection (AC-6)", () => {
  it("AC-6 boots on the schema's own created_at desc default, carried as order=-created_at with no filter", async () => {
    await seedClientSession();
    installEmailHistoryHandlers();
    const observed = observeEmailHistoryRequests();

    const emails = useClientReceivedEmails().as(ScopeActorTypes.CLIENT);
    await emails.useActions().isReady();
    observed.stop();

    const params = new URL(observed.first().url).searchParams;
    expect(params.get("order")).toBe("-created_at");
    expect([...params.keys()].filter(key => key.startsWith("filter["))).toEqual(
      []
    );
    expect(emails.useContext().query.value.sort).toEqual(
      SENT_EMAIL_DEFAULT_SORT
    );
  });

  it("AC-6 re-sorts to the other declared field and drops one the schema does not declare", async () => {
    const emails = await bootCollection();
    const observed = observeEmailHistoryRequests();

    emails.useActions().setCriteria({
      sort: [{ field: "subject", dir: SortDirection.ASC }]
    });
    await vi.waitFor(() =>
      expect(latestParams(observed).get("order")).toBe("subject")
    );

    emails.useActions().setCriteria({
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

  it("AC-6 clearing the sort returns to the default order, most recent first", async () => {
    const emails = await bootCollection();
    const observed = observeEmailHistoryRequests();

    emails.useActions().setCriteria({
      sort: [{ field: "subject", dir: SortDirection.ASC }]
    });
    await vi.waitFor(() =>
      expect(latestParams(observed).get("order")).toBe("subject")
    );

    emails.useActions().setCriteria({ sort: SENT_EMAIL_DEFAULT_SORT });
    // Reverting to the default criteria is served from the boot cache — the
    // proof it "returns to the default order" is the live model, not a fresh
    // outbound request (the boot test already read `order=-created_at` off the
    // wire).
    await vi.waitFor(() =>
      expect(emails.useContext().query.value.sort).toEqual(
        SENT_EMAIL_DEFAULT_SORT
      )
    );
    observed.stop();
  });
});

describe("client-email-history criteria — search my history (AC-7)", () => {
  it("AC-7 sends the free-text search as filter[subject|like], never a bare subject= or query=", async () => {
    const emails = await bootCollection();
    const observed = observeEmailHistoryRequests();

    emails
      .useActions()
      .setCriteria({ filters: { subject: { like: "Welcome" } } });

    await vi.waitFor(() =>
      expect(latestParams(observed).get("filter[subject|like]")).toBe(
        "%Welcome%"
      )
    );
    observed.stop();

    for (const request of observed.all()) {
      const params = new URL(request.url).searchParams;
      expect(params.get("query")).toBeNull();
      expect(params.get("subject")).toBeNull();
      expect(params.get("q")).toBeNull();
      expect(params.get("search")).toBeNull();
    }
  });

  it("AC-7 narrowing by search AND a status together keeps both — neither silently cancels the other", async () => {
    const emails = await bootCollection();
    const observed = observeEmailHistoryRequests();

    emails.useActions().setCriteria({
      filters: { subject: { like: "Welcome" }, error_id: { neq: "null" } }
    });

    await vi.waitFor(() => {
      const params = latestParams(observed);
      expect(params.get("filter[subject|like]")).toBe("%Welcome%");
      expect(params.get("filter[error_id|neq]")).toBe("null");
    });
    observed.stop();
    expect(latestFilterKeys(observed).sort()).toEqual([
      "filter[error_id|neq]",
      "filter[subject|like]"
    ]);
  });
});

describe("client-email-history criteria — narrow to what happened to each email (AC-8)", () => {
  it("AC-8 sends a true boolean as filter[sent|eq]=1", async () => {
    const emails = await bootCollection();
    const observed = observeEmailHistoryRequests();

    emails.useActions().setCriteria({ filters: { sent: { eq: true } } });

    await vi.waitFor(() =>
      expect(latestParams(observed).get("filter[sent|eq]")).toBe("1")
    );
    observed.stop();
    expect(latestFilterKeys(observed)).toEqual(["filter[sent|eq]"]);
  });

  it("AC-8 sends a FALSE boolean as filter[bounced|eq]=0 rather than dropping it", async () => {
    const emails = await bootCollection();
    const observed = observeEmailHistoryRequests();

    emails.useActions().setCriteria({ filters: { bounced: { eq: false } } });

    await vi.waitFor(() =>
      expect(latestParams(observed).get("filter[bounced|eq]")).toBe("0")
    );
    observed.stop();
    expect(emails.useContext().query.value.filters).toEqual({
      bounced: { eq: false }
    });
  });

  it("AC-8 sends the error selection as filter[error_id|neq]=null — the one column the legacy wire already spelled this way", async () => {
    const emails = await bootCollection();
    const observed = observeEmailHistoryRequests();

    emails.useActions().setCriteria({ filters: { error_id: { neq: "null" } } });

    await vi.waitFor(() =>
      expect(latestParams(observed).get("filter[error_id|neq]")).toBe("null")
    );
    observed.stop();
  });

  it("AC-8 switches selection on the SAME live instance and re-reads straight away, leaving no part of the previous selection behind", async () => {
    const emails = await bootCollection();
    const keysBefore = clientEmailHistoryScopeKeys();
    const observed = observeEmailHistoryRequests();

    emails.useActions().setCriteria({ filters: { sent: { eq: true } } });
    await vi.waitFor(() =>
      expect(latestParams(observed).get("filter[sent|eq]")).toBe("1")
    );

    emails.useActions().setCriteria({ filters: { bounced: { eq: false } } });
    await vi.waitFor(() =>
      expect(latestParams(observed).get("filter[bounced|eq]")).toBe("0")
    );
    observed.stop();

    expect(latestParams(observed).get("filter[sent|eq]")).toBeNull();
    expect(latestFilterKeys(observed)).toEqual(["filter[bounced|eq]"]);
    // Same live instance answered the switch — no fresh scope was minted.
    expect(clientEmailHistoryScopeKeys()).toEqual(keysBefore);
    expect(clientEmailHistoryScopeKeys()).toHaveLength(1);
  });

  it("AC-8 switching back to all removes every filter key — no stale filter survives", async () => {
    const emails = await bootCollection();
    const observed = observeEmailHistoryRequests();

    emails.useActions().setCriteria({ filters: { sent: { eq: true } } });
    await vi.waitFor(() =>
      expect(latestParams(observed).get("filter[sent|eq]")).toBe("1")
    );

    emails.useActions().setCriteria({ filters: {} });
    await vi.waitFor(() =>
      expect(emails.useContext().query.value.filters).toBeUndefined()
    );
    // A later window write proves the cleared request actually re-read.
    emails.useActions().setCriteria({ pagination: { limit: 2 } });
    await vi.waitFor(() =>
      expect(latestParams(observed).get("limit")).toBe("2")
    );
    observed.stop();
    expect(latestFilterKeys(observed)).toEqual([]);
  });
});

describe("client-email-history criteria — the URL scopes, the criteria filters (AC-8)", () => {
  it("AC-8 boots carrying only its `with` scope on the URL — no filter[…] baked in", async () => {
    await seedClientSession();
    installEmailHistoryHandlers();
    const observed = observeEmailHistoryRequests();

    const emails = useClientReceivedEmails().as(ScopeActorTypes.CLIENT);
    await emails.useActions().isReady();
    observed.stop();

    const params = new URL(observed.first().url).searchParams;
    expect(params.get("with")).toBe("recipient,recipient_type,recipient.image");
    expect([...params.keys()].filter(key => key.startsWith("filter["))).toEqual(
      []
    );
  });

  it("AC-8 moves the wire when the SAME instance is re-filtered — a URL-baked filter could not", async () => {
    const emails = await bootCollection();
    const observed = observeEmailHistoryRequests();

    emails
      .useActions()
      .setCriteria({ filters: { subject: { like: "Welcome" } } });

    await vi.waitFor(() =>
      expect(latestParams(observed).get("filter[subject|like]")).toBe(
        "%Welcome%"
      )
    );
    observed.stop();
    // Spelled ONCE, as the criteria's key — no bare column beside it.
    expect(latestParams(observed).get("subject")).toBeNull();
    expect(latestFilterKeys(observed)).toEqual(["filter[subject|like]"]);
  });
});

describe("client-email-history criteria — the published surface a consumer derives its filter bar from (AC-7, AC-8)", () => {
  it("AC-8 publishes schemas.query {schema, uischema} — the renderer's door to the filter bar", async () => {
    const emails = await bootCollection();

    const schemas = emails.useContext().schemas.query;
    expect(schemas.uischema).toBeDefined();
    expect(schemas.schema).toMatchObject({
      properties: {
        filters: {
          properties: { subject: {}, sent: {}, bounced: {}, error_id: {} }
        },
        sort: {}
      }
    });
  });

  it("AC-8 exposes setCriteria as the ONE write verb and reflects it on the live model, with the sort()/filters façade gone", async () => {
    const emails = await bootCollection();
    const actions = emails.useActions();

    expect(typeof actions.setCriteria).toBe("function");
    expect(actions).not.toHaveProperty("sort");
    expect(actions).not.toHaveProperty("filters");
    expect(actions).not.toHaveProperty("filter");

    expect(emails.useInternals().query.isFiltered.value).toBe(false);
    actions.setCriteria({ filters: { sent: { eq: true } } });

    await vi.waitFor(() =>
      expect(emails.useContext().query.value.filters).toEqual({
        sent: { eq: true }
      })
    );
    expect(emails.useInternals().query.isFiltered.value).toBe(true);
    expect(emails.useInternals().query.criteriaError.value).toBeUndefined();
  });
});
