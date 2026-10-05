// -----------------------------------------------------------------------------
/**
 * @fileoverview Velia's storefront is cart-nuxt's layer with its own cart route, and nothing else.
 *
 * ## Job To Be Done
 * velia-nuxt extends cart-nuxt and adds only its cart route: the
 * `#basket-segment` module and the router options that serve the basket under
 * `/order/cart`. Every component, page, wording and theme it shows is
 * cart-nuxt's or the brand's.
 *
 * ## What Breaks If These Fail
 * Velia's customers see a page, pricing block, wording or theme that no other
 * storefront has, and it drifts from cart-nuxt's with each release.
 */

import { lstatSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { keys } from "lodash-es";

// -----------------------------------------------------------------------------

const VELIA_ROOT = join(import.meta.dirname, "..", "..", "velia-nuxt");
const STATIC_DIR = "public";
const CART_ROUTE = ["app/funnels/segment.ts", "app/router.options.ts"];

type LayerConfig = {
  extends?: unknown;
  alias?: Record<string, string>;
  runtimeConfig?: unknown;
};

const isOwnEntry = (entry: string) =>
  !entry.startsWith(".") && entry !== "node_modules";

function filesUnder(dir: string): string[] {
  const found: string[] = [];

  for (const entry of readdirSync(dir).filter(isOwnEntry).sort()) {
    const full = join(dir, entry);
    const stat = lstatSync(full);

    if (stat.isDirectory()) found.push(...filesUnder(full));
    else if (stat.isFile()) found.push(relative(VELIA_ROOT, full));
  }
  return found;
}

// A build's `dist` is a symlink into `.output`; lstat keeps it out.
function layerSource(): string[] {
  return readdirSync(VELIA_ROOT)
    .filter(isOwnEntry)
    .filter(entry => entry !== STATIC_DIR)
    .filter(entry => lstatSync(join(VELIA_ROOT, entry)).isDirectory())
    .sort()
    .flatMap(entry => filesUnder(join(VELIA_ROOT, entry)));
}

async function veliaConfig(): Promise<LayerConfig> {
  vi.stubGlobal("defineNuxtConfig", (config: LayerConfig) => config);

  const module = (await import(
    /* @vite-ignore */ join(VELIA_ROOT, "nuxt.config.ts")
  )) as { default: LayerConfig };

  return module.default;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

// -----------------------------------------------------------------------------

describe("velia-nuxt's layer holds only its cart route", () => {
  it("keeps no source beside the cart route's segment and router options", () => {
    expect(layerSource(), "velia-nuxt source outside its cart route").toEqual(
      CART_ROUTE
    );
  });

  it("extends cart-nuxt with no alias but the basket segment's and no runtime config", async () => {
    const config = await veliaConfig();

    expect({
      extends: config.extends,
      aliases: keys(config.alias),
      runtimeConfig: config.runtimeConfig
    }).toEqual({
      extends: ["../cart-nuxt"],
      aliases: ["#basket-segment"],
      runtimeConfig: undefined
    });
  });
});
