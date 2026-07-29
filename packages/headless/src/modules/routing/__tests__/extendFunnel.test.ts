// -----------------------------------------------------------------------------
/**
 * @fileoverview Funnel Inheritance Tests — extendFunnel
 *
 * ## Job To Be Done
 * Verify that `extendFunnel` flattens a funnel's `extends` chain base-first, so
 * a funnel need only declare the states it adds or diverges on. A state key the
 * child declares must replace the base's node WHOLESALE — never deep-merge —
 * and a circular or unregistered chain must throw rather than recurse forever.
 *
 * ## What Breaks If These Fail
 * - Deep-merge instead of wholesale replace: one-page's `checkout` silently
 *   inherits cart's leftover transitions, re-adding the standalone BILLING /
 *   BASKET_PRODUCTS_SETUP diverts the one-page flow exists to remove.
 * - Array index-merge: a shorter child `onError` list leaves the base's extra
 *   trailing entries dangling, so a rejected guard falls through to a page the
 *   child funnel does not own.
 * - Mutated base: the registry entry for the base funnel is corrupted, so every
 *   subsequent `prepare()` builds a different machine from the same config.
 * - No cycle guard: `a extends b`, `b extends a` blows the stack on boot
 *   instead of surfacing a funnel error.
 */

import { describe, it, expect, vi } from "vitest";

// -----------------------------------------------------------------------------
// Mocks — hoisted. `utils.ts` pulls in i18n and brand at module load; neither is
// exercised by extendFunnel beyond the error message lookup. The cookie and
// Sentry stubs only exist to keep the transitive session/util barrels loadable.

vi.mock("../../../utils/useCookies", () => ({
  useCookies: vi.fn(() => ({
    removeTopLevel: vi.fn(),
    setTopLevel: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn()
  }))
}));

vi.mock("@sentry/vue", () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  withScope: vi.fn(),
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() }
}));

// `src/utils/useError` and `useCalculate` reach back up into the module
// barrels, which instantiate the SDK on load. Stub them so a pure-function test
// never boots Upmind.
vi.mock("../../../modules", () => ({
  useI18n: () => ({ t: vi.fn((key: string) => key) }),
  useQuery: vi.fn(() => ({ queryClient: {} }))
}));

vi.mock("../../query", () => ({
  useQuery: vi.fn(() => ({ queryClient: {} }))
}));

vi.mock("../../system", () => ({
  useI18n: () => ({ t: vi.fn((key: string) => key) })
}));

vi.mock("../../brand", () => ({
  useBrand: () => ({
    uischema_Route: { value: {} },
    uiCart: { value: {} },
    isReady: vi.fn()
  })
}));

// -----------------------------------------------------------------------------

import { extendFunnel } from "../utils";
import type { FunnelProps, Funnels } from "../types";

// -----------------------------------------------------------------------------
// Fixtures — shaped like the real cart / one-page funnels.

const cart = {
  id: "cart",
  states: {
    basket: { meta: { next: "checkout" }, entry: ["setBasket"] },
    billing: { entry: ["setCurrency"], invoke: { src: "guardBilling" } },
    checkout: {
      meta: { prev: "basket" },
      entry: ["setCurrency", "setBasket"],
      // Declared by the base ONLY — must not survive a child override.
      on: { NEXT: { target: "order" } },
      invoke: {
        src: "guardCheckout",
        onError: ["session", "overlay", "billing", "invalidProducts", "basket"]
      }
    }
  },
  guards: { isBasket: "cartIsBasket", isCheckout: "cartIsCheckout" },
  services: { guardCheckout: "cartGuardCheckout" },
  actions: { setResolved: "cartSetResolved" },
  context: { resolved: false }
} as unknown as FunnelProps;

const onePage = {
  id: "one-page",
  extends: "cart",
  states: {
    billing: { always: [{ target: "checkout" }] },
    checkout: {
      meta: { prev: "basket" },
      entry: ["setCurrency", "setBasket", "setBillingDefaults"],
      invoke: {
        src: "guardCheckout",
        onError: ["session", "overlay", "basket", "stayPut"]
      }
    }
  },
  guards: { isCheckout: "onePageIsCheckout" },
  context: { fallbackResolved: true }
} as unknown as FunnelProps;

const express = {
  id: "one-page-express",
  extends: "one-page",
  states: { checkout: { entry: ["skipEverything"] } },
  guards: { isCheckout: "expressIsCheckout" }
} as unknown as FunnelProps;

const funnels = { cart, "one-page": onePage } as unknown as Funnels;

/** `states` is typed as an XState StateNodesConfig; index it as a plain bag. */
const nodes = (funnel?: FunnelProps) =>
  (funnel?.states ?? {}) as unknown as Record<string, any>;

// -----------------------------------------------------------------------------

