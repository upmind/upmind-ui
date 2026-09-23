// -----------------------------------------------------------------------------
/**
 * @fileoverview The back control the session screens withhold — and the ones
 * they keep
 *
 * ## Job To Be Done
 * `useAuthResolve` does not gate the back step: asked, it falls through to the
 * funnel in either host (see `host-mode-resolve.test.ts`). The only thing that
 * keeps a funnel-free host off that call is that login and register RENDER NO
 * BACK CONTROL there — their back is the basket, and such a host has none.
 * Recovery's back is the login screen, which exists in every host, so recovery
 * keeps its control and routes with it. The absence is therefore a decision, and
 * a decision is what is graded here.
 *
 * ## Why the control is found by clicking, not by a selector
 * An absence assertion made with a selector nobody proved can see anything
 * passes on a typo. So the back control is identified by what it DOES: every
 * control on the screen is clicked on its own mount, and the one that reaches
 * the back step is the control. The funnel host proves the sweep finds it on the
 * very screens the funnel-free host is then asserted to be missing it from, and
 * the funnel-free inventory is compared whole — so a screen that rendered
 * nothing at all, or lost some other affordance, fails rather than passes.
 *
 * ## What Breaks If These Fail
 * A visitor to a funnel-free host is offered a back that reaches for a funnel
 * that is not there: the click throws, the screen stays, and the control looks
 * broken. Or the reverse — the cart's own back disappears from a funnel host and
 * every customer loses their way to the basket.
 */

import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Suspense, computed, defineComponent, h, ref } from "vue";
import { createI18n } from "vue-i18n";
import { createMemoryHistory, createRouter } from "vue-router";
import { provideThemeEngine } from "@upmind-automation/foundation";
import LoginView from "../views/Login.vue";
import RecoverPasswordView from "../views/RecoverPassword.vue";
import RegisterView from "../views/Register.vue";
import type { VueWrapper } from "@vue/test-utils";
import type { Component } from "vue";

// -----------------------------------------------------------------------------

const hasFunnels = ref(true);
const navigate = vi.fn(() => Promise.resolve());
const navigateNext = vi.fn(() => Promise.resolve());
const navigateBack = vi.fn(() => Promise.resolve());

vi.mock("@upmind-automation/headless", async importOriginal => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useRoutingEngine: () => ({
      navigate,
      navigateNext,
      navigateBack,
      meta: computed(() => ({ hasFunnels: hasFunnels.value }))
    }),
    useActiveSession: () => ({
      useActions: () => ({ isReady: () => Promise.resolve(true) }),
      useContext: () => ({}),
      useInternals: () => ({}),
      useMeta: () => ({ isAuthenticated: computed(() => false) })
    }),
    useBrand: () => ({
      isReady: () => Promise.resolve(true),
      meta: computed(() => ({ isAvailable: true })),
      brandId: computed(() => "brand-1"),
      name: computed(() => "Brand"),
      image: computed(() => null),
      styles: computed(() => null),
      uiTheme: computed(() => ({ tokens: "", variant: undefined })),
      uischema_Route: computed(() => ({})),
      hasUpmindBranding: computed(() => false),
      getConfig: () => ({}),
      getConfigValue: () => undefined
    }),
    useClientTemplate: () => ({
      isReady: () => Promise.resolve(true),
      meta: computed(() => ({ isAvailable: false })),
      data: computed(() => undefined),
      template: computed(() => undefined),
      content: computed(() => undefined)
    }),
    useConfig: () => ({
      data: {},
      ui: {
        theme: computed(() => ""),
        template: computed(() => undefined),
        variant: computed(() => undefined),
        iconVariant: computed(() => "outline"),
        basketSummary: { isVisible: false },
        guestCheckout: { isVisible: false }
      }
    })
  };
});

const Blank = { setup: () => () => h("div") };

/** Neither the login screen nor the landing, so every arrival is a real move. */
const START = "/start";

const CONTROL = '[role="button"], button, a';

const SCREENS = [
  { name: "login", view: LoginView },
  { name: "register", view: RegisterView },
  { name: "recovery", view: RecoverPasswordView }
] as const;

