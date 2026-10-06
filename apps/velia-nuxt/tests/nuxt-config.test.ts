// -----------------------------------------------------------------------------
/**
 * @fileoverview Velia's redirects take cart-nuxt's place in the middleware chain
 *
 * ## Job To Be Done
 * When Nuxt resolves Velia's app, the global middleware entry for cart-nuxt's
 * redirects is pointed at Velia's own redirects, in the same place in the
 * chain, so they still run before cart-nuxt's routing guard; with no such entry
 * the build stops and says so.
 *
 * ## What Breaks If These Fail
 * Velia's basket redirects never run, run after the routing guard has already
 * sent the shopper on, or silently stop running when cart-nuxt renames its
 * middleware.
 */

import { existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import config from "../nuxt.config";
import {
  assign,
  cloneDeep,
  includes,
  indexOf,
  map,
  reject,
  replace,
  sortBy
} from "lodash-es";

// -----------------------------------------------------------------------------

vi.hoisted(() => {
  vi.stubGlobal("defineNuxtConfig", (nuxtConfig: unknown) => nuxtConfig);
});

type Middleware = { name: string; path: string; global: boolean };
type ResolvedApp = { middleware: Middleware[] };
type Hook = (app: ResolvedApp) => void;

const CART_MIDDLEWARE = resolve(
  import.meta.dirname,
  "../../cart-nuxt/app/middleware"
);
const CART_REDIRECTS = join(CART_MIDDLEWARE, "redirects.global.ts");
const VELIA_REDIRECTS = resolve(import.meta.dirname, "../app/redirects.ts");

const resolveApp = (config as unknown as { hooks: Record<string, Hook> }).hooks[
  "app:resolve"
];

/** cart-nuxt's global middleware as Nuxt resolves it: one entry per file, in name order. */
const CART_CHAIN: Middleware[] = map(
  sortBy(readdirSync(CART_MIDDLEWARE)),
  file => ({
    name: replace(replace(file, /\.global\.ts$/, ""), /\.ts$/, ""),
    path: join(CART_MIDDLEWARE, file),
    global: includes(file, ".global.")
  })
);

const resolved = (middleware: Middleware[]) => {
  const app = { middleware: cloneDeep(middleware) };
  resolveApp(app);
  return app.middleware;
};

// -----------------------------------------------------------------------------

describe("Velia's app:resolve hook", () => {
  it("is graded on a chain that holds cart-nuxt's redirects", () => {
    expect(map(CART_CHAIN, "path")).toContain(CART_REDIRECTS);
  });

  it("points cart-nuxt's redirects entry at Velia's redirects", () => {
    const chain = resolved(CART_CHAIN);

    expect(map(chain, "path")).not.toContain(CART_REDIRECTS);
    expect(map(chain, "path")).toContain(VELIA_REDIRECTS);
    expect(existsSync(VELIA_REDIRECTS)).toBe(true);
  });

  it("keeps the entry's name, its global flag and its place in the chain", () => {
    const chain = resolved(CART_CHAIN);
    const index = indexOf(map(CART_CHAIN, "path"), CART_REDIRECTS);

    expect(chain).toHaveLength(CART_CHAIN.length);
    expect(chain[index]).toEqual(
      assign({}, CART_CHAIN[index], { path: VELIA_REDIRECTS })
    );
  });

  it("leaves every other middleware as cart-nuxt resolves it", () => {
    const others = (chain: Middleware[]) =>
      reject(chain, entry =>
        includes([CART_REDIRECTS, VELIA_REDIRECTS], entry.path)
      );

    expect(others(resolved(CART_CHAIN))).toEqual(others(CART_CHAIN));
  });

  it("stops the build, naming the redirects, when cart-nuxt has no such entry", () => {
    const withoutRedirects = reject(CART_CHAIN, { path: CART_REDIRECTS });

    expect(() => resolved(withoutRedirects)).toThrow(/redirects/);
  });
});
