import { Page, Locator, expect } from "@playwright/test";

export class Basket {
  readonly page: Page;
  readonly basketProduct: Locator;
  readonly basketProductSummary: Locator;
  readonly subtotalSummary: Locator;
  readonly summaryFooter: Locator;
  readonly promotionForm: Locator;
  readonly addPromo: Locator;
  readonly promoInput: Locator;
  readonly applyPromo: Locator;
  readonly promoMessage: Locator;
  readonly promoBadge: Locator;
  readonly showDetails: Locator;
  readonly proceedToCheckout: Locator;

  constructor(page: Page) {
    this.page = page;
    this.basketProduct = page.getByTestId("basket-product");
    this.basketProductSummary = page.getByTestId("basket-product-summary");
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
    this.showDetails = page.getByTestId("tooltip-trigger");
    this.proceedToCheckout = page.getByTestId("button-proceed-to-checkout");
  }

  async enterPromoCode(promoCode: string | null) {
    await expect(this.proceedToCheckout).toBeEnabled();
    await this.addPromo.click();
    await this.promoInput.fill(`${promoCode}`);
    await this.promotionForm.getByTestId("button-apply").click();
  }

  expandConfigurations() {
    this.page.getByRole("link", { name: "Expand all configurations" });
  }

  async clickShowDetails() {
    await this.showDetails.nth(1).click();
  }
}
