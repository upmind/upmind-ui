/**
 * @fileoverview contract.utils unit tests
 *
 * ## Job To Be Done
 * Pin `selectContractStatusNode`'s state derivation for criterion @AC-12
 * ("See my contract's state ... in the platform's own words"), per design.md
 * §5.2 (`ContractState`) and flow.md §3's locked `contract.machine.ts` node
 * table: `unavailable.cancelled` / `.lapsed` / `.fraud` derive from
 * `status.code` alone; `available.cancelling` derives from
 * `cancellation_request.status.code === request_cancellation_request` (the
 * HARD request only) — carried on a record whose OWN `status.code` still
 * reads `contract_active`, the same shared-code ambiguity
 * `contract-product.utils.test.ts` already proves for its own chart. A
 * fixture that never separates "the record's own status" from "the
 * cancellation request riding on it" would never reach `cancelling` at all.
 *
 * ## What Breaks If These Fail
 * A client sees the wrong lifecycle state on one of their contracts — a
 * contract with an outstanding cancellation request reading as plain
 * `active` (so AC-7's withdraw action is offered nowhere), or a status code
 * the platform's own vocabulary does not name being silently coerced into a
 * state that was never on the record.
 */
import { describe, expect, it } from "vitest";
import {
  CancellationRequestStatusCodes,
  ContractStatusCodes
} from "@upmind-automation/types";
import { ContractState } from "../contract.types";
import { selectContractStatusNode } from "../contract.utils";
import type { Contract } from "../contract.types";

type Fixture = Pick<Contract, "status" | "cancellationRequest">;

/**
 * Every guard input `selectContractStatusNode` reads, defaulted to the
 * "plain active, no cancellation request" case. Each `it` overrides only
 * the guard inputs its row's entry-order rule actually depends on — never
 * the whole object — so a passing row proves that ONE branch, not a
 * coincidence of defaults.
 */
function fixture(overrides: Partial<Fixture> = {}): Fixture {
  return {
    status: { code: ContractStatusCodes.ACTIVE },
    cancellationRequest: undefined,
    ...overrides
  };
}

describe("selectContractStatusNode — the raw status.code branch, one node per code (@AC-12)", () => {
  it.each([
    [ContractStatusCodes.PENDING, ContractState.PENDING],
    [ContractStatusCodes.AWAITING_ACTIVATION, ContractState.INACTIVE],
    [ContractStatusCodes.SUSPENDED, ContractState.SUSPENDED]
  ])("maps %s to %s", (code, expected) => {
    expect(selectContractStatusNode(fixture({ status: { code } }))).toBe(
      expected
    );
  });

  it("maps contract_fraud to unavailable.fraud", () => {
    expect(
      selectContractStatusNode(
        fixture({ status: { code: ContractStatusCodes.FRAUD } })
      )
    ).toBe(ContractState.FRAUD);
  });

  it("maps contract_cancelled to unavailable.cancelled", () => {
    expect(
      selectContractStatusNode(
        fixture({ status: { code: ContractStatusCodes.CANCELLED } })
      )
    ).toBe(ContractState.CANCELLED);
  });

  it("maps contract_closed to unavailable.lapsed", () => {
    expect(
      selectContractStatusNode(
        fixture({ status: { code: ContractStatusCodes.CLOSED } })
      )
    ).toBe(ContractState.LAPSED);
  });
});

describe("selectContractStatusNode — entry order on a shared contract_active code (flow.md §3, @AC-12)", () => {
  it("a plain active record with no cancellation request reads as ACTIVE", () => {
    expect(
      selectContractStatusNode(
        fixture({ status: { code: ContractStatusCodes.ACTIVE } })
      )
    ).toBe(ContractState.ACTIVE);
  });

  it("a contract_active record carrying a HARD cancellation request reads as CANCELLING — the record's own status.code still says contract_active", () => {
    expect(
      selectContractStatusNode(
        fixture({
          status: { code: ContractStatusCodes.ACTIVE },
          cancellationRequest: {
            status: {
              code: CancellationRequestStatusCodes.REQUEST_CANCELLATION_REQUEST
            }
          }
        })
      )
    ).toBe(ContractState.CANCELLING);
  });

  it("a contract_active record carrying a SOFT (non-hard) request code is not read as CANCELLING — only the hard request moves this node", () => {
    expect(
      selectContractStatusNode(
        fixture({
          status: { code: ContractStatusCodes.ACTIVE },
          cancellationRequest: {
            status: {
              code: CancellationRequestStatusCodes.REQUEST_END_OF_BILLING_CYCLE
            }
          }
        })
      )
    ).toBe(ContractState.ACTIVE);
  });
});

describe("selectContractStatusNode — an unknown status.code is a wire-contract violation, not a state (@AC-12)", () => {
  it("a code outside the platform's own vocabulary falls through to the raw, unmapped code rather than a coerced default", () => {
    const node = selectContractStatusNode(
      fixture({ status: { code: "not_a_real_code" as ContractStatusCodes } })
    );

    expect(node).not.toBe(ContractState.ACTIVE);
    expect(node).not.toBe(ContractState.PENDING);
    expect(node).toBeUndefined();
  });
});
