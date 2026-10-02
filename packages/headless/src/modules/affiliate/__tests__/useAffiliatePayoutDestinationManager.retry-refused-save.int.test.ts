// -----------------------------------------------------------------------------
/**
 * @fileoverview useAffiliatePayoutDestinationManager — a client retries a save
 * the server refused (@AC23)
 *
 * ## Job To Be Done
 * Protect the retry edge of a payout destination save: after a refused
 * `update()` (a 422 that leaves the manager in `available` with `errors`
 * filled and the edit kept, design.md §8.6), a second `update()` sends a
 * second PUT of the kept edit. A manager that goes back to `available` but
 * ignores the next `update()` leaves the client unable to save until the
 * editor is closed and opened again.
 *
 * ## Real captures used
 * The second PUT is answered by the recorded non-PayPal save capture
 * `put-accounts-id-case-non-paypal-save`, matched on its recorded request
 * body. The first PUT is a declared 422 control response
 * (code-tests.companion.md: control and error responses are exempt).
 *
 * ## Named gap — NO-PAYOUT-SAVE-REJECTED-CAPTURE
 * No recording holds a refused account save. Recording one needs a write that
 * the server must refuse against the shared `client` account, and a server
 * that accepted it would change that account's real payout destination, so
 * the refusal stays a declared control, as in `affiliate.destination-save`.
 *
 * ## What Breaks If These Fail
 * A client who fixes a refused payout form and presses save again sees
 * nothing happen: no request leaves, and the error stays on screen.
 */
import { describe, expect, it } from "vitest";
import { ScopeActorTypes } from "../../scope/scope.types";
import { useAffiliatePayoutDestinationManager } from "../useAffiliatePayoutDestinationManager";
import {
  inputAndSettle,
  seedRealClient,
  serveCapture,
  serveFailure,
  withBound
} from "./affiliate.int-helpers";
import { recorded, server } from "./setup.integration";

// -----------------------------------------------------------------------------

const SAVE_ROUTE = "*/api/accounts/:accountId";

type AccountBody = {
  data?: { account?: { affiliate_payout_destination_id?: string } };
};
type SaveBody = {
  data?: {
    affiliate_payout_destination_id?: string;
    affiliate_payout_paypal_email_id?: string | null;
  };
};
type SavePutBody = {
  affiliate_payout_destination_id?: string;
  affiliate_payout_paypal_email_id?: string | null;
};

describe("useAffiliatePayoutDestinationManager retry — a client retries a refused payout save", () => {
  it("A client retries a payout destination save after the server refused it, and the second save is sent", async () => {
    await seedRealClient();
    const paypalDestinationId = recorded<AccountBody>(
      "get-accounts-id-affiliate-with-staged-imports-1"
    ).data?.account?.affiliate_payout_destination_id;
    const typed = recorded<SaveBody>(
      "put-accounts-id-case-non-paypal-save"
    ).data;
    const typedDestinationId = typed?.affiliate_payout_destination_id;
    const typedEmailId = typed?.affiliate_payout_paypal_email_id ?? null;

    const seenPutBodies: unknown[] = [];
    server?.events.on("request:start", async ({ request }) => {
      if (
        request.method === "PUT" &&
        /\/accounts\/[^/]+$/.test(new URL(request.url).pathname)
      ) {
        seenPutBodies.push(await request.clone().json());
      }
    });

    const manager = useAffiliatePayoutDestinationManager()
      .as(ScopeActorTypes.CLIENT)
      .fresh();
    try {
      await manager.useActions().isReady();

      const destinations = manager.useContext().destinations.value ?? [];
      const nonPaypal = destinations.find(
        destination => destination.id !== paypalDestinationId
      );
      expect(nonPaypal?.id).toBe(typedDestinationId);
      await inputAndSettle(manager, {
        payoutDestinationId: nonPaypal?.id,
        paypalEmailId: typedEmailId
      });

      serveCapture<SaveBody, SavePutBody>(
        "put",
        SAVE_ROUTE,
        "put-accounts-id-case-non-paypal-save",
        {
          bodyMatch: body =>
            body.affiliate_payout_destination_id === typedDestinationId &&
            (body.affiliate_payout_paypal_email_id ?? null) === typedEmailId
        }
      );
      serveFailure("put", SAVE_ROUTE, 422, { once: true });

      await withBound(
        manager.useActions().update(),
        3000,
        "[retry-refused-save] first update()"
      );
      expect(manager.useMeta().hasError.value).toBe(true);
      expect(seenPutBodies).toHaveLength(1);

      await withBound(
        manager.useActions().update(),
        3000,
        "[retry-refused-save] second update()"
      );

      expect(seenPutBodies).toHaveLength(2);
      expect(seenPutBodies[1]).toEqual({
        affiliate_payout_destination_id: typedDestinationId,
        affiliate_payout_paypal_email_id: typedEmailId
      });
      expect(manager.useMeta().hasError.value).toBe(false);
    } finally {
      manager.useActions().destroy();
    }
  });
});
