// -----------------------------------------------------------------------------
/**
 * @fileoverview Every host's records draw every page name its own enum offers.
 *
 * ## Job To Be Done
 * A host owes a layout for every name its enum offers a brand, and every host
 * offers a page the same names; a record with a gap draws nothing for a name.
 *
 * ## What Breaks If These Fail
 * A brand's chosen arrangement draws no layout in one host, or one host offers
 * an arrangement the others never draw.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  difference,
  filter,
  groupBy,
  join,
  map,
  sortBy,
  toArray,
  toPairs,
  uniq
} from "lodash-es";

// -----------------------------------------------------------------------------

const REPO_ROOT = resolve(process.cwd(), "..", "..");

const ENUM = {
  auth: "AUTH_TEMPLATE",
  order: "ORDER_TEMPLATE",
  product: "PRODUCT_TEMPLATE"
};

type Page = keyof typeof ENUM;

const RECORDS: Array<{
  host: string;
  page: Page;
  record: string;
  types: string;
}> = [
  {
    host: "auth app",
    page: "auth",
    record: "apps/auth/src/shell.ts",
    types: "apps/auth/src/types.ts"
  },
  {
    host: "portal-nuxt",
    page: "auth",
    record: "apps/portal-nuxt/app/portal/auth/shell.ts",
    types: "apps/portal-nuxt/app/portal/auth/types.ts"
  },
  {
    host: "portal-nuxt",
    page: "order",
    record: "apps/portal-nuxt/app/portal/billing/shell.ts",
    types: "apps/portal-nuxt/app/portal/billing/types.ts"
  },
  {
    host: "labs-nuxt",
    page: "auth",
    record: "playgrounds/labs-nuxt/app/shell/shell.ts",
    types: "playgrounds/labs-nuxt/app/shell/modules/session/types.ts"
  },
  {
    host: "labs-nuxt",
    page: "order",
    record: "playgrounds/labs-nuxt/app/shell/shell.ts",
    types: "playgrounds/labs-nuxt/app/shell/modules/order/types.ts"
  },
  {
    host: "cart",
    page: "auth",
    record: "apps/cart/src/shell/modules/session/shell.ts",
    types: "apps/cart/src/shell/modules/session/types.ts"
  },
  {
    host: "cart",
    page: "order",
    record: "apps/cart/src/shell/modules/order/shell.ts",
    types: "apps/cart/src/shell/modules/order/types.ts"
  },
  {
    host: "cart",
    page: "product",
    record: "apps/cart/src/shell/modules/product/shell.ts",
    types: "apps/cart/src/shell/modules/product/types.ts"
  },
  {
    host: "cart-nuxt",
    page: "auth",
    record: "apps/cart-nuxt/app/shell/modules/session/shell.ts",
    types: "apps/cart-nuxt/app/shell/modules/session/types.ts"
  },
  {
    host: "cart-nuxt",
    page: "order",
    record: "apps/cart-nuxt/app/shell/modules/order/shell.ts",
    types: "apps/cart-nuxt/app/shell/modules/order/types.ts"
  },
  {
    host: "cart-nuxt",
    page: "product",
    record: "apps/cart-nuxt/app/shell/modules/product/shell.ts",
    types: "apps/cart-nuxt/app/shell/modules/product/types.ts"
  }
];

function read(path: string): string {
  const full = resolve(REPO_ROOT, path);
  if (!existsSync(full)) return "";
  return readFileSync(full, "utf8");
}

function offeredNames(types: string, constant: string): string[] {
  const body = new RegExp(
    `export\\s+enum\\s+${constant}\\s*\\{([^}]*)\\}`
  ).exec(read(types));

  if (body === null) return [];

  return map([...body[1].matchAll(/^\s*(\w+)\s*=/gm)], match => match[1]);
}

function filledNames(record: string, constant: string): string[] {
  return map(
    toArray(
      read(record).matchAll(
        new RegExp(`\\[\\s*${constant}\\.(\\w+)\\s*\\]\\s*:`, "g")
      )
    ),
    match => match[1]
  );
}

const CASES = map(RECORDS, entry => ({
  host: entry.host,
  page: entry.page,
  offered: offeredNames(entry.types, ENUM[entry.page]),
  filled: filledNames(entry.record, ENUM[entry.page])
}));

const PAGES = map(toPairs(groupBy(CASES, "page")), ([page, cases]) => ({
  page,
  cases
}));

// -----------------------------------------------------------------------------

describe("the surface this spec grades", () => {
  it.each(CASES)("reads the $page names $host offers", entry => {
    expect(
      entry.offered.length,
      `${entry.host} offers no ${entry.page} names this spec can read, so ` +
        `its record is graded against nothing`
    ).toBeGreaterThan(0);
  });
});

describe("every page name a host can be asked for", () => {
  it.each(CASES)("$host draws every $page name it offers", entry => {
    const missing = difference(entry.offered, entry.filled);

    expect(
      missing,
      `${entry.host}'s record has no layout for ${join(missing, ", ")}, so a ` +
        `brand that asks for one gets no page`
    ).toEqual([]);
  });

  it.each(CASES)("$host draws no $page name twice", entry => {
    const doubled = uniq(
      filter(
        entry.filled,
        name => filter(entry.filled, other => other === name).length > 1
      )
    );

    expect(doubled).toEqual([]);
  });

  it.each(CASES)("$host draws no $page name it never offered", entry => {
    expect(difference(entry.filled, entry.offered)).toEqual([]);
  });
});

describe("the names each host offers a page", () => {
  it.each(PAGES)("every host offers the same $page names", entry => {
    const offered = uniq(
      map(entry.cases, found => join(sortBy(found.offered), ", "))
    );

    expect(
      offered,
      `the hosts offer different ${entry.page} names, so a brand's choice ` +
        `draws a layout in one host and the fallback in another`
    ).toHaveLength(1);
  });
});
