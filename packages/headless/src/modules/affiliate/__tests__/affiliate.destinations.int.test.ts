// -----------------------------------------------------------------------------
/**
 * @fileoverview affiliate.destinations — the destinations read for the
 * account brand; the account's own destination is PayPal, the brand's
 * fallback default is still `wallet` (@AC22)
 *
 * ## Job To Be Done
 * Protect that the payout destination manager reads the account brand's
 * destinations with the documented window/order (design.md §8.1) and
 * publishes the real `default` entry and the account's own `isPaypal`
 * verdict correctly. The editor's form schema offers the read destinations
 * and the client's own emails as closed choices, never free strings.
 *
 * ## What Breaks If These Fail
 * A client would see the wrong (or no) default payout destination, or a
 * PayPal destination could wrongly fail to gate the PayPal email field on, or
 * the editor would make the client type a raw destination or email id.
 *
 * ## Operator brief, 2026-09-30 — staging state changed, retitled
 * The brand now carries a real PayPal destination (`code: "paypal"`),
 * recorded fresh this pass. It does NOT hold the brand-level `default: true`
 * flag — `wallet` still does — but it IS the account's own real, currently
 * saved `affiliate_payout_destination_id`. The manager seeds
 * `model.payoutDestinationId` from the ACCOUNT, not from the brand's
 * `default` flag (design.md §8.6), so `isPaypal` now reads TRUE — the prior
 * "the real default is not PayPal" title/assertion (NO-PAYPAL-DESTINATION)
 * no longer describes reality and is corrected, not carried forward stale.
 *
 * Stated omissions (ADR-021, design.md §8.2): this spec's only branches are
 * the documented base read and its failure case; no PayPal-default
 * (brand-flag) override is authored — the account-seeded PayPal case below
 * is the real, achievable proof instead.
 */
import { beforeEach, describe, expect, it, onTestFinished } from "vitest";
import { ScopeActorTypes } from "../../scope/scope.types";
import { useAffiliatePayoutDestinationManager } from "../useAffiliatePayoutDestinationManager";
import {
  recordedAffiliateAccountBrandId,
  seedRealClient,
  serveFailure
} from "./affiliate.int-helpers";
import { choiceValues } from "./affiliate.uischema-helpers";
import { recorded, server } from "./setup.integration";
import type { JsonSchema } from "@jsonforms/core";

// -----------------------------------------------------------------------------

type DestinationRow = { id: string; code: string; default: boolean };
type DestinationsBody = { data?: DestinationRow[] };
type AccountBody = {
  data?: {
    account?: {
      affiliate_payout_destination_id?: string;
      affiliate_payout_paypal_email_id?: string;
    };
  };
};
type EmailRow = { id: string; default: boolean };
type EmailsBody = { data?: EmailRow[] };

function recordedDefaultDestination(): DestinationRow {
  const row = recorded<DestinationsBody>(
    "get-brands-id-affiliate-payout-destination"
  ).data?.find(d => d.default);
  if (!row) {
    throw new Error(
      "[affiliate.destinations] recorded destinations capture carries no default row."
    );
  }
  return row;
}

function recordedAccountPayoutDestinationId(): string {
  const id = recorded<AccountBody>(
    "get-accounts-id-affiliate-with-staged-imports-1"
  ).data?.account?.affiliate_payout_destination_id;
  if (!id) {
    throw new Error(
      "[affiliate.destinations] recorded account capture carries no affiliate_payout_destination_id."
    );
  }
  return id;
}

function recordedDefaultEmailId(): string {
  const id = recorded<EmailsBody>(
    "get-clients-id-emails-with-staged-imports-1"
  ).data?.find(e => e.default)?.id;
  if (!id) {
    throw new Error(
      "[affiliate.destinations] recorded emails capture carries no default row."
    );
  }
  return id;
}

