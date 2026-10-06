// -----------------------------------------------------------------------------
/**
 * @fileoverview Velia's routes: cart-nuxt's, with the basket at `/order/cart`
 *
 * ## Job To Be Done
 * Velia serves every route cart-nuxt serves, under the same names, with the
 * basket's own pages moved from `/order/basket` to `/order/cart`, and the
 * basket segment in front of the other order pages taking `cart` as well as
 * `basket`.
 *
 * ## What Breaks If These Fail
 * A Velia basket URL lands on the catch-all page, an order page stops taking a
 * `cart` segment or an old `basket` one, or a page cart-nuxt serves goes
 * missing on Velia.
 */

import { readdirSync } from "node:fs";
import { relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { createMemoryHistory, createRouter } from "vue-router";
import cartOptions from "../../cart-nuxt/app/router.options";
import veliaOptions from "../app/router.options";
import {
  assign,
  concat,
  endsWith,
  filter,
  flatMap,
  join,
  map,
  reduce,
  replace,
  split,
  startsWith
} from "lodash-es";
import type { RouteRecordRaw } from "vue-router";

// -----------------------------------------------------------------------------

const PAGES = resolve(import.meta.dirname, "../../cart-nuxt/app/pages");

const BID = "8d632507-9806-5d1e-302f-8174e234e98d";
const BPID = "5d085e69-d562-3719-459a-218e940d4237";

function pageFiles(directory: string): string[] {
  return flatMap(readdirSync(directory, { withFileTypes: true }), entry => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return pageFiles(path);
    return endsWith(entry.name, ".vue") ? [path] : [];
  });
}

const SEGMENT_PARAMS: [RegExp, string][] = [
  [/^\[\.\.\.(\w+)\]$/, ":$1(.*)*"],
  [/^\[\[(\w+)\]\]$/, ":$1?"],
  [/^\[(\w+)\]$/, ":$1()"]
];

function segmentOf(part: string) {
  return reduce(
    SEGMENT_PARAMS,
    (segment, [pattern, param]) => replace(segment, pattern, param),
    part
  );
}

function nameOf(part: string) {
  return replace(part, /[[\].]/g, "");
}

/** cart-nuxt's pages as Nuxt's file-system routing scans them, fresh for each call. */
function scannedRoutes(): RouteRecordRaw[] {
  return map(pageFiles(PAGES), file => {
    const parts = split(replace(relative(PAGES, file), /\.vue$/, ""), "/");
    const named = filter(parts, part => part !== "index");

    return {
      name: join(map(named, nameOf), "-") || "index",
      path: `/${join(map(named, segmentOf), "/")}`,
      component: () => Promise.resolve({ render: () => null })
    };
  });
}

type Routes = (routes: RouteRecordRaw[]) => RouteRecordRaw[];

const cartRoutes = (cartOptions.routes as Routes)(scannedRoutes());
const veliaRoutes = (veliaOptions.routes as Routes)(scannedRoutes());

function flatten(routes: RouteRecordRaw[], parent = ""): RouteRecordRaw[] {
  return flatMap(routes, route =>
    concat<RouteRecordRaw>(
      assign({}, route, { path: parent + route.path }),
      flatten(route.children ?? [], `${parent}${route.path}`)
    )
  );
}

const routerOf = (routes: RouteRecordRaw[]) =>
  createRouter({ history: createMemoryHistory(), routes });

const cartRouter = routerOf(cartRoutes);
const veliaRouter = routerOf(veliaRoutes);

const nameAt = (router: typeof cartRouter, url: string) =>
  String(router.resolve(url).name);

// -----------------------------------------------------------------------------

describe("Velia's routes against cart-nuxt's", () => {
  it("scans the cart-nuxt pages it is graded on", () => {
    expect(map(flatten(cartRoutes), "path")).toContain("/order/basket/:bid?");
  });

  it("serves every route cart-nuxt serves, under the same names, and no other", () => {
    expect(map(flatten(veliaRoutes), "name")).toEqual(
      map(flatten(cartRoutes), "name")
    );
  });

  it("keeps no route under /order/basket", () => {
    const left = filter(map(flatten(veliaRoutes), "path"), path =>
      startsWith(path, "/order/basket")
    );

    expect(left).toEqual([]);
  });

  it.each([
    [`/order/basket/${BID}`, `/order/cart/${BID}`],
    [`/order/basket/${BID}/edit/${BPID}`, `/order/cart/${BID}/edit/${BPID}`],
    [`/order/basket/${BID}/empty`, `/order/cart/${BID}/empty`],
    ["/order/basket/unavailable", "/order/cart/unavailable"]
  ])("serves cart-nuxt's %s page at %s", (cartUrl, veliaUrl) => {
    const name = nameAt(cartRouter, cartUrl);

    expect(name).not.toBe(nameAt(cartRouter, "/no/such/page"));
    expect(nameAt(veliaRouter, veliaUrl)).toBe(name);
  });

  it.each(["shop", "checkout", "domains", "auth/login", "product"])(
    "takes both a cart and a basket segment in front of the %s page",
    page => {
      const name = nameAt(cartRouter, `/order/basket/${BID}/${page}/`);

      expect(nameAt(veliaRouter, `/order/cart/${BID}/${page}/`)).toBe(name);
      expect(nameAt(veliaRouter, `/order/basket/${BID}/${page}/`)).toBe(name);
      expect(
        veliaRouter.resolve(`/order/cart/${BID}/${page}/`).params.segment
      ).toBe("cart");
    }
  );
});
