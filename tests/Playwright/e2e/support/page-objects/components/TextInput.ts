import { Locator, Page } from "@playwright/test";

export class TextInput {
  readonly textInput: Locator;

  constructor(page: Page) {
    this.textInput = page.getByTestId("text-input");
  }

  getTextInputField(container: Locator) {
    const getTextInput = container.locator(this.textInput);
    return getTextInput;
  }
}
