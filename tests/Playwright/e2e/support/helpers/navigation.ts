import { Page } from "@playwright/test";

/**
 * Waits for the page URL to match the expected value.
 * Useful for SPAs where URL updates may lag behind element rendering.
 *
 * @param page - Playwright Page object
 * @param expectedUrl - The exact URL string, glob pattern, or RegExp to match
 * @param options - Optional configuration
 * @param options.timeout - Maximum time to wait in ms (default: 10000)
 */
export async function waitForUrlChange(
  page: Page,
  expectedUrl: string | RegExp,
  options: { timeout?: number } = {}
): Promise<void> {
  const { timeout = 10000 } = options;
  await page.waitForURL(expectedUrl, { timeout });
}
