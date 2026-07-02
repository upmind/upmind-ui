import { Page, expect, Locator } from "@playwright/test";
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
  readonly gateways: Locator;
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
  readonly billingSummaryAddress: Locator;
  readonly billingSummaryCompany: Locator;
  readonly billingAddAddress: Locator;
  readonly billingAddCompany: Locator;
  readonly billingAddNumber: Locator;
  readonly backToCheckout: Locator;
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
    this.gateways = this.paymentDetails.locator('[data-test-key^="gateway-"]');
    this.expandPaymentDetails = this.page.getByTestId(
      "show-more-payment-options"
    );
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
    this.payAmount = this.page.getByTestId("pay-amount-value");
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
    this.billingNeedsInputAlert = this.billingDetails.getByTestId(
      "billing-requirements-alert"
    );
    // BillingSummary.vue tags the populated address/company rows with explicit
    // testids carrying the entered value in data-test-value (address title /
    // company name), separated from the multi-line rendered <p> rows.
    this.billingSummaryAddress = this.billingDetails.getByTestId(
      "billing-summary-address"
    );
    this.billingSummaryCompany = this.billingDetails.getByTestId(
      "billing-summary-company"
    );
    this.billingAddAddress =
      this.billingDetails.getByTestId("link-add-address");
    this.billingAddCompany =
      this.billingDetails.getByTestId("link-add-company");
    this.billingAddNumber = this.billingDetails.getByTestId("link-add-number");
    this.backToCheckout = this.page.getByTestId("button-back-to-checkout");
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
    const options = this.page.getByTestId("address-search-option");
    await expect(options.first()).toBeVisible();
    await options.filter({ hasText: expectedOption }).click();
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

  /**
   * Returns the gateway radio for a provider code in a LOCALE-SAFE way. Each
   * gateway radio is tagged `data-test-key="gateway-{provider}"` by
   * `GatewaysRenderer.vue` (provider code from the headless gateway schema), so
   * the target is independent of the translated label (the FE-2840 trap).
   *
   * @param provider - Gateway provider code, e.g. `gateways.STRIPE`.
   */
  async getPaymentMethod(provider: string) {
    await expect(this.paymentDetails).toBeVisible({ timeout: 30000 });
    await this.page.waitForLoadState("domcontentloaded");
    return this.paymentDetails.getByTestId(`gateway-${provider}`);
  }

  /**
   * Selects a payment gateway by its zero-based position in the gateway radio
   * group — a LOCALE-SAFE alternative to `selectPaymentMethod`, which locates by
   * `radio-card-${kebabCase(label)}` and therefore resolves only in English
   * (the FE-2840 trap). The gateway list is rendered by `GatewaysRenderer.vue`,
   * whose `RadioCardItem` gives each option a `Label[for="gateway_id-{index}"]`
   * and a `RadioGroupItem[id="gateway_id-{index}"]` (the group `name` is the
   * JSONForms `control.path`, which ends `gateway_id`). The `id`/`for` index is
   * data-order-driven, not derived from the translated label, so it is stable
   * across all 28 locales. Scoped inside `paymentDetails` to avoid colliding
   * with any other radio group on the page.
   *
   * @param index - Zero-based gateway position in the rendered group.
   */
  async selectGatewayByIndex(index: number) {
    await expect(this.paymentDetails).toBeVisible({ timeout: 30000 });
    if (await this.expandPaymentDetails.isVisible()) {
      await this.expandPaymentDetails.click();
    }
    await this.page.waitForLoadState("domcontentloaded");
    await this.paymentDetails
      .locator(`label[for$="gateway_id-${index}"]`)
      .click();
  }

  /**
   * Selects the synthetic "Pay Later" option in a LOCALE-SAFE way. Pay Later is
   * pushed onto the end of the gateway list in `GatewaysRenderer.vue` with
   * `value = PaymentType.PAY_LATER` ("pay-later"); its `RadioGroupItem` carries
   * the stable, locale-independent attribute `value="pay-later"`, unlike the
   * translated `t('form.payment_method_type.pay-later')` label that drives the
   * `radio-card-*` testid. We click the enclosing `Label` so the whole card's
   * `@click` handler fires (Radix `RadioGroupItem` is a `button[role=radio]`
   * that swallows clicks when already focused). Scoped inside `paymentDetails`.
   */
  async selectPayLater() {
    await expect(this.paymentDetails).toBeVisible({ timeout: 30000 });
    // Gateways paint after an async fetch resolves, and Pay Later sits behind
    // the "show more" expander. Wait for the list, reveal the expander, then
    // read the (visually-hidden Radix) radio once it is attached.
    await this.paymentDetails
      .locator('[data-test-key^="gateway-"]')
      .first()
      .waitFor({ state: "visible", timeout: 30000 });
    if (await this.expandPaymentDetails.isVisible()) {
      await this.expandPaymentDetails.click();
    }
    await this.page.waitForLoadState("domcontentloaded");
    await this.paymentDetails
      .locator('[role="radio"][value="pay-later"]')
      .waitFor({ state: "attached", timeout: 30000 });
    const payLaterId = await this.paymentDetails
      .locator('[role="radio"][value="pay-later"]')
      .getAttribute("id");
    await this.paymentDetails.locator(`label[for="${payLaterId}"]`).click();
  }

  /**
   * Selects a gateway by its provider code in a LOCALE- AND ORDER-SAFE way.
   * Each gateway radio is tagged `data-test-key="gateway-{provider}"` by
   * `GatewaysRenderer.vue` (provider code surfaced from the headless gateway
   * schema), so the target is independent of both the translated label (the
   * FE-2840 trap) and the dynamic gateway order (`selectGatewayByIndex(0)` is
   * NOT guaranteed to be any particular gateway). The `gateway-{provider}`
   * testid sits on the enclosing `Label`, which is itself clickable, so click
   * it directly. Throws with the rendered gateway list if the provider is
   * absent.
   *
   * @param provider - Gateway provider code, e.g. `gateways.STRIPE`.
   */
  async selectGatewayByType(provider: string) {
    await expect(this.paymentDetails).toBeVisible({ timeout: 30000 });
    // Gateways paint after an async fetch resolves — wait for the list to
    // render before reading it, otherwise the check races an empty container.
    await this.paymentDetails
      .locator('[data-test-key^="gateway-"]')
      .first()
      .waitFor({ state: "visible", timeout: 30000 });
    if (await this.expandPaymentDetails.isVisible()) {
      await this.expandPaymentDetails.click();
    }
    await this.page.waitForLoadState("domcontentloaded");
    const radio = this.paymentDetails.getByTestId(`gateway-${provider}`);
    if ((await radio.count()) === 0) {
      const available = await this.paymentDetails
        .locator('[data-test-key^="gateway-"]')
        .evaluateAll(els => els.map(el => el.getAttribute("data-test-key")));
      throw new Error(
        `Gateway "gateway-${provider}" not found. Rendered: ${JSON.stringify(available)}`
      );
    }
    await radio.click();
  }

  /**
   * Selects the first stored payment method (saved card) in a LOCALE-SAFE way.
   * The stored-method radios are rendered by `PaymentDetailsRenderer.vue` inside
   * the `form-item-payment-details-id` FormField; each card is keyed off a
   * dynamic `payment_details_id` (`radio-card-{uuid}`), so there is no stable,
   * hard-codeable per-card testid and no locale-stable label to target. The
   * fixture user has exactly one saved card, so target the first `RadioCardItem`
   * — whose root is a `<Label>` that drives the Radix radio — under the
   * stored-methods form item. Scoped inside `paymentDetails`.
   */
  async selectFirstStoredPaymentMethod() {
    await expect(this.paymentDetails).toBeVisible({ timeout: 30000 });
    await this.page.waitForLoadState("domcontentloaded");
    await this.paymentDetails
      .getByTestId("form-item-payment-details-id")
      .locator("label")
      .first()
      .click();
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
    // 3rd-party Stripe Elements: target Stripe's own attributes, not our testids
    // and not the translated label/role-name (which shift across locales).
    await stripeFrame
      .locator('[data-payment-method-type="sepa_debit"]')
      .click();
    await stripeFrame.locator('input[name="iban"]').fill(iban);
    await stripeFrame.locator('input[name="email"]').fill(email);
    await stripeFrame.locator('input[name="full_name"]').fill(fullName);
    await stripeFrame.locator("[id='payment-addressLine1Input']").fill(address);
    await stripeFrame.locator("[id='payment-localityInput']").fill(city);
    await stripeFrame.locator("[id='payment-postalCodeInput']").fill(postCode);
  }

  async inputIdealDetails(email: string, fullName: string) {
    const stripeFrame = this.page.frameLocator(
      'iframe[title="Secure payment input frame"]'
    );
    // 3rd-party Stripe Elements: target Stripe's own attributes, not our testids
    // and not the translated label/role-name (which shift across locales).
    // Stripe's Payment Element now renders methods as an accordion; the iDEAL
    // tab carries `data-value="ideal"` and its name field is `name="name"`.
    await stripeFrame.locator('[data-value="ideal"]').click();
    await stripeFrame.locator('input[name="email"]').fill(email);
    await stripeFrame.locator('input[name="name"]').fill(fullName);
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
