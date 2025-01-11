// --- external
import { type HTMLAttributes } from "vue";
import type { VariantProps } from "class-variance-authority";

// --- internal
import type { IconProps } from "../icon";
import type { alertVariants } from "./alert.config";
type AlertVariantProps = VariantProps<typeof alertVariants>;

export interface AlertProps {
  title?: string;
  description?: string;
  icon?: IconProps["icon"];
  action?: string;
  // ---
  variant?: AlertVariantProps["variant"];
  color?: AlertVariantProps["color"];
  border?: boolean;
  // ---
  upmindUIConfig?: { alert: Partial<AlertProps> };
  class?: HTMLAttributes["class"];
}
