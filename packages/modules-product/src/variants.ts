import { cva, type VariantProps } from "class-variance-authority";

// -----------------------------------------------------------------------------
// Product module variants (token utilities) — the in-component cva
// class-organisers (ADR-024 D-3, replaces the retired useStyles/*.config.ts).
// Only the cvas actually consumed by the migrated components are exported
// (the old config's card/notFound/pricing branches had no consumers).

export const productConfigRootVariants = cva("w-full text-base", {
  variants: {
    isDisabled: {
      true: "pointer-events-none"
    }
  }
});

export const productConfigContentVariants = cva("flex flex-wrap items-start");

export const productConfigWrapperVariants = cva(
  "flex w-full flex-1 flex-wrap items-stretch gap-x-6 gap-y-16"
);

export const productConfigHeadingVariants = cva(
  "flex w-full flex-wrap items-end gap-x-10 gap-y-2"
);

export const productConfigFieldsVariants = cva(
  "flex w-full flex-none flex-wrap items-start empty:hidden",
  {
    variants: {
      divide: {
        hidden: "",
        solid:
          "divide-y divide-solid [&>*:first-child]:pt-0 [&>*:last-child]:pb-0",
        dashed:
          "divide-y divide-dashed [&>*:first-child]:pt-0 [&>*:last-child]:pb-0",
        dotted:
          "divide-y divide-dotted [&>*:first-child]:pt-0 [&>*:last-child]:pb-0"
      },
      spacing: {
        "2": "",
        "4": "",
        "6": "",
        "8": "",
        "10": ""
      }
    },
    compoundVariants: [
      { divide: "hidden", spacing: "2", class: "gap-2" },
      { divide: "hidden", spacing: "4", class: "gap-4" },
      { divide: "hidden", spacing: "6", class: "gap-6" },
      { divide: "hidden", spacing: "8", class: "gap-8" },
      { divide: "hidden", spacing: "10", class: "gap-10" }
    ]
  }
);

export const productConfigFooterVariants = cva(
  "mt-6 flex w-full items-center justify-between gap-x-10 border-t px-6 py-4"
);

export const productConfigBoldVariants = cva("font-medium", {
  variants: {
    isCalculating: {
      true: "opacity-50"
    }
  }
});

export const productConfigItemtotalVariants = cva(
  "text-muted m-0 flex w-full items-end justify-end gap-2 leading-normal",
  {
    variants: {
      isCalculating: {
        true: "opacity-50"
      }
    }
  }
);

export const productSummaryVariants = cva("");

export const productActionsVariants = cva(
  "flex w-full flex-col gap-6 font-medium lg:flex-row"
);

export type ProductConfigRootVariants = VariantProps<
  typeof productConfigRootVariants
>;
export type ProductConfigFieldsVariants = VariantProps<
  typeof productConfigFieldsVariants
>;
