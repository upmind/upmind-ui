import { Page, expect, Frame, Locator } from "@playwright/test";
export class Checkout {
  readonly page: Page;
  readonly addressSearch: Locator;
  readonly addressFormMessage: Locator;
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
  readonly dialogWindow: Locator;

  constructor(page: Page) {
    this.page = page;
    this.billingDetails = page.getByTestId("billing");
    this.addressSearch = this.billingDetails.getByTestId("form-field-address");
    this.addressFormMessage = page.getByTestId("form-item-message-address");
    this.phone = this.billingDetails.getByTestId("form-item-phone2");
    this.addressManualEntry = page.getByTestId("enter-address-manually-link");
    this.addressLine1 = this.billingDetails.getByTestId("form-item-address1");
    this.addressLine2 = this.billingDetails.getByTestId("form-item-address2");
    this.city = this.billingDetails.getByTestId("form-item-city");
    this.postCode = this.billingDetails.getByTestId("form-item-postcode");
    this.phoneRegion = this.phone.getByTestId("popover-trigger");
    this.phoneInput = this.phone.getByTestId("text-input");
    this.saveDetails = page.getByTestId("button-save-details");
    this.dialogWindow = page.getByTestId("dialog-window");
  }

  async manuallyInputAddress(
    addressLine1: string,
    addressLine2: string,
    city: string,
    postCode: string,
    phoneInput: string | null
  ) {
    await this.addressManualEntry.waitFor();
    await this.addressManualEntry.click();
    await this.addressLine1.fill(addressLine1);
    await this.addressLine2.fill(addressLine2);
    await this.city.fill(city);
    await this.postCode.fill(postCode);
    if (phoneInput) {
      await this.phoneInput.fill(phoneInput);
    }
    await this.saveDetails.click();
  }

  async selectPaymentMethod(method: string) {
    const button = this.page.locator("button", {
      has: this.page.locator("h5", { hasText: method })
    });
    await button.click();
  }

  async clickPlaceOrderButton() {
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

  async inputStripeDetails(
    cardNumber: string,
    expiryDate: string,
    cvcCode: string
  ) {
    const stripeFrame = await this.getStripeIframe();
    await stripeFrame.fill('input[name="number"]', `${cardNumber}`);
    await stripeFrame.fill('input[name="expiry"]', `${expiryDate}`);
    await stripeFrame.fill('input[name="cvc"]', `${cvcCode}`);
    await stripeFrame.fill('input[name="postalCode"]', "SW1A 2AB");
  }

  // async payWithStripeCard(
  //   cardNumber: string,
  //   expiryDate: string,
  //   cvcCode: string
  // ) {
  //   await this.page.click('button:has-text("Stripe Payment")');
  //   const stripeFrame = await this.getStripeIframe();
  //   await stripeFrame.fill('input[name="number"]', `${cardNumber}`);
  //   await stripeFrame.fill('input[name="expiry"]', `${expiryDate}`);
  //   await stripeFrame.fill('input[name="cvc"]', `${cvcCode}`);
  //   await stripeFrame.fill('input[name="postalCode"]', "SW1A 2AB");

  //   const placeOrderButton = this.page.getByTestId(
  //     "button-place-order-and-pay"
  //   );
  //   await placeOrderButton.waitFor({ state: "attached" });
  //   await expect(placeOrderButton).toBeEnabled();

  //   await placeOrderButton.click();
  // }
}
