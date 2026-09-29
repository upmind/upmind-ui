// -----------------------------------------------------------------------------
/**
 * @fileoverview The session forms' hand-back to their host.
 *
 * ## Job To Be Done
 * A submitted sign-in or guest upgrade hands back once the session holds the
 * user: success resolves with the submitted model, a failed user load rejects,
 * a failed attempt stays put, and a recovery request waits for no session.
 *
 * ## What Breaks If These Fail
 * An overlay closes on a guest, hangs open after the user load failed, closes
 * on a wrong password, or a recovery never hands back.
 */

import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createI18n } from "vue-i18n";
import Account from "../components/Account.vue";
import Auth from "../components/Auth.vue";
import { assign } from "lodash-es";
import type { Component } from "vue";

// -----------------------------------------------------------------------------

const { forms, resolveMock, registerMock, whenAuthenticatedMock, FormStub } =
  vi.hoisted(() => ({
    forms: {
      showLoginForm: true,
      showRecoverPasswordForm: false,
      showGuestUpgradeForm: false
    },
    resolveMock: vi.fn<(model: unknown) => Promise<boolean>>(),
    registerMock: vi.fn<(model: unknown) => Promise<boolean>>(),
    whenAuthenticatedMock: vi.fn<() => Promise<unknown>>(),
    FormStub: {
      name: "FormStub",
      emits: ["resolve", "reject", "update:modelValue"],
      render: () => null
    }
  }));

vi.mock("@upmind-automation/foundation", async importOriginal => {
  const actual = await importOriginal<Record<string, unknown>>();
  const { assign } = await import("lodash-es");
  return assign({}, actual, { Form: FormStub });
});

vi.mock("@upmind-automation/headless", async importOriginal => {
  const actual = await importOriginal<Record<string, unknown>>();
  const { assign } = await import("lodash-es");
  const { ref } = await import("vue");
  const context = () => ({
    errors: ref([]),
    model: ref({}),
    schema: ref({}),
    uischema: ref({}),
    validationErrors: ref([])
  });
  const meta = () => ({
    canResend: ref(false),
    canShowForms: ref(true),
    hasErrors: ref(false),
    isLoading: ref(false),
    isProcessing: ref(false),
    isResending: ref(false),
    resendComplete: ref(false),
    resendFailed: ref(false),
    show2fa: ref(false),
    showLoginForm: ref(forms.showLoginForm),
    showRecoverPasswordForm: ref(forms.showRecoverPasswordForm),
    showRegisterForm: ref(false),
    showGuestUpgradeForm: ref(forms.showGuestUpgradeForm),
    showVerifyEmailForm: ref(false)
  });
  return assign({}, actual, {
    useActiveSession: () => ({
      useActions: () => ({ whenAuthenticated: whenAuthenticatedMock }),
      useMeta: () => ({ isAuthenticated: ref(false) })
    }),
    useRoutingEngine: () => ({ navigate: vi.fn() }),
    useAuth: () => ({
      as: () => ({
        useMeta: meta,
        useContext: context,
        useActions: () => ({
          reject: vi.fn(() => Promise.resolve(true)),
          resolve: resolveMock,
          set: vi.fn(),
          start: vi.fn(() => Promise.resolve(true))
        })
      })
    }),
    useAccount: () => ({
      as: () => ({
        useMeta: meta,
        useContext: context,
        useActions: () => ({
          cancel: vi.fn(),
          register: registerMock,
          resend: vi.fn(),
          set: vi.fn(),
          verify: vi.fn(() => Promise.resolve(true))
        })
      })
    })
  });
});

const i18n = createI18n({
  legacy: false,
  locale: "en",
  missingWarn: false,
  fallbackWarn: false
});

const CREDENTIALS = { username: "jane@example.com", password: "s3cret-pass" };

function deferred() {
  let settle: (value: unknown) => void = () => undefined;
  const promise = new Promise(resolve => {
    settle = resolve;
  });
  return { promise, settle };
}

async function submit(form: Component, props: Record<string, unknown> = {}) {
  const wrapper = mount(form, {
    props,
    global: { plugins: [i18n], stubs: { RouterLink: true } }
  });
  await flushPromises();

  wrapper.findComponent({ name: "FormStub" }).vm.$emit("resolve", CREDENTIALS);
  await flushPromises();

  return wrapper;
}

