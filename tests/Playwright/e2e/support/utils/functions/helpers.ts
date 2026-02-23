import { Page } from "@playwright/test";

interface DataLayerEntry {
  event?: string;
  [key: string]: unknown;
}

/**
 * Retrieves the GTM dataLayer from the page window object.
 */
export async function getDataLayer(
  page: Page
): Promise<DataLayerEntry[] | undefined> {
  return page.evaluate(() => {
    return (window as Window & { dataLayer?: DataLayerEntry[] }).dataLayer;
  });
}

/**
 * Waits for the gtm.historyChange-v2 event to be present in the dataLayer.
 * Uses polling to check for the event at regular intervals.
 *
 * @param page - Playwright Page object
 * @param options - Optional configuration
 * @param options.timeout - Maximum time to wait in ms (default: 10000)
 * @param options.pollInterval - Interval between checks in ms (default: 100)
 * @returns The matching dataLayer entry, or throws if timeout exceeded
 */
export async function waitForEvent(
  page: Page,
  eventName: string,
  options: { timeout?: number; pollInterval?: number } = {}
): Promise<DataLayerEntry> {
  const { timeout = 10000, pollInterval = 100 } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const dataLayer = await getDataLayer(page);
    const event = dataLayer?.find(entry => entry.event === eventName);

    if (event) {
      return event;
    }

    await page.waitForTimeout(pollInterval);
  }

  throw new Error(`Timeout waiting for event after ${timeout}ms`);
}

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

export function kebabCase(input: string): string {
  return input
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

export function getFormattedDate(): string {
  const now = new Date();
  const month = now.toLocaleString("en-US", { month: "short" });
  const day = now.getDate();
  const year = now.getFullYear();
  // Add ordinal suffix
  const suffix = (d: number) => {
    if (d > 3 && d < 21) return "th";
    switch (d % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };
  return `${month} ${day}${suffix(day)}, ${year}`;
}

export function getTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
