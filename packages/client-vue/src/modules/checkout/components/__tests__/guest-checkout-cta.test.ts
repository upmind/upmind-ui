// -----------------------------------------------------------------------------
/**
 * @fileoverview The guest-checkout CTA at the `auth:guest-checkout` shell socket.
 *
 * ## Job To Be Done
 * The filled socket resolves, each gate term withdraws the offer, and the test key survives.
 *
 * ## What Breaks If These Fail
 * An unfilled socket renders nothing and raises nothing: no guest checkout for any visitor.
 */

import { RouterLinkStub, mount } from "@vue/test-utils";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { computed, defineComponent, h } from "vue";
import { createI18n } from "vue-i18n";
import type { Component, ComputedRef } from "vue";

// -----------------------------------------------------------------------------

const OFFERED = {
  isAuthenticated: false,
  canRegisterAsGuest: true,
  isBasketLoading: false,
  hasRecurringProducts: false
};

const terms = { ...OFFERED };
const scopedAs: unknown[] = [];

vi.mock("@upmind-automation/headless", async importOriginal => {
  const real = await importOriginal<Record<string, unknown>>();
  const { computed: derive } = await import("vue");
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
      if (typeof key === "string" && key in overrides) return overrides[key];
      return Reflect.get(target, key);
    }
  });
});

const CTA = '[data-test-key="guest-checkout-cta"]';

const COPY = {
  question: "cart-namespace question",
  action: "cart-namespace action"
};

const i18n = createI18n({
  legacy: false,
  locale: "en",
  missingWarn: false,
  fallbackWarn: false,
  messages: {
    en: {
      cart: {
        guest_checkout_qn: COPY.question,
        guest_checkout_action: COPY.action
      }
    }
  }
});

const HostTemplate = defineComponent({
  setup: () => () => h("div", { "data-host": "template" })
});

async function offerUnderHost(
  host?: Record<string, Component>,
  props: Record<string, unknown> = { registerAsGuest: () => undefined }
) {
  let resolved: ComputedRef<Component | undefined> | undefined;
  const warnings: string[] = [];
  const warn = vi
    .spyOn(console, "warn")
    .mockImplementation((...args: unknown[]) => {
      warnings.push(args.map(String).join(" "));
    });
  const { AUTH_SHELL } = await import("@upmind-automation/auth");
  const { provideShellComponents, useShellComponents } =
    await import("@upmind-automation/foundation");

  const Organism = defineComponent({
    setup() {
      const shell = useShellComponents();
      resolved = computed(() => shell.resolve(AUTH_SHELL.GUEST_CHECKOUT));
      return () => (resolved?.value ? h(resolved.value, props) : null);
    }
  });
  const Host = defineComponent({
    setup() {
      if (host) provideShellComponents(computed(() => host));
      return () => h(Organism);
    }
  });

  const wrapper = mount(Host, {
    global: {
      plugins: [i18n],
      components: { RouterLink: RouterLinkStub }
    }
  });
  warn.mockRestore();
  return { wrapper, warnings, slot: () => resolved?.value };
}

async function shellComponents() {
  const { SESSION_SHELL_COMPONENTS } = await import("../../../session/shell");
  return SESSION_SHELL_COMPONENTS;
}

describe("the guest-checkout offer at the auth socket", () => {
  beforeAll(async () => {
    await offerUnderHost(await shellComponents());
  }, 30000);

  beforeEach(() => {
    Object.assign(terms, OFFERED);
    scopedAs.length = 0;
  });

  it("fills the slot the session views ask for", async () => {
    const { AUTH_SHELL } = await import("@upmind-automation/auth");

    expect((await shellComponents())[AUTH_SHELL.GUEST_CHECKOUT]).toBeTruthy();
  });

  it("offers guest checkout to an anonymous visitor with a settled one-off basket", async () => {
    const { wrapper } = await offerUnderHost(await shellComponents());

    expect(wrapper.find(CTA).exists()).toBe(true);
  });

  it("withholds the offer from a visitor who already holds a session", async () => {
    terms.isAuthenticated = true;

    const { wrapper } = await offerUnderHost(await shellComponents());

    expect(wrapper.find(CTA).exists()).toBe(false);
  });

  it("withholds the offer when the brand disallows guest checkout", async () => {
    terms.canRegisterAsGuest = false;

    const { wrapper } = await offerUnderHost(await shellComponents());

    expect(wrapper.find(CTA).exists()).toBe(false);
  });

  it("withholds the offer while the basket is still loading", async () => {
    terms.isBasketLoading = true;

    const { wrapper } = await offerUnderHost(await shellComponents());

    expect(wrapper.find(CTA).exists()).toBe(false);
  });

  it("withholds the offer when the basket carries a recurring product", async () => {
    terms.hasRecurringProducts = true;

    const { wrapper } = await offerUnderHost(await shellComponents());

    expect(wrapper.find(CTA).exists()).toBe(false);
  });

  it("reads the brand toggle as the client, not as the caller", async () => {
    const { ScopeActorTypes } = await import("@upmind-automation/headless");

    await offerUnderHost(await shellComponents());

    expect(scopedAs).toContain(ScopeActorTypes.CLIENT);
  });

  it("mounts through the socket with no Vue warning", async () => {
    const { warnings } = await offerUnderHost(await shellComponents());

    expect(warnings).toEqual([]);
  });

  it("asks the host catalogue for the cart namespace, not auth's", async () => {
    const { wrapper } = await offerUnderHost(await shellComponents());

    expect(wrapper.find(CTA).text()).toContain(COPY.action);
    expect(wrapper.text()).toContain(COPY.question);
  });

  it("hands the visitor's click back to the host's own verb", async () => {
    const registerAsGuest = vi.fn();

    const { wrapper } = await offerUnderHost(await shellComponents(), {
      registerAsGuest
    });
    await wrapper.find(CTA).trigger("click");

    expect(registerAsGuest).toHaveBeenCalledTimes(1);
  });

  it("stops taking clicks while a registration is already running", async () => {
    const registerAsGuest = vi.fn();

    const { wrapper } = await offerUnderHost(await shellComponents(), {
      registerAsGuest,
      isRegistering: true
    });
    await wrapper.find(CTA).trigger("click");

    expect(registerAsGuest).not.toHaveBeenCalled();
  });

  it("renders nothing when the host fills every other auth slot but this one", async () => {
    const { AUTH_SHELL } = await import("@upmind-automation/auth");
    const partial: Record<string, Component> = {};
    for (const slot of Object.values(AUTH_SHELL)) {
      if (slot === AUTH_SHELL.GUEST_CHECKOUT) continue;
      partial[slot] = HostTemplate;
    }

    const { wrapper, slot } = await offerUnderHost(partial);

    expect(slot()).toBeUndefined();
    expect(wrapper.find(CTA).exists()).toBe(false);
  });

  it("renders nothing when the host offers no shell at all", async () => {
    const { wrapper, slot } = await offerUnderHost();

    expect(slot()).toBeUndefined();
    expect(wrapper.find(CTA).exists()).toBe(false);
  });
});
