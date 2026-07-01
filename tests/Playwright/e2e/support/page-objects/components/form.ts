import { Page, Locator } from "@playwright/test";

export class Form {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * @param testId - The form field's STABLE, explicit testid (NOT a translated
   *   label), e.g. `form-item-provision-fields-sld`.
   */
  async getFormField(testId: string) {
    return this.page.getByTestId(testId);
  }

  async getFormInput(testId: string): Promise<Locator> {
    const formField = await this.getFormField(testId);
    const formInput = await formField.locator("input, textarea, select");
    return formInput;
  }

  async fillFormInput(testId: string, content: string) {
    let inputField = await this.getFormInput(testId);
    await inputField.fill(content);
  }

  async clearFormInput(testId: string) {
    const formInput = await this.getFormInput(testId);
    return formInput.clear();
  }
}
