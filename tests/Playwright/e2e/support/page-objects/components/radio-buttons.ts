import { Locator, Page } from "@playwright/test";
import { kebabCase } from "../../helpers/strings";

export class RadioButtons {
  readonly page: Page;
  readonly radioGroup: Locator;
  readonly radioOption: Locator;

  constructor(page: Page) {
    this.page = page;
    this.radioGroup = page.getByRole("radiogroup");
    this.radioOption = page.getByTestId("radio-card-item");
  }

  getRadioButton(option: string) {
    const radioOption = this.page.getByTestId(
      `radio-card-${kebabCase(option)}`
    );
    return radioOption;
  }

  async selectRadioOption(option: string) {
    const radioOption = this.page.getByTestId(
      `radio-card-${kebabCase(option)}`
    );
    await radioOption.click();
  }
}
