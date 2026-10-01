// -----------------------------------------------------------------------------
/**
 * @fileoverview affiliate.payout-null-destination — a client whose payout
 * destination was never set opens the editor and is offered the brand default
 * (@AC22)
 *
 * ## Job To Be Done
 * Protect that an account with a null `affiliate_payout_destination_id` seeds
 * the editor with no saved destination, resolves to the brand's default
 * destination, and asks for no PayPal email (design.md §8.6: "a null id
 * inherits the default").
 *
 * ## What Breaks If These Fail
 * A client who never chose a payout destination would see a destination they
 * did not choose, or a PayPal email field they cannot use.
 *
 * ## Recordings used
 * One client throughout: the R-ENROL-2 client's own recorded `self`, account
 * read (destination null) and emails read (`case=reenrol2-empty-destination`),
 * served verbatim. The brand's destinations answer from the brand-wide
 * recording, which carries `wallet` as the default.
 *
 * ## Named gap (CONTROLS.md row 50, NO-NULL-DESTINATION-STATE)
 * The inherit rule shows only over a brand whose default is PayPal. Staging
 * holds Wallet and a recording may not flip a value (ADR-035), so
 * `useAffiliatePayoutDestinationManager.null-not-default` cannot flip this
 * spec. The scenario stays `@todo`. This spec characterises the null-account
 * open and is reddened only by other controls.
 */
import { describe, expect, it } from "vitest";
import { ScopeActorTypes } from "../../scope/scope.types";
import { useAffiliatePayoutDestinationManager } from "../useAffiliatePayoutDestinationManager";
import {
  ENROL2_SELF_CAPTURE,
  seedRecordedClient,
  serveCapture
} from "./affiliate.int-helpers";
import { recorded } from "./setup.integration";

// -----------------------------------------------------------------------------

type DestinationRow = { id: string; code: string; default: boolean };
type DestinationsBody = { data?: DestinationRow[] };

describe("affiliate.payout-null-destination — the editor of a client with no saved destination", () => {
  it("A client with no saved payout destination is offered the brand's default destination and asked for no PayPal email", async () => {
    await seedRecordedClient(ENROL2_SELF_CAPTURE);
    serveCapture(
      "get",
      "*/api/accounts/:accountId/affiliate",
      "get-accounts-id-affiliate-case-reenrol2-empty-destination-with-staged-imports-1"
    );
    serveCapture(
      "get",
      "*/api/clients/:clientId/emails",
      "get-clients-id-emails-case-reenrol2-empty-destination-with-staged-imports-1"
    );

    const defaultRow = recorded<DestinationsBody>(
      "get-brands-id-affiliate-payout-destination"
    ).data?.find(destination => destination.default);
    expect(defaultRow?.id).toBeTruthy();

    const manager = useAffiliatePayoutDestinationManager()
      .as(ScopeActorTypes.CLIENT)
      .fresh();
    try {
      await manager.useActions().isReady();

      expect(
        manager.useContext().model.value?.payoutDestinationId ?? null
      ).toBeNull();
      expect(manager.useMeta().defaultDestination.value?.id).toBe(
        defaultRow?.id
      );
      expect(manager.useMeta().defaultDestination.value?.code).toBe(
        defaultRow?.code
      );
      expect(manager.useContext().model.value?.paypalEmailId ?? "").toBe("");
      expect(manager.useMeta().isDirty.value).toBe(false);
    } finally {
      manager.useActions().destroy();
    }
  });
});
