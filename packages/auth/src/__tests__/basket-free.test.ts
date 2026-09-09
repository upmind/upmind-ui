// -----------------------------------------------------------------------------
/**
 * @fileoverview `auth` no longer reaches for the basket — ADR 023 §7
 *
 * ## Job To Be Done
 * A login screen that fetches a basket is what started this phase: the session
 * views owned the summary aside, so mounting `/login` issued order and
 * provision-field calls no login needs, and a package that must run with no
 * basket at all (the standalone app, portal-nuxt) could not. The aside now
 * arrives through the `auth:summary` socket, and the whole basket vocabulary has
 * to be gone from this package's source — imports AND call sites.
 *
 * ## What Breaks If These Fail
 * One re-added `useBasket()` puts the calls back on a login page, and every host
 * with no basket store gets a failed fetch or a hang on the screen that mints
 * credentials. The network cost is invisible to a green build, so nothing else
 * catches the regression until a request log is read.
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { describe, expect, it } from "vitest";

// -----------------------------------------------------------------------------

const SOURCE_ROOT = join(process.cwd(), "src");
const SOURCE_EXTENSIONS = [".ts", ".vue"];

/** Basket, order and provision vocabulary this package must not carry. */
const FORBIDDEN = [
  "useBasket",
  "useBasketProduct",
  "useOrder",
  "useOrders",
  "useProvisionFields",
  "provision_fields",
  "@upmind-automation/client-vue",
  "@upmind-automation/basket"
];

function sourceFiles(directory: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      if (entry === "__tests__") continue;
      found.push(...sourceFiles(path));
      continue;
    }
    if (SOURCE_EXTENSIONS.includes(extname(entry))) found.push(path);
  }
  return found;
}

const FILES = existsSync(SOURCE_ROOT) ? sourceFiles(SOURCE_ROOT) : [];

function offenders(term: string) {
  return FILES.filter(path => readFileSync(path, "utf8").includes(term)).map(
    path => path.slice(SOURCE_ROOT.length + 1)
  );
}

describe("the auth package's distance from the basket", () => {
  it("has source files to check", () => {
    expect(FILES.length).toBeGreaterThan(0);
  });

  it("names no basket, order or provision surface anywhere in its source", () => {
    for (const term of FORBIDDEN) {
      expect({ term, offenders: offenders(term) }).toEqual({
        term,
        offenders: []
      });
    }
  });

  it("takes the summary aside from its host rather than building one", () => {
    expect(offenders("cart.basket_section")).toEqual([]);
    expect(offenders("shopping-bag-02")).toEqual([]);
  });
});
