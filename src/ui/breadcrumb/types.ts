// --- external
import { type HTMLAttributes } from "vue";
import type { CxOptions, VariantProps } from "class-variance-authority";

// --- internal
import type { rootVariants } from "./breadcrumb.config";
import type { RouterLinkProps } from "vue-router";

type BreadcrumbConsolidateVariantProps = VariantProps<typeof rootVariants>;

export interface BreadcrumbItem extends RouterLinkProps {
  label: string;
  current?: boolean;
  value?: string | number;
  handler?: Function;
}

export interface BreadcrumbConsolidateProps {
  items: BreadcrumbItem[];
  // --- variants
  size?: BreadcrumbConsolidateVariantProps["size"] | string;
  // --- styles
  uiConfig?: { breadcrumbConsolidate?: CxOptions };
  class?: HTMLAttributes["class"];
}
