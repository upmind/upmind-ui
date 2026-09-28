// -----------------------------------------------------------------------------
/**
 * @fileoverview The session form's hand-back to its host.
 *
 * ## Job To Be Done
 * A submitted sign-in hands back to the host once `headless` settles it: success
 * resolves with the submitted model, a failed user load rejects, a failed attempt stays put.
 *
 * ## What Breaks If These Fail
 * An overlay closes on a guest, hangs open after the user load failed, or closes on a wrong password.
 */

import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { computed, ref } from "vue";
import { createI18n } from "vue-i18n";
import Auth from "../components/Auth.vue";

// -----------------------------------------------------------------------------

const { resolveMock, FormStub } = vi.hoisted(() => ({
  resolveMock: vi.fn<(model: unknown) => Promise<boolean>>(),
  FormStub: {
    name: "FormStub",
    emits: ["resolve", "reject", "update:modelValue"],
    render: () => null
  }
}));

vi.mock("@upmind-automation/foundation", async importOriginal => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, Form: FormStub };
});

vi.mock("@upmind-automation/headless", async importOriginal => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useActiveSession: () => ({
      useActions: () => ({ whenAuthenticated: vi.fn() }),
      useMeta: () => ({ isAuthenticated: computed(() => false) })
    }),
    useRoutingEngine: () => ({ navigate: vi.fn() }),
    useAuth: () => ({
      as: () => ({
        useMeta: () => ({
          canShowForms: ref(true),
          hasErrors: ref(false),
          isLoading: ref(false),
          isProcessing: ref(false),
          show2fa: ref(false),
          showLoginForm: ref(true),
          showRecoverPasswordForm: ref(false),
          showRegisterForm: ref(false)
        }),
        useContext: () => ({
          errors: ref([]),
          model: ref({}),
          schema: ref({}),
          uischema: ref({}),
          validationErrors: ref([])
        }),
        useActions: () => ({
          reject: vi.fn(() => Promise.resolve(true)),
          resolve: resolveMock,
          set: vi.fn(),
          start: vi.fn(() => Promise.resolve(true))
        })
      })
    })
  };
});

const i18n = createI18n({
  legacy: false,
  locale: "en",
  missingWarn: false,
  fallbackWarn: false
});

const CREDENTIALS = { username: "jane@example.com", password: "s3cret-pass" };

async function submit() {
  const wrapper = mount(Auth, {
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
    resolveMock.mockReset();
  });

  it("resolves once with the submitted model when the sign-in settles true", async () => {
    resolveMock.mockResolvedValue(true);

    const wrapper = await submit();

    expect(resolveMock).toHaveBeenCalledWith(CREDENTIALS);
    expect(wrapper.emitted("resolve")).toEqual([[CREDENTIALS]]);
    expect(wrapper.emitted("reject")).toBeUndefined();
  });

  it("rejects once when the user load fails after the token", async () => {
    resolveMock.mockRejectedValue(new Error("user load failed"));

    const wrapper = await submit();

    expect(wrapper.emitted("reject")).toEqual([[]]);
    expect(wrapper.emitted("resolve")).toBeUndefined();
  });

  it("hands nothing back when the attempt fails", async () => {
    resolveMock.mockResolvedValue(false);

    const wrapper = await submit();

    expect(resolveMock).toHaveBeenCalledWith(CREDENTIALS);
    expect(wrapper.emitted("resolve")).toBeUndefined();
    expect(wrapper.emitted("reject")).toBeUndefined();
  });
});
