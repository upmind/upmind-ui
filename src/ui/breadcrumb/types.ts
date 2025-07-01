// --- external
import { type HTMLAttributes } from "vue";
import type { CxOptions, VariantProps } from "class-variance-authority";

// --- internal
import type { breadcrumbVariants } from "./breadcrumb.config";

type BreadcrumbConsolidateVariantProps = VariantProps<
  typeof breadcrumbVariants
>;

export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
  onClick?: () => void;
}

export interface BreadcrumbConsolidateProps {
  items: BreadcrumbItem[];
  // --- variants
  size?: BreadcrumbConsolidateVariantProps["size"] | string;
  // --- styles
  uiConfig?: { breadcrumbConsolidate?: CxOptions };
  class?: HTMLAttributes["class"];
}
