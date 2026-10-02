import { cva, type VariantProps } from "class-variance-authority";

// -----------------------------------------------------------------------------
// Pricing variants (token utilities) — the in-component cva class-organisers
// (ADR-024 D-3, replaces the retired useStyles/*.config.ts shape).

export const currentVariants = cva("text-base", {
  variants: {
    useMonthlyFromPrice: {
      true: "flex items-baseline gap-1",
      false: ""
    }
  }
});
export const exVariants = cva("text-muted text-sm font-normal");
export const termVariants = cva("text-sm font-normal");
export const currentSkeletonVariants = cva("my-px h-6 w-20");
export const exSkeletonVariants = cva("my-px h-4 w-14");

export type CurrentVariants = VariantProps<typeof currentVariants>;
export type ExVariants = VariantProps<typeof exVariants>;
