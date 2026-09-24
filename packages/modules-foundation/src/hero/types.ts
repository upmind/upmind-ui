import type { heroRootVariants } from "./variants";
import type { BadgeInput } from "@upmind-automation/headless";
import type { VariantProps } from "class-variance-authority";

type HeroVariantProps = VariantProps<typeof heroRootVariants>;

/** The Hero CTA — rendered as a subtle Button; icon/label go in the slot. */
export type HeroActionProps = {
  label?: string;
  icon?: string;
  disabled?: boolean;
  loading?: boolean;
  dataAttrs?: Record<`data-${string}`, string | number | boolean>;
};

export type HeroProps = {
  badge?: BadgeInput;
  title?: string;
  /** Extra classes merged onto the title/description elements (template-direction styling). */
  titleClass?: string;
  descriptionClass?: string;
  subtitle?: string;
  description?: string;
  loading?: boolean;
  size?: HeroVariantProps["size"];
  action?: HeroActionProps;
  dataAttrs?: Record<`data-${string}`, string | number | boolean>;
};
