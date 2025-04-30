import { Locator, Page } from "@playwright/test";

export class RadioButtons {
  readonly radioGroup: Locator;
  readonly radioOption: Locator;

  constructor(page: Page) {
    this.radioGroup = page.getByTestId("radio-card-group");
    this.radioOption = page.getByTestId("radio-card-item");
  }

  getRadioButton(group: number, option: number) {
    const getGroup = this.radioGroup.nth(group);
    const getButton = getGroup.locator(this.radioOption).nth(option);
    return getButton;
  }

  async clickRadioButton(group: number, option: number) {
    const button = this.getRadioButton(group, option);
    await button.click();
  }
}
