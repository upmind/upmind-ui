import { Page, Locator } from "@playwright/test";

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
  readonly proceedToCheckout: Locator;

  constructor(page: Page) {
    this.page = page;
    this.basketProduct = page.getByTestId("basket-product");
    this.basketProductSummary = page.getByTestId("basket-product-summary");
    this.subtotalSummary = page.getByTestId("card-container-summary");
    this.summaryFooter = page.getByTestId("summary-footer");
    this.promotionForm = page.getByTestId("promotions-form");
    this.addPromo = page.getByTestId("add-a-voucher-linklink");
    this.promoInput = this.promotionForm.getByTestId("form-item-promocode");
    this.applyPromo = this.promotionForm.getByTestId("button-apply");
    this.promoMessage = this.promotionForm.getByTestId(
      "form-item-message-promocode"
    );
    this.promoBadge = this.summaryFooter.getByTestId("badge");
    this.proceedToCheckout = page.getByTestId("button-proceed-to-checkout");
  }

  async enterPromoCode(promoCode: string | null) {
    const promotionForm = this.page.getByTestId("promotions-form");
    await this.page.getByTestId("add-a-voucher-link").click();
    await promotionForm.getByTestId("form-item-promocode").fill(`${promoCode}`);
    await promotionForm.getByTestId("button-apply").click();
  }

  expandConfigurations() {
    this.page.getByRole("link", { name: "Expand all configurations" });
  }
}
