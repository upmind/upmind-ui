import { Page, Locator } from "@playwright/test";
import { kebabCase } from "../../utils/functions/helpers";

export class Form {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async getFormField(label: string) {
    const formField = this.page.getByTestId(`form-item-${kebabCase(label)}`);
    return formField;
  }

  async getFormInput(label: string): Promise<Locator> {
    const formField = await this.getFormField(label);
    const formInput = await formField.locator("input, textarea, select");
    return formInput;
  }

  async fillFormInput(label: string, content: string) {
    let inputField = await this.getFormInput(label);
    await inputField.fill(content);
  }

  async clearFormInput(label: string) {
    const formInput = await this.getFormInput(label);
    return formInput.clear();
  }
}
