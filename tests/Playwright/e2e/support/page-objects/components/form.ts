import { Page, Locator } from "@playwright/test";
import { kebabCase } from "../../helpers/strings";

export class Form {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async getFormField(field: string) {
    const formField = this.page.getByTestId(`${kebabCase(field)}`);
    return formField;
  }

  async getFormInput(field: string): Promise<Locator> {
    const formField = await this.getFormField(field);
    const formInput = await formField.locator("input, textarea, select");
    return formInput;
  }

  async fillFormInput(field: string, content: string) {
    let inputField = await this.getFormInput(field);
    await inputField.fill(content);
  }

  async clearFormInput(field: string) {
    const formInput = await this.getFormInput(field);
    return formInput.clear();
  }
}
