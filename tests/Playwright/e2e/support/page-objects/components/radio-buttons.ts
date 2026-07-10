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
   * Locate a radio card by its stable value — the `RadioCards` primitive tags
   * every card with the STATIC key `radio-card-item` and carries the stable
   * datum (term `cycle`, subproduct `opt.id`) in `data-test-value`.
   *
   * @param key - Stable value, e.g. `12` (a term cycle) or a subproduct id.
   */
  getRadioButton(key: string | number) {
    return this.page
      .getByTestId("radio-card-item")
      .and(this.page.locator(`[data-test-value="${key}"]`));
  }

  async selectRadioOption(key: string | number) {
    await this.getRadioButton(key).click();
  }
}
