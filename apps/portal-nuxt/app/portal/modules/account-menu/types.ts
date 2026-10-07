// -----------------------------------------------------------------------------
/**
 * @module portal/modules/account-menu/types
 * @description Prop contract for the `account-menu` module — legacy's topbar
 * profile-dropdown: the avatar opening the account destinations. Items are
 * config-authored; each emits its `value` through the action seam (the
 * `navigate:` verb for destinations).
 */

export type AccountMenuItem = {
  readonly value: string;
  readonly label: string;
};

export type AccountMenuModuleProps = {
  /** Accessible name for the avatar trigger. No English default (CC22). */
  readonly label: string;
  /** The identity line at the top of the menu — who is signed in. */
  readonly heading?: string;
  /** Avatar image; absent falls back to the monogram. */
  readonly imageSrc?: string;
  /** The avatar's monogram glyph when no image renders. */
  readonly monogram?: string;
  readonly items: readonly AccountMenuItem[];
};

export type AccountMenuModuleEmits = {
  select: [value: string];
};
