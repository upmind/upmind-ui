// --- external
import { type HTMLAttributes } from "vue";
import type { CxOptions } from "class-variance-authority";

// --- internal
import type { LinkProps } from "../link/types";
import type { RouterLinkProps } from "vue-router";

export interface BreadcrumbItem extends RouterLinkProps {
  label?: string;
  icon?: string;
  current?: boolean;
  value?: string | number;
  handler?: Function;
  href?: string;
}

export type BreadcrumbVariant = "visible" | "condensed" | "parent" | "hidden";

export interface BreadcrumbConsolidateProps {
  items: BreadcrumbItem[];
  // --- variants
  variant?: BreadcrumbVariant;
  size?: LinkProps["size"];
  separator?: string;
  // --- styles
  uiConfig?: { breadcrumbConsolidate?: CxOptions };
  class?: HTMLAttributes["class"];
}
