import type { Page } from "@playwright/test";

declare global {
  interface Window {
    /**
     * The live headless system, exposed on `window` when the cart runs in test
     * mode (`testMode: true`, i.e. `pnpm start:test`); `undefined` otherwise.
     */
    Upmind?: typeof import("@upmind-automation/headless");
  }
}

const BRIDGE_TIMEOUT = 15000;
const POLL_TIMEOUT = 15000;
const POLL_INTERVAL = 100;

/**
 * Waits for the live `window.Upmind` headless system to attach before any
 * bridge-driven seeding runs.
 *
 * The bridge attaches `window.Upmind` via a dynamic import during app init
 * (only in test mode), so callers must wait for it rather than racing the first
 * call. A prior `page.goto(<app URL>)` is required — no app, no bridge.
 *
 * @param page - The Playwright page (the live system lives on its `window`).
 */
export async function waitForUpmindBridge(page: Page): Promise<void> {
  await page
    .waitForFunction(
      () => !!window.Upmind?.useBasket && !!window.Upmind?.useActiveSession,
      null,
      { timeout: BRIDGE_TIMEOUT }
    )
    .catch(() => {
      throw new Error(
        "window.Upmind not exposed — is the cart running in test mode (pnpm start:test)?"
      );
    });
}

/**
 * Waits for an active session to be established, without ever exposing a token.
 *
 * Waits for the session store to initialise, then polls until the active
 * session carries an `access_token` (guest sessions carry one too). The token
 * is only read in-page for the readiness check — it never leaves the browser.
 * Use this as a readiness gate where a spec needs a session before acting.
 *
 * @param page - The Playwright page (the live system lives on its `window`).
 */
export async function waitForActiveSessionViaHeadless(
  page: Page
): Promise<void> {
  await waitForUpmindBridge(page);
  await page.evaluate(
    async ({ pollTimeout, pollInterval }) => {
      if (!window.Upmind?.useActiveSession) {
        throw new Error(
          "window.Upmind not exposed — is the cart running in test mode (pnpm start:test)?"
        );
      }
      const session = window.Upmind.useActiveSession();
      await session.useActions().isReady();
      const { session: token } = session.useContext();

      const deadline = Date.now() + pollTimeout;
      while (Date.now() < deadline) {
        if (token.value?.access_token) return;
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
      throw new Error(
        "waitForActiveSessionViaHeadless: no access_token on the active session — is a session established?"
      );
    },
    { pollTimeout: POLL_TIMEOUT, pollInterval: POLL_INTERVAL }
  );
}
