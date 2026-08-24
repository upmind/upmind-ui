import { cva } from "class-variance-authority";

// -----------------------------------------------------------------------------
// Catalogue variants (ADR-024 D-3 — replaces the retired useStyles/*.config.ts
// shape). One named export per cva, nested keys flattened. Classes copied
// verbatim from catalogue.config.ts.

// --- products
export const productsRootVariants = cva("flex flex-col gap-12 md:flex-row");
export const productsFacetsRootVariants = cva(
  "mb-4 flex w-full flex-col md:mb-0 md:w-1/4"
);

// --- products.facet
export const productsFacetRootVariants = cva("flex w-full flex-col gap-y-8");
export const productsFacetSearchInputVariants = cva("max-w-xl");
export const productsFacetSearchIconVariants = cva("text-muted mr-1.5");
export const productsFacetListRootVariants = cva("flex flex-col space-y-4");
export const productsFacetListIconVariants = cva(
  "text-body h-5 w-5 transition-opacity duration-200"
);
export const productsFacetDrillDownItemsVariants = cva(
  "flex flex-col space-y-2"
);
export const productsFacetDrillDownActionVariants = cva("flex justify-between");
export const productsFacetDrillDownBackVariants = cva("self-start");
export const productsFacetExpandButtonVariants = cva("flex justify-between");

// --- products.skeleton
export const productsSkeletonRootVariants = cva(
  "group relative flex flex-col text-base"
);
export const productsSkeletonContentVariants = cva("flex h-full flex-col");
export const productsSkeletonImageVariants = cva("h-64 w-full rounded");
export const productsSkeletonDetailsVariants = cva("mt-4 flex flex-1 flex-col");
export const productsSkeletonTitleContainerVariants = cva("space-y-2");
export const productsSkeletonTitleLine1Variants = cva("h-6 w-4/5");
export const productsSkeletonTitleLine2Variants = cva("h-6 w-3/5");
export const productsSkeletonPriceContainerVariants = cva("mt-1 space-y-1");
export const productsSkeletonPriceVariants = cva("h-5 w-24");
export const productsSkeletonCycleVariants = cva("h-4 w-32");
export const productsSkeletonDescriptionContainerVariants = cva(
  "mt-3 flex-1 space-y-2"
);
export const productsSkeletonDescriptionLine1Variants = cva("h-4 w-full");
export const productsSkeletonDescriptionLine2Variants = cva("h-4 w-5/6");
export const productsSkeletonDescriptionLine3Variants = cva("h-4 w-4/6");
export const productsSkeletonButtonContainerVariants = cva("mt-4 pt-2");
export const productsSkeletonButtonVariants = cva("h-12 w-full rounded");

// --- products.main
export const productsMainRootVariants = cva("flex w-full flex-col gap-12");
export const productsMainControlsVariants = cva(
  "flex flex-col items-center justify-between gap-3 md:flex-row"
);
export const productsMainSearchInputVariants = cva("max-w-xl");
export const productsMainSearchIconVariants = cva("text-muted mr-1.5");
export const productsMainGridRootVariants = cva(
  "flex w-full flex-col justify-end gap-12"
);
export const productsMainGridContainerVariants = cva("grid grid-cols-1", {
  variants: {
    layout: {
      "1-col": "gap-12 md:grid-cols-1",
      "2-col": "gap-12 md:grid-cols-2",
      "3-col": "gap-12 md:grid-cols-3",
      "4-col": "gap-x-8 gap-y-12 md:grid-cols-4"
    }
  },
  defaultVariants: {
    layout: "3-col"
  }
});
export const productsMainEmptyStateRootVariants = cva(
  "flex w-full flex-col items-center justify-center space-y-4 p-4 py-10 text-center"
);
export const productsMainEmptyStateIconVariants = cva("text-muted");
export const productsMainEmptyStateTitleVariants = cva("font-medium");
export const productsMainEmptyStateDescriptionVariants = cva("text-muted");

// --- categories
export const categoriesRootVariants = cva("flex flex-col gap-y-9");
export const categoriesGridVariants = cva(
  "bg-surface text-muted border-stroke rounded-control grid w-full grid-cols-1 gap-px overflow-hidden border",
  {
    variants: {
      layout: {
        "1-col": "md:grid-cols-1",
        "2-col": "md:grid-cols-2",
        "3-col": "md:grid-cols-3",
        "4-col": "md:grid-cols-4",
        "5-col": "md:grid-cols-5",
        "6-col": "md:grid-cols-6"
      }
    },
    defaultVariants: {
      layout: "3-col"
    }
  }
);
export const categoriesControlsRootVariants = cva(
  "flex w-full flex-col items-start justify-between gap-4 md:flex-row md:items-center md:gap-0"
);

// --- categories.item
export const categoriesItemRootVariants = cva(
  "before:border-stroke group relative z-10 m-0 flex h-full w-full flex-col items-start justify-start gap-4 rounded-none border-none bg-transparent! p-8 text-left text-base whitespace-normal shadow-none before:absolute before:-inset-px before:-z-10 before:border before:border-solid before:content-[''] [&:hover:not(:disabled),&:focus-within:not(:disabled),&[data-hover=true]:not([data-disabled=true]),&[data-focus=true]:not([data-disabled=true])]:shadow-none!"
);
export const categoriesItemIconVariants = cva(
  "text-muted text-primary transition-all duration-200 [&>svg]:p-px"
);
export const categoriesItemActionVariants = cva(
  "flex h-auto w-full flex-col gap-1 border-none px-0 py-0 text-left"
);
export const categoriesItemTitleContainerVariants = cva(
  "m-0 flex w-full items-start justify-between gap-2 text-lg font-normal"
);
export const categoriesItemTitleVariants = cva("");
export const categoriesItemLinkVariants = cva("font-medium");
export const categoriesItemBadgeVariants = cva("mt-1 mr-auto");
export const categoriesItemArrowIconVariants = cva(
  "text-muted mt-1.5 transition-all duration-200"
);
export const categoriesItemDescriptionVariants = cva(
  "text-muted m-0 line-clamp-3 text-sm font-normal whitespace-normal transition-all duration-200"
);
