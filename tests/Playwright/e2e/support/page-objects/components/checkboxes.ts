import { Locator, Page } from "@playwright/test";
import { kebabCase } from "../../helpers/strings";

export class Checkboxes {
  readonly page: Page;
  readonly checkboxGroup: Locator;
  readonly checkboxOption: Locator;
  readonly checkboxQtyIncrease: Locator;
  readonly checkboxQtyDecrease: Locator;

  constructor(page: Page) {
    this.page = page;
    this.checkboxGroup = page.getByTestId("checkbox-group");
    this.checkboxOption = page.getByTestId("checkbox-item");
    this.checkboxQtyIncrease = page.getByTestId("checkbox-qty-increase");
    this.checkboxQtyDecrease = page.getByTestId("checkbox-qty-decrease");
  }

  getCheckbox(option: number) {
    return this.checkboxOption.nth(option);
  }

  async clickCheckbox(checkbox: string) {
    await this.page.getByTestId(`checkbox-${kebabCase(checkbox)}`).click();
  }
}
