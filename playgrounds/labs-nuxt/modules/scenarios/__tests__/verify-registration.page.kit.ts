// -----------------------------------------------------------------------------
/**
 * @module scenarios/__tests__/verify-registration.page.kit
 * @description Shared scaffolding of the labs verify-registration page specs:
 * the replay server of the auth recordings and its answers, the page mounted
 * under the Suspense its top-level await needs, the start press with the
 * page's own delay, and the per-test reset of the timers, the session store,
 * the request listeners and the mounted pages. Holds no assertion.
 */

import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, beforeEach, vi } from "vitest";
import { Suspense, defineComponent, h } from "vue";
import { createMemoryHistory, createRouter } from "vue-router";
import { useSessionStore } from "@upmind-automation/headless";
import { startReplayServer } from "@upmind-automation/test-fixtures/replay-server";
import {
  clearSessionCookies,
  makeFixtureOverrides
} from "../../../../../packages/headless/src/__tests__/int-test-helpers";
import {
  LINK,
  RECORDING,
  makeLandingAnswers,
  recordingsDir
} from "../../../../../packages/headless/src/modules/auth/__tests__/useVerifyRegistration.recordings";
import VerifyRegistrationPage from "../useVerifyRegistration/verify-registration.page.vue";
import { forEach } from "lodash-es";
import type { VueWrapper } from "@vue/test-utils";
import type { LocationQueryRaw } from "vue-router";

// -----------------------------------------------------------------------------

export {
  GRANT_ROUTE,
  LINK,
  RECORDING,
  VALID_PASSWORD,
  VERIFY_ROUTE,
  recordingsDir
} from "../../../../../packages/headless/src/modules/auth/__tests__/useVerifyRegistration.recordings";

const START_DELAY_MS = 1000;

export const server = startReplayServer({ recordingsDir });

const { overrideToken, overrideSelf } = makeFixtureOverrides(
  server,
  recordingsDir
);

export { overrideSelf };

export const { serve, serveHeld } = makeLandingAnswers(server);

export type Mounted = {
  wrapper: VueWrapper;
  router: ReturnType<typeof createRouter>;
};

const NuxtLinkStub = defineComponent({
  props: { to: { type: String, required: true } },
  setup:
    (props, { slots }) =>
    () =>
      h("a", { href: props.to }, slots.default?.())
});

const mountedPages: VueWrapper[] = [];

export const key = (id: string): string => `[data-test-key="${id}"]`;

/** Mounts the page at `query`, under the Suspense its top-level await needs. */
export async function mountPage(
  query: LocationQueryRaw = LINK
): Promise<Mounted> {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: "/", component: { render: () => null } }]
  });
  await router.push({ path: "/", query });
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
  mountedPages.push(wrapper);
  await vi.waitFor(() => {
    if (!wrapper.find(key("verify-registration-start")).exists()) {
      throw new Error("page still suspended");
    }
  });
  return { wrapper, router };
}

/** Presses start, runs the page's own delay, and lets the landing settle. */
export async function start(wrapper: VueWrapper): Promise<void> {
  await wrapper.find(key("verify-registration-start")).trigger("click");
  vi.advanceTimersByTime(START_DELAY_MS);
  await flushPromises();
}

/**
 * Registers the per-test reset: only `setTimeout` is faked, so the replay
 * server and the query layer keep real time.
 */
export function usePageHarness(): void {
  beforeEach(async () => {
    vi.useFakeTimers({
      toFake: ["setTimeout", "clearTimeout"],
      shouldAdvanceTime: true
    });
    clearSessionCookies();
    sessionStorage.clear();
    overrideToken(RECORDING.guestToken);
    useSessionStore().useActions().clear();
    await useSessionStore().useActions().isReady();
  });

  afterEach(() => {
    forEach(mountedPages.splice(0), wrapper => wrapper.unmount());
    server?.events.removeAllListeners("request:start");
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });
}
