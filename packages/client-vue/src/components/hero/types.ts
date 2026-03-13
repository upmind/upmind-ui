import type { BadgeProps, ButtonProps } from "@upmind-automation/upmind-ui";
import type { CxOptions } from "class-variance-authority";

export interface HeroProps {
  badge?: string | BadgeProps;
  title?: string;
  subtitle?: string;
  description?: string;
  loading?: boolean;
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
}
