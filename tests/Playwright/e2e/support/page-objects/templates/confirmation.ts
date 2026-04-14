import { Page, Locator } from "@playwright/test";
import { kebabCase } from "../../helpers/strings";

export class Confirmation {
  readonly page: Page;
  readonly orderSummary: Locator;
  readonly orderDetails: Locator;
  readonly detailsRowPrice: Locator;
  readonly detailsRowQty: Locator;
  readonly detailsRowTotal: Locator;
  readonly invoiceNumberHeading: Locator;
  readonly invoiceNumber: Locator;
  readonly orderDateHeading: Locator;
  readonly orderDate: Locator;
  readonly orderPaymentMethodHeading: Locator;
  readonly orderPaymentMethod: Locator;

  constructor(page: Page) {
    this.page = page;
    this.orderSummary = page.getByTestId("section-order-summary");
    this.orderDetails = page.getByTestId("section-your-order");
    this.detailsRowPrice = this.orderDetails.getByTestId("price");
    this.detailsRowQty = this.orderDetails.getByTestId("qty");
    this.detailsRowTotal = this.orderDetails.getByTestId("total");
    this.invoiceNumberHeading = page
      .getByTestId("description-list-item-order")
      .locator("dt");
    this.invoiceNumber = page
      .getByTestId("description-list-item-order")
      .locator("dd");
    this.orderDateHeading = page
      .getByTestId("description-list-item-purchase-date")
      .locator("dt");
    this.orderDate = page
      .getByTestId("description-list-item-purchase-date")
      .locator("dd");
    this.orderPaymentMethodHeading = page
      .getByTestId("description-list-item-payment-method")
      .locator("dt");
    this.orderPaymentMethod = page
      .getByTestId("description-list-item-payment-method")
      .locator("dd");
  }
  async productNameVisible(productName: string) {
    return this.page.getByTestId(`item-${kebabCase(productName)}`).isVisible();
  }
}
