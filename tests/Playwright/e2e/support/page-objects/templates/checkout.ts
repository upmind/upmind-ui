import { Page, expect, Locator } from "@playwright/test";
import { kebabCase } from "../../helpers/strings";
import { TextInput } from "../components/text-input";

export class Checkout {
  readonly page: Page;
  readonly checkoutContent: Locator;
  readonly basketSummary: Locator;
  readonly addNewAddress: Locator;
  readonly addNewCompany: Locator;
  readonly addNewPhone: Locator;
  readonly addressSearch: Locator;
  readonly addressFormMessage: Locator;
  readonly addressRegionMessage: Locator;
  readonly companyFormMessage: Locator;
  readonly phone: Locator;
  readonly addressManualEntry: Locator;
  readonly billingDetails: Locator;
  readonly billingCards: Locator;
  readonly addressCard: Locator;
  readonly addressLine1: Locator;
  readonly addressLine2: Locator;
  readonly city: Locator;
  readonly postCode: Locator;
  readonly phoneInput: Locator;
  readonly phoneRegion: Locator;
  readonly paymentDetails: Locator;
  readonly expandPaymentDetails: Locator;
  readonly saveDetails: Locator;
  readonly addVoucherForm: Locator;
  readonly addVoucherButton: Locator;
  readonly addVoucherInput: Locator;
  readonly addVoucherMessage: Locator;
  readonly applyVoucherButton: Locator;
  readonly dialogWindow: Locator;
  readonly accountCredit: Locator;
  readonly completeCheckout: Locator;
  readonly payAmount: Locator;
  readonly changeAmountButton: Locator;
  readonly changeAmountForm: Locator;
  readonly changeAmountInput: Locator;
  readonly changeAmountIncrement: Locator;
  readonly changeAmountDecrement: Locator;
  readonly confirmAmountButton: Locator;
  readonly billingSummaryChangeLink: Locator;
  readonly billingNeedsInputAlert: Locator;
  readonly billingAddAddress: Locator;
  readonly billingAddCompany: Locator;
  readonly billingAddNumber: Locator;
  readonly backToCheckout: Locator;

  /* One-page checkout sections (stable DOM ids, locale-independent) */
  readonly billingSection: Locator;
  readonly billingForm: Locator;
  readonly fieldsSection: Locator;
  readonly fieldsForm: Locator;
  private readonly textInputComponent: TextInput;

