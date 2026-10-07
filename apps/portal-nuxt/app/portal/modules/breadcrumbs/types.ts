// -----------------------------------------------------------------------------
/**
 * @module portal/modules/breadcrumbs/types
 * @description Prop contract for the `breadcrumbs` module (tasks.md 5.1),
 * over `@upmind/ui`'s `Breadcrumb`.
 */

import type { BreadcrumbProps, Crumb } from "@upmind/ui";
// -----------------------------------------------------------------------------

export type BreadcrumbsModuleProps = {
  /** The trail, in order; the last crumb is usually `current`. */
  readonly items: readonly Crumb[];
  /** Accessible label for a collapsed-crumbs marker. Required by `Breadcrumb` itself; no English default (CC22). */
  readonly moreLabel: string;
  /** Separator text between crumbs; `Breadcrumb`'s own default is the chevron glyph. */
  readonly separator?: BreadcrumbProps["separator"];
  /** Empty-state heading when `items` is empty (tasks.md 5.6). No English default (CC22). */
  readonly emptyTitle: string;
  readonly emptyDescription?: string;
};
