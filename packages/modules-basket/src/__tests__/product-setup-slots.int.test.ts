// @vitest-environment happy-dom
// Not jsdom: node's undici fetch rejects jsdom's AbortSignal (vitest #8374).
// -----------------------------------------------------------------------------
/**
 * @fileoverview The product setup page's layout gets the organism's develop blocks
 *
 * ## Job To Be Done
 * On the product setup route, the page's self-closing layout for the template
 * it is handed gets `UpmProductSetup`'s own content in every slot develop fills
 * for the recorded basket's first product that needs setup: the configuration,
 * the content header, the aside, the progress and the actions. A slot the page
 * writes on its layout replaces only that slot's content.
 *
 * ## What Breaks If These Fail
 * A guest asked to finish a product's setup sees no form, no count of the
 * products left or no way on, or a page override pushes out the content around
 * it.
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { h } from "vue";
import { UpmProductSetup } from "../index";
import {
  BOOT_BUDGET,
  inFrame,
  layoutFor,
  mountPage,
  ROUTES,
  seedBasket,
  seedGuestSession,
  slotsOf,
  templateOf,
  unmountPages
} from "./mount-page";
import { installBootRoutes, recordedTemplate } from "./recorded-pool";
import type { PageWrapper } from "./mount-page";
import type { RawSlots } from "vue";

// -----------------------------------------------------------------------------

const DEVELOP_BLOCKS = [
  "configuration",
  "content-header",
  "aside",
  "progress",
  "actions"
];

const HERO_TITLE = '[data-test-key="product-setup-hero-title"]';

const drawsForm = (wrapper: PageWrapper) =>
  wrapper.find("#setup-form").exists();

const openSetup = (overrides?: RawSlots) =>
  mountPage({
    organism: UpmProductSetup,
    props: { basketRoute: { name: ROUTES.BASKET } },
    layout: layoutFor(DEVELOP_BLOCKS),
    path: "/order/basket/setup",
    until: drawsForm,
    overrides
  });

// -----------------------------------------------------------------------------

describe("the product setup page's layout, for the recorded basket's invalid products", () => {
  beforeAll(async () => {
    installBootRoutes();
    await seedGuestSession();
    await seedBasket();
  }, BOOT_BUDGET);

  beforeEach(() => {
    installBootRoutes();
  });

  afterEach(unmountPages);

  it(
    "hands the layout the brand's own template and every block develop fills",
    async () => {
      const wrapper = await openSetup();

      expect(templateOf(wrapper)).toBe(recordedTemplate);
      expect(slotsOf(wrapper)).toEqual(expect.arrayContaining(DEVELOP_BLOCKS));
    },
    BOOT_BUDGET
  );

  it(
    "draws the form, the hero, the count of products left and the way on, each in its own frame",
    async () => {
      const wrapper = await openSetup();

      expect(
        inFrame(wrapper, "configuration").find("#setup-form").exists()
      ).toBe(true);
      expect(inFrame(wrapper, "content-header").find(HERO_TITLE).exists()).toBe(
        true
      );
      expect(inFrame(wrapper, "progress").text()).toContain(
        "cart.product_setup_count"
      );
      expect(inFrame(wrapper, "actions").text()).toContain(
        "action.continue_label"
      );
    },
    BOOT_BUDGET
  );

  it(
    "puts the page's own slot in place of its block, and keeps every other block's",
    async () => {
      const wrapper = await openSetup({
        "content-header": () =>
          h("p", { "data-test-key": "page-header" }, "Page")
      });

      expect(
        inFrame(wrapper, "content-header")
          .find('[data-test-key="page-header"]')
          .exists()
      ).toBe(true);
      expect(wrapper.find(HERO_TITLE).exists()).toBe(false);
      expect(
        inFrame(wrapper, "configuration").find("#setup-form").exists()
      ).toBe(true);
    },
    BOOT_BUDGET
  );
});
