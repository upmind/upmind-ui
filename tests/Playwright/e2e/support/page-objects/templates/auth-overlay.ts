import { Page, Locator, expect } from "@playwright/test";

/**
 * Page object for the deep-linkable auth overlay (FE-1365 / FE-2790).
 *
 * The auth overlay is registered as an `OverlayType.MODAL` route, so the
 * `OverlayController` mounts it inside a `Dialog` whose content element carries
 * the shared `dialog-window` testid (see `packages/ui` DialogContent). The
 * overlay hosts the same `Auth` component as the standalone `/auth` page, so the
 * login form inside it is driven through the existing `Login` page object — this
 * object owns only the overlay *container* and its open/closed state.
 *
 * NB: the auth overlay is rendered `dismissable="false"`, so Escape/backdrop do
 * not close it. Its exits are browser-back and sign-in success (auth resolving
 * → the controller's `close()` → the return target).
 */
export class AuthOverlay {
  readonly page: Page;
  /** The modal content host — present only while the overlay is open. */
  readonly window: Locator;

  constructor(page: Page) {
    this.page = page;
    this.window = page.getByTestId("dialog-window");
  }

  /** The overlay is mounted and visible. */
  async expectOpen(timeout = 15000) {
    await expect(this.window).toBeVisible({ timeout });
  }

  /** The overlay is gone from the DOM / no longer visible. */
  async expectClosed(timeout = 15000) {
    await expect(this.window).toBeHidden({ timeout });
  }
}
