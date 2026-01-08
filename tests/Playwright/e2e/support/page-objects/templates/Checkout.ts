import { Page, expect, Locator } from "@playwright/test";
import { kebabCase } from "../../utils/functions/helpers";
import { TextInput } from "../components/TextInput";
import { selectRadixRadio } from "../../utils/radixRadios";

export class Checkout {
  readonly page: Page;
  readonly checkoutContent: Locator;
  readonly addressSearch: Locator;
  readonly addressFormMessage: Locator;
  readonly addressRegionMessage: Locator;
  readonly companyFormMessage: Locator;
  readonly phone: Locator;
  readonly addressManualEntry: Locator;
  readonly billingDetails: Locator;
  readonly addressCard: Locator;
  readonly addressLine1: Locator;
  readonly addressLine2: Locator;
  readonly city: Locator;
  readonly postCode: Locator;
  readonly phoneInput: Locator;
  readonly phoneRegion: Locator;
  readonly paymentDetails: Locator;
  readonly saveDetails: Locator;
  readonly addVoucherForm: Locator;
  readonly addVoucherButton: Locator;
  readonly addVoucherInput: Locator;
  readonly applyVoucherButton: Locator;
  readonly dialogWindow: Locator;
  readonly placeOrderAndPay: Locator;
  readonly placeOrder: Locator;
  readonly payAmount: Locator;
  readonly changeAmountButton: Locator;
  readonly changeAmountForm: Locator;
  readonly changeAmountInput: Locator;
  readonly changeAmountIncrement: Locator;
  readonly changeAmountDecrement: Locator;
  readonly confirmAmountButton: Locator;
  private readonly textInputComponent: TextInput;

  constructor(page: Page) {
    this.page = page;
    this.textInputComponent = new TextInput(page);

    this.checkoutContent = page.getByTestId("checkout-content");
    this.billingDetails = page.getByTestId("billing");
    this.addressCard = page.getByTestId("radio-card-change");
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
    this.addressLine1 = this.billingDetails.getByTestId(
      "input-properties-address-1"
    );
    this.addressLine2 = this.billingDetails.getByTestId(
      "input-properties-address-2"
    );
    this.city = this.billingDetails.getByTestId("input-properties-city");
    this.postCode = this.billingDetails.getByTestId(
      "input-properties-region-id"
    );
    this.phoneRegion = this.phone.getByTestId("popover-trigger");
    this.phoneInput = this.textInputComponent.getTextInputField(this.phone);
    this.paymentDetails = page.getByTestId("payment-details");
    this.saveDetails = page.getByTestId("button-save-details");
    this.addVoucherForm = page.getByTestId("form-item-promocode");
    this.addVoucherButton = page.getByTestId("link-add-a-voucher-code");
    this.addVoucherInput = this.textInputComponent.getTextInputField(
      this.addVoucherForm
    );
    this.applyVoucherButton = page.getByTestId("button-apply");
    this.dialogWindow = page.getByTestId("dialog-window");
    this.placeOrderAndPay = page.getByTestId("button-place-order-and-pay");
    this.placeOrder = page.getByTestId("button-place-order");
    this.payAmount = page
      .getByTestId("payment-details")
      .getByRole("heading", { level: 4 });
    this.changeAmountButton = page.getByTestId("change-amount");
    this.changeAmountForm = page.getByTestId("form-item-amount");
    this.changeAmountInput =
      this.changeAmountForm.getByTestId("number-field-input");
    this.changeAmountIncrement = this.changeAmountForm.getByTestId(
      "number-field-increment"
    );
    this.changeAmountDecrement = this.changeAmountForm.getByTestId(
      "number-field-decrement"
    );
    this.confirmAmountButton = page.getByTestId("button-confirm-amount");
  }

  async manuallyInputAddress(
    addressLine1: string,
    addressLine2: string,
    city: string,
    postCode: string,
    phoneInput: string | null
  ) {
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

  async selectPaymentMethod(gatewayName: string) {
    await this.page.getByTestId("link-show-more-options").click();
    await selectRadixRadio(this.page, {
      testId: `radio-card-${kebabCase(gatewayName)}`
    });
  }

  async clickPlaceOrderAndPay() {
    const placeOrderButton = this.placeOrderAndPay;
    await expect(placeOrderButton).toBeEnabled();
    await placeOrderButton.click();
  }

  async clickPlaceOrder() {
    const placeOrderButton = this.placeOrder;
    await expect(placeOrderButton).toBeEnabled();
    await placeOrderButton.click();
  }

  async clickConfirmAmount() {
    await this.confirmAmountButton.click({
      force: true,
      noWaitAfter: true
    });
    await expect(this.page.getByTestId("dialog-window")).toHaveAttribute(
      "data-state",
      "closed"
    );
  }

  async inputStripeDetails(
    cardNumber: string,
    expiryDate: string,
    cvcCode: string
  ) {
    const stripeFrame = this.page.frameLocator(
      'iframe[title="Secure payment input frame"]'
    );
    await stripeFrame
      .getByRole("textbox", { name: "Card number" })
      .fill(cardNumber);
    await stripeFrame
      .getByRole("textbox", { name: "Expiration date" })
      .fill(expiryDate);
    await stripeFrame.getByRole("textbox", { name: "CVC" }).fill(cvcCode);
    await stripeFrame
      .getByRole("textbox", { name: "ZIP code" })
      .fill("SW1A 2AB");
  }

  async inputSepaDetails(iban: string, email: string, fullName: string) {
    const stripeFrame = this.page.frameLocator(
      'iframe[title="Secure payment input frame"]'
    );
    await stripeFrame.getByRole("button").getByText("SEPA Debit").click();
    await stripeFrame.getByRole("textbox", { name: "iban" }).fill(iban);
  }

  async interceptPaymentResponse() {
    const paymentsResponse: Array<{
      url: string;
      status: number;
      headers: Record<string, string>;
      body: any;
    }> = [];

    await this.page.route("**/api/payments", async route => {
      const response = await route.fetch();
      const body = await response.json().catch(() => null);
      paymentsResponse.push({
        url: response.url(),
        status: response.status(),
        headers: response.headers(),
        body
      });
      await route.fulfill({
        response
      });
    });
    console.log(`Payment Response = ${paymentsResponse}`);
    return paymentsResponse;
  }
}
