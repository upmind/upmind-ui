import type { rootVariants as alertVariants } from "./alert.config";
import type { Icon } from "../icon/types";
import type { LinkProps } from "../link/types";
import type { CxOptions, VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "vue";

type AlertVariantProps = VariantProps<typeof alertVariants>;

export interface AlertProps {
  /** The title of the alert */
  title?: string;
  /** An optional description of the alert */
  description?: string;
  /** An optional icon for the alert */
  icon?: string | Icon;
  /** An optional action for the alert */
  action?: LinkProps;
  // ---
  variant?: AlertVariantProps["variant"];
  color?: AlertVariantProps["color"];
  size?: AlertVariantProps["size"];
  // ---
  uiConfig?: { alert: CxOptions };
  class?: HTMLAttributes["class"];
}
