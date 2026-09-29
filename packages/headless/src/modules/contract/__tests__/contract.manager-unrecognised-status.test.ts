// -----------------------------------------------------------------------------
/**
 * @fileoverview useContract machine — an unrecognised status settles on the error node
 *
 * ## Job To Be Done
 * Prove `contract.feature:354` at the machine layer. When a contract loads with
 * a `status.code` outside the platform's published vocabulary, the manager's
 * machine settles on its top-level `error` node rather than coercing the record
 * into one of the eight status states. The record is a RECORDED production
 * capture (`get-contracts-id-with-staged-imports-1`) with only its
 * `status.code` replaced by an unknown code — the same controlled input the
 * pure selector proves in `contract.utils.test.ts`, driven here through the
 * REAL machine so the `isUnrecognised -> #error` transition is itself under
 * test. The barred integration form fed a hand-built wire body (D76/D90); this
 * doubles the `load` service instead, so no wire body is authored.
 *
 * ## What Breaks If These Fail
 * A contract whose status the platform cannot name is shown as an ordinary
 * lifecycle state (active, pending, ...) instead of erroring, so the client
 * sees a state the record never carried.
 */
// -----------------------------------------------------------------------------

import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { interpret } from "xstate";
import { waitFor } from "xstate/lib/waitFor";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import contractMachine from "../contract.machine";
import type { ContractLoaded } from "../contract.types";
import type { IContract } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

const recordingsDir = join(import.meta.dirname, "fixtures");

/** The recorded single-contract read, cloned with only its status.code swapped. */
function recordedRecord(statusCode: string): IContract {
  const envelope = getFixtureBody<{ data: IContract }>(
    "get-contracts-id-with-staged-imports-1",
    { recordingsDir }
  );
  const record = JSON.parse(JSON.stringify(envelope.data)) as IContract & {
    status: { code: string };
  };
  record.status.code = statusCode;
  return record;
}

/** Start the real machine with a doubled `load`; drive it past the auth gate. */
function driveWithStatus(statusCode: string) {
  const loaded: ContractLoaded = {
    record: recordedRecord(statusCode),
    lookups: {}
  };
  const machine = contractMachine.withConfig({
    actions: { setAuthHelper: () => undefined },
    services: { load: async () => loaded } as never
  });
  const service = interpret(machine).start();
  service.send({ type: "AUTHENTICATED" });
  return service;
}

// -----------------------------------------------------------------------------

describe("useContract machine — an unknown status.code settles on the error node (D43, @AC-12)", () => {
  // @proves contract.feature:354
  it("A contract read whose status is none I know settles on an error instead of a state", async () => {
    const service = driveWithStatus("not_a_real_code");

    await waitFor(
      service,
      state =>
        state.matches("error") ||
        state.matches("available.status") ||
        state.matches("unavailable.status"),
      { timeout: 4000 }
    );
    const state = service.getSnapshot();
    service.stop();

    expect(state.matches("error")).toBe(true);
    expect(state.matches("available.status")).toBe(false);
    expect(state.matches("unavailable.status")).toBe(false);
  });
});
