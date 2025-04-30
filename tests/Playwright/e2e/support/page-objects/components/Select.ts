import { Locator, Page } from "@playwright/test";

export class Select {
  readonly select: Locator;

  constructor(page: Page) {
    this.select = page.locator("select");
  }

  getSelectOption(option: string) {
    const selectList = this.select.first();
    const selectOption = selectList.selectOption(option);
    return selectOption;
  }
}
