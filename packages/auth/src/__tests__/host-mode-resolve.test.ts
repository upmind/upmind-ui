// -----------------------------------------------------------------------------
/**
 * @fileoverview The host-mode seam the session screens resolve through
 *
 * ## Job To Be Done
 * The three session screens ran their forward and back steps through the funnel
 * machine alone. A host that drives no funnel — portal-nuxt — has no funnel
 * service to resolve, so an accepted sign-in threw and the visitor stayed on
 * `/login`, signed in, looking at the form they had just filled in.
 * `useSessionResolve` is the seam that ends that: the HOST MODE picks the path,
 * `navigateNext`/`navigateBack` in a funnel host and the screen's own routes in
 * a funnel-free one.
 *
 * ## Why both directions of the mode are asserted
 * The mode has to decide, not a failure. A suite that only covered the
 * funnel-free side would pass against the broken code it replaced, because that
 * code took the funnel path unconditionally. So every claim here is made twice,
 * once per mode, and each is pinned on BOTH channels — the funnel call and the
 * router — so a path cannot be satisfied by doing nothing.
 *
 * ## Where no route is named
 * The mode is read before any route is. A funnel-free host that names no route
 * does nothing at all, rather than calling the funnel step and relying on it
 * throwing — which is what it used to do, with the view swallowing the error.
 * Recovery is the screen in that position: it ends on its own email-sent
 * message, and its type no longer declares a landing it would not honour. The
 * back control's absence is asserted separately in
 * `host-mode-back-control.test.ts`, and remains load-bearing.
 *
 * ## What Breaks If These Fail
 * Forward: a funnel host loses its funnel step and drops every buying customer
 * on a landing page instead of their basket, or a funnel-free host strands them
 * on the sign-in screen again. Back: the same, one control over.
 */

import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { computed, defineComponent, h, ref } from "vue";
import { createMemoryHistory, createRouter } from "vue-router";
import { useSessionResolve } from "../session.utils";
import type { SessionResolveOptions, SessionViewProps } from "../types";
import type { Router } from "vue-router";

// -----------------------------------------------------------------------------

const hasFunnels = ref(true);
const navigateNext = vi.fn(() => Promise.resolve());
const navigateBack = vi.fn(() => Promise.resolve());

vi.mock("@upmind-automation/headless", async importOriginal => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useRoutingEngine: () => ({
      navigateNext,
      navigateBack,
      meta: computed(() => ({ hasFunnels: hasFunnels.value }))
    })
  };
});

const Blank = { setup: () => () => h("div") };

/** Neither `/login` nor `/dashboard`, so every landing is a real move. */
const START = "/start";

const CROSS_LINKS = {
  loginRoute: { name: "login" },
  registerRoute: { name: "register" },
  recoverRoute: { name: "recover" }
} as const;

type Seam = ReturnType<typeof useSessionResolve>;

async function seatedSeam(
  props: Partial<SessionViewProps>,
  options: SessionResolveOptions = {}
): Promise<{ seam: Seam; router: Router }> {
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

  let seam: Seam | undefined;
  const Probe = defineComponent({
    setup() {
      seam = useSessionResolve({ ...CROSS_LINKS, ...props }, options);
      return () => null;
    }
  });
  mount(Probe, { global: { plugins: [router] } });

  if (!seam) throw new Error("the probe never reached useSessionResolve");
  return { seam, router };
}

async function settle() {
  await new Promise(resolve => setTimeout(resolve, 0));
}

// -----------------------------------------------------------------------------

