import { Locator, Page } from "@playwright/test";

export class Select {
  readonly selectList: Locator;
  readonly selectOption: Locator;

  constructor(page: Page) {
    this.selectList = page.getByTestId("combobox");
    this.selectOption = page.getByRole("option");
  }

  /**
   * Click a select option by its STABLE key — the `SelectItem` primitive tags
   * each option `select-item-${id || value}`, keyed off stable data (e.g. an
   * ISO country code), NOT the translated label.
   *
   * @param key - Stable option key, e.g. `GB`.
   */
  async clickSelectOption(key: string) {
    await this.selectList.getByTestId(`select-item-${key}`).click();
  }
}
