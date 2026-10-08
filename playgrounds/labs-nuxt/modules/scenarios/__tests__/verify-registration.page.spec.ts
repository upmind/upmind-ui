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

import { flushPromises } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import error from "@upmind-automation/i18n/core/error-en.json";
import form from "@upmind-automation/i18n/core/form-en.json";
import { getFixture } from "@upmind-automation/test-fixtures";
import {
  GRANT_ROUTE,
  LINK,
  RECORDING,
  VALID_PASSWORD,
  VERIFY_ROUTE,
  key,
  mountPage,
  overrideSelf,
  recordingsDir,
  serve,
  server,
  start,
  usePageHarness
} from "./verify-registration.page.kit";
import { get } from "lodash-es";
import type { Mounted } from "./verify-registration.page.kit";
import type { VueWrapper } from "@vue/test-utils";
import type { LocationQueryRaw } from "vue-router";

// -----------------------------------------------------------------------------

vi.mock("../../../../../packages/headless/src/modules/brand", () => ({
  useBrand: () => ({
    isReady: () => Promise.resolve(true),
    getConfigValue: () => undefined
  })
}));

usePageHarness();

function recordPaths(): () => string[] {
  const paths: string[] = [];
  server?.events.on("request:start", ({ request }) => {
    paths.push(new URL(request.url).pathname);
  });
  return () => paths;
}

const present = (wrapper: VueWrapper, id: string): boolean =>
  wrapper.find(key(id)).exists();

// -----------------------------------------------------------------------------

const EXPIRED_LINK_DATE = "2020-01-01T10:00:00Z";

const selfName = (): string =>
  get(
    getFixture(RECORDING.self, { recordingsDir }).response.body,
    "data.actor.fullname"
  );

const formItem = (field: string): string =>
  `${key("form-item")}[data-test-value="${field}"]`;

const passwordField = (wrapper: VueWrapper, field: string) =>
  wrapper.find(`${formItem(field)} ${key("input-password")}`);

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
  const { wrapper } = await mountPage(query);
  await start(wrapper);
  return wrapper;
}

describe("AC-20 the labs page renders each outcome and owns its links", () => {
  it("AC-20 shows the expired panel and a dashboard link, with no request and no form, for a link with no hash", async () => {
    const paths = recordPaths();
    const mounted = await mountPage({ username: LINK.username });

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
    const mounted = await mountPage(LINK);

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

    await fillPasswords(
      wrapper,
      VALID_PASSWORD.password,
      VALID_PASSWORD.password_confirmation
    );
    await submit(wrapper);

    expect(present(wrapper, "verify-registration-expired")).toBe(true);
    expect(present(wrapper, "verify-registration-form")).toBe(false);
  });

  describe("an account that activates", () => {
    const activate = async (query: LocationQueryRaw): Promise<Mounted> => {
      serve("patch", VERIFY_ROUTE, RECORDING.hasPassword);
      serve("post", GRANT_ROUTE, RECORDING.grantDirect);
      overrideSelf(RECORDING.self);
      const mounted = await mountPage(query);
      await start(mounted.wrapper);
      await vi.waitFor(() => {
        if (!mounted.wrapper.text().includes(selfName())) {
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
      wrapper.find(formItem("password")).find(key("password-generate")).exists()
    ).toBe(true);
  });

  const confirmationMessage = (wrapper: VueWrapper) =>
    wrapper.find(
      `${key("form-item-message")}[data-test-value="password-confirmation"]`
    );

  it("AC-25 shows the landing's mismatch text on the confirmation field after a submit", async () => {
    const wrapper = await openSetPasswordForm();
    expect(confirmationMessage(wrapper).exists()).toBe(false);

    await fillPasswords(wrapper, "abcdefg1", "abcdefg2");
    await submit(wrapper);

    expect(confirmationMessage(wrapper).text()).toBe(
      form.auth_set_password_confirmation.error
    );
  });

  it("AC-25 shows the invalid-link text on the expired panel", async () => {
    const mounted = await mountPage({ username: LINK.username });

    await start(mounted.wrapper);

    expect(
      mounted.wrapper.find(key("verify-registration-expired")).text()
    ).toContain(error.session_verify_link_invalid);
  });
});
