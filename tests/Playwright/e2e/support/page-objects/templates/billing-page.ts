import { Page, Locator } from "@playwright/test";

export class BillingPage {
  readonly page: Page;
  readonly billingSection: Locator;
  readonly backToBasket: Locator;
  readonly continue: Locator;
  readonly personalTab: Locator;
  readonly businessTab: Locator;
  readonly addressManualEntry: Locator;
  readonly addressLine1: Locator;
  readonly city: Locator;
  readonly postCode: Locator;
  readonly companyName: Locator;
  readonly regionSelect: Locator;
  readonly saveDetails: Locator;

  constructor(page: Page) {
    this.page = page;
    this.billingSection = this.page.getByTestId("billing");
    this.backToBasket = this.page.getByTestId("link-back-to-basket");
    this.continue = this.page.getByTestId("button-continue");
    this.personalTab = this.page.getByTestId("tab-personal-details");
    this.businessTab = this.page.getByTestId("tab-business-details");
    this.addressManualEntry = this.page.getByTestId(
      "link-enter-address-manually"
    );
    this.addressLine1 = this.page
      .getByTestId("input")
      .and(page.locator(`[data-test-value="properties-address-1"]`));
    this.city = this.page
      .getByTestId("input")
      .and(page.locator(`[data-test-value="properties-city"]`));
    this.postCode = this.page
      .getByTestId("input")
      .and(page.locator(`[data-test-value="properties-postcode"]`));

    this.companyName = this.page
      .getByTestId("input")
      .and(page.locator(`[data-test-value="properties-name"]`));
    this.regionSelect = this.page
      .getByTestId("form-item")
      .and(page.locator(`[data-test-value="address-region-id"]`))
      .getByRole("combobox")
      .first();
    this.saveDetails = this.page.getByTestId("button-manage-save");
  }

  async manuallyInputAddress(
    addressLine1: string,
    city: string,
    postCode: string
  ) {
    await this.addressManualEntry.click();
    await this.addressLine1.fill(addressLine1);
    await this.city.fill(city);
    await this.postCode.fill(postCode);
    // Region might be required by the backend brand config; selecting a valid one
    // keeps the address POST truthful so the basket billing PUT can fire.
    await this.selectRegion();
  }

  async selectRegion() {
    await this.regionSelect.click();
    await this.page.getByRole("option").first().click();
  }

  async continueIsHidden(): Promise<boolean> {
    return (await this.continue.count()) === 0;
  }
}
