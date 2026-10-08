// @vitest-environment happy-dom
// -----------------------------------------------------------------------------
/**
 * @fileoverview The labs verify-registration page, mounted over the real
 * `useVerifyRegistration` composable and the recorded staging answers.
 *
 * ## Job To Be Done
 * AC-20: the page renders each landing outcome and owns its links. The landing
 * never moves the route; a hand follows the continue or dashboard link.
 * AC-25: the new copy renders from the i18n source, and the page hands the
 * landing's validation errors to the form so a mismatched confirmation reads
 * "Enter the same password again".
 *
 * ## What Breaks If These Fail
 * A hand driving the Live page sees a set-password form on a link that is
 * already expired, is moved off the page when the account activates, follows an
 * unsafe return path, or reads a raw translation key instead of the copy.
 *
 * The AC-20 timer is the page's own 1000 ms start delay: only `setTimeout` is
 * faked, so the replay server and the query layer keep real time.
 */

import { join } from "node:path";
import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Suspense, defineComponent, h } from "vue";
import { createMemoryHistory, createRouter } from "vue-router";
import {
  clearSessionCookies,
  makeFixtureOverrides
} from "../../../../../packages/headless/src/__tests__/int-test-helpers";
import { getFixture } from "@upmind-automation/test-fixtures";
import {
  overrideRoute,
  startReplayServer
} from "@upmind-automation/test-fixtures/replay-server";
import { useSessionStore } from "@upmind-automation/headless";
import error from "@upmind-automation/i18n/core/error-en.json";
import form from "@upmind-automation/i18n/core/form-en.json";
import VerifyRegistrationPage from "../useVerifyRegistration/verify-registration.page.vue";
import { get } from "lodash-es";
import type { VueWrapper } from "@vue/test-utils";
import type { LocationQueryRaw } from "vue-router";

// -----------------------------------------------------------------------------

const recordingsDir = join(
  import.meta.dirname,
  "../../../../../packages/headless/src/modules/auth/__tests__/fixtures"
);

const VERIFY_ROUTE = "*/api/clients/reg_hash/verify";
const GRANT_ROUTE = "*/oauth/access_token";
const START_DELAY_MS = 1000;

