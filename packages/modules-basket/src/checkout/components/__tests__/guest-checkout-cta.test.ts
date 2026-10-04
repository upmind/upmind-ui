// -----------------------------------------------------------------------------
/**
 * @fileoverview The guest-checkout offer the cart puts in registration's `guest-checkout` slot.
 *
 * ## Job To Be Done
 * Given the slot's props, the offer shows only when every gate term holds, keeps
 * its test key, and hands the visitor's click to the slot's verb.
 *
 * ## What Breaks If These Fail
 * No guest checkout for any visitor, an offer to visitors it cannot serve, or a
 * click that registers nobody.
 */

import { RouterLinkStub, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createI18n } from "vue-i18n";
import { UpmGuestCheckoutOffer } from "../../../index";
import { assign, join, map } from "lodash-es";
import type { AuthGuestCheckoutSlotProps } from "@upmind-automation/auth";

// -----------------------------------------------------------------------------

const OFFERED = {
  isAuthenticated: false,
  canRegisterAsGuest: true,
  isBasketLoading: false,
  hasRecurringProducts: false
};

const { terms, scopedAs } = vi.hoisted(() => {
  const scoped: unknown[] = [];
  return {
    terms: {
      isAuthenticated: false,
      canRegisterAsGuest: true,
      isBasketLoading: false,
      hasRecurringProducts: false
    },
    scopedAs: scoped
  };
});

vi.mock("@upmind-automation/headless", async importOriginal => {
  const real = await importOriginal<Record<string, unknown>>();
  const { computed: derive } = await import("vue");
  const { has } = await import("lodash-es");
  const overrides: Record<string, unknown> = {
    useActiveSession: () => ({
      useMeta: () => ({
        isAuthenticated: derive(() => terms.isAuthenticated)
      })
    }),
    useAuth: () => ({
      as: (actor: unknown) => {
        scopedAs.push(actor);
        return {
          useMeta: () => ({
            canRegisterAsGuest: derive(() => terms.canRegisterAsGuest)
          })
        };
      }
    }),
    useBasket: () => ({
      meta: derive(() => ({
        isLoading: terms.isBasketLoading,
        hasRecurringProducts: terms.hasRecurringProducts
      }))
    })
  };
  return new Proxy(real, {
    get(target, key) {
      if (typeof key === "string" && has(overrides, key)) return overrides[key];
      return Reflect.get(target, key);
    }
  });
});

const CTA = '[data-test-key="guest-checkout-cta"]';

const COPY = {
  question: "auth-namespace question",
  action: "auth-namespace action"
};

const i18n = createI18n({
  legacy: false,
  locale: "en",
  missingWarn: false,
  fallbackWarn: false,
  messages: {
    en: {
      auth: {
        guest_checkout_qn: COPY.question,
        guest_checkout_action: COPY.action
      }
    }
  }
});

function offerWith(
  slot: AuthGuestCheckoutSlotProps = { registerAsGuest: () => undefined }
) {
  const warnings: string[] = [];
  const warn = vi
    .spyOn(console, "warn")
    .mockImplementation((...args: unknown[]) => {
      warnings.push(join(map(args, String), " "));
    });
  const wrapper = mount(UpmGuestCheckoutOffer, {
    props: slot,
    global: {
      plugins: [i18n],
      components: { RouterLink: RouterLinkStub }
    }
  });
  warn.mockRestore();
  return { wrapper, warnings };
}

describe("the guest-checkout offer in registration's slot", () => {
  beforeEach(() => {
    assign(terms, OFFERED);
    scopedAs.length = 0;
  });

  it("offers guest checkout to an anonymous visitor with a settled one-off basket", () => {
    const { wrapper } = offerWith();

    expect(wrapper.find(CTA).exists()).toBe(true);
  });

  it("withholds the offer from a visitor who already holds a session", () => {
    terms.isAuthenticated = true;

    const { wrapper } = offerWith();

    expect(wrapper.find(CTA).exists()).toBe(false);
  });

  it("withholds the offer when the brand disallows guest checkout", () => {
    terms.canRegisterAsGuest = false;

    const { wrapper } = offerWith();

    expect(wrapper.find(CTA).exists()).toBe(false);
  });

  it("withholds the offer while the basket is still loading", () => {
    terms.isBasketLoading = true;

    const { wrapper } = offerWith();

    expect(wrapper.find(CTA).exists()).toBe(false);
  });

  it("withholds the offer when the basket carries a recurring product", () => {
    terms.hasRecurringProducts = true;

    const { wrapper } = offerWith();

    expect(wrapper.find(CTA).exists()).toBe(false);
  });

  it("reads the brand toggle as the client, not as the caller", async () => {
    const { ScopeActorTypes } = await import("@upmind-automation/headless");

    offerWith();

    expect(scopedAs).toContain(ScopeActorTypes.CLIENT);
  });

  it("takes the slot's props with no Vue warning", () => {
    const { warnings } = offerWith({
      registerAsGuest: () => undefined,
      isRegistering: false
    });

    expect(warnings).toEqual([]);
  });

  it("asks the host catalogue for the auth namespace, not cart's", () => {
    const { wrapper } = offerWith();

    expect(wrapper.find(CTA).text()).toContain(COPY.action);
    expect(wrapper.text()).toContain(COPY.question);
  });

  it("hands the visitor's click to the slot's verb", async () => {
    const registerAsGuest = vi.fn();

    const { wrapper } = offerWith({ registerAsGuest });
    await wrapper.find(CTA).trigger("click");

    expect(registerAsGuest).toHaveBeenCalledTimes(1);
  });

  it("stops taking clicks while a registration is already running", async () => {
    const registerAsGuest = vi.fn();

    const { wrapper } = offerWith({ registerAsGuest, isRegistering: true });
    await wrapper.find(CTA).trigger("click");

    expect(registerAsGuest).not.toHaveBeenCalled();
  });
});
