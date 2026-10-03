import { cva } from "class-variance-authority";

// -----------------------------------------------------------------------------
// Summary variants (token utilities) — the in-component cva class-organisers
// (ADR-024 D-3, replaces the retired useStyles/*.config.ts).

export const summaryRootVariants = cva("flex flex-col gap-2 font-normal");
export const summarySkeletonVariants = cva("my-px ml-auto h-5 w-16");

export const summaryItemRootVariants = cva(
  "col-span-2 flex items-center justify-between font-medium"
);
export const summaryItemTermVariants = cva("flex-shrink-0 text-left text-xl");
export const summaryItemDescriptionVariants = cva(
  "flex items-center gap-2 text-right text-3xl"
);
export const summaryItemSkeletonVariants = cva("my-px h-8 w-24");

// -----------------------------------------------------------------------------
// Breakdown presentation (ui.basketSummaryDetails). Per-product blocks, then
// adjustments (discount/taxes) and the total, separated by inset dividers.
// gap-4 mirrors the pt-4 under each divider so spacing stays symmetric;
// configuration lines sit flush, on line-height alone.

export const summarySectionsVariants = cva("flex flex-col gap-4 font-normal");
export const summaryProductsVariants = cva("flex flex-col gap-6 text-sm");

// Per-product block: priced header, optional per-unit subtitle, and the
// configuration lines enclosed in a muted container. The container carries a
// label + unit-price footer only when quantity > 1.
export const summaryProductRootVariants = cva("flex flex-col");
export const summaryProductHeaderVariants = cva(
  "flex items-baseline justify-between gap-4"
);
export const summaryProductTitleVariants = cva("font-medium");
export const summaryProductMultiplierVariants = cva(
  "text-muted ml-1 font-normal"
);
export const summaryProductTotalVariants = cva(
  "shrink-0 text-right font-medium"
);
export const summaryProductSubtitleVariants = cva("text-muted text-sm");

// -mx-4 cancels the padding, so the enclosed lines sit flush with the header
// above them.
export const summaryProductBoxVariants = cva(
  "-mx-4 mt-2 flex flex-col rounded-lg p-4 text-sm",
  {
    variants: {
      card: {
        true: "bg-canvas",
        false: "bg-surface border-stroke border"
      }
    },
    defaultVariants: { card: false }
  }
);
export const summaryProductBoxLabelVariants = cva("text-muted");
export const summaryProductUnitPriceVariants = cva(
  "border-stroke mt-3 flex items-baseline justify-between gap-4 border-t pt-3 font-medium"
);

export const summaryAdjustmentsVariants = cva(
  "border-stroke flex flex-col border-t pt-4 text-sm"
);
export const summaryTotalVariants = cva("border-stroke border-t pt-4");

export const summaryLineRootVariants = cva(
  "flex items-baseline justify-between gap-4"
);
export const summaryLineLabelVariants = cva("");
export const summaryLinePriceVariants = cva("shrink-0 text-right");
export const summaryLineMutedVariants = cva("text-faint text-right");
export const summaryLineQuantityVariants = cva("text-muted ml-1 font-normal");

// Load-state bars, sized to the token line boxes a text row occupies: 20px for
// text-sm, 28px for the text-xl total. The widths are a guess at content that
// has not loaded, so varied widths read as real content, not a repeated pattern.
export const summaryBarsGroupVariants = cva("flex flex-col");
export const summaryBarsRowVariants = cva("flex items-center justify-between");
export const summaryBarsTotalRowVariants = cva(
  "mt-2 flex items-center justify-between"
);
export const summaryBarsTotalVariants = cva("my-0.5 h-6 w-20");
export const summaryBarsButtonVariants = cva("mt-6 h-12 w-full rounded-full");
export const summaryBarsWidthVariants = cva("my-0.5 h-4", {
  variants: {
    width: {
      w12: "w-12",
      w14: "w-14",
      w16: "w-16",
      w20: "w-20",
      w28: "w-28",
      w32: "w-32",
      w36: "w-36",
      w40: "w-40",
      w44: "w-44"
    }
  },
  defaultVariants: { width: "w16" }
});
