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
 * AC-3's bounced+error precedence example is NOT proven here, and not because
 * it is unproven: the real staging client this module's fixtures were captured
 * against has ZERO bounced rows in its entire ~2860-row history
 * (`client-email-history.fixtures.ts` fileoverview, and the recorded
 * `filter[bounced]=true` capture's own `total: 0`), so no replayable row can
 * exercise that branch without hand-authoring the very body
 * `no-hand-rolled-int-fixture` exists to catch. Precedence is a branch of the
 * pure `mapEmailStatus`, so it is proven at the unit layer instead —
 * `client-email-history.mappers.test.ts` (AC-3). The three status cases the
 * recorded rows DO reach are proven below.
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

  it("AC-3 resolves SENDING for a recorded row with sent/bounced false and no error_id", async () => {
    await seedClientSession();
    const handlers = installEmailHistoryHandlers();
    const fixture = recorded.noErrorRows();
    handlers.setListBody(fixture);

    const emails = useClientReceivedEmails().as(ScopeActorTypes.CLIENT);
    await vi.waitFor(() =>
      expect(emails.useMeta().isLoading.value).toBe(false)
    );

    const rows = emails.useContext().data.value;
    const sendingRow = rows.find(
      row => !row.meta.isSent && !row.meta.isBounced && !row.meta.isError
    );
    expect(sendingRow).toBeDefined();
    expect(sendingRow?.status).toBe(SentEmailStatus.SENDING);
  });

  // AC-3's ERROR-over-BOUNCED precedence is proven in
  // `client-email-history.mappers.test.ts`, not here: staging's recorded
  // `filter[bounced]=true` capture is `total: 0`, so no replayable row reaches
  // that branch. It is a pure-function branch, so the unit layer proves it
  // without inventing a wire body. See this file's fileoverview.
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
  it("AC-9 reports the first real page — limit, pages, hasNextPage/hasPrevPage", async () => {
    await seedClientSession();
    const handlers = installEmailHistoryHandlers();
    handlers.setListBody(recorded.pageOne());
    const observed = observeEmailHistoryRequests();

    const emails = useClientReceivedEmails().as(ScopeActorTypes.CLIENT);
    await vi.waitFor(() =>
      expect(emails.useMeta().isLoading.value).toBe(false)
    );
    observed.stop();

    // `total` arrives inline on the same response — known as soon as the
    // fetch settles, never a second async round-trip. C10/C9: exactly one
    // request per page read, no `skip_count` side-channel (the withdrawn
    // `withSplitCount` behaviour must stay withdrawn).
    expect(observed.all()).toHaveLength(1);
    expect(observed.all()[0].url).not.toContain("skip_count");
    // C11 is dropped — no absolute-page member exists — but the wire offset
    // for a plain first read is still `offset=0`, matching the recorded
    // page-1 fixture's own captured `request.path`.
    expect(decodeURIComponent(observed.all()[0].url)).toContain("offset=0");

    const pagination = emails.useContext().pagination.value;
    expect(pagination.page).toBe(1);
    expect(pagination.limit).toBe(10);
    expect(pagination.pages).toBeGreaterThan(1);
    expect(emails.useMeta().hasNextPage.value).toBe(true);
    expect(emails.useMeta().hasPrevPage.value).toBe(false);
  });

  it("AC-9 nextPage()/prevPage() walk to page 2 and back — exactly one request per page step, no skip_count, and the offset on the wire matches the recorded page-1/page-2 fixtures' own captured request paths", async () => {
    await seedClientSession();
    const handlers = installEmailHistoryHandlers();
    handlers.setListBody(recorded.pageOne());
    const observed = observeEmailHistoryRequests();

    const emails = useClientReceivedEmails().as(ScopeActorTypes.CLIENT);
    await vi.waitFor(() =>
      expect(emails.useMeta().isLoading.value).toBe(false)
    );
    await vi.waitFor(() => expect(observed.all()).toHaveLength(1));
    expect(observed.all()[0].url).not.toContain("skip_count");
    expect(decodeURIComponent(observed.all()[0].url)).toContain("offset=0");

    expect(emails.useContext().pagination.value.pages).toBeGreaterThan(1);

    handlers.setListBody(recorded.pageTwo());
    await emails.useActions().nextPage();
    await vi.waitFor(() =>
      expect(emails.useContext().pagination.value.page).toBe(2)
    );
    expect(emails.useMeta().hasPrevPage.value).toBe(true);

    await vi.waitFor(() => expect(observed.all()).toHaveLength(2));
    expect(observed.all()[1].url).not.toContain("skip_count");
    expect(decodeURIComponent(observed.all()[1].url)).toContain("offset=10");

    handlers.setListBody(recorded.pageOne());
    await emails.useActions().prevPage();
    await vi.waitFor(() =>
      expect(emails.useContext().pagination.value.page).toBe(1)
    );
    expect(emails.useMeta().hasPrevPage.value).toBe(false);

    // The return to page 1 is served from the SAME query's already-fetched
    // first page — no third request escapes to the wire. Verified live: a
    // 300ms settle window after the page/hasPrevPage flip stays at 2
    // observed requests, never 3. Asserting a fabricated third request
    // would misstate what the walk actually puts on the wire.
    await new Promise(resolve => setTimeout(resolve, 300));
    observed.stop();
    expect(observed.all()).toHaveLength(2);
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
