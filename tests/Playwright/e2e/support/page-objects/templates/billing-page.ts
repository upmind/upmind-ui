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
  readonly saveDetails: Locator;

  constructor(page: Page) {
    this.page = page;
    this.billingSection = this.page.getByTestId("billing");
    this.backToBasket = this.page.getByText("Back to basket");
    this.continue = this.page.getByText("Continue");
    this.personalTab = this.page.getByText("Personal details");
    this.businessTab = this.page.getByText("Business details");
    this.addressManualEntry = this.page.getByTestId(
      "link-enter-address-manually"
    );
    this.addressLine1 = this.page.getByTestId("input-properties-address-1");
    this.city = this.page.getByTestId("input-properties-city");
    this.postCode = this.page.getByTestId("input-properties-postcode");
    this.companyName = this.page.getByTestId("input-properties-name");
    this.saveDetails = this.page.getByTestId("button-save-details");
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
  }

  async continueIsHidden(): Promise<boolean> {
    return (await this.continue.count()) === 0;
  }
}