describe("affiliate.destinations — the destinations read for the account brand; the account's own destination is PayPal", () => {
  beforeEach(async () => {
    await seedRealClient();
  });

  it("the destinations read for the account brand, and the account's own destination is detected as PayPal", async () => {
    const seen: string[] = [];
    server?.events.on("request:start", ({ request }) => {
      const url = new URL(request.url);
      if (url.pathname.includes("/affiliate_payout_destination")) {
        seen.push(`${url.pathname}${url.search}`);
      }
    });

    const manager = useAffiliatePayoutDestinationManager()
      .as(ScopeActorTypes.CLIENT)
      .fresh();
    try {
      await manager.useActions().isReady();

      expect(seen).toHaveLength(1);
      // design.md §8.1: "brandId = affiliate.account.brand_id" — read from
      // THIS unit's own account capture, never from the `self` capture of a
      // different unit.
      expect(seen[0]).toContain(
        `/brands/${recordedAffiliateAccountBrandId()}/affiliate_payout_destination`
      );
      expect(seen[0]).toContain("limit=10");
      expect(seen[0]).toContain("offset=0");
      expect(seen[0]).toContain("order=-created_at");

      // Read from the recorded destinations capture itself, never a
      // hand-copied literal — `defaultDestination` is the full destination
      // row, not a bare id.
      const defaultRow = recordedDefaultDestination();
      expect(manager.useMeta().defaultDestination.value?.id).toBe(
        defaultRow.id
      );
      expect(manager.useMeta().defaultDestination.value?.code).toBe(
        defaultRow.code
      );

      // The account's OWN saved destination (seeded from the account, not
      // from the brand's `default` flag) is PayPal — design.md §8.6 Meta:
      // `isPaypal`, `model.payoutDestinationId` seeded from the account.
      expect(manager.useContext().model.value?.payoutDestinationId).toBe(
        recordedAccountPayoutDestinationId()
      );
      expect(manager.useMeta().isPaypal.value).toBe(true);
    } finally {
      manager.useActions().destroy();
    }
  });

  it("isPaypal is false for a non-PayPal destination, true for a PayPal one, and the PayPal preselect fires only then (always-paypal, preselect-any)", async () => {
    const manager = useAffiliatePayoutDestinationManager()
      .as(ScopeActorTypes.CLIENT)
      .fresh();
    try {
      await manager.useActions().isReady();

      // Read from the recorded destinations and emails captures (design.md
      // §8.9 "No hand edit") — never a hand-copied literal, never read back
      // from the system under test.
      const nonPaypalId = recordedDefaultDestination().id;
      const paypalId = recordedAccountPayoutDestinationId();
      const defaultEmailId = recordedDefaultEmailId();

      // Non-PayPal first: `isPaypal` false, and no preselect fires. The
      // `always-paypal` control reddens the isPaypal assertion below. The
      // debounced `input` action needs a real wait before its effect lands
      // on the machine context, the same pattern client-address's own
      // manager spec uses for the identical debounced seam.
      manager.useActions().input({
        payoutDestinationId: nonPaypalId,
        paypalEmailId: ""
      } as never);
      await new Promise(resolve => setTimeout(resolve, 900));
      expect(manager.useMeta().isPaypal.value).toBe(false);
      expect(manager.useContext().model.value?.paypalEmailId).toBe("");

      // Then PayPal, with an empty email: `isPaypal` true, and the preselect
      // writes the default email. The `preselect-any` control reddens the
      // preselect assertion below: it fires only on an input that TURNS the
      // destination to PayPal, never unconditionally.
      manager.useActions().input({ payoutDestinationId: paypalId } as never);
      await new Promise(resolve => setTimeout(resolve, 900));
      expect(manager.useMeta().isPaypal.value).toBe(true);
      expect(manager.useContext().model.value?.paypalEmailId).toBe(
        defaultEmailId
      );
    } finally {
      manager.useActions().destroy();
    }
  });

  it("the payout destination editor offers the brand's destinations and the client's own emails as its only choices", async () => {
    const manager = useAffiliatePayoutDestinationManager()
      .as(ScopeActorTypes.CLIENT)
      .fresh();
    onTestFinished(() => manager.useActions().destroy());
    await manager.useActions().isReady();

    const destinationIds = (
      recorded<DestinationsBody>("get-brands-id-affiliate-payout-destination")
        .data ?? []
    ).map(d => d.id);
    const emailIds = (
      recorded<EmailsBody>("get-clients-id-emails-with-staged-imports-1")
        .data ?? []
    ).map(e => e.id);
    expect(destinationIds.length).toBeGreaterThan(0);
    expect(emailIds.length).toBeGreaterThan(0);

    const properties = manager.useContext().schema.value?.properties as
      | Record<string, JsonSchema>
      | undefined;

    expect([...choiceValues(properties?.payoutDestinationId)].sort()).toEqual(
      [...destinationIds].sort()
    );
    expect([...choiceValues(properties?.paypalEmailId)].sort()).toEqual(
      [...emailIds].sort()
    );
  });

  it("a failed destinations read leaves the lookup empty, and the seed still runs from the account", async () => {
    serveFailure("get", "*/api/brands/:brandId/affiliate_payout_destination");

    const manager = useAffiliatePayoutDestinationManager()
      .as(ScopeActorTypes.CLIENT)
      .fresh();
    try {
      await manager.useActions().isReady();

      expect(manager.useMeta().defaultDestination.value).toBeUndefined();
      // design.md §8.2 Failure surface: "The seed still runs from the account."
      expect(manager.useContext().accountId.value).toBeDefined();
    } finally {
      manager.useActions().destroy();
    }
  });
});
