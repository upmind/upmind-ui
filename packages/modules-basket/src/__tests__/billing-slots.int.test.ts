// @vitest-environment happy-dom
// Not jsdom: node's undici fetch rejects jsdom's AbortSignal (vitest #8374).
// -----------------------------------------------------------------------------
/**
 * @fileoverview The billing page's layout gets the organism's develop blocks
 *
 * ## Job To Be Done
 * On the billing route, the page's self-closing layout for the template it is
 * handed gets `UpmBilling`'s own content in every slot develop fills for a
 * signed-in client's basket: the hero, the back link, the billing form and the
 * form's actions anchor. The page hiding the hero removes that slot, and a slot
 * the page writes on its layout replaces only that slot's content.
 *
 * ## What Breaks If These Fail
 * A client reaching billing gets no form or no way to submit it, a hidden hero
 * still takes its place, or a page override pushes out the content around it.
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { h } from "vue";
import { Hero } from "@upmind-automation/foundation";
import { BILLING_TEMPLATE, UpmBilling, UpmBillingForm } from "../index";
import {
  BOOT_BUDGET,
  inFrame,
  layoutOf,
  layoutsFor,
  mountPage,
  seedClientBasket,
  slotsOf,
  unmountPages
} from "./mount-page";
import {
  installClientRoutes,
  recordedClaimedBasketId,
  recordedClient
} from "./recorded-pool";
import { values } from "lodash-es";
import type { PageWrapper } from "./mount-page";
import type { RawSlots } from "vue";

// -----------------------------------------------------------------------------

const DEVELOP_BLOCKS = ["hero", "back", "content", "content-footer"];

const BILLING_LAYOUTS = layoutsFor(BILLING_TEMPLATE, [
  ...DEVELOP_BLOCKS,
  "markdown"
]);

const drawsForm = (wrapper: PageWrapper) =>
  wrapper.findComponent(UpmBillingForm).exists();

const openBilling = (options?: {
  hideSlots?: string[];
  overrides?: RawSlots;
}) =>
  mountPage({
    organism: UpmBilling,
    props: { hideSlots: options?.hideSlots },
    layouts: BILLING_LAYOUTS,
    path: "/order/billing",
    until: drawsForm,
    overrides: options?.overrides
  });

// -----------------------------------------------------------------------------

describe("the billing page's layout, for the recorded client's basket", () => {
  beforeAll(async () => {
    installClientRoutes();
    await seedClientBasket(recordedClient, recordedClaimedBasketId as string);
  }, BOOT_BUDGET);

  beforeEach(() => {
    installClientRoutes();
  });

  afterEach(unmountPages);

  it(
    "hands the layout every block develop fills",
    async () => {
      const wrapper = await openBilling();

      expect(values(BILLING_TEMPLATE)).toContain(layoutOf(wrapper));
      expect(slotsOf(wrapper)).toEqual(expect.arrayContaining(DEVELOP_BLOCKS));
    },
    BOOT_BUDGET
  );

  it(
    "draws the hero, the billing form and its actions anchor, each in its own frame",
    async () => {
      const wrapper = await openBilling();

      expect(inFrame(wrapper, "hero").findComponent(Hero).exists()).toBe(true);
      expect(
        inFrame(wrapper, "content").findComponent(UpmBillingForm).exists()
      ).toBe(true);
      expect(
        inFrame(wrapper, "content-footer").find("#billing-actions").exists()
      ).toBe(true);
    },
    BOOT_BUDGET
  );

  it(
    "hands no hero when the page hides it",
    async () => {
      const wrapper = await openBilling({ hideSlots: ["hero"] });

      expect(drawsForm(wrapper)).toBe(true);
      expect(slotsOf(wrapper)).not.toContain("hero");
      expect(wrapper.findComponent(Hero).exists()).toBe(false);
    },
    BOOT_BUDGET
  );

  it(
    "puts the page's own slot in place of its block, and keeps every other block's",
    async () => {
      const wrapper = await openBilling({
        overrides: {
          hero: () => h("p", { "data-test-key": "page-hero" }, "Page")
        }
      });

      expect(
        inFrame(wrapper, "hero").find('[data-test-key="page-hero"]').exists()
      ).toBe(true);
      expect(inFrame(wrapper, "hero").findComponent(Hero).exists()).toBe(false);
      expect(
        inFrame(wrapper, "content").findComponent(UpmBillingForm).exists()
      ).toBe(true);
    },
    BOOT_BUDGET
  );
});
