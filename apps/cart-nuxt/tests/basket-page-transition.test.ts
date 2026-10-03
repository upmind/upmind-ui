/**
 * @fileoverview The Nuxt cart's basket pages hold the route transition around the organism.
 *
 * ## Job To Be Done
 * Each basket, basket-product and product-setup page wraps its organism in one
 * route transition, outside the template the organism swaps.
 *
 * ## What Breaks If These Fail
 * A basket page loses its enter transition, or a template swap runs it again and
 * re-renders the header.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parse } from "vue/compiler-sfc";
import { filter, has, map } from "lodash-es";

// -----------------------------------------------------------------------------

const PAGES = resolve(import.meta.dirname, "../app/pages/order/basket/[[bid]]");
const TRANSITION = "UpmTransition";

const HOSTS = [
  { page: "index.vue", organism: "UpmBasket" },
  { page: "ProductSetup.vue", organism: "UpmProductSetup" },
  { page: "edit/[bpid].vue", organism: "UpmBasketProductEdit" }
];

type TemplateElement = { tag: string; children: unknown[] };

function isElement(node: unknown): node is TemplateElement {
  return has(node, "tag") && has(node, "children");
}

function elements(nodes: unknown[] | undefined): TemplateElement[] {
  return filter(nodes, isElement);
}

function rootsOf(page: string): TemplateElement[] {
  const { descriptor } = parse(readFileSync(resolve(PAGES, page), "utf8"));

  return elements(descriptor.template?.ast?.children);
}

// -----------------------------------------------------------------------------

describe.each(HOSTS)("the Nuxt cart's $page", ({ page, organism }) => {
  it("has the route transition as its one root", () => {
    const roots = rootsOf(page);

    expect(
      map(roots, "tag"),
      `${page} renders no transition around its organism`
    ).toEqual([TRANSITION]);
  });

  it("puts the organism, and only the organism, inside it", () => {
    const [transition] = rootsOf(page);

    expect(
      map(elements(transition?.children), "tag"),
      `${page} puts something beside ${organism} inside the transition`
    ).toEqual([organism]);
  });
});
