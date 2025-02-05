import type { BadgeProps } from "@upmind-automation/upmind-ui";

export interface PromotionBadgeProps {
  id?: string;
  amount?: number;
  amountFormatted?: string;
  mixed?: boolean;
  // ---
  label?: string;
  size?: BadgeProps["size"];
  variant?: BadgeProps["variant"];
  color?: BadgeProps["color"];
}
