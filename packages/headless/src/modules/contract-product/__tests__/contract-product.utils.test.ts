/**
 * @fileoverview contract-product.utils unit tests
 *
 * ## Job To Be Done
 * Pin `selectStatusNode`'s full entry-order derivation for criterion @AC-17
 * ("Know what state each of my products is in") and @AC-15/AC-11's guard
 * inputs, per `design ✅.md` §5.2 (`ContractProductState`), §8.7 and flow.md §3's
 * locked "Entry order" rule: **unavailable first, then cancelling, then
 * expiring, then active** — the same raw `status.code` (`contract_active`)
 * is shared by three of the seven fixture rows below, so the branch a naive
 * switch on `status.code` alone would pick is the WRONG one for two of them.
 * A fixture that hardcodes every guard input to a fixed value never reaches
 * `cancelling` or `expiring` at all — that gap is the one this suite closes.
 * It also pins the one reading the integration layer cannot: `contract_fraud`,
 * which no client-reachable recorded response ever carries (bdd.md's
 * deferral table, task T03, "literal argument — no fixture is authored").
 *
 * ## What Breaks If These Fail
 * A client sees the wrong lifecycle state on one of their products — a
 * product mid-cancellation reading as plain `active`, an expiring
 * subscription reading as merely `active` with no expiry signalled, or a
 * fraud-flagged product (the one status this suite cannot reach over a
 * recorded fixture) silently reading as something else entirely — with no
 * integration test able to catch the regression, because every one of these
 * nodes shares `status.code: contract_active` with the plain-active case.
 */
import { describe, expect, it } from "vitest";
import {
  CancellationRequestStatusCodes,
  ContractStatusCodes
} from "@upmind-automation/types";
import { TrialEndActionTypes } from "@upmind-automation/types";
import { ContractProductsContextTypes } from "../contract-product.types";
import { ContractProductState } from "../contract-product.types";
import {
  resolveExcludeDelegated,
  selectSetupNode,
  selectStatusNode,
  selectTrialNode
} from "../contract-product.utils";
import type { ContractProduct } from "../contract-product.types";

type Fixture = Pick<
  ContractProduct,
  | "status"
  | "stagedImport"
  | "contractRequest"
  | "renew"
  | "isSubscription"
  | "calculatedCancelDate"
>;

/**
 * Every guard input `selectStatusNode` reads, defaulted to the "plain
 * active, nothing else in flight" case. Each `it` overrides only the guard
 * inputs its row's entry-order rule actually depends on — never the whole
 * object — so a passing row proves that ONE branch, not a coincidence of
 * defaults.
 */
function fixture(overrides: Partial<Fixture> = {}): Fixture {
  return {
    status: { code: ContractStatusCodes.ACTIVE },
    stagedImport: false,
    contractRequest: undefined,
    renew: true,
    isSubscription: false,
    calculatedCancelDate: null,
    ...overrides
  };
}

describe("selectStatusNode — the raw status.code branch, one node per code (@AC-17)", () => {
  it.each([
    [ContractStatusCodes.PENDING, ContractProductState.PENDING],
    [ContractStatusCodes.AWAITING_ACTIVATION, ContractProductState.INACTIVE],
    [ContractStatusCodes.SUSPENDED, ContractProductState.SUSPENDED]
  ])("maps %s to %s", (code, expected) => {
    expect(selectStatusNode(fixture({ status: { code } }))).toBe(expected);
  });

  it("maps contract_fraud to unavailable.fraud — the one code no recorded fixture can carry (T03)", () => {
    expect(
      selectStatusNode(fixture({ status: { code: ContractStatusCodes.FRAUD } }))
    ).toBe(ContractProductState.FRAUD);
  });
});

