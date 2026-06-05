import { Page, Locator } from "@playwright/test";

/**
 * Page object for the guest-checkout entry points and account menu on the
 * register page (FE-1035). All selectors for the guest-checkout journey live
 * here; specs call these methods rather than referencing testids directly.
 */
export class GuestCheckout {
  readonly page: Page;
  /** The guest-checkout CTA link (explicit, label-independent `data-testid`). */
  readonly cta: Locator;
  /** Avatar / account-menu dropdown trigger. */
  readonly avatar: Locator;
  /** Opened dropdown menu content (role="menu"). */
  readonly accountMenu: Locator;
  /** Account label inside the dropdown — "Guest" or the client's full name. */
  readonly accountLabel: Locator;
  /**
   * "Register" (create a full account) menu item, scoped INSIDE the opened
   * dropdown menu. Disambiguates from the Auth upgrade form's own
   * `button-register` submit, which shares the same testid on this page.
   */
  readonly upgradeMenuItem: Locator;
  /**
   * The guest upgrade form. Rendered by the shared `Auth` session-form; for a
   * guest client `Auth`'s `currentForm` is `AUTH_FORM.GUEST_REGISTER`, so the
   * form's `data-testid` is `guest-register-form` (enum-derived from the
   * `AUTH_FORM` value). There is no `#guest-registration` on the register page
   * anymore (only the order page).
   */
  readonly upgradeForm: Locator;
  /**
   * Submit button of the upgrade form, scoped INSIDE the upgrade form. Form
   * action buttons are testid'd `button-<kebab(label)>`; the guest upgrade
   * submit label is `action.register` → `button-register` (label-derived, so it
   * tracks the i18n label). Shares the testid with the dropdown's register
   * menu item, hence the scoping to `upgradeForm` / `accountMenu` respectively.
   */
  readonly upgradeFormSubmit: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cta = page.getByTestId("guest-checkout-cta");
    this.avatar = page.getByTestId("auth-avatar");
    this.accountMenu = page.getByRole("menu");
    this.accountLabel = page.getByTestId("dropdown-account-label");
    this.upgradeMenuItem = this.accountMenu.getByTestId("button-register");
    this.upgradeForm = page.getByTestId("guest-register-form");
    this.upgradeFormSubmit = this.upgradeForm.getByTestId("button-register");
  }

  /** Enter guest checkout by clicking the CTA. */
  async enterGuestCheckout() {
    await this.cta.click();
  }

  /** Open the account menu by clicking the avatar trigger. */
  async openAccountMenu() {
    await this.avatar.click();
  }
}
