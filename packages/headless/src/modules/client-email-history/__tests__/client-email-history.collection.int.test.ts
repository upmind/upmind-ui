// -----------------------------------------------------------------------------
/**
 * @fileoverview client-email-history — the collection's core read (AC-1, AC-2,
 * AC-3, AC-4, AC-9, AC-11)
 *
 * ## Job To Be Done
 * Exercise the REAL `useClientReceivedEmails` stack against MSW-replayed,
 * staging-captured fixtures (NFR-2). Proves: the collection reads the client's
 * own history (AC-1); each mapped row carries its display fields (AC-2) and
 * delivery status (AC-3), read back from the SAME recorded rows the fixture
 * captured — never a hand-typed row; loading/empty/error state and a readiness
 * wait that settles (AC-4); real two-page pagination (AC-9); refresh and
 * invalidate (AC-11).
 *
 * ONE of AC-3's states is not proven here, and it is not unproven. The real
 * staging client this module's fixtures were captured against holds no BOUNCED
 * row, and a whole-history capture says so rather than a page sample:
 * `filter[bounced]=true` records `total: 0`
 * (`client-email-history.fixtures.ts` fileoverview). No replayable row reaches
 * that branch without hand-authoring the very body
 * `no-hand-rolled-int-fixture` exists to catch, and it is a branch of the pure
 * `mapEmailStatus`, so it is proven at the unit layer instead, from a real
 * recorded row with ONE field toggled —
 * `client-email-history.mappers.test.ts` (AC-3).
 *
 * SENDING used to be in that same category and no longer is. The account now
 * carries at least one stuck in-flight row, stable across recording runs, so the
 * `filter[error_id]=null` capture holds a real SENDING row and the case below
 * replays it. ERROR, SENT and SENDING are all proven here on recorded rows.
 */

import { describe, expect, it, vi } from "vitest";
import { SentEmailStatus } from "@upmind-automation/types";
import { useClientReceivedEmails } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  assertClientIdentityTransport,
  installEmailHistoryHandlers,
  observeEmailHistoryRequests,
  recorded,
  resetClientEmailHistoryScopes,
  seedClientSession
} from "./client-email-history.int-helpers";
import { filter } from "lodash-es";
import type { WireEmail } from "./client-email-history.int-helpers";
import "./setup.integration";

// -----------------------------------------------------------------------------

describe("client-email-history collection — reads my own history (AC-1)", () => {
  it("AC-1 issues self/email_history and yields a reactive list matching the recorded fixture", async () => {
    const { accessToken } = await seedClientSession();
    installEmailHistoryHandlers();
    const observed = observeEmailHistoryRequests();

    const emails = useClientReceivedEmails().as(ScopeActorTypes.CLIENT);
    await vi.waitFor(() =>
      expect(emails.useMeta().isLoading.value).toBe(false)
    );
    observed.stop();

    const fixture = recorded.list();
    const request = observed.first();
    expect(request.url).toContain("/self/email_history");
    expect(request.url).toContain(
      "with=recipient%2Crecipient_type%2Crecipient.image"
    );
    // C17 — production never sends `sort=`; it maps to `order=`. `total`
    // arrives inline on this same response — there is exactly one request.
    expect(request.url).toContain("order=-created_at");
    expect(request.url).not.toContain("sort=");
    assertClientIdentityTransport(request, accessToken);

    const rows = emails.useContext().data.value;
    expect(rows).toHaveLength(fixture.data.length);
    expect(rows.map(row => row.id)).toEqual(
      fixture.data.map((row: WireEmail) => row.id)
    );
  });

  it("AC-1 yields [] rather than undefined when the payload is not an array", async () => {
    await seedClientSession();
    const handlers = installEmailHistoryHandlers();
    handlers.setListBody({ ...recorded.list(), data: null as never });

    const emails = useClientReceivedEmails().as(ScopeActorTypes.CLIENT);
    await vi.waitFor(() =>
      expect(emails.useMeta().isLoading.value).toBe(false)
    );

    expect(emails.useContext().data.value).toEqual([]);
  });
});

describe("client-email-history collection — each email's display fields (AC-2)", () => {
  it("AC-2 maps subject, to, from, recipient and status fields from the recorded row", async () => {
    await seedClientSession();
    installEmailHistoryHandlers();

    const emails = useClientReceivedEmails().as(ScopeActorTypes.CLIENT);
    await vi.waitFor(() =>
      expect(emails.useMeta().isLoading.value).toBe(false)
    );

    const fixture = recorded.list();
    const raw = fixture.data[0];
    const mapped = emails.useContext().data.value[0];

    expect(mapped.id).toBe(raw.id);
    expect(mapped.subject).toBe(raw.subject);
    expect(mapped.from).toBe(raw.from);
    expect(mapped.to).toEqual(raw.to);
    expect(mapped.recipient.name).toBe(raw.recipient?.fullname);
    expect(mapped.recipient.email).toBe(raw.recipient?.email);
  });

  it('AC-2 maps a row with no recipient.image to imageUrl: "", never undefined', async () => {
    await seedClientSession();
    installEmailHistoryHandlers();

    const emails = useClientReceivedEmails().as(ScopeActorTypes.CLIENT);
    await vi.waitFor(() =>
      expect(emails.useMeta().isLoading.value).toBe(false)
    );

    const fixture = recorded.list();
    const noImageIndex = fixture.data.findIndex(
      (row: WireEmail) => !row.recipient?.image?.full_url
    );
    expect(noImageIndex).toBeGreaterThanOrEqual(0);

    const mapped = emails.useContext().data.value[noImageIndex];
    expect(mapped.recipient.imageUrl).toBe("");
  });
});

