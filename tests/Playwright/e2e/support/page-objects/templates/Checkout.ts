import { Page, expect, Frame, Locator } from "@playwright/test";
export class Checkout {
  readonly page: Page;
  readonly addressSearch: Locator;
  readonly phone: Locator;
  readonly addressManualEntry: Locator;
  readonly billingDetails: Locator;
  readonly addressLine1: Locator;
  readonly addressLine2: Locator;
  readonly city: Locator;
  readonly postCode: Locator;
  readonly phoneInput: Locator;
  readonly phoneRegion: Locator;
  readonly saveDetails: Locator;

  constructor(page: Page) {
    this.page = page;
    this.billingDetails = page.getByTestId("billing");
    this.addressSearch = this.billingDetails.getByTestId("form-field-address");
    this.phone = this.billingDetails.getByTestId("form-item-input-phone2");
    this.addressManualEntry = this.billingDetails.getByText(
      "Enter address manually"
    );
    this.addressLine1 = this.billingDetails.getByTestId(
      "form-item-input-address1"
    );
    this.addressLine2 = this.billingDetails.getByTestId(
      "form-item-input-address2"
    );
    this.city = this.billingDetails.getByTestId("form-item-input-city");
    this.postCode = this.billingDetails.getByTestId("form-item-input-postcode");
    this.phoneRegion = this.phone.getByTestId("popover-trigger");
    this.phoneInput = this.phone.getByTestId("text-input");
    this.saveDetails = page.getByTestId("button-save-details");
  }

  async manuallyInputAddress(
    addressLine1: string,
    addressLine2: string,
    city: string,
    postCode: string,
    phoneInput: string
  ) {
    await this.addressManualEntry.click();
    await this.addressLine1.fill(addressLine1);
    await this.addressLine2.fill(addressLine2);
    await this.city.fill(city);
    await this.postCode.fill(postCode);
    await this.phoneInput.fill(phoneInput);
    await this.saveDetails.click();
  }

  async inputStripeDetails(
    cardNumber: string,
    expiryDate: string,
    cvcCode: string
  ) {
    await this.page.click('button:has-text("Stripe Payment")');
    const stripeFrame = await this.getStripeIframe();
    await stripeFrame.fill('input[name="number"]', `${cardNumber}`);
    await stripeFrame.fill('input[name="expiry"]', `${expiryDate}`);
    await stripeFrame.fill('input[name="cvc"]', `${cvcCode}`);
    await stripeFrame.fill('input[name="postalCode"]', "SW1A 2AB");
  }

  async payWithExistingMethod() {
    const placeOrderButton = this.page.locator(
      'button:has-text("Place order and pay")'
    );
    await placeOrderButton.waitFor({ state: "attached" });
    await expect(placeOrderButton).toBeEnabled();

    await placeOrderButton.click();
  }

  async payWithStripeCard(
    cardNumber: string,
    expiryDate: string,
    cvcCode: string
  ) {
    await this.page.click('button:has-text("Stripe Payment")');
    const stripeFrame = await this.getStripeIframe();
    await stripeFrame.fill('input[name="number"]', `${cardNumber}`);
    await stripeFrame.fill('input[name="expiry"]', `${expiryDate}`);
    await stripeFrame.fill('input[name="cvc"]', `${cvcCode}`);
    await stripeFrame.fill('input[name="postalCode"]', "SW1A 2AB");

    const placeOrderButton = this.page.getByTestId(
      "button-place-order-and-pay"
    );
    await placeOrderButton.waitFor({ state: "attached" });
    await expect(placeOrderButton).toBeEnabled();

    await placeOrderButton.click();
  }

  async getStripeIframe(): Promise<Frame> {
    const iframeElement = await this.page.waitForSelector(
      'iframe[name^="__privateStripeFrame"]'
    );
    const frame = await iframeElement.contentFrame();
    if (!frame) throw new Error("Stripe iframe not found");
    return frame;
  }

  async payWithOfflinePayment() {
    await this.page.click('button:has-text("Offline Payment")');
    const placeOrderButton = this.page.getByTestId("button-place-order");
    await placeOrderButton.waitFor({ state: "attached" });
    await expect(placeOrderButton).toBeEnabled();

    await placeOrderButton.click();
  }

  async payWithBankTransfer() {
    await this.page.click('button:has-text("Direct Bank Transfer")');
    const placeOrderButton = this.page.getByTestId("button-place-order");
    await placeOrderButton.waitFor({ state: "attached" });
    await expect(placeOrderButton).toBeEnabled();

    await placeOrderButton.click();
  }

  async payWithMicropayment() {
    await this.page.click('button:has-text("Micropayments")');
    const placeOrderButton = this.page.getByTestId(
      "button-place-order-and-pay"
    );
    await placeOrderButton.waitFor({ state: "attached" });
    await expect(placeOrderButton).toBeEnabled();

    await placeOrderButton.click();
  }
}
