// -----------------------------------------------------------------------------
/**
 * @fileoverview client-email-history — one home for a filter, and it is reactive
 *
 * ## Job To Be Done
 * This module used to have TWO homes for the same intent: the caller's filters
 * were spread into `useUrl(...)` — frozen at construction — AND handed to
 * `list()` as options. The URL must now carry only what SCOPES the collection
 * (its `with` expansion), and every filter must live in the criteria, where it
 * can still move after boot.
 *
 * The proof is behavioural, not structural: a collection booted WITH an initial
 * filter carries it on its first request (no unfiltered fetch-then-correct),
 * and the SAME instance answers a later `setCriteria` by changing the wire —
 * which a URL-baked filter, fixed when the url object was built, cannot do.
 *
 * ## What Breaks If This Fails
 * The tab bar above the email history stops working: switching tab recomputes
 * the filter, the composable reads it once, and the list keeps showing the
 * first tab's rows. That is exactly the live defect (E3) the migration closes.
 */

import { describe, expect, it, vi } from "vitest";
import { useClientReceivedEmails } from "..";
import {
  observeRequests,
  seedClientSession
} from "../../../__tests__/criteria-int-kit";
import {
  installEmailHistoryHandler,
  recordedNeedle
} from "./client-email-history.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

describe("client-email-history — the URL scopes, the criteria filters", () => {
  it("carries the caller's initial filter on the FIRST request rather than correcting itself", async () => {
    await seedClientSession(server);
    installEmailHistoryHandler(server);
    const observed = observeRequests(server, "/email_history");

    const emails = useClientReceivedEmails({ filters: { sent: { eq: true } } });
    await emails.isReady();
    observed.stop();

    expect(
      new URL(observed.first().url).searchParams.get("filter[sent|eq]")
    ).toBe("1");
  });

  it("spells an initial filter ONCE — the criteria's key, with no bare column beside it", async () => {
    await seedClientSession(server);
    installEmailHistoryHandler(server);
    const observed = observeRequests(server, "/email_history");

    const emails = useClientReceivedEmails({ filters: { sent: { eq: true } } });
    await emails.isReady();
    observed.stop();

    for (const request of observed.all()) {
      const keys = [...new URL(request.url).searchParams.keys()];
      // A model branch reaching the url as its own key is the second home:
      // one intent, two spellings, only one of which can still move.
      expect(keys).not.toContain("sent");
      expect(keys.filter(key => key.startsWith("filter["))).toEqual([
        "filter[sent|eq]"
      ]);
    }
  });

  it("carries no filter key the criteria does not own — the URL holds only its `with` scope", async () => {
    await seedClientSession(server);
    installEmailHistoryHandler(server);
    const observed = observeRequests(server, "/email_history");

    const emails = useClientReceivedEmails();
    await emails.isReady();
    observed.stop();

    const params = new URL(observed.first().url).searchParams;
    expect([...params.keys()].filter(key => key.startsWith("filter["))).toEqual(
      []
    );
    expect(params.get("with")).toBe("recipient,recipient_type,recipient.image");
  });

  it("moves the wire when the SAME instance is re-filtered — a baked filter could not", async () => {
    await seedClientSession(server);
    installEmailHistoryHandler(server);
    const emails = useClientReceivedEmails({ filters: { sent: { eq: true } } });
    await emails.isReady();

    const observed = observeRequests(server, "/email_history");
    const needle = recordedNeedle();

    emails.setCriteria({ filters: { subject: { like: needle } } });

    await vi.waitFor(() =>
      expect(observed.lastParam("filter[subject|like]")).toBe(`%${needle}%`)
    );
    observed.stop();

    // Replace, not merge: the tab the user LEFT must not still be filtering.
    expect(observed.filterKeys()).toEqual(["filter[subject|like]"]);
    expect(emails.criteria.value.filters).toEqual({
      subject: { like: needle }
    });
  });
});
