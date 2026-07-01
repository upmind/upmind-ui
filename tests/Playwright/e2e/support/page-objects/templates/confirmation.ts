import { Page, Locator, expect } from "@playwright/test";

export class Confirmation {
  readonly page: Page;
  readonly orderSummary: Locator;
  readonly orderDetails: Locator;
  readonly detailsRowPrice: Locator;
  readonly detailsRowQty: Locator;
  readonly detailsRowTotal: Locator;
  readonly invoiceNumberRow: Locator;
  readonly invoiceNumberHeading: Locator;
  readonly invoiceNumber: Locator;
  readonly orderDateRow: Locator;
  readonly orderDateHeading: Locator;
  readonly orderDate: Locator;
  readonly orderPaymentMethodRow: Locator;
  readonly orderPaymentMethodHeading: Locator;
  readonly orderPaymentMethod: Locator;

  constructor(page: Page) {
    this.page = page;
    // The singular <Section> wrapper renders a non-discriminating
    // `section-section` testid (FE-2874 keyed section testids off the page-level
    // `Sections` value, which the singular wrapper hardcodes to "section"), so
    // scope the order regions by their stable explicit anchors instead: the
    // order-products table (`#order-products`) and the confirmation heading.
    this.orderSummary = page.getByTestId("order-confirmation-heading");
    this.orderDetails = page.locator("#order-products");
    this.detailsRowPrice = this.orderDetails.getByTestId("price");
    this.detailsRowQty = this.orderDetails.getByTestId("qty");
    this.detailsRowTotal = this.orderDetails.getByTestId("total");
    // Order.vue tags each confirmation summary row with an explicit testid via
    // DescriptionList `item.dataAttrs`; that wrapper div carries the stable
    // data-test-value, the term/value are the structural dt/dd inside it.
    this.invoiceNumberRow = page.getByTestId("confirmation-invoice-number");
    this.invoiceNumberHeading = this.invoiceNumberRow.locator("dt");
    this.invoiceNumber = this.invoiceNumberRow.locator("dd");
    this.orderDateRow = page.getByTestId("confirmation-order-date");
    this.orderDateHeading = this.orderDateRow.locator("dt");
    this.orderDate = this.orderDateRow.locator("dd");
    this.orderPaymentMethodRow = page.getByTestId(
      "confirmation-order-payment-method"
    );
    this.orderPaymentMethodHeading = this.orderPaymentMethodRow.locator("dt");
    this.orderPaymentMethod = this.orderPaymentMethodRow.locator("dd");
  }

  /**
   * The order number is server-generated per run, so the value is not known at
   * authoring time; assert the row's stable data-test-value carries the same
   * number that is rendered to the user (the displayed dd text).
   */
  async expectInvoiceNumberValue() {
    const displayed = (await this.invoiceNumber.textContent())?.trim();
    expect(displayed).toBeTruthy();
    await expect(this.invoiceNumberRow).toHaveAttribute(
      "data-test-value",
      displayed as string
    );
  }

  /**
   * The purchase date is server-generated per run; assert the row's stable
   * data-test-value carries the same date string rendered to the user.
   */
  async expectOrderDateValue() {
    const displayed = (await this.orderDate.textContent())?.trim();
    expect(displayed).toBeTruthy();
    await expect(this.orderDateRow).toHaveAttribute(
      "data-test-value",
      displayed as string
    );
  }

  /**
   * @param last4 - Stored-card last four digits; the visible copy is the
   *   translated "Visa ending 4242", the stable value is the bare last4.
   */
  async expectPaymentMethodLast4(last4: string) {
    await expect(this.orderPaymentMethodRow).toHaveAttribute(
      "data-test-value",
      last4
    );
  }

  /**
   * @param qty - Expected quantity on the first (main) product row.
   */
  async expectFirstRowQty(qty: string) {
    await expect(this.detailsRowQty.first()).toHaveAttribute(
      "data-test-value",
      qty
    );
  }

  /**
   * @param price - Expected formatted unit price on the first product row.
   */
  async expectFirstRowPriceValue(price: string) {
    await expect(this.detailsRowPrice.first()).toHaveAttribute(
      "data-test-value",
      price
    );
  }

  /**
   * When the unit price is altered by a promotion (not known at authoring
   * time), assert the first row's data-test-value carries the same formatted
   * price that is rendered to the user.
   */
  async expectFirstRowPriceMatchesDisplay() {
    const row = this.detailsRowPrice.first();
    const displayed = (await row.textContent())?.trim();
    expect(displayed).toBeTruthy();
    await expect(row).toHaveAttribute("data-test-value", displayed as string);
  }

  /**
   * @param productId - Stable product id; OrderProductsRow tags each row
   *   `item-${row.id}`, NOT a kebab of the translated product title.
   */
  async productNameVisible(productId: string) {
    return this.page.getByTestId(`item-${productId}`).isVisible();
  }
}