// -----------------------------------------------------------------------------

describe("the session form's hand-back", () => {
  beforeEach(() => {
    assign(forms, {
      showLoginForm: true,
      showRecoverPasswordForm: false,
      showGuestUpgradeForm: false
    });
    resolveMock.mockReset();
    registerMock.mockReset();
    whenAuthenticatedMock.mockReset();
  });

  it("holds the hand-back until the session holds the user, then resolves once with the model", async () => {
    resolveMock.mockResolvedValue(true);
    const session = deferred();
    whenAuthenticatedMock.mockReturnValue(session.promise);

    const wrapper = await submit(Auth);
    const before = wrapper.emitted("resolve");
    session.settle({ id: "client-1" });
    await flushPromises();

    expect(resolveMock).toHaveBeenCalledWith(CREDENTIALS);
    expect(before).toBeUndefined();
    expect(wrapper.emitted("resolve")).toEqual([[CREDENTIALS]]);
    expect(wrapper.emitted("reject")).toBeUndefined();
  });

  it("rejects once when the user load fails after the token", async () => {
    resolveMock.mockResolvedValue(true);
    whenAuthenticatedMock.mockRejectedValue(new Error("user load failed"));

    const wrapper = await submit(Auth);

    expect(wrapper.emitted("reject")).toEqual([[]]);
    expect(wrapper.emitted("resolve")).toBeUndefined();
  });

  it("hands nothing back when the attempt fails", async () => {
    resolveMock.mockResolvedValue(false);

    const wrapper = await submit(Auth);

    expect(resolveMock).toHaveBeenCalledWith(CREDENTIALS);
    expect(whenAuthenticatedMock).not.toHaveBeenCalled();
    expect(wrapper.emitted("resolve")).toBeUndefined();
    expect(wrapper.emitted("reject")).toBeUndefined();
  });

  it("hands a recovery request back without waiting for a session", async () => {
    assign(forms, { showLoginForm: false, showRecoverPasswordForm: true });
    resolveMock.mockResolvedValue(true);
    whenAuthenticatedMock.mockReturnValue(new Promise(() => undefined));

    const wrapper = await submit(Auth, { modelValue: "recover" });

    expect(whenAuthenticatedMock).not.toHaveBeenCalled();
    expect(wrapper.emitted("resolve")).toEqual([[CREDENTIALS]]);
  });
});

describe("the guest upgrade's hand-back", () => {
  beforeEach(() => {
    assign(forms, {
      showLoginForm: false,
      showRecoverPasswordForm: false,
      showGuestUpgradeForm: true
    });
    resolveMock.mockReset();
    registerMock.mockReset();
    whenAuthenticatedMock.mockReset();
  });

  it("holds the hand-back until the session holds the client, then resolves once with the model", async () => {
    registerMock.mockResolvedValue(true);
    const session = deferred();
    whenAuthenticatedMock.mockReturnValue(session.promise);

    const wrapper = await submit(Account);
    const before = wrapper.emitted("resolve");
    session.settle({ id: "client-1" });
    await flushPromises();

    expect(registerMock).toHaveBeenCalledWith(CREDENTIALS);
    expect(before).toBeUndefined();
    expect(wrapper.emitted("resolve")).toEqual([[CREDENTIALS]]);
    expect(wrapper.emitted("reject")).toBeUndefined();
  });

  it("rejects once when the client load fails after the upgrade", async () => {
    registerMock.mockResolvedValue(true);
    whenAuthenticatedMock.mockRejectedValue(new Error("user load failed"));

    const wrapper = await submit(Account);

    expect(wrapper.emitted("reject")).toEqual([[]]);
    expect(wrapper.emitted("resolve")).toBeUndefined();
  });

  it("hands nothing back when the upgrade fails", async () => {
    registerMock.mockResolvedValue(false);

    const wrapper = await submit(Account);

    expect(whenAuthenticatedMock).not.toHaveBeenCalled();
    expect(wrapper.emitted("resolve")).toBeUndefined();
    expect(wrapper.emitted("reject")).toBeUndefined();
  });
});
