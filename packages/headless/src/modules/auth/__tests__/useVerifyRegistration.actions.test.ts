// @vitest-environment happy-dom
/**
 * @fileoverview Registration landing actions (unit)
 *
 * ## Job To Be Done
 * Prove each action of the landing does what its name promises: verify sends
 * the link values, completeRegistration submits the form, set merges a partial
 * model, reset restarts the check, destroy evicts the instance, and isReady
 * waits for a settled outcome.
 *
 * ## What Breaks If These Fail
 * A consumer awaits isReady and reads a half-finished landing, a field change
 * drops the other fields of the form, or a destroyed landing comes back stale.
 */

import { describe, expect, it, vi } from "vitest";
import {
  GRANT_ROUTE,
  LINK,
  RECORDING,
  VALID_PASSWORD,
  VERIFY_ROUTE,
  landing,
  overrideSelf,
  reachSetPassword,
  serve,
  serveHeld,
  server,
  useLandingHarness
} from "./useVerifyRegistration.kit";

// -----------------------------------------------------------------------------

vi.mock("../../brand", () => ({
  useBrand: () => ({
    isReady: () => Promise.resolve(true),
    getConfigValue: () => undefined
  })
}));

useLandingHarness();

describe("registration landing actions", () => {
  it("sends the link values of verify as the body of the verify request", async () => {
    const bodies: unknown[] = [];
    server?.events.on("request:start", ({ request }) => {
      if (request.url.includes("/reg_hash/verify")) {
        bodies.push(request.clone().json());
      }
    });
    serve("patch", VERIFY_ROUTE, RECORDING.noPassword);
    const instance = landing();

    await instance.useActions().verify(LINK);
    await instance.useActions().isReady();

    await expect(Promise.all(bodies)).resolves.toStrictEqual([
      { username: LINK.username, reg_hash: LINK.hash }
    ]);
    server?.events.removeAllListeners("request:start");
  });

  it("merges each set call into the model and keeps the other fields", async () => {
    const instance = await reachSetPassword();

    instance.useActions().set({ password: "abcdefg1" });
    instance.useActions().set({ password_confirmation: "abcdefg1" });

    expect(instance.useContext().model.value).toStrictEqual({
      username: LINK.username,
      ...VALID_PASSWORD
    });
  });

  it("submits the form on completeRegistration and reaches success", async () => {
    const instance = await reachSetPassword();
    serve("post", GRANT_ROUTE, RECORDING.grantWithPassword);
    overrideSelf(RECORDING.self);
    instance.useActions().set(VALID_PASSWORD);

    await instance.useActions().completeRegistration();
    await instance.useActions().isReady();

    expect(instance.useMeta().isSuccess.value).toBe(true);
  });

  it("restarts the link check on reset after a refused link", async () => {
    serve("patch", VERIFY_ROUTE, RECORDING.invalidHash);
    const instance = landing();
    await instance.useActions().verify(LINK);
    await instance.useActions().isReady();
    const release = serveHeld("patch", VERIFY_ROUTE, RECORDING.invalidHash);

    instance.useActions().reset();

    await vi.waitFor(() =>
      expect(instance.useMeta().isProcessing.value).toBe(true)
    );
    expect(instance.useMeta().isExpiredOrInvalid.value).toBe(false);
    release();
    await instance.useActions().isReady();
    expect(instance.useContext().currentState.value).toBe("expiredOrInvalid");
  });

  it("evicts the instance on destroy so the next call starts idle", async () => {
    const instance = landing();
    await instance.useActions().verify({ hash: "x" });
    await instance.useActions().isReady();

    instance.useActions().destroy();

    expect(landing().useContext().currentState.value).toBe("idle");
  });

  it("holds isReady until the verify answer settles the landing", async () => {
    const release = serveHeld("patch", VERIFY_ROUTE, RECORDING.noPassword);
    let arrived = false;
    server?.events.on("request:start", ({ request }) => {
      if (request.url.includes("/reg_hash/verify")) arrived = true;
    });
    const instance = landing();
    let settled = false;

    void instance.useActions().verify(LINK);
    void instance
      .useActions()
      .isReady()
      .then(() => {
        settled = true;
      });
    await vi.waitFor(() => expect(arrived).toBe(true));

    expect(settled).toBe(false);
    expect(instance.useMeta().isProcessing.value).toBe(true);

    release();
    await vi.waitFor(() => expect(settled).toBe(true));
    expect(instance.useContext().currentState.value).toBe("needsPassword");
    server?.events.removeAllListeners("request:start");
  });
});
