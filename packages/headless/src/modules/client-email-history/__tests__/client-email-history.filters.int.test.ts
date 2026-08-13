// -----------------------------------------------------------------------------
/**
 * @fileoverview client-email-history — sort, search and tab-narrowing (AC-6,
 * AC-7, AC-8)
 *
 * ## Job To Be Done
 * Read back the OUTBOUND REQUEST every filter/sort action produces, against
 * real staging-captured fixtures. Per `verify-reality-check.md`, the
 * read-back is the recorded REQUEST, never the response payload alone —
 * every assertion below reads `observed.all()` / the intercepted request URL.
 *
 * Deep-linked pagination (`goToPage`, previously AC-10) no longer exists —
 * the query platform's `goToPage` member was withdrawn along with
 * `withSplitCount`, so there is no member left to exercise. See the
 * co-located `.feature`.
 */

import { describe, expect, it, vi } from "vitest";
import { SentEmailStatus } from "@upmind-automation/types";
import { useClientReceivedEmails } from "..";
import { RequestSortDirection } from "../../query";
import { ScopeActorTypes } from "../../scope/scope.types";
import { ReceivedEmailsSortableProperties } from "../client-email-history.types";
import {
  clientEmailHistoryScopeKeys,
  installEmailHistoryHandlers,
  observeEmailHistoryRequests,
  recorded,
  seedClientSession
} from "./client-email-history.int-helpers";
import "./setup.integration";

// -----------------------------------------------------------------------------

describe("client-email-history collection — sort (AC-6)", () => {
  it("AC-6 sort(SUBJECT, DESC) issues a request whose sort param encodes subject DESC", async () => {
    await seedClientSession();
    installEmailHistoryHandlers();

    const emails = useClientReceivedEmails().as(ScopeActorTypes.CLIENT);
    await vi.waitFor(() =>
      expect(emails.useMeta().isLoading.value).toBe(false)
    );

    const observed = observeEmailHistoryRequests();
    emails
      .useActions()
      .sort(
        ReceivedEmailsSortableProperties.SUBJECT,
        RequestSortDirection.DESC
      );
    await vi.waitFor(() => expect(observed.all().length).toBeGreaterThan(0));
    observed.stop();

    const last = observed.all().at(-1);
    expect(decodeURIComponent(last?.url ?? "")).toContain("order=-subject");
  });

  it("AC-6 sort() with no argument re-applies the module default [DESC, created_at]", async () => {
    await seedClientSession();
    installEmailHistoryHandlers();

    const emails = useClientReceivedEmails().as(ScopeActorTypes.CLIENT);
    await vi.waitFor(() =>
      expect(emails.useMeta().isLoading.value).toBe(false)
    );

    const observed = observeEmailHistoryRequests();
    emails.useActions().sort();
    await vi.waitFor(() => expect(observed.all().length).toBeGreaterThan(0));
    observed.stop();

    const last = observed.all().at(-1);
    expect(decodeURIComponent(last?.url ?? "")).toContain("order=-created_at");
  });

  it("AC-6 the sortable properties enum carries the documented default and values", () => {
    expect(ReceivedEmailsSortableProperties.DEFAULT).toBe("created_at");
    expect(ReceivedEmailsSortableProperties.SUBJECT).toBe("subject");
  });
});

describe("client-email-history collection — search (AC-7)", () => {
  it('AC-7 filters.query("invoice") issues a request carrying query=invoice', async () => {
    await seedClientSession();
    installEmailHistoryHandlers();

    const emails = useClientReceivedEmails().as(ScopeActorTypes.CLIENT);
    await vi.waitFor(() =>
      expect(emails.useMeta().isLoading.value).toBe(false)
    );

    const observed = observeEmailHistoryRequests();
    emails.useActions().filters.query("invoice");
    await vi.waitFor(() => expect(observed.all().length).toBeGreaterThan(0));
    observed.stop();

    expect(decodeURIComponent(observed.all().at(-1)?.url ?? "")).toContain(
      "query=invoice"
    );
  });

  it('AC-7 filters.subject("Welcome") does not clear a previously applied query filter', async () => {
    await seedClientSession();
    installEmailHistoryHandlers();

    const emails = useClientReceivedEmails().as(ScopeActorTypes.CLIENT);
    await vi.waitFor(() =>
      expect(emails.useMeta().isLoading.value).toBe(false)
    );

    const observed = observeEmailHistoryRequests();
    emails.useActions().filters.query("invoice");
    await vi.waitFor(() => expect(observed.all().length).toBeGreaterThan(0));

    emails.useActions().filters.subject("Welcome");
    await vi.waitFor(() => expect(observed.all().length).toBeGreaterThan(1));
    observed.stop();

    const third = decodeURIComponent(observed.all().at(-1)?.url ?? "");
    expect(third).toContain("query=invoice");
    expect(third).toContain("subject=Welcome");
  });
});

