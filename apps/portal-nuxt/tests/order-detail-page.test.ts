// -----------------------------------------------------------------------------
/**
 * @fileoverview The order detail page mounts the real order surface
 *
 * ## Job To Be Done
 * Prove the page is routed on the parameter `UpmOrder` reads, and mounts it from the invoice barrel.
 *
 * ## What Breaks If These Fail
 * An order link lands on a document view that never resolves an order.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { QUERY_PARAMS } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

const PAGES = join(
  import.meta.dirname,
  "..",
  "app",
  "pages",
  "billing",
  "orders"
);
const PACKAGE = "@upmind-automation/invoice";
const ORGANISM = "UpmOrder";

const detailPage = readdirSync(PAGES).find(file => /^\[\w+]\.vue$/.test(file));
const param = /^\[(\w+)]\.vue$/.exec(detailPage ?? "")?.[1];
const source = readFileSync(join(PAGES, detailPage ?? ""), "utf8");

function withoutComments(code: string) {
  return code
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1 ");
}

const code = withoutComments(source);

function paramsRead(): string[] {
  const found = new Set<string>();

  for (const match of code.matchAll(/params\s*\.\s*(\w+)/g))
    found.add(match[1]);
  for (const match of code.matchAll(/params\s*\[\s*["'](\w+)["']\s*]/g)) {
    found.add(match[1]);
  }
  return [...found];
}

// -----------------------------------------------------------------------------

describe("the portal's order detail page", () => {
  it("is routed on the parameter the organism reads", () => {
    expect(
      detailPage,
      `no dynamic order detail page in ${PAGES}: ${readdirSync(PAGES).join(", ")}`
    ).toBeTruthy();
    expect(
      param,
      `the page is routed on \`${param}\`; UpmOrder reads \`${QUERY_PARAMS.ORDER_ID}\``
    ).toBe(QUERY_PARAMS.ORDER_ID);
  });

  it("takes the organism from the invoice barrel, not from inside it", () => {
    const specifiers = [
      ...code.matchAll(/\bfrom\s*["'](@upmind-automation\/invoice[^"']*)["']/g)
    ].map(match => match[1]);

    expect(
      specifiers,
      `the page imports nothing from ${PACKAGE}:\n${source}`
    ).not.toEqual([]);
    expect(
      specifiers.filter(specifier => specifier !== PACKAGE),
      `the page reaches past the curated barrel: ${specifiers.join(", ")}`
    ).toEqual([]);
    expect(code, `the page does not name ${ORGANISM}:\n${source}`).toContain(
      ORGANISM
    );
  });

  it("reads no route parameter the portal does not route on", () => {
    const foreign = paramsRead().filter(name => name !== param);

    expect(
      foreign,
      `the page reads ${foreign.join(", ")}, which its own route never carries`
    ).toEqual([]);
  });

  it("mounts the component rather than naming it", () => {
    expect(
      code,
      `the page still carries the stub's "${ORGANISM}" string:\n${source}`
    ).not.toContain(`"${ORGANISM}"`);
  });
});
