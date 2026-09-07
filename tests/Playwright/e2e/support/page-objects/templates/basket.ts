import { Page, Locator, expect } from "@playwright/test";

export class Basket {
  readonly page: Page;
  readonly basketProduct: Locator;
  readonly basketProductSummary: Locator;
  readonly addMissingDataLink: Locator;
  readonly subtotalSummary: Locator;
  readonly summaryFooter: Locator;
  readonly promotionForm: Locator;
  readonly addPromo: Locator;
  readonly promoInput: Locator;
  readonly applyPromo: Locator;
  readonly promoMessage: Locator;
  readonly promoBadge: Locator;
  readonly proceedToCheckout: Locator;

  /* Trial */
  readonly trialAlert: Locator;
  readonly trialPriceLabel: Locator;

  /* Pricing / renewal */
  readonly renewalTermLabel: Locator;
  readonly regularPrice: Locator;
  readonly trialRenewalPrice: Locator;

  /* Upsells */
  readonly basketProductUpsell: Locator;

  /* One-page order page ("Your Order") */
  readonly yourOrderCard: Locator;
  readonly quantityInput: Locator;
  readonly quantityIncrement: Locator;
  readonly termSelector: Locator;
  readonly summarySection: Locator;
  readonly basketTotalValue: Locator;

  constructor(page: Page) {
    this.page = page;
    this.basketProduct = page.getByTestId("basket-product");
    this.basketProductSummary = page.getByTestId("basket-product-summary");
    this.addMissingDataLink = page.getByTestId("link-add-missing-data");
    this.subtotalSummary = page
      .getByTestId("section")
      .and(page.locator(`[data-test-value="basket-summary"]`));
    this.summaryFooter = page.getByTestId("summary-footer");
    this.promotionForm = page.getByTestId("promotions-form");
    this.addPromo = page.getByTestId("link-add-a-voucher-code");
    this.promoInput = this.promotionForm
      .getByTestId("form-item")
      .and(page.locator(`[data-test-value="promocode"]`))
      .locator("input");
    this.applyPromo = this.promotionForm.getByTestId("button-apply");
    this.promoMessage = this.promotionForm
      .getByTestId("form-item-message")
      .and(page.locator(`[data-test-value="promocode"]`));
    this.promoBadge = this.summaryFooter.getByTestId("badge");
    this.proceedToCheckout = page.getByTestId("basket-checkout-button");

    /* Trial */
    this.trialAlert = this.basketProductSummary.getByTestId("trial-alert");
    // Since FE-2654 the "Free Trial" label is rendered inside the header
    // hgroup (next to the title), not the footer alongside the price.
    this.trialPriceLabel =
      this.basketProductSummary.getByTestId("trial-price-label");

    /* Pricing / renewal — `renewal-term-label` carries the stable renewal
     * cycle in `data-test-value`; `regular-price` carries the (pre-discount)
     * regular price amount in `data-test-value`. */
    this.renewalTermLabel =
      this.basketProductSummary.getByTestId("renewal-term-label");
    this.regularPrice = this.basketProductSummary.getByTestId("regular-price");
    // `trial-renewal-price` ("Usually £X.") carries the formatted post-trial
    // renewal price in `data-test-value`, separated from the translated copy.
    this.trialRenewalPrice = this.basketProductSummary.getByTestId(
      "trial-renewal-price"
    );

    /* Upsells */
    this.basketProductUpsell = page.getByTestId("basket-product-upsell");

    /* One-page order page ("Your Order") */
    // Sections.vue keys its heading `tab-${kebabCase(label)}` (the e2e contract
    // it declares; en run). BasketProducts titles the card `cart.your_order`
    // only under the one-page flow, so the key doubles as the flow marker.
    this.yourOrderCard = page.getByTestId("tab-your-order");
    this.quantityInput = this.basketProduct.getByTestId("number-field-input");
    this.quantityIncrement = this.basketProduct.getByTestId(
      "number-field-increment"
    );
    this.termSelector = this.basketProduct.getByTestId(
      "basket-product-term-selector"
    );
    // #basket-summary is a stable DOM id on the summary section of both the
    // basket/order page and the checkout page.
    this.summarySection = page.locator("#basket-summary");
    // The order page's server-priced total renders exactly once, but where and
    // under which label is a template decision (Basket.vue `:show-total` /
    // `#total` slot): two-column-rtl puts BasketTotal ("Basket total") in the
    // page footer and hides the summary's own; every other template shows it in
    // the summary — as "Total" in the itemised breakdown, as BasketTotal in the
    // plain totals. One label-pair regex over the page covers all three (en run).
    this.basketTotalValue = page
      .locator("dt", { hasText: /^(Basket total|Total)$/ })
      .locator("xpath=following-sibling::dd[1]");
  }

  /**
   * Opens the inline term selector (a design-system Select) and picks the
   * term by its stable cycle — Select.vue keys each item `select-item` with the
   * option value in data-test-value, never the translated label.
   */
  async selectTerm(cycle: number) {
    await this.termSelector.getByTestId("select-trigger").click();
    await this.page
      .getByTestId("select-item")
      .and(this.page.locator(`[data-test-value="${cycle}"]`))
      .click();
  }

  upsellTitle(upsell: Locator): Locator {
    return upsell.locator("strong").first();
  }

  upsellByTitle(title: string): Locator {
    // Gated dynamic-data read: scope to the upsell cards (explicit testid) and
    // disambiguate by the upsell PRODUCT title (the data under test), as no
    // stable per-upsell testid is rendered. `title` is product data, not chrome.
    return this.basketProductUpsell.filter({
      has: this.page.locator("strong").filter({ hasText: title })
    });
  }

  upsellAddButton(upsell: Locator): Locator {
    return upsell.getByTestId("button-add-option");
  }

  upsellAddedButton(upsell: Locator): Locator {
    return upsell.getByTestId("button-added");
  }

  upsellBenefits(title: string): Locator {
    return this.upsellByTitle(title)
      .locator("xpath=..")
      .getByTestId("product-benefits");
  }

  upsellBenefitItems(title: string): Locator {
    return this.upsellBenefits(title).getByRole("listitem");
  }

  async enterPromoCode(promoCode: string | null) {
    await expect(this.proceedToCheckout).toBeEnabled();
    await this.addPromo.click();
    await this.promoInput.fill(`${promoCode}`);
    await this.promotionForm.getByTestId("button-apply").click();
  }

  async clickShowDetails() {
    const card = this.basketProduct.first();
    await card.getByTestId("button-product-information").first().click();
  }
}
