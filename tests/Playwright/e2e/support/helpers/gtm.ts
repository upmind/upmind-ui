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
 * Waits for a specific event to be present in the GTM dataLayer.
 * Uses polling to check for the event at regular intervals.
 *
 * @param page - Playwright Page object
 * @param eventName - The event name to search for in the dataLayer
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
