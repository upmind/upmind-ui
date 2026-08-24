import type { Page } from "@playwright/test";
import { fakerEN_GB } from "@faker-js/faker";
import { newUser, expect } from "../../support/fixtures/auth-context";
import { URLs } from "../../support/constants/urls";
import {
  CONFIGURED_PRODUCT,
  SUMMARY_DETAILS_KEYS,
  VISIBILITY
} from "../../support/constants/summary-breakdown";
import {
  interceptConfigValues,
  interceptUISchema
} from "../../support/mocks/brand";
import { addProductViaHeadless } from "../../support/flows/basket-setup";
import { readSummaryProduct } from "../../support/flows/basket-summary-data";
import {
  BasketSummary,
  SUMMARY_LINE_KINDS
} from "../../support/page-objects/templates/basket-summary";

/**
 * @fileoverview FE-2943 — the promotion-code field the checkout step supplies.
 *
 * ## Job To Be Done
 * The checkout step passes its own promotion-code field to the summary as
 * trailing content AND sets the summary's own promotion flag from the same brand
 * setting. Whichever presentation the summary renders, the customer is offered
 * exactly one promotion-code field on the step: the trailing copy inside the
 * itemised presentation, the summary's own copy in the plain-totals one. Never
 * two, never none.
 *
 * Implements the checkout Scenarios of
 * `docs/sdd/FE-2943/summary-breakdown.feature`; capability ids are
 * docs/sdd/FE-2943/design.md's (C19, C20).
 *
 * ## What breaks if these fail
 * Trailing content dropped by the summary loses the checkout's promotion-code
 * field outright (no discount can be entered at checkout), and a field offered
 * by both channels at once shows the customer two.
 *
 * Both brand settings this depends on are SET per test — the presentation
 * (`@context.checkout.basketSummaryDetails`) and the field
 * (`ui.checkout.hide_promotions_field`, inverted) — and both branches of each
 * are covered.
 */

const seedConfiguredProduct = (page: Page) =>
  addProductViaHeadless(page, {
    productId: CONFIGURED_PRODUCT.id,
    quantity: 1,
    billingCycleMonths: CONFIGURED_PRODUCT.billingCycle,
    provisionFields: {
      domain: `${fakerEN_GB.string.alphanumeric({ length: { min: 6, max: 12 } })}.com`
    },
    options: {
      [CONFIGURED_PRODUCT.option.categoryId]: {
        [CONFIGURED_PRODUCT.option.valueId]: {
          productId: CONFIGURED_PRODUCT.option.valueId,
          cycle: CONFIGURED_PRODUCT.option.cycle,
          quantity: 1
        }
      }
    },
    attributes: {
      [CONFIGURED_PRODUCT.unpricedAttribute.categoryId]: {
        [CONFIGURED_PRODUCT.unpricedAttribute.valueId]: {
          productId: CONFIGURED_PRODUCT.unpricedAttribute.valueId,
          cycle: CONFIGURED_PRODUCT.unpricedAttribute.cycle,
          quantity: 1
        }
      }
    }
  });

newUser.describe("Checkout summary — the promotion-code field", () => {
  newUser.afterEach(async ({ page }) => {
    await page.unrouteAll({ behavior: "wait" });
  });

  // Scenario: The promotion-code field the checkout supplies appears inside the
  // itemised summary — C19, C20
  newUser(
    "The promotion-code field the checkout supplies appears inside the itemised summary",
    async ({ page, context }) => {
      const summary = new BasketSummary(page);

      // Given the brand shows itemised configuration details in the checkout summary
      interceptUISchema(context, {
        [SUMMARY_DETAILS_KEYS.CHECKOUT]: VISIBILITY.VISIBLE
      });
      // And the brand offers the promotion-code field at checkout
      await interceptConfigValues(page, { hidePromotionsAtCheckout: false });

      // And my basket contains that configured product
      const { basketProductId } = await seedConfiguredProduct(page);
      expect(basketProductId).toBeTruthy();

      // When I reach the checkout step
      await page.goto(URLs.checkout);
      await expect(summary.breakdown).toBeVisible({ timeout: 20000 });

      // Then the itemised summary CONTAINS the promotion-code field — trailing
      // content the caller supplied, rendered inside the summary rather than
      // dropped or rendered after it
      await expect(
        summary.breakdown.getByTestId("promotions-form")
      ).toHaveCount(1);

      // And exactly one promotion-code field is offered on the checkout step
      await expect(summary.promotionFormsOnStep).toHaveCount(1);
    }
  );

  // Scenario: The promotion-code field is still offered once when the checkout
  // summary shows plain totals — C20 (the other branch of the presentation)
  newUser(
    "The promotion-code field is still offered once when the checkout summary shows plain totals",
    async ({ page, context }) => {
      const summary = new BasketSummary(page);

      // Given the brand hides itemised configuration details in the checkout summary
      interceptUISchema(context, {
        [SUMMARY_DETAILS_KEYS.CHECKOUT]: VISIBILITY.HIDDEN
      });
      // And the brand offers the promotion-code field at checkout
      await interceptConfigValues(page, { hidePromotionsAtCheckout: false });

      // And my basket contains that configured product
      const { basketProductId } = await seedConfiguredProduct(page);
      expect(basketProductId).toBeTruthy();

      // When I reach the checkout step
      await page.goto(URLs.checkout);
      await expect(summary.section).toBeVisible({ timeout: 20000 });
      await expect(summary.totalsLists.first()).toBeVisible();

      // Then exactly one promotion-code field is offered on the checkout step
      await expect(summary.promotionFormsOnStep).toHaveCount(1);

      // And no itemised configuration breakdown is shown
      await expect(summary.breakdown).toHaveCount(0);
    }
  );

  // Scenario: No promotion-code field is offered at checkout when the brand
  // withholds it — C20 (the other branch of the promotion setting)
  newUser(
    "No promotion-code field is offered at checkout when the brand withholds it",
    async ({ page, context }) => {
      const summary = new BasketSummary(page);

      // Given the brand shows itemised configuration details in the checkout summary
      interceptUISchema(context, {
        [SUMMARY_DETAILS_KEYS.CHECKOUT]: VISIBILITY.VISIBLE
      });
      // And the brand does not offer the promotion-code field at checkout
      await interceptConfigValues(page, { hidePromotionsAtCheckout: true });

      // And my basket contains that configured product
      const { basketProductId } = await seedConfiguredProduct(page);
      expect(basketProductId).toBeTruthy();

      // When I reach the checkout step
      await page.goto(URLs.checkout);
      await expect(summary.breakdown).toBeVisible({ timeout: 20000 });

      // Then no promotion-code field is offered on the checkout step
      await expect(summary.promotionFormsOnStep).toHaveCount(0);

      // And the summary still itemises that product's configuration
      const served = await readSummaryProduct(page, basketProductId as string);
      const block = summary.productBlock(basketProductId as string);
      await expect(block).toBeVisible();
      await expect(
        summary.productLinesOfKind(block, SUMMARY_LINE_KINDS.TERM)
      ).toHaveCount(1);
      await expect(summary.productLines(block)).toHaveCount(
        1 + served.selections.options + served.selections.attributes
      );
    }
  );
});
