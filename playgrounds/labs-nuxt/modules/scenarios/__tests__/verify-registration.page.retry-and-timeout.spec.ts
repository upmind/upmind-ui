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

import { join } from "node:path";
import { flushPromises, mount } from "@vue/test-utils";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Suspense, defineComponent, h } from "vue";
import { createMemoryHistory, createRouter } from "vue-router";
import { useSessionStore } from "@upmind-automation/headless";
import labs from "@upmind-automation/i18n/modules/labs-en.json";
import { getFixture, getFixtureBody } from "@upmind-automation/test-fixtures";
import {
  overrideRoute,
  startReplayServer
} from "@upmind-automation/test-fixtures/replay-server";
import {
  clearSessionCookies,
  makeFixtureOverrides
} from "../../../../../packages/headless/src/__tests__/int-test-helpers";
import { persistTokenToStorage } from "../../../../../packages/headless/src/modules/session-store";
import VerifyRegistrationPage from "../useVerifyRegistration/verify-registration.page.vue";
import type { VueWrapper } from "@vue/test-utils";
import type { IToken } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

const recordingsDir = join(
  import.meta.dirname,
  "../../../../../packages/headless/src/modules/auth/__tests__/fixtures"
);

const VERIFY_ROUTE = "*/api/clients/reg_hash/verify";
const GRANT_ROUTE = "*/oauth/access_token";
const START_DELAY_MS = 1000;
const SESSION_SWITCH_TIMEOUT_MS = 10000;
const OTHER_CLIENT_BEARER = "client-a-bearer";

const RECORDING = {
  noPassword: "patch-clients-reg-hash-verify-case-no-password",
  hasPassword: "patch-clients-reg-hash-verify-case-has-password",
  grantDirect: "post-oauth-access-token-case-complete-direct-client",
  self: "get-self"
} as const;

const LINK = { username: "link-user@example.com", hash: "link-hash-value" };

vi.mock("../../../../../packages/headless/src/modules/brand", () => ({
  useBrand: () => ({
    isReady: () => Promise.resolve(true),
    getConfigValue: () => undefined
  })
}));

const server = startReplayServer({ recordingsDir });
const { overrideToken } = makeFixtureOverrides(
  server,
  recordingsDir
);

const NuxtLinkStub = defineComponent({
  props: { to: { type: String, required: true } },
  setup:
    (props, { slots }) =>
    () =>
      h("a", { href: props.to }, slots.default?.())
});

const key = (id: string) => `[data-test-key="${id}"]`;

function serve(
  method: "patch" | "post",
  route: string,
  recording: string
): void {
  const { response } = getFixture(recording, { recordingsDir });
  overrideRoute(
    server,
    method,
    route,
    response.body as Record<string, unknown>,
    response.status
  );
}

/** Serves a recording on `route` only after the returned release is called. */
function serveHeld(route: string, recording: string): () => void {
  const { response } = getFixture(recording, { recordingsDir });
  let release: () => void = () => undefined;
  const gate = new Promise<void>(resolve => {
    release = resolve;
  });
  server?.use(
    http.patch(route, async () => {
      await gate;
      return HttpResponse.json(response.body as Record<string, unknown>, {
        status: response.status
      });
    })
  );
  return release;
}

async function mountPage(): Promise<VueWrapper> {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: "/", component: { render: () => null } }]
  });
  await router.push({ path: "/", query: LINK });
  await router.isReady();
  vi.stubGlobal("navigateTo", (to: string) => router.push(to));

  const wrapper = mount(
    defineComponent({
      render: () =>
        h(Suspense, null, { default: () => h(VerifyRegistrationPage) })
    }),
    {
      attachTo: document.body,
      global: { plugins: [router], components: { NuxtLink: NuxtLinkStub } }
    }
  );
  await vi.waitFor(() => {
    if (!wrapper.find(key("verify-registration-start")).exists()) {
      throw new Error("page still suspended");
    }
  });
  return wrapper;
}

async function start(wrapper: VueWrapper): Promise<void> {
  await wrapper.find(key("verify-registration-start")).trigger("click");
  vi.advanceTimersByTime(START_DELAY_MS);
  await flushPromises();
}

const retryButton = (wrapper: VueWrapper) =>
  wrapper.find(key("verify-registration-retry"));

let mounted: VueWrapper | undefined;

beforeEach(async () => {
  vi.useFakeTimers({
    toFake: ["setTimeout", "clearTimeout"],
    shouldAdvanceTime: true
  });
  clearSessionCookies();
  sessionStorage.clear();
  overrideToken("post-oauth-access-token-guest");
  useSessionStore().useActions().clear();
  await useSessionStore().useActions().isReady();
});

afterEach(() => {
  mounted?.unmount();
  mounted = undefined;
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

// -----------------------------------------------------------------------------

describe("the retry control", () => {
  it("is disabled while the link check is in flight and enabled once it settles", async () => {
    const release = serveHeld(VERIFY_ROUTE, RECORDING.noPassword);
    mounted = await mountPage();
    expect(retryButton(mounted).attributes("disabled")).toBeUndefined();

    await start(mounted);

    await vi.waitFor(() => {
      expect(retryButton(mounted as VueWrapper).attributes("disabled")).toBe(
        ""
      );
    });
    release();
    await vi.waitFor(() => {
      expect(
        (mounted as VueWrapper).find(key("verify-registration-form")).exists()
      ).toBe(true);
    });
    expect(retryButton(mounted).attributes("disabled")).toBeUndefined();
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
    mounted = await mountPage();

    await start(mounted);
    await vi.waitFor(() => {
      if (!(mounted as VueWrapper).find(key("verify-registration-success")).exists()) {
        throw new Error("the landing has not reached success");
      }
    });
    expect(mounted.text()).not.toContain(labs.verify_registration_user_error);

    vi.advanceTimersByTime(SESSION_SWITCH_TIMEOUT_MS);
    await flushPromises();

    expect(
      mounted.find(key("verify-registration-success")).text()
    ).toContain(labs.verify_registration_user_error);
  });
});
