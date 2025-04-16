// --- external
import { type HTMLAttributes } from "vue";
import type { CxOptions, VariantProps } from "class-variance-authority";

// --- internal
import type { Icon } from "../icon/types";
import type { alertVariants } from "./alert.config";
type AlertVariantProps = VariantProps<typeof alertVariants>;

export interface AlertProps {
  /** The title of the alert */
  title: string;
  /** An optional description of the alert */
  description?: string;
  /** An optional icon for the alert */
  icon?: string | Icon;
  // ---
  variant?: AlertVariantProps["variant"] | string;
  color?: AlertVariantProps["color"] | string;
  // ---
  uiConfig?: { alert: CxOptions };
  class?: HTMLAttributes["class"];
}