const i18n = createI18n({
  legacy: false,
  locale: "en",
  missingWarn: false,
  fallbackWarn: false
});

async function render(view: Component) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: START, name: "start", component: Blank },
      { path: "/login", name: "login", component: Blank },
      { path: "/register", name: "register", component: Blank },
      { path: "/recover", name: "recover", component: Blank },
      { path: "/dashboard", name: "dashboard", component: Blank }
    ]
  });
  await router.push(START);
  await router.isReady();

  const Host = defineComponent({
    setup() {
      provideThemeEngine({ set: () => undefined });
      return () =>
        h(Suspense, null, {
          default: () =>
            h(view, {
              loginRoute: { name: "login" },
              registerRoute: { name: "register" },
              recoverRoute: { name: "recover" },
              landingRoute: { name: "dashboard" }
            }),
          fallback: () => h("div", { "data-suspended": "" })
        });
    }
  });

  const wrapper = mount(Host, { global: { plugins: [router, i18n] } });
  await flushPromises();
  await flushPromises();
  return { wrapper, router };
}

function controlsIn(wrapper: VueWrapper) {
  return wrapper.findAll(CONTROL);
}

function signatureOf(control: ReturnType<typeof controlsIn>[number]) {
  const key = control.attributes("data-test-key") ?? "";
  return `${control.element.tagName}|${key}|${control.text()}`;
}

type Activation = {
  signature: string;
  reachedFunnelBack: boolean;
  landedOn: string;
};

/** Clicks every control on its own mount, so one activation cannot mask another. */
async function sweep(view: Component): Promise<Activation[]> {
  const opening = await render(view);
  const count = controlsIn(opening.wrapper).length;
  const activations: Activation[] = [];

  for (let index = 0; index < count; index += 1) {
    navigateBack.mockClear();
    const { wrapper, router } = await render(view);
    const control = controlsIn(wrapper)[index];
    const signature = signatureOf(control);

    await control.trigger("click");
    await flushPromises();

    activations.push({
      signature,
      reachedFunnelBack: navigateBack.mock.calls.length > 0,
      landedOn: router.currentRoute.value.path
    });
  }

  return activations;
}

function inventoryOf(activations: Activation[]) {
  return activations.map(activation => activation.signature);
}

function backStepIn(activations: Activation[]) {
  return activations.filter(activation => activation.reachedFunnelBack);
}

// -----------------------------------------------------------------------------

describe("the session screens' back control", () => {
  beforeEach(() => {
    hasFunnels.value = true;
    navigate.mockClear();
    navigateNext.mockClear();
    navigateBack.mockClear();
  });

  describe("in a host that drives funnels", () => {
    for (const screen of SCREENS) {
      it(`gives ${screen.name} exactly one control, and it takes the funnel's back step`, async () => {
        const activations = await sweep(screen.view);
        const back = backStepIn(activations);

        expect(back).toHaveLength(1);
        expect(back[0]?.landedOn).toBe(START);
      });
    }
  });

  describe("in a host that drives no funnel", () => {
    for (const screen of [SCREENS[0], SCREENS[1]]) {
      it(`takes ${screen.name}'s control away and leaves the rest of the screen alone`, async () => {
        const withFunnels = await sweep(screen.view);
        const [back] = backStepIn(withFunnels);
        hasFunnels.value = false;
        const withoutFunnels = await sweep(screen.view);

        expect(back).toBeDefined();
        expect(inventoryOf(withoutFunnels)).toEqual(
          inventoryOf(withFunnels).filter(
            signature => signature !== back?.signature
          )
        );
        expect(backStepIn(withoutFunnels)).toEqual([]);
      });
    }

    it("keeps recovery's control and sends it to the login screen instead", async () => {
      const withFunnels = await sweep(SCREENS[2].view);
      const [back] = backStepIn(withFunnels);
      hasFunnels.value = false;
      const withoutFunnels = await sweep(SCREENS[2].view);

      expect(inventoryOf(withoutFunnels)).toEqual(inventoryOf(withFunnels));
      expect(backStepIn(withoutFunnels)).toEqual([]);
      expect(
        withoutFunnels.find(
          activation => activation.signature === back?.signature
        )?.landedOn
      ).toBe("/login");
    });
  });
});
