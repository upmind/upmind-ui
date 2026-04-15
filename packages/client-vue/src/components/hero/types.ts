import type { BadgeProps, ButtonProps } from "@upmind-automation/upmind-ui";
import type { CxOptions } from "class-variance-authority";
import type { variants } from "./hero.config";

export type HeroSize = keyof typeof variants.size;

export type HeroProps = {
  badge?: string | BadgeProps;
  title?: string;
  subtitle?: string;
  description?: string;
  loading?: boolean;
  size?: HeroSize;
  action?: ButtonProps;
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
