import { cva, type VariantProps } from "class-variance-authority";

// -----------------------------------------------------------------------------
// Pricing-list (summary) variants (token utilities) — the in-component cva
// class-organisers (ADR-024 D-3, replaces the retired useStyles/*.config.ts).

export const summaryPricingTotalVariants = cva("text-left text-xl");
export const summaryPricingPriceVariants = cva(
  "items-center justify-between font-medium",
  {
    variants: {
      footer: {
        false: "mt-4 flex",
        true: "hidden lg:flex"
      }
    }
  }
);
export const summaryPricingRegularPriceVariants = cva(
  "text-muted text-right text-xs line-through"
);
export const summaryPricingCurrentPriceVariants = cva(
  "flex items-center gap-2 text-right text-3xl"
);

export const summaryListRootVariants = cva(
  "m-0 flex flex-col gap-y-2.5 text-sm"
);
export const summaryListItemRootVariants = cva(
  "flex list-none justify-between text-sm"
);
export const summaryListItemCategoryVariants = cva("text-muted font-normal");
export const summaryListItemTitleVariants = cva("font-normal");

export const summaryFooterVariants = cva(
  "flex w-full flex-col items-center gap-4 gap-y-6 md:flex-row"
);

export const summarySkeletonRootVariants = cva("-mb-1.5 flex justify-between");
export const summarySkeletonItemLongVariants = cva("h-6 w-36");
export const summarySkeletonItemShortVariants = cva("h-6 w-24");

export type SummaryPricingPriceVariants = VariantProps<
  typeof summaryPricingPriceVariants
>;
