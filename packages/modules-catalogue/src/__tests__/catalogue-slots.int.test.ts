// @vitest-environment happy-dom
// Not jsdom: node's undici fetch rejects jsdom's AbortSignal (vitest #8374).
// -----------------------------------------------------------------------------
/**
 * @fileoverview The catalogue page's layout gets the brand's template and the organism's develop blocks
 *
 * ## Job To Be Done
 * On the catalogue route, `UpmCatalogue`'s default slot hands the page one
 * value, the brand's template setting as the brand wrote it, even a name no
 * page layout carries. The page's self-closing layout gets the organism's own
 * content in every slot develop fills for a grid catalogue: the categories in
 * the content header and the product grid in the content, and neither domain
 * footer anchor. A slot the page writes on its layout replaces only that slot's
 * content.
 *
 * ## What Breaks If These Fail
 * The page cannot pick the brand's layout, a guest browsing the store sees no
 * categories or no products, or a page override pushes out the content around
 * it.
 */

import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { h } from "vue";
import { UpmCategories, UpmProducts } from "../index";
import {
  BOOT_BUDGET,
  framesOf,
  mountCatalogue,
  readableText,
  seedBasket,
  seedGuestSession,
  slotScopeOf,
  slotsOf
} from "./mount-catalogue";
import {
  installBootRoutes,
  RECORDED_TEMPLATE,
  recordedCategoryNames
} from "./recorded-pool";
import { intersection, some } from "lodash-es";
import type { CatalogueWrapper } from "./mount-catalogue";

// -----------------------------------------------------------------------------

const DEVELOP_BLOCKS = ["content-header", "content"];
const DAC_ANCHORS = ["aside-footer", "content-footer"];

const PAGE_TEMPLATES = ["full"];

const showsCategories = (wrapper: CatalogueWrapper) =>
  some(recordedCategoryNames, name =>
    readableText(wrapper).includes((name ?? "").trim())
  );

const inFrame = (wrapper: CatalogueWrapper, name: string) =>
  wrapper.find(`[data-frame="${name}"]`);

// -----------------------------------------------------------------------------

describe("the catalogue page's layout, for the recorded grid storefront", () => {
  beforeAll(async () => {
    installBootRoutes();
    await seedGuestSession();
    await seedBasket();
  }, BOOT_BUDGET);

  beforeEach(() => {
    installBootRoutes();
  });

  it(
    "hands the page the brand's template, a name no page layout carries, as the brand wrote it",
    async () => {
      const wrapper = await mountCatalogue(showsCategories);

      expect(PAGE_TEMPLATES).not.toContain(RECORDED_TEMPLATE);
      expect(slotScopeOf(wrapper)).toEqual({ template: RECORDED_TEMPLATE });
    },
    BOOT_BUDGET
  );

  it(
    "hands the layout develop's header and content, and no domain footer anchor",
    async () => {
      const wrapper = await mountCatalogue(showsCategories);

      expect(slotsOf(wrapper)).toEqual(expect.arrayContaining(DEVELOP_BLOCKS));
      expect(intersection(slotsOf(wrapper), DAC_ANCHORS)).toEqual([]);
    },
    BOOT_BUDGET
  );

  it(
    "draws the recorded categories in the header frame and the grid in the content frame",
    async () => {
      const wrapper = await mountCatalogue(showsCategories);

      expect(
        showsCategories(wrapper),
        "the recorded categories never reached the page"
      ).toBe(true);
      expect(
        inFrame(wrapper, "content-header").findComponent(UpmCategories).exists()
      ).toBe(true);
      expect(
        inFrame(wrapper, "content").findComponent(UpmProducts).exists()
      ).toBe(true);
    },
    BOOT_BUDGET
  );

  it(
    "puts the page's own slot in place of its block, and keeps every other block's",
    async () => {
      const wrapper = await mountCatalogue(
        found => found.find('[data-test-key="page-header"]').exists(),
        {
          "content-header": () =>
            h("p", { "data-test-key": "page-header" }, "Page")
        }
      );

      expect(
        inFrame(wrapper, "content-header")
          .find('[data-test-key="page-header"]')
          .exists()
      ).toBe(true);
      expect(
        inFrame(wrapper, "content-header").findComponent(UpmCategories).exists()
      ).toBe(false);
      expect(
        inFrame(wrapper, "content").findComponent(UpmProducts).exists()
      ).toBe(true);
      expect(framesOf(wrapper)).toEqual(expect.arrayContaining(DEVELOP_BLOCKS));
    },
    BOOT_BUDGET
  );
});
