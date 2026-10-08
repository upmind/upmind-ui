// @vitest-environment happy-dom
/**
 * @fileoverview Registration landing meta flags (unit)
 *
 * ## Job To Be Done
 * Prove the ten flags of the landing in each state a consumer can see: idle,
 * in flight, the set-password step, success, expired-or-invalid and
 * completion failure.
 *
 * ## What Breaks If These Fail
 * A consumer shows a spinner on a refused link, the expired page on a
 * completion failure, or hides the form at the set-password step.
 */

import { describe, expect, it, vi } from "vitest";
import { getFixture } from "@upmind-automation/test-fixtures";
import {
  GRANT_ROUTE,
  LINK,
  RECORDING,
  VERIFY_ROUTE,
  landing,
  overrideSelf,
  recordingsDir,
  reachSetPassword,
  serve,
  serveHeld,
  server,
  useLandingHarness
} from "./useVerifyRegistration.kit";
import { get, mapValues } from "lodash-es";

// -----------------------------------------------------------------------------

vi.mock("../../brand", () => ({
  useBrand: () => ({
    isReady: () => Promise.resolve(true),
    getConfigValue: () => undefined
  })
}));

useLandingHarness();

const FLAGS = [
  "isVerifying",
  "needsPassword",
  "needsCompleteStep",
  "twoFARequired",
  "isSuccess",
  "isComplete",
  "isExpiredOrInvalid",
  "isProcessing",
  "hasErrors",
  "hasValidationErrors"
] as const;

function readFlags(
  instance: ReturnType<typeof landing>
): Record<string, boolean> {
  const meta = instance.useMeta();
  return mapValues(
    Object.fromEntries(FLAGS.map(flag => [flag, meta[flag]])),
    ref => ref.value
  );
}

const ALL_OFF = Object.fromEntries(FLAGS.map(flag => [flag, false]));

describe("registration landing meta flags", () => {
  it("reads verifying and nothing else in idle", () => {
    expect(readFlags(landing())).toStrictEqual({
      ...ALL_OFF,
      isVerifying: true
    });
  });

  it("reads verifying and processing while the verify is in flight", async () => {
    const release = serveHeld("patch", VERIFY_ROUTE, RECORDING.noPassword);
    const instance = landing();

    let arrived = false;
    server?.events.on("request:start", ({ request }) => {
      if (request.url.includes("/reg_hash/verify")) arrived = true;
    });

    void instance.useActions().verify(LINK);
    await vi.waitFor(() => expect(arrived).toBe(true));

    expect(readFlags(instance)).toStrictEqual({
      ...ALL_OFF,
      isVerifying: true,
      isProcessing: true
    });
    release();
    await instance.useActions().isReady();
    server?.events.removeAllListeners("request:start");
  });

  it("reads the password need at the set-password step", async () => {
    const hasName = get(
      getFixture(RECORDING.noPassword, { recordingsDir }).response.body,
      "data.has_name"
    );
    const instance = await reachSetPassword();

    expect(readFlags(instance)).toStrictEqual({
      ...ALL_OFF,
      needsPassword: true,
      needsCompleteStep: !hasName
    });
  });

  it("reads validation errors at the set-password step after a bad submit", async () => {
    const instance = await reachSetPassword();
    instance
      .useActions()
      .set({ password: "abc", password_confirmation: "abc" });

    await instance.useActions().completeRegistration();

    expect(readFlags(instance)).toMatchObject({
      needsPassword: true,
      hasValidationErrors: true,
      isSuccess: false
    });
  });

  it("reads success and complete after an activation, keeping the data flags", async () => {
    serve("patch", VERIFY_ROUTE, RECORDING.hasPassword);
    serve("post", GRANT_ROUTE, RECORDING.grantDirect);
    overrideSelf(RECORDING.self);
    const instance = landing();

    await instance.useActions().verify(LINK);
    await instance.useActions().isReady();

    expect(readFlags(instance)).toStrictEqual({
      ...ALL_OFF,
      isSuccess: true,
      isComplete: true
    });
  });

  it("reads expired-or-invalid with errors after a refused link", async () => {
    serve("patch", VERIFY_ROUTE, RECORDING.invalidHash);
    const instance = landing();

    await instance.useActions().verify(LINK);
    await instance.useActions().isReady();

    expect(readFlags(instance)).toStrictEqual({
      ...ALL_OFF,
      isExpiredOrInvalid: true,
      hasErrors: true
    });
  });

  it("reads errors without expired-or-invalid after a direct completion failure", async () => {
    serve("patch", VERIFY_ROUTE, RECORDING.hasPassword);
    serve("post", GRANT_ROUTE, RECORDING.grantRefused);
    const instance = landing();

    await instance.useActions().verify(LINK);
    await instance.useActions().isReady();

    expect(readFlags(instance)).toStrictEqual({
      ...ALL_OFF,
      hasErrors: true
    });
  });
});
