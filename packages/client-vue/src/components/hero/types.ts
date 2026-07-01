import type { rootVariants } from "./hero.config";
import type { BadgeProps, ButtonProps } from "@upmind-automation/upmind-ui";
import type { CxOptions, VariantProps } from "class-variance-authority";

type HeroVariantProps = VariantProps<typeof rootVariants>;

export type HeroProps = {
  badge?: string | BadgeProps;
  title?: string;
  subtitle?: string;
  description?: string;
  loading?: boolean;
  size?: HeroVariantProps["size"];
  action?: ButtonProps;
  dataAttrs?: Record<`data-${string}`, string | number | boolean>;
  uiConfig?: {
    hero?: {
      root?: CxOptions;
      title?: CxOptions;
      badge?: CxOptions;
      subtitle?: CxOptions;
      description?: CxOptions;
    };
  };
};
