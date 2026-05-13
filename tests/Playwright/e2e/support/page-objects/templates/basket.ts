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

  /* Upsells */
  readonly basketProductUpsell: Locator;

  constructor(page: Page) {
    this.page = page;
    this.basketProduct = page.getByTestId("basket-product");
    this.basketProductSummary = page.getByTestId("basket-product-summary");
    this.addMissingDataLink = page.getByTestId("link-add-missing-data");
    this.subtotalSummary = page.getByTestId("card-container-summary");
    this.summaryFooter = page.getByTestId("summary-footer");
    this.promotionForm = page.getByTestId("promotions-form");
    this.addPromo = page.getByTestId("link-add-a-voucher-code");
    this.promoInput = this.promotionForm
      .getByTestId("form-item-promocode")
      .locator("input");
    this.applyPromo = this.promotionForm.getByTestId("button-apply");
    this.promoMessage = this.promotionForm.getByTestId(
      "form-item-message-promocode"
    );
    this.promoBadge = this.summaryFooter.getByTestId("badge");
    this.proceedToCheckout = page.getByTestId("button-proceed-to-checkout");

    /* Trial */
    this.trialAlert = this.basketProductSummary.getByRole("alert");
    // Since FE-2654 the "Free Trial" label is rendered inside the header
    // hgroup (next to the title), not the footer alongside the price.
    this.trialPriceLabel = this.basketProductSummary.getByText("Free Trial");

    /* Upsells */
    this.basketProductUpsell = page.getByTestId("basket-product-upsell");
  }

  upsellTitle(upsell: Locator): Locator {
    return upsell.locator("strong").first();
  }

  upsellByTitle(title: string): Locator {
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
    await card.getByLabel("Product information").first().click();
  }
}