const RECORDING = {
  noPassword: "patch-clients-reg-hash-verify-case-no-password",
  invalidHash: "patch-clients-reg-hash-verify-case-invalid-hash",
  grantRefused: "post-oauth-access-token-case-complete-refused",
  grantWithPassword:
    "post-oauth-access-token-case-complete-with-password-client",
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
const { overrideToken, overrideSelf } = makeFixtureOverrides(
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

type Mounted = {
  wrapper: VueWrapper;
  router: ReturnType<typeof createRouter>;
};

const key = (id: string) => `[data-test-key="${id}"]`;

function serve(
  method: "patch" | "post",
  route: string,
  recording: string,
  edit?: (body: Record<string, unknown>) => Record<string, unknown>
): void {
  const { response } = getFixture(recording, { recordingsDir });
  const body = response.body as Record<string, unknown>;
  overrideRoute(
    server,
    method,
    route,
    edit ? edit(body) : body,
    response.status
  );
}

/** Mounts the page at `query`, under the Suspense its top-level await needs. */
async function mountPage(query: LocationQueryRaw): Promise<Mounted> {
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
  await vi.waitFor(() => {
    if (!wrapper.find(key("verify-registration-start")).exists()) {
      throw new Error("page still suspended");
    }
  });
  return { wrapper, router };
}

/** Presses start, runs the page's own delay, and lets the landing settle. */
async function start(wrapper: VueWrapper): Promise<void> {
  await wrapper.find(key("verify-registration-start")).trigger("click");
  vi.advanceTimersByTime(START_DELAY_MS);
  await flushPromises();
}

function recordPaths(): () => string[] {
  const paths: string[] = [];
  server?.events.on("request:start", ({ request }) => {
    paths.push(new URL(request.url).pathname);
  });
  return () => paths;
}

const present = (wrapper: VueWrapper, id: string): boolean =>
  wrapper.find(key(id)).exists();

let mounted: Mounted | undefined;

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
  mounted?.wrapper.unmount();
  mounted = undefined;
  server?.events.removeAllListeners("request:start");
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

// -----------------------------------------------------------------------------

const EXPIRED_LINK_DATE = "2020-01-01T10:00:00Z";
const VALID_PASSWORD = "abcdefg1";

const selfName = (): string =>
  get(
    getFixture(RECORDING.self, { recordingsDir }).response.body,
    "data.actor.fullname"
  );

const passwordField = (wrapper: VueWrapper, field: string) =>
  wrapper.find(`fieldset[data-test-value="${field}"] input`);

async function fillPasswords(
  wrapper: VueWrapper,
  password: string,
  confirmation: string
): Promise<void> {
  await passwordField(wrapper, "password").setValue(password);
  await passwordField(wrapper, "password-confirmation").setValue(confirmation);
}

async function submit(wrapper: VueWrapper): Promise<void> {
  await wrapper.find(key("verify-registration-submit")).trigger("click");
  await flushPromises();
}

/** Starts a no-password landing and waits for the set-password form. */
async function openSetPasswordForm(
  query: LocationQueryRaw = LINK
): Promise<VueWrapper> {
  serve("patch", VERIFY_ROUTE, RECORDING.noPassword);
  mounted = await mountPage(query);
  await start(mounted.wrapper);
  return mounted.wrapper;
}

describe("AC-20 the labs page renders each outcome and owns its links", () => {
  it("AC-20 shows the expired panel and a dashboard link, with no request and no form, for a link with no hash", async () => {
    const paths = recordPaths();
    mounted = await mountPage({ username: LINK.username });

    await start(mounted.wrapper);

    expect(present(mounted.wrapper, "verify-registration-expired")).toBe(true);
    expect(
      mounted.wrapper
        .find(key("verify-registration-dashboard"))
        .attributes("href")
    ).toBe("/");
    expect(present(mounted.wrapper, "verify-registration-form")).toBe(false);
    expect(paths()).toStrictEqual([]);
  });

  it("AC-20 shows the expired panel and no form for a link the API refuses", async () => {
    serve("patch", VERIFY_ROUTE, RECORDING.invalidHash);
    mounted = await mountPage(LINK);

    await start(mounted.wrapper);

    expect(present(mounted.wrapper, "verify-registration-expired")).toBe(true);
    expect(present(mounted.wrapper, "verify-registration-form")).toBe(false);
  });

  it("AC-20 shows the set-password form for a link with no password", async () => {
    const wrapper = await openSetPasswordForm();

    expect(present(wrapper, "verify-registration-form")).toBe(true);
    expect(present(wrapper, "verify-registration-expired")).toBe(false);
    expect(present(wrapper, "verify-registration-success")).toBe(false);
  });

  it("AC-20 shows the expired panel and no form for a no-password link past its expiry date", async () => {
    const wrapper = await openSetPasswordForm({
      ...LINK,
      expires: EXPIRED_LINK_DATE
    });

    expect(present(wrapper, "verify-registration-expired")).toBe(true);
    expect(present(wrapper, "verify-registration-form")).toBe(false);
  });

  it("AC-20 shows the expired panel and no form after a valid submit the API refuses", async () => {
    const wrapper = await openSetPasswordForm();
    serve("post", GRANT_ROUTE, RECORDING.grantRefused);

    await fillPasswords(wrapper, VALID_PASSWORD, VALID_PASSWORD);
    await submit(wrapper);

    expect(present(wrapper, "verify-registration-expired")).toBe(true);
    expect(present(wrapper, "verify-registration-form")).toBe(false);
  });

  describe("an account that activates", () => {
    const activate = async (query: LocationQueryRaw): Promise<Mounted> => {
      serve("patch", VERIFY_ROUTE, RECORDING.hasPassword);
      serve("post", GRANT_ROUTE, RECORDING.grantDirect);
      overrideSelf(RECORDING.self);
      mounted = await mountPage(query);
      await start(mounted.wrapper);
      await vi.waitFor(() => {
        if (!mounted?.wrapper.text().includes(selfName())) {
          throw new Error("the signed-in user has not shown yet");
        }
      });
      return mounted;
    };

    it("AC-20 shows the success panel, the signed-in user and a continue link to the safe redirect", async () => {
      const { wrapper } = await activate({
        ...LINK,
        redirect: "/billing?tab=1"
      });

      expect(present(wrapper, "verify-registration-success")).toBe(true);
      expect(wrapper.find(key("verify-registration-success")).text()).toContain(
        selfName()
      );
      expect(
        wrapper.find(key("verify-registration-continue")).attributes("href")
      ).toBe("/billing?tab=1");
      expect(present(wrapper, "verify-registration-form")).toBe(false);
    });

    it("AC-20 offers the root as the continue link when the redirect is unsafe", async () => {
      const { wrapper } = await activate({
        ...LINK,
        redirect: "//evil.example"
      });

      expect(
        wrapper.find(key("verify-registration-continue")).attributes("href")
      ).toBe("/");
    });

    it("AC-20 leaves the route where it was until a link is followed", async () => {
      const { router } = await activate({
        username: LINK.username,
        hash: LINK.hash,
        redirect: "/billing?tab=1"
      });

      expect(router.currentRoute.value.path).toBe("/");
    });
  });
});

describe("AC-25 the new texts render from the source", () => {
  it("AC-25 shows the hint at rest and the length rule after a short password", async () => {
    const wrapper = await openSetPasswordForm();

    expect(wrapper.text()).toContain(form.auth_set_password.hint);
    expect(wrapper.text()).not.toContain(
      form.auth_set_password.error.min_length_number
    );

    await passwordField(wrapper, "password").setValue("abc");
    await flushPromises();

    expect(wrapper.text()).toContain(
      form.auth_set_password.error.min_length_number
    );
  });

  it("AC-25 labels the three fields and offers one generator on the password control", async () => {
    const wrapper = await openSetPasswordForm();

    expect(wrapper.text()).toContain(form.auth_login.label);
    expect(wrapper.text()).toContain(form.auth_set_password.label);
    expect(wrapper.text()).toContain(form.auth_set_password_confirmation.label);
    const generators = wrapper.findAll(key("password-generate"));
    expect(generators).toHaveLength(1);
    expect(
      wrapper
        .find('fieldset[data-test-value="password"]')
        .find(key("password-generate"))
        .exists()
    ).toBe(true);
  });

  const confirmationMessage = (wrapper: VueWrapper) =>
    wrapper.find(
      `p${key("form-item-message")}[data-test-value="password-confirmation"]`
    );

  it("AC-25 hands the landing's mismatch error to the confirmation field", async () => {
    const wrapper = await openSetPasswordForm();
    expect(confirmationMessage(wrapper).exists()).toBe(false);

    await fillPasswords(wrapper, "abcdefg1", "abcdefg2");
    await submit(wrapper);

    expect(confirmationMessage(wrapper).exists()).toBe(true);
  });

  it("AC-25 shows the mismatch text on the confirmation field", async () => {
    const wrapper = await openSetPasswordForm();

    await fillPasswords(wrapper, "abcdefg1", "abcdefg2");
    await submit(wrapper);

    expect(confirmationMessage(wrapper).text()).toBe(
      form.auth_set_password_confirmation.error
    );
  });

  it("AC-25 shows the invalid-link text on the expired panel", async () => {
    mounted = await mountPage({ username: LINK.username });

    await start(mounted.wrapper);

    expect(
      mounted.wrapper.find(key("verify-registration-expired")).text()
    ).toContain(error.session_verify_link_invalid);
  });
});
