import { Page, Locator } from "@playwright/test";

export class Form {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * @param field - The form field's STABLE data-test-value (the schema-derived
   *   field name, NOT a translated label), e.g. `provision-fields-sld` — form
   *   items carry the static key `form-item` with the field in
   *   `data-test-value`.
   */
  async getFormField(field: string) {
    return this.page
      .getByTestId("form-item")
      .and(this.page.locator(`[data-test-value="${field}"]`));
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
