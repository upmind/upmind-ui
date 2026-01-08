import { Page, Locator, expect } from "@playwright/test";

type SelectRadixRadioOptions = {
  scope?: Locator;
  name?: string;
  testId?: string;
  maxRetries?: number;
  retryDelayMs?: number;
};

export async function selectRadixRadio(
  page: Page,
  options: SelectRadixRadioOptions
) {
  const { scope, name, testId, maxRetries = 10, retryDelayMs = 50 } = options;

  if (!name && !testId) {
    throw new Error("selectRadixRadio requires either { name } or { testId }");
  }

  const root = scope ?? page;

  // Locate the radio button or role
  const radio = name
    ? root.getByRole("radio", { name })
    : root.getByTestId(testId!).getByRole("radio");

  await expect(radio, "Radix radio not visible").toBeVisible();

  // Already checked?
  if ((await radio.getAttribute("aria-checked")) === "true") return;

  // ✅ Locate the parent label
  const label = radio.locator("xpath=ancestor::label[1]");

  await expect(label, "Radix radio label not found").toBeVisible();

  // Click the label — this triggers Radix safely
  await label.click({ force: true });

  // Wait for Radix state
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const checked = await radio.getAttribute("aria-checked");
    if (checked === "true") return;
    await page.waitForTimeout(retryDelayMs);
  }

  throw new Error(
    `Radix radio did not become checked after ${maxRetries} attempts`
  );
}
