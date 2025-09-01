// --- external
import { type HTMLAttributes } from "vue";
import type { CxOptions } from "class-variance-authority";

// --- internal
import type { ButtonProps } from "../button/types";
import type { RouterLinkProps } from "vue-router";

export interface BreadcrumbItem extends RouterLinkProps {
  label: string;
  current?: boolean;
  value?: string | number;
  handler?: Function;
  href?: string;
}

export interface BreadcrumbConsolidateProps {
  items: BreadcrumbItem[];
  // --- variants
  size?: ButtonProps["size"] | string;
  separator?: string;
  // --- styles
  uiConfig?: { breadcrumbConsolidate?: CxOptions };
  class?: HTMLAttributes["class"];
}