  constructor(page: Page) {
    this.page = page;
    this.textInputComponent = new TextInput(page);
    this.checkoutContent = this.page.getByTestId("checkout-content");
    this.basketSummary = this.page.getByTestId("section-summary");
    this.billingDetails = this.page.getByTestId("section-billing-details");
    this.billingCards = this.page.getByTestId("billing");
    this.addressCard = this.page.getByTestId("radio-card-group");
    this.addNewAddress = this.page.getByTestId("link-add-address");
    this.addNewCompany = this.page.getByTestId("link-add-company");
    this.addNewPhone = this.page.getByTestId("link-add-number");
    this.addressSearch = this.page.getByTestId("input-search");
    this.addressFormMessage = this.page.getByTestId(
      "form-item-message-address"
    );
    this.addressRegionMessage = this.page.getByTestId(
      "form-item-message-address-regionId"
    );
    this.companyFormMessage = this.page.getByTestId(
      "form-item-message-company-name"
    );
    this.phone = this.page.getByTestId("form-item-phone-phone");
    this.addressManualEntry = this.page.getByTestId(
      "link-enter-address-manually"
    );
    this.addressLine1 = this.page.getByTestId("input-properties-address-1");
    this.addressLine2 = this.page.getByTestId("input-properties-address-2");
    this.city = this.page.getByTestId("input-properties-city");
    this.postCode = this.page.getByTestId("input-properties-postcode");
    this.phoneRegion = this.phone.getByTestId("popover-trigger");
    this.phoneInput = this.textInputComponent.getTextInputField(this.phone);
    this.paymentDetails = this.page.getByTestId("payment-details");
    this.expandPaymentDetails = this.page.getByTestId("link-show-more-options");
    this.saveDetails = this.page.getByTestId("button-manage-save");
    this.addVoucherForm = this.page.getByTestId("form-item-promocode");
    this.addVoucherButton = this.page.getByTestId("link-add-a-voucher-code");
    this.addVoucherInput = this.textInputComponent.getTextInputField(
      this.addVoucherForm
    );
    this.addVoucherMessage = this.page.getByTestId(
      "form-item-message-promocode"
    );
    this.applyVoucherButton = this.page.getByTestId("button-apply");
    this.dialogWindow = this.page.getByTestId("dialog-window");
    this.accountCredit = this.page.getByTestId("account-credit");
    this.completeCheckout = this.page.getByTestId("button-complete-checkout");
    this.payAmount = this.page
      .getByTestId("payment-details")
      .getByRole("heading", { level: 4 });
    this.changeAmountButton = this.page.getByTestId("change-amount");
    this.changeAmountForm = this.page.getByTestId("form-item-amount");
    this.changeAmountInput =
      this.changeAmountForm.getByTestId("number-field-input");
    this.changeAmountIncrement = this.changeAmountForm.getByTestId(
      "number-field-increment"
    );
    this.changeAmountDecrement = this.changeAmountForm.getByTestId(
      "number-field-decrement"
    );
    this.confirmAmountButton = this.page.getByTestId("button-confirm-amount");
    this.billingSummaryChangeLink =
      this.billingDetails.getByTestId("link-change");
    this.billingNeedsInputAlert = this.billingDetails.getByRole("alert");
    this.billingAddAddress = this.billingDetails.getByText("Add address");
    this.billingAddCompany = this.billingDetails.getByText("Add company");
    this.billingAddNumber = this.billingDetails.getByText("Add number");
    this.backToCheckout = this.page.getByTestId("button-back-to-checkout");

    /* One-page checkout sections */
    // #checkout-billing wraps both billing variants (saved-details summary and
    // the entry form); #basket-fields is the "Additional details" custom-fields
    // section. Both are stable DOM ids.
    this.billingSection = this.page.locator("#checkout-billing");
    this.billingForm = this.billingSection.getByTestId("form");
    this.fieldsSection = this.page.locator("#basket-fields");
    this.fieldsForm = this.fieldsSection.getByTestId("form");
  }

  /**
   * A single Place Order attempt for refusal paths — unlike
   * `clickCompleteCheckout` it does not retry or await navigation, so the
   * machine's refusal reaction can be asserted.
   */
  async attemptPlaceOrder() {
    await this.completeCheckout.click();
  }

  /**
   * The first form validation message inside a section — the incomplete-state
   * signal a Place Order refusal surfaces. Field names differ per brand, so
   * this matches the renderer's `form-item-message-*` prefix.
   */
  sectionValidationMessage(section: Locator): Locator {
    return section.locator('[data-testid^="form-item-message"]').first();
  }

  async manuallyInputAddress(
    addressLine1: string,
    city: string,
    postCode: string,
    phoneInput: string | null
  ) {
    await this.addressManualEntry.click();
    await this.addressLine1.fill(addressLine1);
    await this.city.fill(city);
    await this.postCode.fill(postCode);
    if (phoneInput != null) {
      await this.phoneInput.fill(phoneInput);
    }
  }

  async selectAddressFromSearch(searchQuery: string, expectedOption: string) {
    await this.addressSearch.fill(searchQuery);
    await this.page
      .locator('[role="dialog"][data-state="open"]')
      .locator("li", { hasText: expectedOption })
      .click();
  }
  async clickSaveDetails(endpoint: "addresses" | "companies" = "addresses") {
    // Allow an optional /{id} segment so edits (PUT/PATCH to /addresses/{id})
    // are detected alongside creates (POST to /addresses).
    const endpointPattern = new RegExp(
      `/api/clients/[^/]+/${endpoint}(/[^/?]+)?(\\?|$)`
    );
    for (let attempt = 0; attempt < 5; attempt++) {
      const responsePromise = this.page.waitForResponse(
        response =>
          endpointPattern.test(response.url()) &&
          ["POST", "PUT", "PATCH"].includes(response.request().method()) &&
          response.ok(),
        { timeout: 2000 }
      );
      await this.saveDetails.click();
      try {
        await responsePromise;
        return;
      } catch {
        // save request not detected, click again
      }
    }
    throw new Error(`${endpoint} save request not detected after 5 clicks`);
  }

  async getPaymentMethod(gatewayName: string) {
    await expect(this.paymentDetails).toBeVisible({ timeout: 30000 });
    await this.page.waitForLoadState("domcontentloaded");
    return this.page.getByTestId(`radio-card-${kebabCase(gatewayName)}`);
  }