describe("the session screens' host-mode resolve", () => {
  beforeEach(() => {
    hasFunnels.value = true;
    navigateNext.mockClear();
    navigateBack.mockClear();
  });

  describe("an accepted sign-in", () => {
    it("takes the funnel's next step in a host that drives funnels", async () => {
      const { seam, router } = await seatedSeam({
        landingRoute: { name: "dashboard" }
      });
      await settle();

      await seam.navigateResolved();
      await settle();

      expect(navigateNext).toHaveBeenCalledTimes(1);
      expect(router.currentRoute.value.path).toBe(START);
    });

    it("routes to the landing route in a host that drives no funnel", async () => {
      hasFunnels.value = false;
      const { seam, router } = await seatedSeam({
        landingRoute: { name: "dashboard" }
      });
      await settle();

      await seam.navigateResolved();
      await settle();

      expect(router.currentRoute.value.path).toBe("/dashboard");
      expect(navigateNext).not.toHaveBeenCalled();
    });

    it("does nothing when a funnel-free host names no landing", async () => {
      hasFunnels.value = false;
      const { seam, router } = await seatedSeam({});
      await settle();

      await seam.navigateResolved();
      await settle();

      expect(
        navigateNext,
        "the funnel step throws with no funnel service, so reaching it is the " +
          "defect this seam exists to remove"
      ).not.toHaveBeenCalled();
      expect(router.currentRoute.value.path).toBe(START);
    });
  });

  describe("the back step", () => {
    it("takes the funnel's back step in a host that drives funnels", async () => {
      const { seam, router } = await seatedSeam({});
      await settle();

      await seam.navigateRejected();
      await settle();

      expect(navigateBack).toHaveBeenCalledTimes(1);
      expect(router.currentRoute.value.path).toBe(START);
    });

    it("keeps the funnel's back step even when the screen names a route", async () => {
      const { seam, router } = await seatedSeam(
        {},
        { rejectRoute: { name: "login" } }
      );
      await settle();

      await seam.navigateRejected();
      await settle();

      expect(navigateBack).toHaveBeenCalledTimes(1);
      expect(router.currentRoute.value.path).toBe(START);
    });

    it("routes to the screen's own route in a host that drives no funnel", async () => {
      hasFunnels.value = false;
      const { seam, router } = await seatedSeam(
        {},
        { rejectRoute: { name: "login" } }
      );
      await settle();

      await seam.navigateRejected();
      await settle();

      expect(router.currentRoute.value.path).toBe("/login");
      expect(navigateBack).not.toHaveBeenCalled();
    });

    it("does nothing when a funnel-free host names no route", async () => {
      hasFunnels.value = false;
      const { seam, router } = await seatedSeam({});
      await settle();

      expect(seam.meta.value.hasReject).toBe(false);

      await seam.navigateRejected();
      await settle();

      expect(
        navigateBack,
        "the funnel step throws with no funnel service, so reaching it is the " +
          "defect this seam exists to remove"
      ).not.toHaveBeenCalled();
      expect(router.currentRoute.value.path).toBe(START);
    });

    it("reads a route the screen only names after setup", async () => {
      hasFunnels.value = false;
      const rejectRoute = ref<{ name: string } | undefined>(undefined);
      const { seam, router } = await seatedSeam({}, { rejectRoute });
      await settle();
      rejectRoute.value = { name: "login" };

      await seam.navigateRejected();
      await settle();

      expect(router.currentRoute.value.path).toBe("/login");
      expect(navigateBack).not.toHaveBeenCalled();
    });
  });

  describe("whether the screen offers a back at all", () => {
    it("offers one in a funnel host whether or not a route is named", async () => {
      const bare = await seatedSeam({});
      const routed = await seatedSeam({}, { rejectRoute: { name: "login" } });

      expect(bare.seam.meta.value.hasReject).toBe(true);
      expect(routed.seam.meta.value.hasReject).toBe(true);
    });

    it("offers one in a funnel-free host only when a route is named", async () => {
      hasFunnels.value = false;
      const bare = await seatedSeam({});
      const routed = await seatedSeam({}, { rejectRoute: { name: "login" } });

      expect(bare.seam.meta.value.hasReject).toBe(false);
      expect(routed.seam.meta.value.hasReject).toBe(true);
    });
  });
});
