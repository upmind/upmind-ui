// -----------------------------------------------------------------------------
/**
 * @fileoverview affiliate.utils — pure derivations (@AC13, @AC16 unit halves)
 *
 * ## Job To Be Done
 * Protect `referralOrigin` against the brand's `oauth_clients` array order
 * (design.md §8.9 declared override "a brand with the `default` entry
 * second") and pin the two documented commission-status override rows
 * (design.md §8.9, bdd.md AC16 — the two-status row and a `keep_until` in
 * the past) against `commissionTagStatus`/`commissionSummaryStatus`.
 *
 * ## What Breaks If These Fail
 * A client would see no referral URL for a brand whose default OAuth client
 * is not array index 0, or a commission would show the wrong status label
 * (or wrongly show "cancelled" for a stale `keep_until`, audit DI-3).
 *
 * ## Known gap (prover hand-off — not fabricated)
 * The full derivation formula for `commissionTagStatus`/`commissionSummaryStatus`
 * — which exact flag combination yields each of the five other reachable
 * statuses (`rejected`, `on_hold`, `awaiting_payment`, `pending_approval`,
 * `approved`) singly, "in each order" (bdd.md AC16: 2 of its 4 cases) — is
 * not stated in design.md, bdd.md, the Gherkin, or the exported public
 * surface (the function bodies are internal, out of the prover's Read-block
 * scope). Only the two rows bdd.md states a literal expected output for are
 * proven here. The "tag order"/"summary order" full-sweep cases are a named
 * gap, not guessed.
 */
import { resolve } from "path";
import { describe, expect, it } from "vitest";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import {
  referralOrigin,
  commissionTagStatus,
  commissionSummaryStatus
} from "../affiliate.utils";
import type {
  IAffiliatePendingCommission,
  IBrand
} from "@upmind-automation/types";

// -----------------------------------------------------------------------------

const recordingsDir = resolve(
  process.cwd(),
  "src/modules/affiliate/__tests__/fixtures"
);

function recordedAccountBrand(): IBrand {
  const body = getFixtureBody<{ data: { account?: { brand?: IBrand } } }>(
    "accounts-id-affiliate-with-staged-imports",
    { recordingsDir }
  );
  const brand = body?.data?.account?.brand;
  if (!brand) {
    throw new Error(
      "[affiliate.utils.test] Missing the recorded account capture's account.brand."
    );
  }
  return brand;
}

function recordedCommissionRow(index = 0): IAffiliatePendingCommission {
  const body = getFixtureBody<{ data: IAffiliatePendingCommission[] }>(
    "accounts-id-affiliate-pending-commissions",
    { recordingsDir }
  );
  const row = body?.data?.[index];
  if (!row) {
    throw new Error(
      `[affiliate.utils.test] Missing recorded pending-commissions row ${index}.`
    );
  }
  return row;
}

describe("affiliate.utils — referralOrigin", () => {
  it("returns the default oauth_clients entry's origin regardless of its array position (declared override)", () => {
    const brand = recordedAccountBrand();
    const clients = brand.oauth_clients ?? [];
    const defaultEntry = clients.find(client => client.default);
    if (!defaultEntry) {
      throw new Error(
        "[affiliate.utils.test] The recorded account brand carries no default oauth_clients entry."
      );
    }

    const reordered: IBrand = {
      ...brand,
      oauth_clients: [
        ...clients.filter(client => client !== defaultEntry),
        defaultEntry
      ]
    };

    // Hand-written literal copied from the recorded account capture — never a
    // value read back from the same brand object under test.
    expect(referralOrigin(reordered)).toBe("kn6x1dzbtcgb.staging.upmind.dev");
  });

  it("returns an empty string when the brand has no default oauth_clients entry", () => {
    const brand = recordedAccountBrand();
    const noDefault: IBrand = {
      ...brand,
      oauth_clients: (brand.oauth_clients ?? []).map(client => ({
        ...client,
        default: false
      }))
    };

    expect(referralOrigin(noDefault)).toBe("");
  });

  it("returns an empty string when no brand is given", () => {
    expect(referralOrigin(null)).toBe("");
    expect(referralOrigin(undefined)).toBe("");
  });
});

describe("affiliate.commission-derivations — the two documented override rows (bdd.md AC16)", () => {
  it("the two-status row (suspended true, rejected/invoice_paid/commission_approved false) gives tag on_hold and summary awaiting_payment", () => {
    const baseRow = recordedCommissionRow();
    const twoStatusRow: IAffiliatePendingCommission = {
      ...baseRow,
      suspended: true,
      rejected: false,
      invoice_paid: false,
      commission_approved: false
    };

    expect(commissionTagStatus(twoStatusRow)).toBe("on_hold");
    expect(commissionSummaryStatus(twoStatusRow)).toBe("awaiting_payment");
  });

  it("a keep_until in the past gives pending_approval, never cancelled (audit DI-3)", () => {
    // Declared override (same convention as the two-status row above): both
    // real recorded rows now carry `commission_approved: true` (re-recorded
    // 2026-09-30) — "approved" would win regardless of `keep_until` on
    // either real row, so picking by position no longer reaches this case.
    // `commission_approved` and `invoice_paid` are both set explicitly here,
    // never assumed from whichever value the current capture happens to
    // carry for either flag — `invoice_paid: true` is the case this row
    // proves (DI-3: the pending-approval branch must win over `cancelled`
    // when the invoice is paid and not yet approved, regardless of `keep_until`).
    const baseRow = recordedCommissionRow(0);
    const staleRow: IAffiliatePendingCommission = {
      ...baseRow,
      commission_approved: false,
      invoice_paid: true,
      keep_until: "2020-01-01 00:00:00"
    };

    expect(commissionTagStatus(staleRow)).toBe("pending_approval");
    expect(commissionSummaryStatus(staleRow)).toBe("pending_approval");
  });
});
