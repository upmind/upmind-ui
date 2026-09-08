// -----------------------------------------------------------------------------
/**
 * @module portal/modules/pagination/types
 * @description Prop contract for the `pagination` module — a row's trailing
 * pager, over `@upmind/ui`'s `Pagination`. Every reference portal that pages
 * a panel puts one here (Rockzone's "‹ Previous · This Week · W20 · Next ›").
 */

/**
 * A LIVE pager's whole feed — built by one data ref from a mock collection
 * facade's `PaginationInfo` (plan §2 pager wiring). One object prop because
 * `resolveDataRefProps` resolves refs per prop VALUE: a built object needs a
 * single prop to land in.
 */
export interface PaginationModuleState {
  /** How many items the collection spans. */
  readonly total: number;
  /** Items per page — the facade's `pagination.limit`. */
  readonly itemsPerPage: number;
  /** The CURRENT page (1-based) — the facade owns it; this module renders it. */
  readonly page: number;
  /** The action value the previous arrow emits (the PAGE_PREV verb). */
  readonly prevValue?: string;
  /** The action value the next arrow emits (the PAGE_NEXT verb). */
  readonly nextValue?: string;
  /** The showing page size, as the select reads it. */
  readonly pageSizeValue?: string;
  /** Emit prefix for the page size: `set-page-size:<id>`; the module appends `:<n>`. */
  readonly pageSizeAction?: string;
  /** Accessible name for the page-size select. The selector authors it (CC22). */
  readonly pageSizeLabel?: string;
  /** Rendered verbatim; the selector authors them. */
  readonly pageSizeOptions?: readonly { value: string; label: string }[];
}

export interface PaginationModuleProps {
  /**
   * The live feed. Present, it drives the pager (and wins over the flat
   * props); the pager self-hides at one page. Absent, the flat props render
   * the DECORATIVE form exactly as before (Rockzone's brand panel).
   */
  readonly state?: PaginationModuleState;
  /** How many items the pager spans (decorative form). */
  readonly total?: number;
  /** Items per page; the pager derives its page count from this and `total` (decorative form). */
  readonly itemsPerPage?: number;
  /** Accessible name for the pager's own landmark. No English default (CC22). */
  readonly label: string;
  /**
   * What sits between the two arrows. Absent renders the page position
   * (`2 / 6`) — digits, never untranslated copy invented in the library.
   */
  readonly info?: string;
}

export type PaginationModuleEmits = {
  /** An arrow's action value — the same seam every module's actions ride. */
  select: [value: string];
};
