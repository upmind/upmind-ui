// -----------------------------------------------------------------------------
/**
 * @fileoverview Velia's basket redirects, in front of cart-nuxt's
 *
 * ## Job To Be Done
 * On Velia the basket lives at `/order/cart/`: a path there is left alone,
 * cart-nuxt's default `/order/basket/` path moves there for good with its query and hash,
 * and every other path gets exactly what cart-nuxt's redirects give it.
 *
 * ## What Breaks If These Fail
 * A Velia shopper bounces off their basket, an old basket link loses its
 * basket or currency, or Velia stops normalising the paths cart-nuxt does.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryHistory, createRouter } from "vue-router";
import cartRedirects from "../../cart-nuxt/app/middleware/redirects.global";
import veliaRedirects from "../app/redirects";
import { assign } from "lodash-es";
import type { RouteLocationNormalized } from "vue-router";

// -----------------------------------------------------------------------------

const { navigateTo } = vi.hoisted(() => {
  const navigateTo = vi.fn((to: unknown, options?: unknown) => ({
    to,
    options
  }));
  vi.stubGlobal(
    "defineNuxtRouteMiddleware",
    (middleware: unknown) => middleware
  );
  vi.stubGlobal("navigateTo", navigateTo);
  return { navigateTo };
});

type Middleware = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized
) => unknown;

const BID = "8d632507-9806-5d1e-302f-8174e234e98d";
const BPID = "5d085e69-d562-3719-459a-218e940d4237";

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: "/:path(.*)*", component: { render: () => null } }]
});

const at = (url: string) => router.resolve(url) as RouteLocationNormalized;

const FROM = at("/order/shop/");

const run = (middleware: unknown, url: string) =>
  (middleware as Middleware)(at(url), FROM);

/** Where a `navigateTo` call sends the shopper: its path, query and hash, and its status. */
function destinationOf(result: unknown) {
  const { to, options } = result as {
    to: string | { path: string; query?: object; hash?: string };
    options?: { redirectCode?: number };
  };
  const target =
    typeof to === "string" ? at(to) : assign({ query: {}, hash: "" }, to);

  return {
    path: target.path,
    query: target.query,
    hash: target.hash,
    code: options?.redirectCode
  };
}

// -----------------------------------------------------------------------------

describe("Velia's redirects", () => {
  beforeEach(() => {
    navigateTo.mockClear();
  });

  it.each([
    "/order/cart/",
    `/order/cart/${BID}/`,
    `/order/cart/${BID}/edit/${BPID}/`,
    "/order/cart/?currency=GBP"
  ])("leaves %s, the basket's own path, alone", async url => {
    expect(await run(veliaRedirects, url)).toBeUndefined();
    expect(navigateTo).not.toHaveBeenCalled();
  });

  it.each([
    ["/order/basket/", "/order/cart/"],
    [`/order/basket/${BID}/`, `/order/cart/${BID}/`],
    [`/order/basket/${BID}/edit/${BPID}/`, `/order/cart/${BID}/edit/${BPID}/`],
    ["/order/basket/unavailable/", "/order/cart/unavailable/"]
  ])("moves %s to %s for good", async (url, path) => {
    expect(destinationOf(await run(veliaRedirects, url))).toEqual({
      path,
      query: {},
      hash: "",
      code: 301
    });
  });

  it("keeps the query and the hash when it moves a basket link", async () => {
    const result = await run(
      veliaRedirects,
      `/order/basket/${BID}/?currency=GBP&promo=SPRING#summary`
    );

    expect(destinationOf(result)).toEqual({
      path: `/order/cart/${BID}/`,
      query: { currency: "GBP", promo: "SPRING" },
      hash: "#summary",
      code: 301
    });
  });

  it.each([
    "/order/shop",
    "/order/shop/",
    "/order/cart",
    "/order/basket",
    "/shop/",
    "/order/billing/?currency=GBP",
    "/"
  ])("gives %s exactly what cart-nuxt's redirects give it", async url => {
    const cart = await run(cartRedirects, url);
    const cartCalls = navigateTo.mock.calls.length;
    navigateTo.mockClear();

    const velia = await run(veliaRedirects, url);

    expect(velia).toEqual(cart);
    expect(navigateTo.mock.calls.length).toBe(cartCalls);
  });

  it("still redirects a path cart-nuxt redirects", async () => {
    expect(await run(veliaRedirects, "/order/shop")).toEqual(
      await run(cartRedirects, "/order/shop")
    );
    expect(navigateTo).toHaveBeenCalled();
  });
});
