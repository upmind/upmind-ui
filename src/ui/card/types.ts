// --- external
import type { rootVariants } from "./card.config";
import type { VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "vue";
// --- types

type CardVariantProps = VariantProps<typeof rootVariants>;

export interface CardProps {
  as?: string;
  class?: HTMLAttributes["class"];
  disabled?: boolean;
  padding?: CardVariantProps["padding"];
  width?: CardVariantProps["width"];
}