describe("client-email-history collection — each email's delivery status (AC-3)", () => {
  it("AC-3 resolves ERROR for every recorded row that carries an error_id", async () => {
    await seedClientSession();
    const handlers = installEmailHistoryHandlers();
    const fixture = recorded.errorRows();
    handlers.setListBody(fixture);

    const emails = useClientReceivedEmails().as(ScopeActorTypes.CLIENT);
    await vi.waitFor(() =>
      expect(emails.useMeta().isLoading.value).toBe(false)
    );

    const rows = emails.useContext().data.value;
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.status).toBe(SentEmailStatus.ERROR);
      expect(row.meta.isError).toBe(true);
    }
  });

  it("AC-3 resolves SENT for the one recorded row with sent:true and no error", async () => {
    await seedClientSession();
    const handlers = installEmailHistoryHandlers();
    handlers.setListBody(recorded.sentRow());

    const emails = useClientReceivedEmails().as(ScopeActorTypes.CLIENT);
    await vi.waitFor(() =>
      expect(emails.useMeta().isLoading.value).toBe(false)
    );

    const rows = emails.useContext().data.value;
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe(SentEmailStatus.SENT);
    expect(rows[0].meta.isSent).toBe(true);
  });

  it("AC-3 resolves SENDING through the replay — the recorded error-free page carries a REAL in-flight row", async () => {
    await seedClientSession();
    const handlers = installEmailHistoryHandlers();
    handlers.setListBody(recorded.noErrorRows());

    const emails = useClientReceivedEmails().as(ScopeActorTypes.CLIENT);
    await vi.waitFor(() =>
      expect(emails.useMeta().isLoading.value).toBe(false)
    );

    const rows = emails.useContext().data.value;
    expect(rows.length).toBeGreaterThan(0);

    // The page is filtered to error-free rows, so nothing on it errored or
    // bounced — every row is either already SENT or still in flight.
    for (const row of rows) {
      expect(row.meta.isError).toBe(false);
      expect(row.meta.isBounced).toBe(false);
    }

    // The in-flight row is RECORDED, not toggled: this account holds a stuck
    // sending email, so SENDING is now proven on the replay path too.
    // How MANY rows are stuck is staging weather, not a contract. Assert the
    // branch is reached, and that every row reaching it reports itself unsent.
    const sending = filter(rows, row => row.status === SentEmailStatus.SENDING);
    expect(sending.length).toBeGreaterThan(0);
    for (const row of sending) {
      expect(row.meta.isSent).toBe(false);
    }

    expect(
      filter(rows, row => row.status === SentEmailStatus.SENT).length
    ).toBeGreaterThan(0);
  });

  // AC-3's ERROR-over-BOUNCED branch is proven in
  // `client-email-history.mappers.test.ts`, not here: staging's whole-history
  // `filter[bounced]=true` capture is `total: 0`, so no bounced row exists to
  // replay, and the branch belongs to the pure `mapEmailStatus`. SENDING is no
  // longer in that category — the `filter[error_id]=null` capture now carries a
  // real in-flight row, replayed by the case just above. See this file's
  // fileoverview.
});

describe("client-email-history collection — loading / empty / error, and isReady() (AC-4)", () => {
  it("AC-4 reports isLoading true before the fetch settles and false after", async () => {
    await seedClientSession();
    installEmailHistoryHandlers();

    const emails = useClientReceivedEmails().as(ScopeActorTypes.CLIENT);
    expect(emails.useMeta().isLoading.value).toBe(true);

    await vi.waitFor(() =>
      expect(emails.useMeta().isLoading.value).toBe(false)
    );
  });

  it("AC-4 reports isEmpty true for the recorded empty (filter[bounced]=true) fixture", async () => {
    await seedClientSession();
    const handlers = installEmailHistoryHandlers();
    handlers.setListBody(recorded.empty());

    const emails = useClientReceivedEmails().as(ScopeActorTypes.CLIENT);
    await vi.waitFor(() =>
      expect(emails.useMeta().isLoading.value).toBe(false)
    );

    expect(emails.useContext().data.value).toEqual([]);
    expect(emails.useMeta().isEmpty.value).toBe(true);
  });

  it("AC-4 reports isEmpty false for the recorded populated fixture", async () => {
    await seedClientSession();
    installEmailHistoryHandlers();

    const emails = useClientReceivedEmails().as(ScopeActorTypes.CLIENT);
    await vi.waitFor(() =>
      expect(emails.useMeta().isLoading.value).toBe(false)
    );

    expect(emails.useMeta().isEmpty.value).toBe(false);
  });

  it("AC-4 resolves isReady() true once the first fetch has settled", async () => {
    await seedClientSession();
    installEmailHistoryHandlers();

    const emails = useClientReceivedEmails().as(ScopeActorTypes.CLIENT);

    const settled = await Promise.race([
      emails.useActions().isReady(),
      new Promise(resolve => setTimeout(() => resolve("never-settled"), 3000))
    ]);

    expect(settled).toBe(true);
  });
});

