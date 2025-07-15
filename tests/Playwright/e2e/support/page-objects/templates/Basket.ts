import { Page, Locator } from "@playwright/test";

export class Basket {
  readonly page: Page;
  readonly basketProduct: Locator;
  readonly basketProductSummary: Locator;
  readonly subtotalSummary: Locator;
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
    this.promotionForm = page.getByTestId("promotions-form");
    this.addPromo = this.subtotalSummary.getByTestId("link");
    this.promoInput = this.promotionForm.getByTestId("text-input");
    this.applyPromo = this.promotionForm.getByTestId("button-apply");
    this.promoMessage = this.promotionForm.getByTestId("form-message");
    this.promoBadge = page.getByTestId("badge");
    this.proceedToCheckout = page.getByTestId("button-proceed-to-checkout");
  }

  enterPromoCode(promoCode: string | null) {
    const promotionForm = this.page.getByTestId("promotions-form");
    this.page.getByText("Add a voucher").click();
    promotionForm.getByTestId("text-input").fill(`${promoCode}`);
    promotionForm.getByTestId("button-apply").click();
  }

  expandConfigurations() {
    this.page.getByRole("link", { name: "Expand all configurations" });
  }
}
