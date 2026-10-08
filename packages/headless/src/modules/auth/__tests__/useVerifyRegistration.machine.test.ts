// @vitest-environment happy-dom
/**
 * @fileoverview Registration landing machine transitions (unit)
 *
 * ## Job To Be Done
 * Prove each transition of the landing machine and the data it keeps, with the
 * verify and the grant answered at the network edge: the missing-value guard,
 * the nil-answer handling, the set-password validation loop, the failure
 * routes and the retry. The blocked-address 403 mapping is proven here,
 * through the refused verify, and not in the rules spec.
 *
 * ## What Breaks If These Fail
 * A guest with a good link is sent to the wrong outcome, a bad password form is
 * sent to the API, a retry ignores a late answer of the old attempt, or a nil
 * answer crashes the landing.
 */

import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { getFixture } from "@upmind-automation/test-fixtures";
import {
  GRANT_ROUTE,
  LINK,
  RECORDING,
  VALID_PASSWORD,
  VERIFY_ROUTE,
  landing,
  reachSetPassword,
  serve,
  serveControl,
  server,
  useLandingHarness
} from "./useVerifyRegistration.kit";
import { recordingsDir } from "./useVerifyRegistration.kit";

// -----------------------------------------------------------------------------

vi.mock("../../brand", () => ({
  useBrand: () => ({
    isReady: () => Promise.resolve(true),
    getConfigValue: () => undefined
  })
}));

useLandingHarness();

describe("registration landing machine", () => {
  it("ignores a reset while the landing waits and stays idle", () => {
    const instance = landing();

    instance.useActions().reset();

    expect(instance.useContext().currentState.value).toBe("idle");
    expect(instance.useMeta().hasErrors.value).toBe(false);
  });

  it("sends a verify answered with a nil data to the set-password step", async () => {
    serveControl("patch", VERIFY_ROUTE, 200, { status: "ok", data: null });
    const instance = landing();

    await instance.useActions().verify(LINK);
    await instance.useActions().isReady();

    expect(instance.useContext().currentState.value).toBe("needsPassword");
    expect(instance.useMeta().needsPassword.value).toBe(true);
  });

  it("sends a verify answered with a JSON null to expired-or-invalid with an error", async () => {
    serveControl("patch", VERIFY_ROUTE, 200, null);
    const instance = landing();

    await instance.useActions().verify(LINK);
    await instance.useActions().isReady();

    expect(instance.useContext().currentState.value).toBe("expiredOrInvalid");
    expect(instance.useMeta().hasErrors.value).toBe(true);
    expect(instance.useContext().error.value).toMatchObject({
      origin: "headless",
      message: "error.session_verify_link_invalid"
    });
  });

  it("keeps the 403 status and the API code of a refused verify", async () => {
    serveControl("patch", VERIFY_ROUTE, 403, {
      error: { code: "ip_address_disallowed" }
    });
    const instance = landing();

    await instance.useActions().verify(LINK);
    await instance.useActions().isReady();

    expect(instance.useContext().currentState.value).toBe("expiredOrInvalid");
    expect(instance.useContext().error.value).toMatchObject({
      status: 403,
      apiCode: "ip_address_disallowed"
    });
  });

  it("keeps a model with errors at the set-password step and sends no grant", async () => {
    const instance = await reachSetPassword();
    const grants = vi.fn();
    server?.events.on("request:start", ({ request }) => {
      if (request.url.includes("/oauth/access_token")) grants();
    });
    instance
      .useActions()
      .set({ password: "abc", password_confirmation: "abc" });

    await instance.useActions().completeRegistration();

    expect(instance.useContext().currentState.value).toBe("needsPassword");
    expect(instance.useContext().validationErrors.value).toContainEqual(
      expect.objectContaining({ instancePath: "/password" })
    );
    expect(grants).not.toHaveBeenCalled();
    server?.events.removeAllListeners("request:start");
  });

  it("clears the validation errors once a valid model is completed", async () => {
    const instance = await reachSetPassword();
    serve("post", GRANT_ROUTE, RECORDING.grantWithPassword);
    server?.use(
      http.get("*/self", () => {
        const self = getFixture(RECORDING.self, { recordingsDir }).response;
        return HttpResponse.json(self.body as Record<string, unknown>, {
          status: self.status
        });
      })
    );
    instance
      .useActions()
      .set({ password: "abc", password_confirmation: "abc" });
    await instance.useActions().completeRegistration();
    instance.useActions().set(VALID_PASSWORD);

    await instance.useActions().completeRegistration();
    await instance.useActions().isReady();

    expect(instance.useContext().currentState.value).toBe("success");
    expect(instance.useContext().validationErrors.value).toStrictEqual([]);
  });

  it("drops the late answer of a stopped attempt while the restarted verify is still held", async () => {
    const stale = getFixture(RECORDING.noPassword, { recordingsDir }).response;
    const refused = getFixture(RECORDING.invalidHash, {
      recordingsDir
    }).response;
    const releases: Array<() => void> = [];
    const answered: number[] = [];
    server?.use(
      http.patch(VERIFY_ROUTE, async () => {
        const attempt = releases.length;
        await new Promise<void>(resolve => releases.push(resolve));
        answered.push(attempt);
        const { body, status } = attempt === 0 ? stale : refused;
        return HttpResponse.json(body as Record<string, unknown>, { status });
      })
    );
    const instance = landing();

    void instance.useActions().verify(LINK);
    await vi.waitFor(() => expect(releases).toHaveLength(1));
    instance.useActions().reset();
    await vi.waitFor(() => expect(releases).toHaveLength(2));
    releases[0]();
    await vi.waitFor(() => expect(answered).toStrictEqual([0]));
    await new Promise(resolve => setImmediate(resolve));

    expect(instance.useContext().currentState.value).toBe("verifying");
    expect(instance.useMeta().needsPassword.value).toBe(false);

    releases[1]();
    await instance.useActions().isReady();

    expect(instance.useContext().currentState.value).toBe("expiredOrInvalid");
    expect(instance.useMeta().needsPassword.value).toBe(false);
    expect(instance.useContext().error.value?.status).toBe(refused.status);
  });

  it("ignores a second verify outside the idle state", async () => {
    serve("patch", VERIFY_ROUTE, RECORDING.noPassword);
    const instance = landing();
    await instance.useActions().verify(LINK);
    await instance.useActions().isReady();

    await instance
      .useActions()
      .verify({ username: "other@example.com", hash: "y" });

    expect(instance.useContext().currentState.value).toBe("needsPassword");
    expect(instance.useContext().model.value?.username).toBe(LINK.username);
  });

  it("ignores a completion outside the set-password step", async () => {
    const instance = landing();

    await instance.useActions().completeRegistration();

    expect(instance.useContext().currentState.value).toBe("idle");
  });
});