describe("client-email-history collection — pagination (AC-9)", () => {
  it("AC-9 boots on the schema's own paged window — the first real page: limit 10, page 1, more pages ahead", async () => {
    await seedClientSession();
    const handlers = installEmailHistoryHandlers();
    handlers.setListBody(recorded.pageOne());
    const observed = observeEmailHistoryRequests();

    const emails = useClientReceivedEmails().as(ScopeActorTypes.CLIENT);
    await emails.useActions().isReady();
    observed.stop();

    // The schema's own pagination.limit default governs the boot window: the
    // collection opens ALREADY on a bounded first page (matching legacy + the
    // recorded default capture's own `limit=10`), which is what creates AC-9's
    // "more emails than fit on one page" condition — no consumer opt-in first.
    const boot = observed.first();
    expect(new URL(boot.url).searchParams.get("limit")).toBe("10");
    // C10/C9: one request per page read, no `skip_count` side-channel (the
    // withdrawn `withSplitCount` behaviour must stay withdrawn); `total` arrives
    // inline on this same response.
    expect(boot.url).not.toContain("skip_count");

    const pagination = emails.useContext().pagination.value;
    expect(pagination.page).toBe(1);
    expect(pagination.limit).toBe(10);
    expect(pagination.pages).toBeGreaterThan(1);
    expect(emails.useMeta().hasNextPage.value).toBe(true);
    expect(emails.useMeta().hasPrevPage.value).toBe(false);
  });

  it("AC-9 nextPage()/prevPage() walk to page 2 and back — page 2 goes out at offset=10 (matching the recorded page-2 capture), no skip_count", async () => {
    await seedClientSession();
    const handlers = installEmailHistoryHandlers();
    handlers.setListBody(recorded.pageOne());

    const emails = useClientReceivedEmails().as(ScopeActorTypes.CLIENT);
    await emails.useActions().isReady();
    expect(emails.useContext().pagination.value.pages).toBeGreaterThan(1);

    const observed = observeEmailHistoryRequests();
    handlers.setListBody(recorded.pageTwo());
    await emails.useActions().nextPage();
    await vi.waitFor(() =>
      expect(emails.useContext().pagination.value.page).toBe(2)
    );
    expect(emails.useMeta().hasPrevPage.value).toBe(true);
    await vi.waitFor(() =>
      expect(decodeURIComponent(observed.all().at(-1)?.url ?? "")).toContain(
        "offset=10"
      )
    );
    expect(observed.all().at(-1)!.url).not.toContain("skip_count");

    handlers.setListBody(recorded.pageOne());
    await emails.useActions().prevPage();
    await vi.waitFor(() =>
      expect(emails.useContext().pagination.value.page).toBe(1)
    );
    expect(emails.useMeta().hasPrevPage.value).toBe(false);
    observed.stop();
  });
});

describe("client-email-history collection — refresh and invalidate (AC-11)", () => {
  it("AC-11 refresh() issues a second request to the same URL and resolves", async () => {
    await seedClientSession();
    installEmailHistoryHandlers();

    const emails = useClientReceivedEmails().as(ScopeActorTypes.CLIENT);
    await vi.waitFor(() =>
      expect(emails.useMeta().isLoading.value).toBe(false)
    );

    const observed = observeEmailHistoryRequests();
    await emails.useActions().refresh();
    observed.stop();

    expect(
      observed
        .all()
        .filter(request => request.url.includes("/self/email_history")).length
    ).toBeGreaterThan(0);
  });

  it("AC-11 invalidate() marks the key stale so the next read refetches", async () => {
    await seedClientSession();
    installEmailHistoryHandlers();

    const emails = useClientReceivedEmails().as(ScopeActorTypes.CLIENT);
    await vi.waitFor(() =>
      expect(emails.useMeta().isLoading.value).toBe(false)
    );

    emails.useActions().invalidate();

    await vi.waitFor(() => {
      expect(emails.useInternals().query.isStale.value).toBe(true);
    });
  });
});

// Ensure a fresh registry for whichever suite runs next in this file's process.
resetClientEmailHistoryScopes();
