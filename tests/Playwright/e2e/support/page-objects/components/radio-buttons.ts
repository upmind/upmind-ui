import { Locator, Page } from "@playwright/test";

export class RadioButtons {
  readonly page: Page;
  readonly radioGroup: Locator;
  readonly radioOption: Locator;

  constructor(page: Page) {
    this.page = page;
    this.radioGroup = page.getByRole("radiogroup");
    this.radioOption = page.getByRole("radio");
  }

  /**
   * Locate an option tile by its STABLE cascade key — `OptionTile` emits
   * `option-tile-${id || value}` via its `testId` prop, keyed off stable data
   * (term `cycle`, subproduct `opt.id`), NOT the translated label.
   *
   * @param key - Stable value, e.g. `12` (a term cycle) or a subproduct id.
   */
  getRadioButton(key: string | number) {
    return this.page.getByTestId(`option-tile-${key}`);
  }

  async selectRadioOption(key: string | number) {
    await this.getRadioButton(key).click();
  }
}
