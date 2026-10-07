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
 * form's actions anchor. The page hiding the hero removes that slot, a slot the
 * page writes on its layout replaces only that slot's content, and the layout's
 * back and content options draw the back link and shape the form.
 *
 * ## What Breaks If These Fail
 * A client reaching billing gets no form or no way to submit it, a hidden hero
 * still takes its place, a page override pushes out the content around it, or
 * the inset billing page loses its back link or its in-place editing.
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { h } from "vue";
import { Hero } from "@upmind-automation/foundation";
import { UpmBilling, UpmBillingForm } from "../index";
import {
  BOOT_BUDGET,
  inFrame,
  layoutFor,
  mountPage,
  seedClientBasket,
  slotsOf,
  templateOf,
  unmountPages
} from "./mount-page";
import {
  installClientRoutes,
  recordedClaimedBasketId,
  recordedClient,
  recordedTemplate
} from "./recorded-pool";
import { concat } from "lodash-es";
import type { PageWrapper, SlotOptions } from "./mount-page";
import type { RawSlots } from "vue";

// -----------------------------------------------------------------------------

const DEVELOP_BLOCKS = ["hero", "back", "content", "content-footer"];

const LAYOUT_BLOCKS = concat(DEVELOP_BLOCKS, "markdown");

const BACK_LINK = '[data-test-key="link"]';

const drawsForm = (wrapper: PageWrapper) =>
  wrapper.findComponent(UpmBillingForm).exists();

const openBilling = (options?: {
  hideSlots?: string[];
  overrides?: RawSlots;
  slotOptions?: SlotOptions;
}) =>
  mountPage({
    organism: UpmBilling,
    props: { hideSlots: options?.hideSlots },
    layout: layoutFor(LAYOUT_BLOCKS, options?.slotOptions),
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
    "hands the layout the brand's own template and every block develop fills",
    async () => {
      const wrapper = await openBilling();

      expect(templateOf(wrapper)).toBe(recordedTemplate);
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

  it(
    "draws the back link only when the layout asks for it",
    async () => {
      const plain = await openBilling();
      expect(drawsForm(plain)).toBe(true);
      expect(inFrame(plain, "back").find(BACK_LINK).exists()).toBe(false);
      unmountPages();

      const withBack = await openBilling({
        slotOptions: { back: { showBack: true } }
      });
      expect(inFrame(withBack, "back").find(BACK_LINK).exists()).toBe(true);
      expect(inFrame(withBack, "back").text()).toContain("action.back");
    },
    BOOT_BUDGET
  );

  it(
    "hands the form an inline, uncarded, stepped layout until the layout says otherwise",
    async () => {
      const plain = await openBilling();
      expect(
        inFrame(plain, "content").findComponent(UpmBillingForm).props()
      ).toMatchObject({ card: false, inline: true, inlineEditing: false });
      unmountPages();

      const inset = await openBilling({
        slotOptions: {
          content: { card: true, inline: false, inlineEditing: true }
        }
      });
      expect(
        inFrame(inset, "content").findComponent(UpmBillingForm).props()
      ).toMatchObject({ card: true, inline: false, inlineEditing: true });
    },
    BOOT_BUDGET
  );
});
