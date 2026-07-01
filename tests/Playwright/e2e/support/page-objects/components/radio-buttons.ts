import { Locator, Page } from "@playwright/test";

export class RadioButtons {
  readonly page: Page;
  readonly radioGroup: Locator;
  readonly radioOption: Locator;

  constructor(page: Page) {
    this.page = page;
    this.radioGroup = page.getByRole("radiogroup");
    this.radioOption = page.getByTestId("radio-card-item");
  }

  /**
   * Locate a radio card by its STABLE cascade key — the `RadioCards` primitive
   * tags each card `radio-card-${id || value}`, keyed off stable data (term
   * `cycle`, subproduct `opt.id`), NOT the translated label.
   *
   * @param key - Stable cascade key, e.g. `12` (a term cycle) or a subproduct id.
   */
  getRadioButton(key: string | number) {
    return this.page.getByTestId(`radio-card-${key}`);
  }

  async selectRadioOption(key: string | number) {
    await this.getRadioButton(key).click();
  }
}
