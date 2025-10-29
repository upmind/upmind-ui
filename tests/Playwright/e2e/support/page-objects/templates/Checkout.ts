import { Page, expect, Locator } from "@playwright/test";
export class Checkout {
  readonly page: Page;
  readonly addressSearch: Locator;
  readonly addressFormMessage: Locator;
  readonly addressRegionMessage: Locator;
  readonly companyFormMessage: Locator;
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
  readonly placeOrderButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.billingDetails = page.getByTestId("billing");
    this.addressSearch = this.billingDetails.getByTestId(
      "input-address-search-search"
    );
    this.addressFormMessage = page.getByTestId("form-item-message-address");
    this.addressRegionMessage = page.getByTestId(
      "form-item-message-address-regionId"
    );
    this.companyFormMessage = page.getByTestId(
      "form-item-message-company-name"
    );
    this.phone = this.billingDetails.getByTestId("form-item-phone-phone");
    this.addressManualEntry = page.getByTestId("link-enter-address-manually");
    this.addressLine1 = this.billingDetails.getByTestId("input-address-line1");
    this.addressLine2 = this.billingDetails.getByTestId("input-address-line2");
    this.city = this.billingDetails.getByTestId("input-address-level2");
    this.postCode = this.billingDetails.getByTestId("input-postal-code");
    this.phoneRegion = this.phone.getByTestId("popover-trigger");
    this.phoneInput = this.phone.getByTestId("text-input");
    this.saveDetails = page.getByTestId("button-save-details");
    this.dialogWindow = page.getByTestId("dialog-window");
    this.placeOrderButton = page.getByTestId("button-place-order-and-pay");
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
    //await this.addressLine2.fill(addressLine2);
    await this.city.fill(city);
    await this.postCode.fill(postCode);
    if (phoneInput != null) {
      await this.phoneInput.fill(phoneInput);
    }
    await this.saveDetails.click();
  }

  async selectPaymentMethod(method: string) {
    const button = this.page.getByTestId("accordion-trigger").getByText(method);
    await button.click();
  }

  async clickPlaceOrderButton() {
    const placeOrderButton = this.page.getByTestId(
      "button-place-order-and-pay"
    );
    //await placeOrderButton.waitFor({ state: 'attached' });
    await expect(placeOrderButton).toBeEnabled();
    await placeOrderButton.click();
  }

  async inputStripeDetails(
    cardNumber: string,
    expiryDate: string,
    cvcCode: string
  ) {
    const stripeFrame = this.page.frameLocator(
      'iframe[title="Secure payment input frame"]'
    );
    await stripeFrame.locator('input[name="number"]').fill(`${cardNumber}`);
    await stripeFrame.locator('input[name="expiry"]').fill(`${expiryDate}`);
    await stripeFrame.locator('input[name="cvc"]').fill(`${cvcCode}`);
    await stripeFrame.locator('input[name="postalCode"]').fill("SW1A 2AB");
  }
}
