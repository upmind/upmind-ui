// -----------------------------------------------------------------------------
/**
 * @module portal/modules/brand/types
 * @description Prop contract for the `brand` module — the portal's own mark
 * and wordmark, linking home. The `identity` accept tag existed from Stage 1
 * (`primitives.ts`) with no module able to fill it: a shape with no sidebar
 * had nowhere to put its logo at all, which is why the booking shape rendered
 * with an empty topbar-left.
 */

/**
 * Which mark renders beside the wordmark. The references split three ways:
 * a monogram chip (Strata's "S"), a photo (Host·Grid's account avatar), or
 * none at all (Host·Grid's sidebar, wordmark only). Absent = `monogram`.
 */
export const BRAND_MARK = {
  MONOGRAM: "monogram",
  IMAGE: "image",
  NONE: "none"
} as const;

export type BrandMark = (typeof BRAND_MARK)[keyof typeof BRAND_MARK];

export interface BrandModuleProps {
  /** The wordmark. No English default (CC22). */
  readonly label: string;
  /** Which mark renders (BRAND_MARK). Absent = monogram. */
  readonly mark?: BrandMark;
  /** The mark's glyph — a short monogram. Defaults to the label's first character. */
  readonly monogram?: string;
  /** `image` mark only — the photo it renders. */
  readonly imageSrc?: string;
  /** Where the mark links. */
  readonly to?: string;
  /**
   * An EXTERNAL destination for the mark — the brand's own site, where it
   * publishes one (`UI_LOGO_URL`, legacy `clientHeader.vue:36-42`). Set, the
   * mark leaves the portal and `to` is never used; the module renders, it
   * does not decide which of the two the brand meant.
   */
  readonly href?: string;
  /** Wordmark visually hidden, mark only — the topbar's avatar chip. The label stays the accessible name. */
  readonly markOnly?: boolean;
  /** The sidebar rail's collapsed state; the wordmark hides while collapsed, the mark stays. */
  readonly collapsed?: boolean;
}
