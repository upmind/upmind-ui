/**
 * @fileoverview mapContract — the cancellation-request badge meta (AC-3, R38 item 9)
 *
 * ## Job To Be Done
 * `contract.feature:139` promises an opened contract "arrives ... with that
 * cancellation request's state". The mapper turns the request's own
 * `status.code` into the translated-badge `cancellationRequest.meta` flag a page
 * binds (R38 item 9, G2). Prove it sets the flag that MATCHES a real recorded
 * cancellation request — over the module's own `post-contracts-id-cancel-request`
 * capture, whose data is a real request record.
 *
 * ## What Breaks If These Fail
 * A page draws the wrong cancellation-request badge, or none, for a contract
 * whose cancellation the client is waiting on.
 */

import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import { mapContract } from "../contract.mappers";
import type {
  IContract,
  IContractCancellationRequest
} from "@upmind-automation/types";

const recordingsDir = join(import.meta.dirname, "fixtures");

describe("mapContract — the cancellation-request badge meta (contract.feature:139)", () => {
  it("sets the badge flag that matches a recorded cancellation request's own status code", () => {
    const base = getFixtureBody<{ data: IContract }>(
      "get-contracts-id-with-staged-imports-1",
      { recordingsDir }
    ).data;
    const cancellationRequest = getFixtureBody<{
      data: IContractCancellationRequest;
    }>("post-contracts-id-cancel-request", { recordingsDir }).data;
    // The recorded request's own status — a hard cancellation request.
    expect(cancellationRequest.status?.code).toBe(
      "request_cancellation_request"
    );

    const contract = {
      ...base,
      cancellation_request: cancellationRequest
    } as IContract;

    const view = mapContract(contract);

    expect(view.cancellationRequest?.status?.code).toBe(
      cancellationRequest.status?.code
    );
    // The matching badge flag is set; the others stay false, so a mutant that
    // sets the wrong flag (or none) is caught.
    expect(view.cancellationRequest?.meta?.isCancellationRequest).toBe(true);
    expect(view.cancellationRequest?.meta?.isAccepted).toBe(false);
    expect(view.cancellationRequest?.meta?.isScheduledFutureCancellation).toBe(
      false
    );
    // The row's own `meta` carries the same request flags, so the list's one
    // status cell badges the request beside the contract's state.
    expect(view.meta.isCancellationRequest).toBe(true);
    expect(view.meta.isAccepted).toBe(false);
  });
});