describe("selectStatusNode — entry order on a shared contract_active code (flow.md §3, @AC-15/@AC-11)", () => {
  it("a plain active record with no request and no stopped renewal reads as ACTIVE", () => {
    expect(
      selectStatusNode(
        fixture({ status: { code: ContractStatusCodes.ACTIVE } })
      )
    ).toBe(ContractProductState.ACTIVE);
  });

  it("a contract_active record carrying a hard cancellation request reads as CANCELLING, tested BEFORE expiring or active — the record still says contract_active", () => {
    expect(
      selectStatusNode(
        fixture({
          status: { code: ContractStatusCodes.ACTIVE },
          contractRequest: {
            status: {
              code: CancellationRequestStatusCodes.REQUEST_CANCELLATION_REQUEST
            }
          }
        })
      )
    ).toBe(ContractProductState.CANCELLING);
  });

  it("a contract_active subscription that stopped renewing, with a calculated end date, reads as EXPIRING — not the plain active the raw code alone would suggest", () => {
    expect(
      selectStatusNode(
        fixture({
          status: { code: ContractStatusCodes.ACTIVE },
          isSubscription: true,
          renew: false,
          calculatedCancelDate: "2026-12-31"
        })
      )
    ).toBe(ContractProductState.EXPIRING);
  });

  /**
   * `@proves contract-product.feature:352` — "it is not confused with a
   * subscription whose renewal invoicing was switched off, which this surface
   * tells me about but never changes". EXPIRING is read off `renew`/`calculatedCancelDate`
   * alone (flow.md §3); a subscription that is STILL renewing reads
   * `ACTIVE`, whatever its separate renewal-invoicing setting is — this
   * selector carries no input for that setting at all, so a mutation that
   * wired it in as a second, mistaken trigger for EXPIRING would surface
   * here.
   */
  it("a subscription that is still renewing does not read as EXPIRING — renewal invoicing is a separate fact this selector never reads", () => {
    expect(
      selectStatusNode(
        fixture({
          status: { code: ContractStatusCodes.ACTIVE },
          isSubscription: true,
          renew: true,
          calculatedCancelDate: null
        })
      )
    ).toBe(ContractProductState.ACTIVE);
  });

  it("a one-off purchase that never renews at all is not read as EXPIRING — expiring needs a subscription, not just renew:false", () => {
    expect(
      selectStatusNode(
        fixture({
          status: { code: ContractStatusCodes.ACTIVE },
          isSubscription: false,
          renew: false,
          calculatedCancelDate: "2026-12-31"
        })
      )
    ).toBe(ContractProductState.ACTIVE);
  });

  it("cancelling still wins over expiring when both guard inputs are present on the same record", () => {
    expect(
      selectStatusNode(
        fixture({
          status: { code: ContractStatusCodes.ACTIVE },
          contractRequest: {
            status: {
              code: CancellationRequestStatusCodes.REQUEST_CANCELLATION_REQUEST
            }
          },
          isSubscription: true,
          renew: false,
          calculatedCancelDate: "2026-12-31"
        })
      )
    ).toBe(ContractProductState.CANCELLING);
  });
});

describe("selectStatusNode — the record's own staged/cancelled/lapsed facts (@AC-11's read-only refusal, flow.md §3)", () => {
  it("a staged import reads as STAGED regardless of its status.code", () => {
    expect(
      selectStatusNode(
        fixture({
          status: { code: ContractStatusCodes.ACTIVE },
          stagedImport: true
        })
      )
    ).toBe(ContractProductState.STAGED);
  });

  it("maps contract_cancelled to unavailable.cancelled", () => {
    expect(
      selectStatusNode(
        fixture({ status: { code: ContractStatusCodes.CANCELLED } })
      )
    ).toBe(ContractProductState.CANCELLED);
  });

  it("maps contract_closed to unavailable.lapsed", () => {
    expect(
      selectStatusNode(
        fixture({ status: { code: ContractStatusCodes.CLOSED } })
      )
    ).toBe(ContractProductState.LAPSED);
  });
});

describe("selectStatusNode — an unknown status.code matches no node in ContractProductState (@AC-17)", () => {
  // `ContractProductState` has one member per published code (flow.md §3). A
  // code outside that vocabulary cannot select ANY of its members — the
  // selector returns no node, never a coerced default. AC-17's own promise,
  // "shown to me as it is, rather than quietly turned into one that is", is
  // the raw `status.code` reaching the manager's published state — proven at
  // the integration layer against the real record, not by this pure
  // selector, whose contract is "which enum member, if any" and never "the
  // raw code".
  it("a code outside the seven published codes selects no ContractProductState member", () => {
    const node = selectStatusNode(
      fixture({ status: { code: "not_a_real_code" as ContractStatusCodes } })
    );

    expect(node).not.toBe(ContractProductState.ACTIVE);
    expect(node).not.toBe(ContractProductState.PENDING);
    expect(node).toBeUndefined();
  });
});

/**
 * The `setup` and `trial` regions of the LOCKED product chart (flow.md §3):
 * `setup.incomplete` is `!(provision_setup_fields_confirmed ?? true)` — ruling
 * R15 confirms the nullish default, and the reference bundle's omission of it
 * is a transcription error against its own oracle [L24]. `trial.running` is
 * `in_trial`; `trial.ending` is `in_trial && trial_end_action === CANCEL`.
 *
 * `status` is exclusive and `setup`/`trial` are independent, so a product can
 * be active, awaiting setup and on trial at once — which is exactly why these
 * three readings cannot be proven by `selectStatusNode`'s own suite, and why a
 * regression in either region is invisible to it.
 *
 * - `@proves contract-product.feature:333` — whether it is awaiting setup
 * - `@proves contract-product.feature:334` — whether it is on trial
 * - `@proves contract-product.feature:335` — whether that trial is about to end
 */
function setupFixture(
  provisionSetupFieldsConfirmed: ContractProduct["provisionSetupFieldsConfirmed"]
): Parameters<typeof selectSetupNode>[0] {
  return {
    provisionSetupFieldsConfirmed
  } as Parameters<typeof selectSetupNode>[0];
}

function trialFixture(
  inTrial: ContractProduct["inTrial"],
  trialEndAction: ContractProduct["trialEndAction"]
): Parameters<typeof selectTrialNode>[0] {
  return { inTrial, trialEndAction } as Parameters<typeof selectTrialNode>[0];
}

