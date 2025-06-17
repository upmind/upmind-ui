import { Page, expect, Frame } from "@playwright/test";
export class Checkout {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async inputStripeDetails(
    page: Page,
    cardNumber: string,
    expiryDate: string,
    cvcCode: string
  ) {
    await page.click('button:has-text("Stripe Payment")');
    const stripeFrame = await this.getStripeIframe(page);
    await stripeFrame.fill('input[name="number"]', `${cardNumber}`);
    await stripeFrame.fill('input[name="expiry"]', `${expiryDate}`);
    await stripeFrame.fill('input[name="cvc"]', `${cvcCode}`);
    await stripeFrame.fill('input[name="postalCode"]', "SW1A 2AB");
  }

  async payWithExistingMethod(page: Page) {
    const placeOrderButton = page.locator(
      'button:has-text("Place order and pay")'
    );
    await placeOrderButton.waitFor({ state: "attached" });
    await expect(placeOrderButton).toBeEnabled();

    await placeOrderButton.click();
  }

  async payWithStripeCard(
    page: Page,
    cardNumber: string,
    expiryDate: string,
    cvcCode: string
  ) {
    await page.click('button:has-text("Stripe Payment")');
    const stripeFrame = await this.getStripeIframe(page);
    await stripeFrame.fill('input[name="number"]', `${cardNumber}`);
    await stripeFrame.fill('input[name="expiry"]', `${expiryDate}`);
    await stripeFrame.fill('input[name="cvc"]', `${cvcCode}`);
    await stripeFrame.fill('input[name="postalCode"]', "SW1A 2AB");

    const placeOrderButton = page.getByTestId("button-place-order-and-pay");
    await placeOrderButton.waitFor({ state: "attached" });
    await expect(placeOrderButton).toBeEnabled();

    await placeOrderButton.click();
  }

  async getStripeIframe(page: Page): Promise<Frame> {
    const iframeElement = await page.waitForSelector(
      'iframe[name^="__privateStripeFrame"]'
    );
    const frame = await iframeElement.contentFrame();
    if (!frame) throw new Error("Stripe iframe not found");
    return frame;
  }

  async payWithOfflinePayment(page: Page) {
    await page.click('button:has-text("Offline Payment")');
    const placeOrderButton = page.getByTestId("button-place-order");
    await placeOrderButton.waitFor({ state: "attached" });
    await expect(placeOrderButton).toBeEnabled();

    await placeOrderButton.click();
  }

  async payWithBankTransfer(page: Page) {
    await page.click('button:has-text("Direct Bank Transfer")');
    const placeOrderButton = page.getByTestId("button-place-order");
    await placeOrderButton.waitFor({ state: "attached" });
    await expect(placeOrderButton).toBeEnabled();

    await placeOrderButton.click();
  }

  async payWithMicropayment(page: Page) {
    await page.click('button:has-text("Micropayments")');
    const placeOrderButton = page.getByTestId("button-place-order-and-pay");
    await placeOrderButton.waitFor({ state: "attached" });
    await expect(placeOrderButton).toBeEnabled();

    await placeOrderButton.click();
  }
}