  async selectPaymentMethod(gatewayName: string) {
    await expect(this.paymentDetails).toBeVisible({ timeout: 30000 });
    if (await this.expandPaymentDetails.isVisible()) {
      await this.expandPaymentDetails.click();
    }
    await this.page.waitForLoadState("domcontentloaded");
    await this.page.getByTestId(`radio-card-${kebabCase(gatewayName)}`).click();
  }

  async clickCompleteCheckout() {
    const checkoutUrlPattern = /\/order\/checkout/;
    const confirmationUrlPattern = /\/order\/.+\/\?payment_/;
    const modal = this.page.getByTestId("dialog-window");
    for (let attempt = 0; attempt < 3; attempt++) {
      const currentUrl = this.page.url();
      if (confirmationUrlPattern.test(currentUrl)) return;
      if (!checkoutUrlPattern.test(currentUrl)) continue;
      try {
        if (await modal.isVisible()) return;
      } catch {
        continue;
      }
      try {
        await this.completeCheckout.click({ timeout: 2000 });
      } catch {
        continue;
      }
      try {
        await this.page.waitForURL(confirmationUrlPattern, { timeout: 5000 });
        return;
      } catch {
        continue;
      }
    }
    throw new Error("Clicking 'Place Order' didn't work");
  }

  async clickConfirmAmount() {
    await this.confirmAmountButton.click();
    // Wait for dialog to close - Radix Vue removes the dialog from DOM when closed
    await expect(this.dialogWindow).toBeHidden({ timeout: 5000 });
  }

  async inputStripeDetails(
    cardNumber: string,
    expiryDate: string,
    cvcCode: string
  ) {
    // Locate Stripe Elements inputs by `autocomplete` rather than `placeholder`
    // or label text. Placeholders/labels are locale-driven (e.g. "WS11 1DB" vs
    // "12345", "Postal code" vs "ZIP code") and shift with Stripe SDK updates.
    // The autocomplete attribute is the W3C-standard semantic anchor and
    // stable across countries.
    const stripeFrame = this.page.frameLocator(
      'iframe[title="Secure payment input frame"]'
    );
    await stripeFrame
      .locator('input[autocomplete="cc-number"]')
      .fill(cardNumber);
    await stripeFrame.locator('input[autocomplete="cc-exp"]').fill(expiryDate);
    await stripeFrame.locator('input[autocomplete="cc-csc"]').fill(cvcCode);

    // Postcode is country-driven by Stripe Elements. Some countries (e.g. ZA)
    // omit the field entirely. The card suites verify card → success, not
    // billing capture (covered by the billing-details specs). So: tolerate
    // the field being absent.
    const postcode = stripeFrame.locator(
      'input[autocomplete*="postal-code" i]'
    );
    if ((await postcode.count()) > 0) await postcode.first().fill("SW1A 2AB");
  }

  async inputSepaDetails(
    iban: string,
    email: string,
    fullName: string,
    address: string,
    city: string,
    postCode: string
  ) {
    const stripeFrame = this.page.frameLocator(
      'iframe[title="Secure payment input frame"]'
    );
    await stripeFrame.getByRole("button").getByText("SEPA Debit").click();
    await stripeFrame.getByRole("textbox", { name: "iban" }).fill(iban);
    await stripeFrame.getByRole("textbox", { name: "email" }).fill(email);
    await stripeFrame
      .getByRole("textbox", { name: "full name" })
      .fill(fullName);
    await stripeFrame.locator("[id='payment-addressLine1Input']").fill(address);
    await stripeFrame.locator("[id='payment-localityInput']").fill(city);
    await stripeFrame.locator("[id='payment-postalCodeInput']").fill(postCode);
  }

  async inputIdealDetails(email: string, fullName: string) {
    const stripeFrame = this.page.frameLocator(
      'iframe[title="Secure payment input frame"]'
    );
    await stripeFrame.getByRole("button").getByText("iDEAL | Wero").click();
    await stripeFrame.getByRole("textbox", { name: "email" }).fill(email);
    await stripeFrame
      .getByRole("textbox", { name: "full name" })
      .fill(fullName);
    await this.page.keyboard.press("Tab"); // clicking complete while focus is in the iframe causes a failure for unknown reasons
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
    return paymentsResponse;
  }
}
