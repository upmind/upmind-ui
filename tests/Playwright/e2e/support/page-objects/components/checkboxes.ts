import { Locator, Page } from "@playwright/test";

export class Checkboxes {
  readonly page: Page;
  readonly checkboxGroup: Locator;
  readonly checkboxOption: Locator;
  readonly checkboxQtyIncrease: Locator;
  readonly checkboxQtyDecrease: Locator;

  constructor(page: Page) {
    this.page = page;
    this.checkboxGroup = page.getByTestId("option-tile-group");
    this.checkboxOption = page.getByTestId("checkbox-item");
    this.checkboxQtyIncrease = page.getByTestId("checkbox-qty-increase");
    this.checkboxQtyDecrease = page.getByTestId("checkbox-qty-decrease");
  }

  getCheckbox(option: number) {
    return this.checkboxOption.nth(option);
  }

  /**
   * @param slug - Stable checkbox slug (NOT a translated label), e.g.
   *   `checkbox-item-try-before-you-buy`.
   */
  async clickCheckbox(slug: string) {
    await this.page.getByTestId(slug).click();
  }
}
