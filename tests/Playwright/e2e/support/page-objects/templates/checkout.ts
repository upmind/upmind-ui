import { Page, expect, Locator } from "@playwright/test";
import { TextInput } from "../components/text-input";
import { PLACE_ORDER_TIMEOUT } from "../../constants/timeouts";
import {
  readCheckoutReadinessViaHeadless,
  waitForCheckoutReadyViaHeadless
} from "../../flows/headless-bridge";

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
  // --- FE-2789: fields backed by lazily-loaded system data (FE-1698) ---
  readonly addressCountry: Locator;
  readonly addressRegion: Locator;
  readonly selectOptions: Locator;
  readonly selectedSelectOption: Locator;
  readonly phoneCountryTrigger: Locator;
  readonly phoneCountryPopover: Locator;
  readonly phoneDialCodeOptions: Locator;
  /* One-page checkout sections (FE-3002) — stable DOM ids, locale-independent */
  readonly billingSection: Locator;
  readonly billingForm: Locator;
  readonly fieldsSection: Locator;
  readonly fieldsForm: Locator;
  private readonly textInputComponent: TextInput;

  constructor(page: Page) {
    this.page = page;
    this.textInputComponent = new TextInput(page);
    this.checkoutContent = this.page.getByTestId("checkout-content");
    this.basketSummary = this.page
      .getByTestId("section")
      .and(page.locator(`[data-test-value="summary"]`));
    this.billingDetails = this.page
      .getByTestId("section")
      .and(page.locator(`[data-test-value="billing-details"]`));
    this.billingCards = this.page.getByTestId("billing");
    this.addressCard = this.page.getByTestId("option-tile-group");
    this.addNewAddress = this.page.getByTestId("link-add-address");
    this.addNewCompany = this.page.getByTestId("link-add-company");
    this.addNewPhone = this.page.getByTestId("link-add-number");
    // AddressRenderer.vue renders the lookup as a design-system <Search> whose
    // field is the bare Input primitive (`input`, no value) with role=combobox;
    // the manual-entry fields that later join the same form-item carry their
    // own values, so the role keeps this on the lookup. The personal form keys
    // its form-item `address`, the company form `company-address` — only one
    // tab is mounted at a time.
    this.addressSearch = this.page
      .getByTestId("form-item")
      .and(
        page.locator(
          `[data-test-value="address"], [data-test-value="company-address"]`
        )
      )
      .getByTestId("input")
      .and(page.locator('[role="combobox"]'));
    this.addressFormMessage = this.page
      .getByTestId("form-item-message")
      .and(page.locator(`[data-test-value="address"]`));
    this.addressRegionMessage = this.page
      .getByTestId("form-item-message")
      .and(page.locator(`[data-test-value="address-region-id"]`));
    this.companyFormMessage = this.page
      .getByTestId("form-item-message")
      .and(page.locator(`[data-test-value="company-name"]`));
    this.phone = this.page
      .getByTestId("form-item")
      .and(page.locator(`[data-test-value="phone-phone"]`));
    this.addressManualEntry = this.page.getByTestId(
      "link-enter-address-manually"
    );
    this.addressLine1 = this.page
      .getByTestId("input")
      .and(page.locator(`[data-test-value="properties-address-1"]`));
    this.addressLine2 = this.page
      .getByTestId("input")
      .and(page.locator(`[data-test-value="properties-address-2"]`));
    this.city = this.page
      .getByTestId("input")
      .and(page.locator(`[data-test-value="properties-city"]`));
    this.postCode = this.page
      .getByTestId("input")
      .and(page.locator(`[data-test-value="properties-postcode"]`));
    this.phoneRegion = this.phone.getByTestId("popover-trigger");
    this.phoneInput = this.textInputComponent.getTextInputField(this.phone);
    this.paymentDetails = this.page.getByTestId("payment-details");
    this.gateways = this.paymentDetails.getByTestId("gateway");
    this.expandPaymentDetails = this.page.getByTestId(
      "show-more-payment-options"
    );
    this.saveDetails = this.page.getByTestId("button-manage-save");
    this.addVoucherForm = this.page
      .getByTestId("form-item")
      .and(page.locator(`[data-test-value="promocode"]`));
    this.addVoucherButton = this.page.getByTestId("link-add-a-voucher-code");
    this.addVoucherInput = this.textInputComponent.getTextInputField(
      this.addVoucherForm
    );
    this.addVoucherMessage = this.page
      .getByTestId("form-item-message")
      .and(page.locator(`[data-test-value="promocode"]`));
    this.applyVoucherButton = this.page.getByTestId("button-apply");
    this.dialogWindow = this.page.getByTestId("dialog-window");
    this.accountCredit = this.page.getByTestId("account-credit");
    this.completeCheckout = this.page.getByTestId("button-complete-checkout");
    this.payAmount = this.page.getByTestId("pay-amount-value");
    this.changeAmountButton = this.page.getByTestId("change-amount");
    this.changeAmountForm = this.page
      .getByTestId("form-item")
      .and(page.locator(`[data-test-value="amount"]`));
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
    // FE-2789: the address country/region controls render as JSONForms <Select>s
    // (OneOfSelectRenderer). Their form-item carries the control path as a stable
    // data-test-value (`address-country-id` / `address-region-id`, kebab of the
    // JSONForms path) — mirrors BillingPage.regionSelect. The option list is
    // teleported to the document body as `role=option`, so it is read page-wide,
    // not nested under the form item.
    this.addressCountry = this.page
      .getByTestId("form-item")
      .and(page.locator(`[data-test-value="address-country-id"]`));
    this.addressRegion = this.page
      .getByTestId("form-item")
      .and(page.locator(`[data-test-value="address-region-id"]`));
    this.selectOptions = this.page.getByRole("option");
    // A Radix Select marks the chosen option `data-state="checked"` (verified in
    // radix-vue's SelectItem) — a locale-independent "has a value" signal that
    // never touches the translated option label (the FE-2840 trap).
    this.selectedSelectOption = this.page
      .getByRole("option")
      .and(page.locator(`[data-state="checked"]`));
    // The phone dialling-code control is a Combobox whose anchor is tagged
    // `button-phone-country` by PhoneRenderer; its list is a reka listbox
    // teleported to the body, holding `role=option` items.
    this.phoneCountryTrigger = this.phone.getByTestId("button-phone-country");
    this.phoneCountryPopover = this.page.getByRole("listbox");
    this.phoneDialCodeOptions = this.phoneCountryPopover.getByRole("option");
    // #checkout-billing (CheckoutBilling.vue) wraps both billing variants — the
    // saved-details summary and the entry form (BillingForm.vue keys its
    // Sections root `billing`); #basket-fields (BasketFieldsSection.vue) is the
    // "Additional details" custom-fields section, whose Form.vue keys `form`.
    this.billingSection = this.page.locator("#checkout-billing");
    this.billingForm = this.billingSection.getByTestId("billing");
    this.fieldsSection = this.page.locator("#basket-fields");
    this.fieldsForm = this.fieldsSection.getByTestId("form");
  }

  /**
   * A single Place Order attempt for refusal paths — unlike
   * `clickCompleteCheckout` it neither re-sends nor awaits navigation, so the
   * basket's refusal reaction can be asserted.
   */
  async attemptPlaceOrder() {
    await this.completeCheckout.click();
  }

  /**
   * A form validation message inside a section — the incomplete-state signal a
   * Place Order refusal surfaces. Field names differ per brand, so this matches
   * FormField.vue's `form-item-message` key prefix (PhoneRenderer suffixes it)
   * and takes any one member of that collection.
   */
  sectionValidationMessage(section: Locator): Locator {
    return section.locator('[data-test-key^="form-item-message"]').first();
  }

  // --- FE-2789: lazily-loaded system fields (country / region / dial code) ---
  // Countries, regions and billing cycles load on demand (FE-1698), not on cart
  // boot. These helpers drive the address country/region <Select>s and the phone
  // dialling-code Combobox so a spec can prove the options POPULATE once the
  // deferred load resolves. All targeting is by stable key or ARIA role — never
  // a translated label — so it holds across every locale.

  /** Opens the address country <Select> and waits for its option list. */
  async openAddressCountry() {
    await this.addressCountry.getByRole("combobox").first().click();
    await this.selectOptions
      .first()
      .waitFor({ state: "visible", timeout: 15000 });
  }

  /** Opens the address region <Select> and waits for its option list. */
  async openAddressRegion() {
    await this.addressRegion.getByRole("combobox").first().click();
    await this.selectOptions
      .first()
      .waitFor({ state: "visible", timeout: 15000 });
  }

  /** Closes an open <Select> list without choosing anything. */
  async dismissSelect() {
    await this.page.keyboard.press("Escape");
    await this.selectOptions
      .first()
      .waitFor({ state: "hidden", timeout: 5000 })
      .catch(() => {});
  }

  /** The stable keys (`data-test-value`) of every option in the open <Select>. */
  async selectOptionKeys(): Promise<string[]> {
    return this.selectOptions.evaluateAll(els =>
      els.map(el => el.getAttribute("data-test-value") ?? "")
    );
  }

  /**
   * Chooses the open <Select> option carrying the stable key `key`
   * (`data-test-value` — a country/region id, never a translated label).
   */
  async chooseSelectOption(key: string) {
    await this.selectOptions
      .and(this.page.locator(`[data-test-value="${key}"]`))
      .click();
  }

  /** Opens the phone dialling-code selector and waits for its list. */
  async openPhoneCountry() {
    await this.phoneCountryTrigger.click();
    await this.phoneDialCodeOptions
      .first()
      .waitFor({ state: "visible", timeout: 15000 });
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
    // Google Places autocomplete needs real keystrokes: fill() fires a single
    // synthetic input event that the debounced lookup sometimes ignores,
    // leaving the suggestions closed (screenshot-verified flake). Type the
    // query for real, and if no suggestion surfaces, nudge the lookup by
    // retyping the last character.
    const options = this.page.getByTestId("address-search-option");
    await this.addressSearch.click();
    await this.addressSearch.pressSequentially(searchQuery, { delay: 25 });
    for (let attempt = 0; attempt < 3; attempt++) {
      const visible = await options
        .first()
        .waitFor({ state: "visible", timeout: 5000 })
        .then(() => true)
        .catch(() => false);
      if (visible) break;
      await this.addressSearch.press("Backspace");
      await this.addressSearch.pressSequentially(searchQuery.slice(-1), {
        delay: 50
      });
    }
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
      // The add-company drawer flow mounts more than one visible
      // `button-manage-save` (background form + the teleported drawer form).
      // Teleported dialogs render last in the DOM, so target the last visible
      // one — the active drawer's — to avoid a Playwright strict-mode violation.
      await this.page
        .getByTestId("button-manage-save")
        .filter({ visible: true })
        .last()
        .click();
      // save request not detected → fall through and click again
      const detected = await responsePromise
        .then(() => true)
        .catch(() => false);
      if (detected) return;
    }
    throw new Error(`${endpoint} save request not detected after 5 clicks`);
  }

  /**
   * Opens the business tab and saves a new company with a manually entered
   * address.
   * @param name - company name
   * @param regNumber - registration number, also used as the tax number
   * @param address - manually entered company address
   */
  async saveNewCompany(
    name: string,
    regNumber: string,
    address: { line1: string; city: string; postcode: string }
  ) {
    await this.page.getByTestId("tab-business-details").click();
    const companyName = this.page.getByTestId("input-properties-name");
    await expect(companyName.or(this.addNewCompany).first()).toBeVisible();
    if (!(await companyName.isVisible())) await this.addNewCompany.click();
    await companyName.fill(name);
    await this.page.getByTestId("input-properties-reg-number").fill(regNumber);
    await this.page
      .getByTestId("input-properties-tax-properties-number")
      .fill(regNumber);
    await this.manuallyInputAddress(
      address.line1,
      address.city,
      address.postcode,
      null
    );
    await this.clickSaveDetails("companies");
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
    return this.paymentDetails
      .getByTestId("gateway")
      .and(this.page.locator(`[data-test-value="${provider}"]`));
  }

  /**
   * Selects a payment gateway by its zero-based position in the gateway radio
   * group — a LOCALE-SAFE alternative to selecting by a translated,
   * label-derived testid, which would resolve only in English
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
   * translated `t('form.payment_method_type.pay-later')` label that a
   * label-derived testid would key off. We click the enclosing `Label` so the whole card's
   * `@click` handler fires (Radix `RadioGroupItem` is a `button[role=radio]`
   * that swallows clicks when already focused). Scoped inside `paymentDetails`.
   */
  async selectPayLater() {
    await expect(this.paymentDetails).toBeVisible({ timeout: 30000 });
    // Gateways paint after an async fetch resolves, and Pay Later sits behind
    // the "show more" expander. Wait for the list, reveal the expander, then
    // read the (visually-hidden Radix) radio once it is attached.
    await this.paymentDetails
      .getByTestId("gateway")
      .first()
      .waitFor({ state: "visible", timeout: 30000 });
    if (await this.expandPaymentDetails.isVisible()) {
      await this.expandPaymentDetails.click();
    }
    await this.page.waitForLoadState("domcontentloaded");
    // Click the radio itself, as selectGatewayByType does — its label is not a
    // visible target, so a label click waits out the whole test budget.
    await this.paymentDetails
      .locator('[role="radio"][value="pay-later"]')
      .click({ timeout: 30000 });
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
      .getByTestId("gateway")
      .first()
      .waitFor({ state: "visible", timeout: 30000 });
    if (await this.expandPaymentDetails.isVisible()) {
      await this.expandPaymentDetails.click();
    }
    await this.page.waitForLoadState("domcontentloaded");
    const radio = this.paymentDetails
      .getByTestId("gateway")
      .and(this.page.locator(`[data-test-value="${provider}"]`));
    if ((await radio.count()) === 0) {
      const available = await this.paymentDetails
        .getByTestId("gateway")
        .evaluateAll(els => els.map(el => el.getAttribute("data-test-value")));
      throw new Error(
        `Gateway "${provider}" not found. Rendered: ${JSON.stringify(available)}`
      );
    }
    await radio.click();
  }

  /**
   * Selects the first stored payment method (saved card) in a LOCALE-SAFE way.
   * The stored methods render inside the `payment-details-id` FormField as an
   * `option-tile-group` of option tiles; each tile is keyed off a dynamic
   * `payment_details_id` (`option-tile-{uuid}`), so there is no stable,
   * hard-codeable per-card testid and no locale-stable label to target. The
   * fixture user has exactly one saved card, so target the first tile's radio
   * in the group — `first()` here picks a collection MEMBER (this method's own
   * contract, per its name), it does not paper over a duplicate test key.
   *
   * Targeted by ARIA role, not by tag: the option-tile rewrite dropped the old
   * `RadioCardItem`'s `<Label>` root, so the previous `.locator("label")`
   * matched nothing and the spec timed out with the saved card on screen.
   */
  async selectFirstStoredPaymentMethod() {
    await expect(this.paymentDetails).toBeVisible({ timeout: 30000 });
    const storedMethods = this.paymentDetails
      .getByTestId("form-item")
      .and(this.page.locator(`[data-test-value="payment-details-id"]`))
      .getByTestId("option-tile-group");
    await expect(storedMethods).toBeVisible({ timeout: 30000 });
    await storedMethods.getByRole("radio").first().click();
  }

  /**
   * Places the order and returns once the app has reached a TERMINAL state:
   * a blocking dialog, or it has left the checkout route — the confirmation
   * route (success AND declined-card flows both land there) or an offsite
   * gateway page (PayPal Express, or Stripe's hosted 3DS challenge).
   *
   * Every read in the wait is NON-BLOCKING by construction: `page.url()` is
   * synchronous and `locator.isVisible()` never auto-waits. An auto-retrying
   * `expect.poll` owns the deadline, so nothing here can outlive its budget.
   *
   * That is the whole point of the shape. The hand-rolled loop this replaces
   * decided whether to re-click by reading `completeCheckout.isEnabled()` —
   * and `isEnabled()` DOES auto-wait for its element, with no `actionTimeout`
   * configured for this project, so it waits forever. The moment the payment
   * section unmounted on conversion that call blocked, the loop never re-read
   * the URL, and 19 payment specs reported a test timeout for payments that
   * had demonstrably gone through (the failure screenshots show the
   * confirmation page). One click has always been enough — every trace shows
   * a single `button-complete-checkout` click driving the placement POST — so
   * the re-click went with it.
   */
  /**
   * @param until - What counts as done. Defaults to leaving the checkout route
   *   or a blocking dialog; a mocked decline that stays on the page with an
   *   inline message passes its own predicate.
   */
  async clickCompleteCheckout(until?: () => Promise<boolean>) {
    // The checkout route, tolerating the optional `basket/{bid}` segment the
    // cart router allows (BID_PREFIX in apps/cart/src/router/funnels/types.ts).
    const checkoutUrlPattern = /\/order\/(basket\/[^/]+\/)?checkout\//;
    const confirmationUrlPattern = /\/order\/.+\/\?payment_/;
    const modal = this.page.getByTestId("dialog-window");

    const atTerminalState =
      until ??
      (async () =>
        (await modal.isVisible().catch(() => false)) ||
        !checkoutUrlPattern.test(this.page.url()));

    // Already at a terminal state (idempotent re-entry).
    if (confirmationUrlPattern.test(this.page.url())) return;
    if (await modal.isVisible().catch(() => false)) return;

    // Gated here: the one chokepoint every payment path crosses, and after the
    // terminal early-returns so re-entry stays idempotent.
    await waitForCheckoutReadyViaHeadless(this.page);

    // Playwright auto-waits for the button to be visible, enabled and stable.
    await this.completeCheckout.click({ timeout: 15000 });

    // Re-send only on the app's own proof of non-delivery. The payment section
    // re-renders as Stripe's VALIDATE settles, so the click can dispatch on a
    // node Vue has already swapped: reported done, handler never ran, no event.
    // Unlike the old blind double-click, this never fires once the basket has it.
    let sends = 1;
    const maxSends = 3;
    let lastState = await readCheckoutReadinessViaHeadless(this.page);
    let attempts = lastState?.attempts ?? 0;

    await expect
      .poll(
        async () => {
          if (await atTerminalState()) return true;

          const state = await readCheckoutReadinessViaHeadless(this.page);
          lastState = state ?? lastState;
          // No bridge to read (mid-navigation): keep waiting, never re-click.
          if (!state) return false;
          // The basket HAS the event — a placement is under way. Wait it out.
          if (state.hasAcceptedCheckout) return false;

          // Idle basket. Either it refused the event (attempts moved) or the
          // click never reached the handler (attempts unmoved). Both mean no
          // placement is running, so sending it again is safe and correct.
          attempts = Math.max(attempts, state.attempts);
          if (sends >= maxSends || !state.isReady) return false;

          sends += 1;
          await this.completeCheckout.click({ timeout: 5000 }).catch(() => {});
          return false;
        },
        {
          timeout: PLACE_ORDER_TIMEOUT,
          message:
            "Place Order: the app never left the checkout route — no confirmation route, no offsite gateway redirect and no dialog within PLACE_ORDER_TIMEOUT of the click"
        }
      )
      .toBe(true)
      .catch((error: unknown) => {
        throw new Error(
          `Place Order: the app never left the checkout route — no confirmation route, no offsite gateway redirect and no dialog within PLACE_ORDER_TIMEOUT. Sent ${sends} click(s); basket refusals ${attempts}; state at failure ${JSON.stringify(
            lastState
          )}; url ${this.page.url()}`,
          { cause: error }
        );
      });
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
    // and not the translated label/role-name (which shift across locales). The
    // tab anchor is data-value (as for iDEAL); data-payment-method-type is gone
    // from this Payment Element version.
    await stripeFrame.locator('[data-value="sepa_debit"]').click();
    await stripeFrame.locator('input[name="iban"]').fill(iban);
    await stripeFrame.locator('input[name="email"]').fill(email);
    await stripeFrame.locator('input[name="name"]').fill(fullName);
    // Stripe pre-selects the billing country from the browser's location and
    // validates the postal code against it, so pin the country the address
    // belongs to — otherwise the element never reports itself complete and
    // Place Order stays disabled.
    await stripeFrame.locator('select[name="country"]').selectOption("GB");
    await stripeFrame.locator("[id='payment-addressLine1Input']").fill(address);
    await stripeFrame.locator("[id='payment-localityInput']").fill(city);
    await stripeFrame.locator("[id='payment-postalCodeInput']").fill(postCode);
  }

  /**
   * Completes an iDEAL checkout end-to-end: select the iDEAL tab in the Stripe
   * Payment Element, fill email/name, submit, and return once the page has
   * left checkout for the gateway's hosted page.
   *
   * Owned as ONE flow because the Payment Element RE-MOUNTS while the basket
   * settles (screenshot-verified), silently resetting the accordion to an
   * empty Card tab — a select-then-submit split loses that race. The loop
   * re-establishes the selection whenever it was reset and only ever submits
   * while the iDEAL panel is demonstrably open. The terminal signal is the
   * real one: the offsite redirect.
   *
   * 3rd-party Stripe Elements: targets Stripe's own attributes, not our
   * testids and not the translated label/role-name (which shift across
   * locales and rebrands — the tab is now titled "iDEAL | Wero"). The tab
   * anchor is data-value="ideal" (probe-verified; data-payment-method-type
   * does not exist in this Payment Element version).
   *
   * Every read in the wait is NON-BLOCKING by construction: `page.url()` is
   * synchronous, `locator.isVisible()` never auto-waits, and the app's own
   * in-flight flag is read through `count()`. That is what replaced
   * `completeCheckout.isEnabled()` — which DOES auto-wait, with no
   * `actionTimeout` configured for this project, so it blocked forever the
   * moment its element unmounted, exactly the defect `clickCompleteCheckout`
   * was rewritten to remove. An auto-retrying `expect.poll` owns the deadline
   * and its own backoff, so the fixed 1s sleep went with it.
   */
  async completeIdealCheckout(email: string, fullName: string) {
    const checkoutUrlPattern = /\/order\/checkout/;
    const stripeFrame = this.page.frameLocator(
      'iframe[title="Secure payment input frame"]'
    );
    const tab = stripeFrame.locator('[data-value="ideal"]');
    const emailInput = stripeFrame.locator('input[name="email"]');

    // `page.url()` is synchronous, so the terminal read cannot block.
    const redirected = () => !checkoutUrlPattern.test(this.page.url());
    // `count()` does not auto-wait, so reading the button's own loading state
    // cannot block — unlike `isEnabled()`, which auto-waits and hangs forever
    // once the button unmounts on conversion.
    const isIdle = async () =>
      (await this.completeCheckout
        .and(this.page.locator("[data-loading]"))
        .count()) === 0;

    let armed = false;

    const driveIdeal = async () => {
      if (redirected()) return true;

      // `isVisible()` does not auto-wait: a non-blocking read of whether the
      // iDEAL panel is open. Closed means the Payment Element re-mounted on an
      // empty Card tab, so (re)establish the selection and let the next poll
      // iteration observe the result.
      if (!(await emailInput.isVisible().catch(() => false))) {
        armed = false;
        await tab.click({ timeout: 10000 }).catch(() => {});
        return redirected();
      }

      if (!armed) {
        await emailInput.fill(email, { timeout: 10000 });
        await stripeFrame
          .locator('input[name="name"]')
          .fill(fullName, { timeout: 10000 });
        // clicking complete while focus is in the iframe causes a failure for
        // unknown reasons
        await this.page.keyboard.press("Tab");
        armed = true;
      }

      // Submit only while the panel is open and the app is idle: a confirm in
      // flight publishes payment-processing="processing" AND disables the
      // button, so the bounded click cannot double-submit.
      if (await isIdle()) {
        await this.completeCheckout.click({ timeout: 2000 }).catch(() => {});
      }

      return redirected();
    };

    await expect
      .poll(driveIdeal, {
        timeout: 90000,
        message:
          "iDEAL: no offsite redirect within 90s — the selection kept resetting or the confirm never fired"
      })
      .toBe(true);
  }

  /**
   * Records every `/api/payments` round-trip on this page, capturing BOTH the
   * outgoing request payload and the response. Returns the (initially empty)
   * array by reference — call it BEFORE placing the order, then read the array
   * AFTER the confirmation is visible.
   *
   * The placement mutation (`POST /api/payments`) is where `gateway_id` and
   * `amount` reach the wire (see headless `payment.services.update` — the body
   * is `{ invoice_id, ...paymentDetail }`). Asserting `request` closes the
   * end-state-only gap the confirmation-suite specs had: a wrong `gateway_id`
   * or `amount` on placement now fails a test instead of silently reaching a
   * "Thank you" page. Currency is NOT in this body — it is fixed on the invoice
   * and asserted via the currency-scoped pay-amount UI in those specs.
   */
  async interceptPaymentResponse() {
    const paymentsResponse: Array<{
      url: string;
      method: string;
      request: any;
      status: number;
      headers: Record<string, string>;
      body: any;
    }> = [];

    // regex (not a $-anchored glob) so a query string can't silently
    // unmatch the route
    await this.page.route(/\/api\/payments(\?|$)/, async route => {
      // Snapshot the outgoing payload before fetching — the placement POST
      // carries gateway_id/amount here (GET reads have no body → null).
      let request: any = null;
      try {
        request = route.request().postDataJSON();
      } catch {
        request = null;
      }
      const response = await route.fetch();
      const body = await response.json().catch(() => null);
      paymentsResponse.push({
        url: response.url(),
        method: route.request().method(),
        request,
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
