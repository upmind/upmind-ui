// -----------------------------------------------------------------------------
/**
 * @fileoverview affiliate.payout-null-destination — a client whose payout
 * destination was never set opens the editor and is offered the brand default
 * (@AC22)
 *
 * ## Job To Be Done
 * Protect that an account with a null `affiliate_payout_destination_id` seeds
 * the editor with no saved destination and inherits the brand's default
 * destination (design.md §8.6: "a null id inherits the default"). Over a
 * Wallet default it asks for no PayPal email. Over a PayPal default it
 * resolves to PayPal, requires a PayPal email and preselects the
 * client's default email.
 *
 * ## What Breaks If These Fail
 * A client who never chose a payout destination would see a destination they
 * did not choose, no PayPal email field when the brand pays by PayPal, or a
 * PayPal email field they cannot use.
 *
 * ## Recordings used
 * The R-ENROL-2 client throughout. The Wallet case serves its recorded
 * `self`, account (destination null) and emails (`case=reenrol2-empty-destination`),
 * with the brand-wide destinations recording that carries `wallet` as the
 * default. The PayPal cases serve its `case=paypal-default` self, account,
 * emails and brand destinations, recorded in one read-only pass while the
 * operator held PayPal as the brand default (R-DATA-6, 2026-10-02).
 *
 * ## Controls
 * `useAffiliatePayoutDestinationManager.null-not-default` flips the two
 * PayPal cases (CONTROLS.md row 50). The Wallet case stays green under it by
 * construction: a Wallet default resolves to non-PayPal either way.
 */
import { describe, expect, it } from "vitest";
import { ScopeActorTypes } from "../../scope/scope.types";
import { useAffiliatePayoutDestinationManager } from "../useAffiliatePayoutDestinationManager";
import {
  ENROL2_SELF_CAPTURE,
  PAYPAL_DEFAULT_SELF_CAPTURE,
  seedRecordedClient,
  serveCapture
} from "./affiliate.int-helpers";
import { recorded } from "./setup.integration";

// -----------------------------------------------------------------------------

type DestinationRow = { id: string; code: string; default: boolean };
type DestinationsBody = { data?: DestinationRow[] };
type EmailsBody = { data?: { id: string; default: boolean }[] };

const ACCOUNT_ROUTE = "*/api/accounts/:accountId/affiliate";
const EMAILS_ROUTE = "*/api/clients/:clientId/emails";
const DESTINATIONS_ROUTE = "*/api/brands/:brandId/affiliate_payout_destination";

const ENROL2_ACCOUNT_CAPTURE =
  "get-accounts-id-affiliate-case-reenrol2-empty-destination-with-staged-imports-1";
const ENROL2_EMAILS_CAPTURE =
  "get-clients-id-emails-case-reenrol2-empty-destination-with-staged-imports-1";
const PAYPAL_DEFAULT_ACCOUNT_CAPTURE =
  "get-accounts-id-affiliate-case-paypal-default-with-staged-imports-1";
const PAYPAL_DEFAULT_EMAILS_CAPTURE =
  "get-clients-id-emails-case-paypal-default-with-staged-imports-1";
const PAYPAL_DEFAULT_DESTINATIONS_CAPTURE =
  "get-brands-id-affiliate-payout-destination-case-paypal-default";

function seedPaypalDefaultClient(): Promise<{ accountId: string }> {
  return seedRecordedClient(PAYPAL_DEFAULT_SELF_CAPTURE);
}

function servePaypalDefaultCaptures(): void {
  serveCapture("get", ACCOUNT_ROUTE, PAYPAL_DEFAULT_ACCOUNT_CAPTURE);
  serveCapture("get", EMAILS_ROUTE, PAYPAL_DEFAULT_EMAILS_CAPTURE);
  serveCapture("get", DESTINATIONS_ROUTE, PAYPAL_DEFAULT_DESTINATIONS_CAPTURE);
}

describe("affiliate.payout-null-destination — the editor of a client with no saved destination", () => {
  it("A client whose saved destination is empty inherits the brand default and is asked for no PayPal email on open", async () => {
    await seedRecordedClient(ENROL2_SELF_CAPTURE);
    serveCapture("get", ACCOUNT_ROUTE, ENROL2_ACCOUNT_CAPTURE);
    serveCapture("get", EMAILS_ROUTE, ENROL2_EMAILS_CAPTURE);

    const defaultRow = recorded<DestinationsBody>(
      "get-brands-id-affiliate-payout-destination"
    ).data?.find(destination => destination.default);
    expect(defaultRow?.id).toBeTruthy();
    expect(
      recorded<EmailsBody>(ENROL2_EMAILS_CAPTURE).data?.some(
        email => email.default
      )
    ).toBe(true);

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
      expect(manager.useMeta().isPaypal.value).toBe(false);
      expect(manager.useContext().model.value?.paypalEmailId ?? "").toBe("");
      expect(manager.useMeta().isDirty.value).toBe(false);
    } finally {
      manager.useActions().destroy();
    }
  });

  it("A client with no saved payout destination on a PayPal-default brand is offered PayPal and requires a PayPal email", async () => {
    await seedPaypalDefaultClient();
    servePaypalDefaultCaptures();

    const defaultRow = recorded<DestinationsBody>(
      PAYPAL_DEFAULT_DESTINATIONS_CAPTURE
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
      expect(manager.useMeta().defaultDestination.value?.code).toBe("paypal");
      expect(manager.useMeta().isPaypal.value).toBe(true);
    } finally {
      manager.useActions().destroy();
    }
  });

  it("A client whose payout destination resolves to PayPal and who has no PayPal email opens with the default email preselected", async () => {
    await seedPaypalDefaultClient();
    servePaypalDefaultCaptures();

    const defaultEmail = recorded<EmailsBody>(
      PAYPAL_DEFAULT_EMAILS_CAPTURE
    ).data?.find(email => email.default);
    expect(defaultEmail?.id).toBeTruthy();

    const manager = useAffiliatePayoutDestinationManager()
      .as(ScopeActorTypes.CLIENT)
      .fresh();
    try {
      await manager.useActions().isReady();

      expect(manager.useContext().model.value?.paypalEmailId).toBe(
        defaultEmail?.id
      );
      expect(manager.useMeta().isDirty.value).toBe(true);
      expect(manager.useMeta().isPaypal.value).toBe(true);
    } finally {
      manager.useActions().destroy();
    }
  });
});
