import { Page, Locator } from "@playwright/test";

export class ProductSetup {
  readonly page: Page;
  readonly section: Locator;
  readonly setupForm: Locator;
  readonly heroTitle: Locator;
  readonly progress: Locator;
  readonly continueButton: Locator;
  readonly backToBasketButton: Locator;
  readonly errorAlert: Locator;
  readonly applyToOthersGroup: Locator;
  readonly currentProductLabel: Locator;
  readonly termFormItem: Locator;
  readonly optionsFormItem: Locator;

  constructor(page: Page) {
    this.page = page;
    this.section = page
      .getByTestId("section")
      .and(page.locator('[data-test-value="product-setup-title"]'));
    this.setupForm = page.locator("#setup-form");
    this.heroTitle = page.getByTestId("product-setup-hero-title");
    this.progress = page.getByTestId("product-setup-progress");
    this.continueButton = page.locator("button[form='setup-form']");
    this.backToBasketButton = page.getByTestId("button-back-to-basket");
    // Setup.vue's error <Alert> carries no explicit testid (falls back to the
    // primitive `alert`); locate by role, which is locale-stable (no name).
    this.errorAlert = page.getByRole("alert");
    this.applyToOthersGroup = page.getByTestId("apply-to-others-group");
    this.currentProductLabel = this.section.getByRole("heading").first();
    this.termFormItem = page
      .getByTestId("form-item")
      .and(page.locator('[data-test-value="term"]'));
    this.optionsFormItem = page.getByTestId("options-container-options");
  }

  applyToOthersItem(bpid: string): Locator {
    return this.applyToOthersGroup.locator(`[value='${bpid}']`);
  }

  fieldFor(key: string): Locator {
    return this.page
      .getByTestId("form-item")
      .and(
        this.page.locator(`[data-test-value="provision-fields-update-${key}"]`)
      );
  }

  async visibleFieldKeys(): Promise<string[]> {
    const handles = await this.setupForm
      .getByTestId("form-item")
      .and(
        this.setupForm.locator('[data-test-value^="provision-fields-update-"]')
      )
      .elementHandles();
    const keys: string[] = [];
    for (const h of handles) {
      const value = await h.getAttribute("data-test-value");
      if (value) keys.push(value.replace("provision-fields-update-", ""));
    }
    return keys;
  }

  async submit() {
    await this.continueButton.click();
  }

  async back() {
    await this.backToBasketButton.click();
  }
}
