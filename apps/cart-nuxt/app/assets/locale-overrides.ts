// -----------------------------------------------------------------------------
/**
 * @module assets/locale-overrides
 * @description A storefront's own wording, on top of the shared Localazy set.
 */

export const LOCALE_OVERRIDES: Record<
  string,
  () => Promise<Record<string, string>>
> = {};
