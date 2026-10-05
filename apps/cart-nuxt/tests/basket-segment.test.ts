// -----------------------------------------------------------------------------
/**
 * @fileoverview Two storefronts, two basket URLs, one route table.
 *
 * ## Job To Be Done
 * Each storefront serves its basket under the segment its `#basket-segment` alias names,
 * and velia redirects its old basket URLs onto that segment.
 *
 * ## What Breaks If These Fail
 * Velia's customers land on `/order/basket/...`, an old velia basket link finds no
 * page, or cart-nuxt's live basket links break.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { createMemoryHistory, createRouter } from "vue-router";
import { BID_PREFIX } from "../app/funnels/types";
import cartNuxtRouterOptions from "../app/router.options";
import type { RouteRecordRaw, RouterOptions } from "vue-router";
import { BASKET_SEGMENT, LEGACY_BASKET_SEGMENT } from "#basket-segment";

// -----------------------------------------------------------------------------

const APP_ROOT = join(import.meta.dirname, "..");
const PAGES = join(APP_ROOT, "app", "pages");
const VELIA_ROOT = join(APP_ROOT, "..", "velia-nuxt");

const BID = "0e435795-e78d-184e-458d-b31643202d98";
const BASKET_PRODUCT_ID = "7f1c2a9e-4b3d-4e6f-8a1b-2c3d4e5f6a7b";

type Scanned = { name: string; path: string; component: unknown };

function pageFiles(dir: string, prefix = ""): string[] {
  const found: string[] = [];

  for (const entry of readdirSync(dir).sort()) {
    const full = join(dir, entry);

    if (statSync(full).isDirectory()) {
      found.push(...pageFiles(full, `${prefix}${entry}/`));
    } else if (entry.endsWith(".vue")) {
      found.push(`${prefix}${entry}`);
    }
  }
  return found;
}

function scannedPath(file: string): string {
  const segments = file
    .replace(/\.vue$/, "")
    .split("/")
    .filter(part => part !== "index")
    .map(part =>
      part.replace(/^\[\[(.+)\]\]$/, ":$1?").replace(/^\[(.+)\]$/, ":$1")
    );

  return `/${segments.join("/")}`;
}

const scannedBasketFiles = pageFiles(PAGES).filter(file =>
  file.startsWith("order/basket/")
);

if (scannedBasketFiles.length === 0) {
  throw new Error("No pages scanned under app/pages/order/basket.");
}

const SCANNED_PATHS = scannedBasketFiles.map(scannedPath);

function scannedBasketPages(): Scanned[] {
  return scannedBasketFiles.map(file => ({
    name: file.replace(/\.vue$/, "").replace(/\W+/g, "-"),
    path: scannedPath(file),
    component: { render: () => null }
  }));
}

async function veliaSegment() {
  const config = readFileSync(join(VELIA_ROOT, "nuxt.config.ts"), "utf8");
  const target = /"#basket-segment":\s*resolve\(__dirname,\s*"([^"]+)"\)/.exec(
    config
  )?.[1];

  if (!target) {
    throw new Error(
      "velia-nuxt/nuxt.config.ts declares no #basket-segment alias."
    );
  }
  return (await import(/* @vite-ignore */ join(VELIA_ROOT, target))) as {
    BASKET_SEGMENT: string;
    LEGACY_BASKET_SEGMENT: string;
  };
}

function resolveRoutes(options: RouterOptions): RouteRecordRaw[] {
  return options.routes?.(
    scannedBasketPages() as RouteRecordRaw[]
  ) as RouteRecordRaw[];
}

function allPaths(routes: RouteRecordRaw[], parent = ""): string[] {
  return routes.flatMap(route => {
    const path = route.path.startsWith("/")
      ? route.path
      : `${parent.replace(/\/$/, "")}/${route.path}`;

    return [path, ...allPaths(route.children ?? [], path)];
  });
}

function hrefFor(routes: RouteRecordRaw[], name: string, segment: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes
  });

  return router.resolve({ name, params: { segment, bid: BID } }).href;
}

