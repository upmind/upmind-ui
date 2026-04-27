import { BrowserContext, expect } from "@playwright/test";

/**
 * Polls the browser context until a session cookie is present.
 * Waits for either the guest or client session cookie to appear.
 *
 * @param context - Playwright BrowserContext
 * @param options - Optional configuration
 * @param options.timeout - Maximum time to wait in ms (default: 30000)
 * @param options.guestOnly - When true, only waits for the guest session cookie
 */
export async function waitForSessionCookie(
  context: BrowserContext,
  options: { timeout?: number; guestOnly?: boolean } = {}
): Promise<void> {
  const { timeout = 30000, guestOnly = false } = options;
  await expect
    .poll(
      async () => {
        const cookies = await context.cookies();
        return cookies.some(c =>
          guestOnly
            ? c.name === "upm_guest_session"
            : c.name === "upm_guest_session" || c.name === "upm_client_session"
        );
      },
      { timeout }
    )
    .toBeTruthy();
}