describe("selectSetupNode — whether my product is awaiting setup (@AC-17, flow.md §3)", () => {
  it("a product whose setup fields are NOT confirmed is awaiting setup", () => {
    expect(selectSetupNode(setupFixture(false))).toBe(
      ContractProductState.SETUP_INCOMPLETE
    );
  });

  it("a product whose setup fields ARE confirmed is not awaiting setup", () => {
    expect(selectSetupNode(setupFixture(true))).toBe(
      ContractProductState.SETUP_COMPLETE
    );
  });

  // Ruling R15: the field ABSENT means complete, never incomplete. Dropping
  // the `?? true` default inverts exactly this case and would tell every
  // client whose record omits the field that their product is awaiting setup.
  it("a product whose record omits the field altogether is NOT awaiting setup — the nullish default is complete (R15)", () => {
    expect(selectSetupNode(setupFixture(undefined))).toBe(
      ContractProductState.SETUP_COMPLETE
    );
  });
});

describe("selectTrialNode — whether my product is on trial, and whether that trial is about to end (@AC-17, flow.md §3)", () => {
  it("a product not on trial reads as neither running nor ending", () => {
    expect(
      selectTrialNode(trialFixture(false, TrialEndActionTypes.CONTINUE))
    ).toBe(ContractProductState.TRIAL_NONE);
  });

  it("a product on trial whose trial continues afterwards reads as TRIAL_RUNNING", () => {
    expect(
      selectTrialNode(trialFixture(true, TrialEndActionTypes.CONTINUE))
    ).toBe(ContractProductState.TRIAL_RUNNING);
  });

  it("a product on trial whose trial ends in cancellation reads as TRIAL_ENDING, tested BEFORE running", () => {
    expect(
      selectTrialNode(trialFixture(true, TrialEndActionTypes.CANCEL))
    ).toBe(ContractProductState.TRIAL_ENDING);
  });

  // A migrating trial is still merely RUNNING: only CANCEL makes it "about to
  // end" for a client. A regression that treated every non-CONTINUE action as
  // ending would warn a client their product is about to stop when it is in
  // fact about to change plan.
  it("a product on trial that MIGRATES afterwards is running, not ending — only a cancelling trial end is 'about to end'", () => {
    expect(
      selectTrialNode(trialFixture(true, TrialEndActionTypes.MIGRATE))
    ).toBe(ContractProductState.TRIAL_RUNNING);
  });

  it("a product NOT on trial whose trial end action is CANCEL is still not ending — the trial must be running first", () => {
    expect(
      selectTrialNode(trialFixture(false, TrialEndActionTypes.CANCEL))
    ).toBe(ContractProductState.TRIAL_NONE);
  });
});

/**
 * KNOWN GAP — the three RECORD-FACT lines of the AC-17 scenario that amendment
 * A1 splits out alongside the thirteen states:
 *
 * - `@gap contract-product.feature:340` — whether it was imported (`isImported`)
 * - `@gap contract-product.feature:341` — whether it was moved to another
 *   product (`hasMoved`)
 * - `@gap contract-product.feature:342` — whether it has unpaid recurring
 *   invoices (`hasUnpaidRecurringInvoices`)
 *
 * `design ✅.md` §8.7 names all three as record facts read off the product
 * record, never machine nodes — so neither this selector suite nor the
 * integration suite's state assertions reach them. Proving them needs a
 * recorded product capture that actually CARRIES an import id, a moved-to
 * product and an unpaid recurring invoice; the one product capture on disk
 * (`get-contract-products-id.json`) carries none of the three, and recording
 * is forbidden this pass (`receipts.md`). Asserting them against the capture's
 * own empty values would be a tautology over the fixture, not a proof of the
 * reading. Registered here rather than faked green.
 */

/**
 * `design ✅.md` §6.1/§8.5/§8.9, §"edge conditions" — the exclude_delegated flag
 * `useContractProducts` sends. This is NOT AC-18 coverage: AC-18 promises the
 * client's remembered preference is persisted and re-read across sessions via
 * the `client-personal-details` seam, which this pure 3-arg function never
 * touches (its `preference` argument is a plain boolean handed in by the
 * caller, not a read of that seam), and which the prover cannot exercise — no
 * capture for it exists on disk, and `contract-product.traceability.test.ts`'s
 * `SCENARIO_GAPS` records AC-18 as an unproven operator gap for that reason. This
 * suite pins only the PURE derivation: given a context and a preference value,
 * which `exclude_delegated` int comes out.
 */
describe("resolveExcludeDelegated — the exclude_delegated flag the scope sends", () => {
  it("the DELEGATED selector context always reads the delegated view — exclude_delegated=0", () => {
    expect(
      resolveExcludeDelegated(
        { type: ContractProductsContextTypes.DELEGATED },
        undefined,
        true
      )
    ).toBe(0);
  });

  it("the client's own excludeDelegatedProducts preference, set true, forces exclude_delegated=1 outside the delegated view", () => {
    expect(resolveExcludeDelegated(undefined, true, true)).toBe(1);
  });

  it("the client's own excludeDelegatedProducts preference, set false, forces exclude_delegated=0 outside the delegated view", () => {
    expect(resolveExcludeDelegated(undefined, false, true)).toBe(0);
  });
});