describe("extendFunnel", () => {
  describe("the good — a funnel that declares no base", () => {
    it("returns the config untouched", () => {
      expect(extendFunnel(funnels, cart)).toBe(cart);
    });

    it("returns undefined for a missing config", () => {
      expect(extendFunnel(funnels, undefined)).toBeUndefined();
    });
  });

  describe("the good — a single-level extend", () => {
    const result = extendFunnel(funnels, onePage) as FunnelProps;

    it("keeps the child's own identity", () => {
      expect(result.id).toBe("one-page");
    });

    it("inherits states the child never declares", () => {
      expect(nodes(result).basket).toEqual(nodes(cart).basket);
    });

    it("keeps states only the child declares", () => {
      expect(nodes(result).billing).toEqual(nodes(onePage).billing);
    });

    it("merges guards, child winning on collision", () => {
      expect(result.guards).toEqual({
        isBasket: "cartIsBasket",
        isCheckout: "onePageIsCheckout"
      });
    });

    it("inherits services and actions the child omits", () => {
      expect(result.services).toEqual(cart.services);
      expect(result.actions).toEqual(cart.actions);
    });

    it("merges context, child winning on collision", () => {
      expect(result.context).toEqual({
        resolved: false,
        fallbackResolved: true
      });
    });
  });

  describe("the bad — an overridden state must replace WHOLESALE", () => {
    const result = extendFunnel(funnels, onePage) as FunnelProps;
    const checkout = nodes(result).checkout as Record<string, any>;

    it("drops a transition the base declared and the child did not", () => {
      expect(checkout.on).toBeUndefined();
    });

    it("replaces the onError list rather than index-merging it", () => {
      expect(checkout.invoke.onError).toEqual([
        "session",
        "overlay",
        "basket",
        "stayPut"
      ]);
    });

    it("leaves no trailing entry from the base's longer list", () => {
      expect(checkout.invoke.onError).not.toContain("invalidProducts");
      expect(checkout.invoke.onError).toHaveLength(4);
    });

    it("takes the child's entry actions verbatim", () => {
      expect(checkout.entry).toEqual([
        "setCurrency",
        "setBasket",
        "setBillingDefaults"
      ]);
    });
  });

  describe("the bad — the registry must not be mutated", () => {
    it("leaves the base config untouched after flattening", () => {
      const snapshot = JSON.stringify(cart);
      extendFunnel(funnels, onePage);
      extendFunnel(funnels, onePage);
      expect(JSON.stringify(cart)).toBe(snapshot);
    });

    it("returns a fresh object each call", () => {
      const a = extendFunnel(funnels, onePage);
      const b = extendFunnel(funnels, onePage);
      expect(a).not.toBe(b);
      expect(a).toEqual(b);
    });
  });

  describe("nested — a chain resolves base-first, deepest layer winning", () => {
    const nested = { ...funnels, "one-page-express": express } as Funnels;
    const result = extendFunnel(nested, express) as FunnelProps;

    it("reaches states declared two levels down", () => {
      expect(nodes(result).basket).toEqual(nodes(cart).basket);
    });

    it("keeps the middle layer's own states", () => {
      expect(nodes(result).billing).toEqual(nodes(onePage).billing);
    });

    it("lets the outermost layer win on a key all three declare", () => {
      expect(result.guards?.isCheckout).toBe("expressIsCheckout");
      expect(nodes(result).checkout).toEqual({ entry: ["skipEverything"] });
    });

    it("still inherits the root's guards", () => {
      expect(result.guards?.isBasket).toBe("cartIsBasket");
    });
  });

  describe("the ugly — chains that must throw", () => {
    it("throws when the base id is not registered", () => {
      const orphan = {
        id: "orphan",
        extends: "nope",
        states: {}
      } as FunnelProps;
      expect(() => extendFunnel(funnels, orphan)).toThrow();
    });

    it("throws on a direct cycle rather than recursing forever", () => {
      const a = { id: "a", extends: "b", states: {} } as FunnelProps;
      const b = { id: "b", extends: "a", states: {} } as FunnelProps;
      expect(() => extendFunnel({ a, b } as Funnels, a)).toThrow();
    });

    it("throws on an indirect cycle three links long", () => {
      const a = { id: "a", extends: "b", states: {} } as FunnelProps;
      const b = { id: "b", extends: "c", states: {} } as FunnelProps;
      const c = { id: "c", extends: "a", states: {} } as FunnelProps;
      expect(() => extendFunnel({ a, b, c } as Funnels, a)).toThrow();
    });

    it("throws on a funnel that extends itself", () => {
      const self = { id: "self", extends: "self", states: {} } as FunnelProps;
      expect(() => extendFunnel({ self } as Funnels, self)).toThrow();
    });
  });
});
