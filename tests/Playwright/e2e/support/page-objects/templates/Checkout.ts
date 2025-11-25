import {
  Page,
  expect,
  Locator,
  BrowserContext,
  Route,
  Request
} from "@playwright/test";
import { URLs } from "../../constants/urls";
import {
  createOrder,
  addProductToOrder,
  addPromotionToOrder,
  setOrderCurrency
} from "../../utils/functions/basket";
import { getSessionToken } from "../../utils/functions/tokens";
import { fakerEN_GB } from "@faker-js/faker";
import { kebabCase } from "../../utils/functions/helpers";
export class Checkout {
  readonly page: Page;
  readonly context: BrowserContext;
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
  readonly addVoucherButton: Locator;
  readonly addVoucherInput: Locator;
  readonly applyVoucherButton: Locator;
  readonly dialogWindow: Locator;
  readonly placeOrderButton: Locator;
  readonly payLaterButton: Locator;
  readonly payAmount: Locator;
  readonly changeAmountButton: Locator;
  readonly changeAmountForm: Locator;
  readonly changeAmountInput: Locator;
  readonly changeAmountIncrement: Locator;
  readonly changeAmountDecrement: Locator;
  readonly confirmAmountButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.context = page.context();
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
    this.addVoucherButton = page.getByTestId("link-add-a-voucher-code");
    this.addVoucherInput = page.getByTestId("input-properties-promocode");
    this.applyVoucherButton = page.getByTestId("button-apply");
    this.dialogWindow = page.getByTestId("dialog-window");
    this.placeOrderButton = page.getByTestId("button-place-order-and-pay");
    this.payLaterButton = page.getByTestId("button-place-order");
    this.payAmount = page.getByTestId("tabslist").getByText("Pay");
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

  async selectPaymentMethod(gatewayName: string) {
    await this.page.getByTestId("link-show-more-options").click();
    await this.page.getByTestId(`radio-card-${kebabCase(gatewayName)}`).click();
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

  async mockStripeCardDecline() {
    await this.page.route(
      "https://api.stripe.com/v1/payment_methods",
      async route => {
        const mockedError = {
          error: {
            code: "card_declined",
            decline_code: "live_mode_test_card",
            doc_url: "https://stripe.com/docs/error-codes/card-declined",
            message:
              "Your card was declined. Your request was in live mode, but used a known test card.",
            param: "",
            request_log_url:
              "https://dashboard.stripe.com/logs/req_fGY1SLS4nXDO87?t=1762263317",
            type: "card_error"
          }
        };

        await route.fulfill({
          status: 402, // Payment Required (Stripe uses this for card declines)
          contentType: "application/json",
          body: JSON.stringify(mockedError)
        });
      }
    );
  }

  async goToCheckout(promotion: string | null, currency: string | null) {
    await this.page.goto(URLs.basket);
    await this.page.waitForLoadState("networkidle");
    let token = await getSessionToken(this.context, "guest");
    let orderId = await createOrder(token);
    await addProductToOrder(
      `${token}`,
      `${orderId}`,
      "3de78642-de53-9714-76df-21208469530d",
      1,
      24,
      [],
      [],
      {
        domain: `${fakerEN_GB.string.alphanumeric({
          length: { min: 3, max: 15 }
        })}.com`
      },
      []
    );
    if (promotion != null) {
      await addPromotionToOrder(orderId, promotion, token);
    }
    if (currency != null) {
      await setOrderCurrency(token, orderId, currency);
    }
    await this.page.goto(URLs.checkout);
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
