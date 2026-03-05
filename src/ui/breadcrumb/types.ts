// --- external
import type { LinkProps } from "../link/types";
import type { CxOptions } from "class-variance-authority";
import type { HTMLAttributes } from "vue";
// --- internal
import type { RouterLinkProps } from "vue-router";

export type BreadcrumbItem = RouterLinkProps & {
  label?: string;
  icon?: string;
  current?: boolean;
  value?: string | number;
  handler?: Function;
  href?: string;
}

export type BreadcrumbVariant = "visible" | "condensed" | "parent" | "hidden";

export type BreadcrumbConsolidateProps = {
  items: BreadcrumbItem[];
  // --- variants
  variant?: BreadcrumbVariant;
  size?: LinkProps["size"];
  separator?: string;
  // --- styles
  uiConfig?: { breadcrumbConsolidate?: CxOptions };
  class?: HTMLAttributes["class"];
}