const cartRoutes = resolveRoutes(cartNuxtRouterOptions as RouterOptions);

async function veliaRoutes() {
  const segment = await veliaSegment();

  vi.resetModules();
  vi.doMock("#basket-segment", () => segment);

  const options = (
    (await import(
      /* @vite-ignore */ join(VELIA_ROOT, "app", "router.options.ts")
    )) as { default: RouterOptions }
  ).default;
  const routes = resolveRoutes(options);

  vi.doUnmock("#basket-segment");
  return { routes, segment };
}

// -----------------------------------------------------------------------------

describe("each storefront declares the basket URL it already serves", () => {
  it("cart-nuxt serves basket and redirects cart", () => {
    expect(BASKET_SEGMENT).toBe("basket");
    expect(LEGACY_BASKET_SEGMENT).toBe("cart");
  });

  it("velia serves cart and redirects basket", async () => {
    const segment = await veliaSegment();

    expect(segment.BASKET_SEGMENT).toBe("cart");
    expect(segment.LEGACY_BASKET_SEGMENT).toBe("basket");
  });

  it("each layer's redirect spelling is the other layer's live one", async () => {
    const segment = await veliaSegment();

    expect(segment.LEGACY_BASKET_SEGMENT).toBe(BASKET_SEGMENT);
    expect(LEGACY_BASKET_SEGMENT).toBe(segment.BASKET_SEGMENT);
  });
});

describe("cart-nuxt's route table carries its own segment", () => {
  it("names it in the BID prefix", () => {
    expect(BID_PREFIX).toContain(":segment(basket)?");
  });

  it("keeps every scanned basket page on the path it was scanned to", () => {
    const paths = allPaths(cartRoutes);

    for (const scanned of SCANNED_PATHS) {
      expect(paths).toContain(scanned);
    }
  });

  it("puts no other storefront's segment anywhere in the table", () => {
    for (const path of allPaths(cartRoutes)) {
      expect(path).not.toContain("/order/cart");
      expect(path).not.toContain("segment(cart)");
    }
  });

  it("resolves a basket-scoped route to a basket URL", () => {
    expect(hrefFor(cartRoutes, "checkout", BASKET_SEGMENT)).toBe(
      `/order/basket/${BID}/checkout/`
    );
  });
});

describe("velia's layer moves every one of them, and only them", () => {
  it("re-paths every scanned basket page onto cart", async () => {
    const { routes } = await veliaRoutes();
    const paths = allPaths(routes);

    for (const scanned of SCANNED_PATHS) {
      expect(scanned).toContain("/order/basket");
      expect(paths).toContain(scanned.replace("/order/basket", "/order/cart"));
    }
  });

  it("leaves no page on a basket path", async () => {
    const { routes } = await veliaRoutes();
    const pages = routes.filter(route => !route.redirect);

    for (const path of allPaths(pages)) {
      expect(path).not.toContain("/order/basket");
    }
  });

  it("moves nothing outside the basket scope", async () => {
    const { routes } = await veliaRoutes();
    const outside = (table: RouteRecordRaw[]) =>
      allPaths(table).filter(path => !path.startsWith("/order/"));

    expect(outside(routes)).toEqual(outside(cartRoutes));
  });
});

describe("velia's layer redirects its old basket URLs onto cart", () => {
  it.each(SCANNED_PATHS)(
    "sends %s on to the same page under cart",
    async path => {
      const { routes } = await veliaRoutes();
      const router = createRouter({ history: createMemoryHistory(), routes });
      const old = path
        .replace(":bid?", BID)
        .replace(":bpid", BASKET_PRODUCT_ID);

      await router.push(old);

      expect(router.currentRoute.value.path).toBe(
        old.replace("/order/basket", "/order/cart")
      );
      expect(
        router.currentRoute.value.matched,
        `${old} lands on no page`
      ).not.toEqual([]);
    }
  );
});
