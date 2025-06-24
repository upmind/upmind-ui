import type { HTMLAttributes } from "vue";
import type { CxOptions, VariantProps } from "class-variance-authority";

// --- internal
import {
  rootVariants,
  buttonVariants,
  infoVariants,
} from "./pagination.config";

type PaginationRootVariantProps = VariantProps<typeof rootVariants>;

/**
 * @property {number} total - Total number of items in the query.
 * @property {number} page - Current page index.
 * @property {number} pages - Total number of pages.
 * @property {number} limit - Number of items per page.
 * @property {number} from - The starting item index for the current page.
 * @property {number} to - The ending item index for the current page.
 */
export interface PaginationProps {
  total: number;
  page: number;
  pages: number;
  limit: number;
  from?: number;
  to?: number;
  // --- variants
  size?: PaginationRootVariantProps["size"] | string;
  alignment?: PaginationRootVariantProps["alignment"] | string;
  // --- styles
  uiConfig?: { pagination?: CxOptions };
  class?: HTMLAttributes["class"];
}