describe("client-email-history collection — status tabs (AC-8)", () => {
  it.each([
    [
      SentEmailStatus.SENT,
      ["filter%5Bsent%5D=true", "filter%5Bbounced%5D=false"]
    ],
    [SentEmailStatus.BOUNCED, ["filter%5Bbounced%5D=true"]],
    [SentEmailStatus.ERROR, ["filter%5Berror_id%7Cneq%5D=null"]]
  ])(
    "AC-8 filters.status(%s) issues a request carrying exactly its own keys",
    async (status, expectedFragments) => {
      await seedClientSession();
      installEmailHistoryHandlers();

      const emails = useClientReceivedEmails().as(ScopeActorTypes.CLIENT);
      await vi.waitFor(() =>
        expect(emails.useMeta().isLoading.value).toBe(false)
      );

      const observed = observeEmailHistoryRequests();
      emails.useActions().filters.status(status);
      await vi.waitFor(() => expect(observed.all().length).toBeGreaterThan(0));
      observed.stop();

      const url = observed.all().at(-1)?.url ?? "";
      for (const fragment of expectedFragments) {
        expect(url).toContain(fragment);
      }
    }
  );

  it("AC-8 switching from bounced to all removes every tab key — no stale filter survives", async () => {
    await seedClientSession();
    installEmailHistoryHandlers();

    const emails = useClientReceivedEmails().as(ScopeActorTypes.CLIENT);
    await vi.waitFor(() =>
      expect(emails.useMeta().isLoading.value).toBe(false)
    );

    const observed = observeEmailHistoryRequests();
    emails.useActions().filters.status(SentEmailStatus.BOUNCED);
    await vi.waitFor(() =>
      expect(
        observed
          .all()
          .some(request => request.url.includes("filter%5Bbounced%5D"))
      ).toBe(true)
    );

    emails.useActions().filters.status(undefined);
    await vi.waitFor(() => {
      const latest = observed.all().at(-1)?.url ?? "";
      expect(latest).not.toContain("filter%5Bbounced%5D");
    });
    observed.stop();

    const finalUrl = observed.all().at(-1)?.url ?? "";
    expect(finalUrl).not.toContain("filter%5Bsent%5D");
    expect(finalUrl).not.toContain("filter%5Bbounced%5D");
    expect(finalUrl).not.toContain("filter%5Berror_id%7Cneq%5D");
  });

  it("AC-8 switching status on a live instance re-issues the request without a fresh instance", async () => {
    await seedClientSession();
    installEmailHistoryHandlers();

    const emails = useClientReceivedEmails().as(ScopeActorTypes.CLIENT);
    await vi.waitFor(() =>
      expect(emails.useMeta().isLoading.value).toBe(false)
    );
    const keysBefore = clientEmailHistoryScopeKeys();

    const observed = observeEmailHistoryRequests();
    emails.useActions().filters.status(SentEmailStatus.SENT);
    await vi.waitFor(() => expect(observed.all().length).toBeGreaterThan(0));
    observed.stop();

    // Same live instance, not a fresh one minted for the new filter — the
    // registry never gained a second scope key for this actor.
    expect(clientEmailHistoryScopeKeys()).toEqual(keysBefore);
    expect(clientEmailHistoryScopeKeys()).toHaveLength(1);
  });

  it("AC-8 applying a status filter synchronously before awaiting readiness (mount-with-status-already-applied) issues exactly one, already-filtered request — no preceding unfiltered request", async () => {
    await seedClientSession();
    installEmailHistoryHandlers();
    const observed = observeEmailHistoryRequests();

    // Mirrors the fixed EmailHistoryListing.vue sequence: construct, then
    // apply the `{ immediate: true }` status watcher SYNCHRONOUSLY, before
    // ever awaiting readiness. The regression this guards was the `await`
    // sitting BEFORE that watcher registration, which let one unfiltered
    // request escape ahead of the filtered one.
    const emails = useClientReceivedEmails().as(ScopeActorTypes.CLIENT);
    emails.useActions().filters.status(SentEmailStatus.BOUNCED);

    await vi.waitFor(() =>
      expect(emails.useMeta().isLoading.value).toBe(false)
    );
    // Give any straggler request a chance to land before asserting the count.
    await new Promise(resolve => setTimeout(resolve, 250));
    observed.stop();

    expect(observed.all()).toHaveLength(1);
    expect(decodeURIComponent(observed.all()[0].url)).toContain(
      "filter[bounced]=true"
    );
  });

  it("AC-8 filters.status(BOUNCED) makes pagination.total/pages track the BOUNCED-filtered count, not the unfiltered total", async () => {
    await seedClientSession();
    const handlers = installEmailHistoryHandlers();

    const emails = useClientReceivedEmails().as(ScopeActorTypes.CLIENT);
    await vi.waitFor(() =>
      expect(emails.useMeta().isLoading.value).toBe(false)
    );
    // `total` arrives inline on the main list response — known as soon as
    // the fetch settles.
    const unfilteredTotal = emails.useContext().pagination.value.total;
    expect(unfilteredTotal).toBe(recorded.list().total);
    expect(unfilteredTotal).toBeGreaterThan(0);

    // The recorded fixture for THIS filter — the real staging account's
    // bounced history is genuinely empty (parity.yaml C9), carrying its own
    // real `total:0` inline on the main list response.
    handlers.setListBody(recorded.empty());
    emails.useActions().filters.status(SentEmailStatus.BOUNCED);

    await vi.waitFor(() =>
      expect(emails.useContext().pagination.value.total).toBe(
        recorded.empty().total
      )
    );
    expect(emails.useContext().pagination.value.total).not.toBe(
      unfilteredTotal
    );
    expect(emails.useContext().pagination.value.pages).toBe(1);
  });
});
