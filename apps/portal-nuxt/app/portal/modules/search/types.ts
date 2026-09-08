// -----------------------------------------------------------------------------
/**
 * @module portal/modules/search/types
 * @description Prop contract for the `search` module (tasks.md 5.2), over
 * `@upmind/ui`'s `Search`.
 */

import type { SearchItem, SearchProps } from "@upmind/ui";

export interface SearchModuleProps {
  /** The full fixture dataset the module filters locally — never fetched (tasks.md 5.7). */
  readonly items: readonly SearchItem[];
  readonly placeholder?: SearchProps["placeholder"];
  readonly minQueryLength?: SearchProps["minQueryLength"];
  /** Empty-state heading when `items` (the fixture dataset) is empty. No English default (CC22). */
  readonly emptyTitle: string;
  readonly emptyDescription?: string;
}
