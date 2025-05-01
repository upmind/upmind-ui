import { Locator, Page } from "@playwright/test";

export class Checkboxes {
  readonly checkboxGroup: Locator;
  readonly checkboxOption: Locator;
  readonly checkboxQtyIncrease: Locator;
  readonly checkboxQtyDecrease: Locator;

  constructor(page: Page) {
    this.checkboxGroup = page.getByTestId("checkbox-group");
    this.checkboxOption = page.getByTestId("checkbox-item");
    this.checkboxQtyIncrease = page.getByTestId("checkbox-qty-increase");
    this.checkboxQtyDecrease = page.getByTestId("checkbox-qty-decrease");
  }

  getCheckbox(group: number, option: number) {
    const getGroup = this.checkboxGroup.nth(group);
    const getCheckbox = getGroup.locator(this.checkboxOption).nth(option);
    return getCheckbox;
  }

  async clickCheckbox(group: number, option: number) {
    const box = this.getCheckbox(group, option);
    await box.click();
  }
}
