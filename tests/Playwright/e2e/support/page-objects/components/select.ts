import { Locator, Page } from "@playwright/test";
import { kebabCase } from "../../helpers/strings";

export class Select {
  readonly selectList: Locator;
  readonly selectOption: Locator;

  constructor(page: Page) {
    this.selectList = page.getByTestId("combobox");
    this.selectOption = page.getByRole("option");
  }

  async clickSelectOption(option: string) {
    const selectOption = this.selectList.getByTestId(
      `select-item-${kebabCase(option)}`
    );
    await selectOption.click();
  }
}
