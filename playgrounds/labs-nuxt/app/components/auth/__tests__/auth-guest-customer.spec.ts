// -----------------------------------------------------------------------------
/**
 * @fileoverview AuthGuestCustomer — the guest-checkout gate
 *
 * ## Job To Be Done
 * Guest-customer registration is a brand privilege. When a brand turns
 * `GUEST_CHECKOUT_ENABLED` off, the guest-customer entry must refuse with a
 * stated reason instead of starting a registration the brand does not permit.
 *
 * ## What Breaks If These Fail
 * The gate is bypassed — a guest-customer registration begins on a brand that
 * forbids it — or the refusal is silent, leaving the operator staring at an
 * inert panel with no reason why.
 */

import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { computed, ref } from "vue";

// -----------------------------------------------------------------------------

vi.mock("@upmind-automation/headless", async () => {
  const real = await vi.importActual<Record<string, unknown>>(
    "@upmind-automation/headless"
  );
  const cell = {
    useActions: () => ({
      registerAsGuest: vi.fn(() => Promise.resolve(true)),
      destroy: vi.fn(),
      reset: vi.fn(),
      set: vi.fn()
    }),
    useContext: () => ({ errors: ref([]) }),
    useMeta: () => ({
      isProcessing: computed(() => false),
      isLoading: computed(() => false)
    }),
    destroy: vi.fn()
  };
  const builder = {
    fresh: () => cell,
    for: () => cell,
    withId: () => cell,
    ...cell
  };
  return {
    ...real,
    useAuth: () => ({
      as: () => builder,
      inBrand: () => ({ as: () => builder })
    }),
    // Guest checkout OFF — the case this gate exists for.
    useBrand: () => ({
      brandId: ref("brand-x"),
      name: ref("Brand X"),
      isReady: computed(() => true),
      getConfigValue: () => false
    })
  };
});

afterEach(() => {
  document.body.innerHTML = "";
});

// -----------------------------------------------------------------------------

describe("the guest-checkout gate", () => {
  // The first mount pays to transform this component's whole import graph
  // (`@upmind/ui`, the domain packages); later mounts reuse the cache. Same ceiling the
  // page specs take (`pages/__tests__/index-card-badge.spec.ts`).
  it(
    "refuses with a stated reason when guest checkout is disabled for the brand",
    { timeout: 20000 },
    async () => {
      const { default: AuthGuestCustomer } =
        await import("../AuthGuestCustomer.vue");
      const wrapper = mount(AuthGuestCustomer, { attachTo: document.body });
      await flushPromises();

      expect(wrapper.text()).toMatch(/disabled/i);
    }
  );

  it(
    "offers no registration affordance while the brand forbids it",
    { timeout: 20000 },
    async () => {
      const { default: AuthGuestCustomer } =
        await import("../AuthGuestCustomer.vue");
      const wrapper = mount(AuthGuestCustomer, { attachTo: document.body });
      await flushPromises();

      expect(wrapper.find("button").exists()).toBe(false);
    }
  );
});
