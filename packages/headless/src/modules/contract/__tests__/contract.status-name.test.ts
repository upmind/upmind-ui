/**
 * @fileoverview mapContract — the translated status names (AC-12, R38 item 9)
 *
 * ## Job To Be Done
 * Commit 5582bbd18 binds a contract's `status.name` and its
 * `cancellationRequest.status.name` through `useTranslateName` (which prefers
 * `name_translated`, else `name`), and the useContract page draws them. Prove
 * the mapper applies that translation over a recorded read — for BOTH the
 * contract status and the cancellation-request status — preferring
 * `name_translated`, so a mutant that binds the raw name or the code is caught.
 *
 * ## What Breaks If These Fail
 * The page shows a raw status code, an untranslated name, or nothing where a
 * translated status label belongs.
 */

import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import { mapContract } from "../contract.mappers";
import { useTranslateName } from "../../../utils";
import type {
  IContract,
  IContractCancellationRequest
} from "@upmind-automation/types";

const recordingsDir = join(import.meta.dirname, "fixtures");

function recordedContract(): IContract {
  return getFixtureBody<{ data: IContract }>(
    "get-contracts-id-with-staged-imports-1",
    { recordingsDir }
  ).data;
}

describe("mapContract — the translated status names (R38 item 9)", () => {
  it("binds the contract status name through useTranslateName, preferring name_translated over the raw name", () => {
    const base = recordedContract();
    const status = { ...base.status, name_translated: "Active (translated)" };
    const contract = { ...base, status } as IContract;

    const view = mapContract(contract);

    expect(view.status.name).toBe(useTranslateName(status));
    expect(view.status.name).toBe("Active (translated)");
    // Not the raw name, and not the code — it is the translated name.
    expect(view.status.name).not.toBe(base.status.name);
    expect(view.status.name).not.toBe(status.code);
  });

  it("binds the cancellation-request status name through useTranslateName, preferring name_translated", () => {
    const base = recordedContract();
    const cancelStatus = getFixtureBody<{ data: IContractCancellationRequest }>(
      "post-contracts-id-cancel-request",
      { recordingsDir }
    ).data.status;
    const status = {
      ...cancelStatus,
      name_translated: "Cancellation Requested (translated)"
    };
    const contract = {
      ...base,
      cancellation_request: { status }
    } as unknown as IContract;

    const view = mapContract(contract);

    expect(view.cancellationRequest?.status?.name).toBe(
      useTranslateName(status)
    );
    expect(view.cancellationRequest?.status?.name).toBe(
      "Cancellation Requested (translated)"
    );
    expect(view.cancellationRequest?.status?.name).not.toBe(cancelStatus?.name);
  });
});
