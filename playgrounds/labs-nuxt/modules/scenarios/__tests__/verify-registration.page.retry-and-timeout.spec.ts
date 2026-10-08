// @vitest-environment happy-dom
// -----------------------------------------------------------------------------
/**
 * @fileoverview The labs verify-registration page: the retry control while the
 * landing works, and the bounded wait for the new session.
 *
 * ## Job To Be Done
 * The retry button is disabled while the landing processes a request, so a
 * hand cannot restart a verify that is in flight. When the account activates
 * but the active session never becomes the new one (another client is signed
 * in), the page stops waiting after the 10 s switch timeout and shows the
 * user-error text instead of the interstitial for ever.
 *
 * ## What Breaks If These Fail
 * A hand presses "Try again" mid-request and double-sends the link check, or a
 * hand sees "Checking the link" for ever after an activation that succeeded.
 *
 * Only `setTimeout` is faked, so the replay server keeps real time.
 */

import { flushPromises } from "@vue/test-utils";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { useSessionStore } from "@upmind-automation/headless";
import labs from "@upmind-automation/i18n/modules/labs-en.json";
import { getFixture, getFixtureBody } from "@upmind-automation/test-fixtures";
import { persistTokenToStorage } from "../../../../../packages/headless/src/modules/session-store";
import {
  GRANT_ROUTE,
  RECORDING,
  VERIFY_ROUTE,
  key,
  mountPage,
  recordingsDir,
  serve,
  serveHeld,
  server,
  start,
  usePageHarness
} from "./verify-registration.page.kit";
import type { IToken } from "@upmind-automation/types";
import type { VueWrapper } from "@vue/test-utils";

// -----------------------------------------------------------------------------

const SESSION_SWITCH_TIMEOUT_MS = 10000;
const OTHER_CLIENT_BEARER = "client-a-bearer";

vi.mock("../../../../../packages/headless/src/modules/brand", () => ({
  useBrand: () => ({
    isReady: () => Promise.resolve(true),
    getConfigValue: () => undefined
  })
}));

usePageHarness();

const retryButton = (wrapper: VueWrapper) =>
  wrapper.find(key("verify-registration-retry"));

// -----------------------------------------------------------------------------

describe("the retry control", () => {
  it("is disabled while the link check is in flight and enabled once it settles", async () => {
    const release = serveHeld("patch", VERIFY_ROUTE, RECORDING.noPassword);
    const { wrapper: mounted } = await mountPage();
    expect(retryButton(mounted).attributes("disabled")).toBeUndefined();

    await start(mounted);

    await vi.waitFor(() => {
      expect(retryButton(mounted).attributes("disabled")).toBe("");
    });
    release();
    await vi.waitFor(() => {
      expect(mounted.find(key("verify-registration-form")).exists()).toBe(true);
    });
    expect(retryButton(mounted).attributes("disabled")).toBeUndefined();
  });
});

describe("the start control", () => {
  const startButton = (wrapper: VueWrapper) =>
    wrapper.find(key("verify-registration-start"));

  it("is enabled before the first start and disabled once the landing leaves idle, through Try again", async () => {
    const release = serveHeld("patch", VERIFY_ROUTE, RECORDING.noPassword);
    const { wrapper: mounted } = await mountPage();
    expect(startButton(mounted).attributes("disabled")).toBeUndefined();

    await start(mounted);
    expect(startButton(mounted).attributes("disabled")).toBe("");
    release();
    await vi.waitFor(() => {
      expect(mounted.find(key("verify-registration-form")).exists()).toBe(true);
    });
    expect(startButton(mounted).attributes("disabled")).toBe("");

    await retryButton(mounted).trigger("click");
    await flushPromises();
    await vi.waitFor(() => {
      expect(mounted.find(key("verify-registration-form")).exists()).toBe(true);
    });
    expect(startButton(mounted).attributes("disabled")).toBe("");
  });
});

describe("the bounded wait for the new session", () => {
  it("shows the user-error text after the switch timeout when another client stays active", async () => {
    const recorded = getFixtureBody<IToken>(RECORDING.grantDirect, {
      recordingsDir
    });
    await persistTokenToStorage({
      ...recorded,
      actor_id: `${OTHER_CLIENT_BEARER}-actor`,
      access_token: OTHER_CLIENT_BEARER
    });
    await vi.waitFor(() => {
      if (!useSessionStore().useMeta().hasClientSession.value) {
        throw new Error("the other client session is still settling");
      }
    });
    const self = getFixture(RECORDING.self, { recordingsDir }).response;
    server?.use(
      http.get("*/self", ({ request }) =>
        request.headers.get("authorization") === `Bearer ${OTHER_CLIENT_BEARER}`
          ? HttpResponse.json(self.body as Record<string, unknown>, {
              status: self.status
            })
          : new HttpResponse(null, { status: 500 })
      )
    );
    serve("patch", VERIFY_ROUTE, RECORDING.hasPassword);
    serve("post", GRANT_ROUTE, RECORDING.grantDirect);
    const { wrapper: mounted } = await mountPage();

    await start(mounted);
    await vi.waitFor(() => {
      if (!mounted.find(key("verify-registration-success")).exists()) {
        throw new Error("the landing has not reached success");
      }
    });
    expect(mounted.text()).not.toContain(labs.verify_registration_user_error);

    vi.advanceTimersByTime(SESSION_SWITCH_TIMEOUT_MS);
    await flushPromises();

    expect(mounted.find(key("verify-registration-success")).text()).toContain(
      labs.verify_registration_user_error
    );
  });
});
