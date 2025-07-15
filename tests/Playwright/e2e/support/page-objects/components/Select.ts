import { Locator, Page } from "@playwright/test";

export class Select {
  readonly selectList: Locator;
  readonly selectOption: Locator;

  constructor(page: Page) {
    this.selectList = page.getByTestId("combobox");
    this.selectOption = page.getByRole("option");
  }

  getSelectOption(option: string) {
    const selectList = this.selectList;
    const selectOption = selectList.getByText(option);
    return selectOption;
  }
}
