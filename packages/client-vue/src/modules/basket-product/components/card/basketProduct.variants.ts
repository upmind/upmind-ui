import { cva, type VariantProps } from "class-variance-authority";

// -----------------------------------------------------------------------------
// Basket-product card variants (token utilities) — the in-component cva
// class-organisers (ADR-024 D-3, replaces the retired useStyles/*.config.ts).
// Nested config keys are flattened into one named export per cva.

// --- root
export const productRootCardVariants = cva(
  "relative flex list-none flex-col p-0 text-base lg:p-0",
  {
    variants: {
      isDisabled: {
        true: "pointer-events-none cursor-not-allowed!",
        false: ""
      },
      isLoading: {
        true: "",
        false: ""
      }
    },
    compoundVariants: [
      {
        isLoading: false
      }
    ]
  }
);
export const productRootSummariesVariants = cva(
  "divide-stroke flex flex-col divide-y divide-dashed *:py-4 *:first:pt-0 *:last:pb-0",
  {
    variants: { card: { true: "p-6 lg:px-8 lg:py-9", false: "" } },
    defaultVariants: { card: true }
  }
);
export const productRootTaxVariants = cva("text-faint text-sm leading-5");

// --- summary
export const productSummaryArticleVariants = cva("flex flex-col gap-4");
export const productSummaryHeaderRootVariants = cva("flex items-start gap-3");
export const productSummaryHeaderContentVariants = cva("w-full");
export const productSummaryHeaderTopVariants = cva("flex justify-between");

export const productSummaryCategoryRootVariants = cva(
  "flex items-center gap-2"
);
export const productSummaryCategoryTextVariants = cva(
  "text-faint text-sm font-normal"
);

export const productSummaryTitleRootVariants = cva(
  "flex items-start justify-between gap-x-4"
);
export const productSummaryTitleGroupVariants = cva("flex items-center gap-2");
export const productSummaryTitleLinkVariants = cva("no-underline");
export const productSummaryTitleTextVariants = cva(
  "text-xl font-medium break-all no-underline"
);

export const productSummaryIconVariants = cva("[&>svg]:p-[2px]");
export const productSummaryImageVariants = cva("rounded-image m-0 size-13");

export const productSummaryRenewRenewsVariants = cva("text-faint text-sm");
export const productSummaryRenewUsuallyVariants = cva("text-faint text-sm");

export const productSummaryFooterRootVariants = cva(
  "flex flex-col justify-between gap-2 lg:flex-row"
);
export const productSummaryFooterTermsRootVariants = cva(
  "flex flex-wrap items-center gap-x-4 gap-y-2"
);
export const productSummaryFooterTermsControlsVariants = cva(
  "flex items-center gap-2"
);
export const productSummaryFooterTermsContentVariants = cva("max-h-74!");
export const productSummaryFooterRemoveVariants = cva(
  "p-2 [&>span>i>svg]:size-4"
);

// --- option
export const productOptionRootVariants = cva(
  "flex w-full flex-col gap-4 md:flex-row md:items-center"
);
export const productOptionDetailsVariants = cva("flex min-w-0 flex-1 flex-col");
export const productOptionTitleVariants = cva("flex items-center gap-2");
export const productOptionDescriptionVariants = cva("text-body text-sm", {
  variants: {
    selected: { true: "", false: "" },
    quantifiable: { true: "", false: "" }
  },
  compoundVariants: [
    { selected: true, quantifiable: true, class: "text-faint" }
  ]
});
export const productOptionDiscountedVariants = cva("text-muted line-through");
export const productOptionActionVariants = cva("w-full shrink-0 md:w-36");
export const productOptionUpsellVariants = cva(
  "border-stroke flex flex-col gap-4 border-t",
  {
    variants: { card: { true: "px-6 py-6 lg:px-8", false: "pt-6" } },
    defaultVariants: { card: true }
  }
);
export const productOptionBenefitsListVariants = cva(
  "text-muted flex flex-col gap-1 text-sm"
);
export const productOptionBenefitsItemVariants = cva("flex items-start gap-2");
export const productOptionBenefitsHeaderVariants = cva(
  "flex h-lh items-center justify-center"
);
export const productOptionBenefitsIconVariants = cva(
  "shrink-0 [&>svg]:size-3.5"
);

// --- pricing
export const productPricingCurrentVariants = cva(
  "shrink-0 text-lg leading-7! font-medium whitespace-nowrap md:text-xl"
);
export const productPricingExVariants = cva("text-sm leading-5");

// --- skeleton
export const productSkeletonImageVariants = cva(
  "rounded-image m-0 h-12 w-12 shrink-0"
);
export const productSkeletonStackVariants = cva("flex w-full flex-col gap-1");
export const productSkeletonCategoryVariants = cva("h-5 w-24");
export const productSkeletonTitleRowVariants = cva(
  "flex items-start justify-between gap-2"
);
// Narrower on mobile so the image + title + price row fits the configurable
// card's doubly-padded width; full title length at md+.
export const productSkeletonTitleTextVariants = cva("h-6 w-24 md:w-48");
export const productSkeletonPriceVariants = cva("h-6 w-24 shrink-0");
export const productSkeletonControlsVariants = cva(
  "flex flex-wrap items-center gap-x-3 gap-y-2"
);
export const productSkeletonQuantityVariants = cva("h-10 w-12");
export const productSkeletonRenewVariants = cva("h-5 w-28");

export type ProductRootCardVariants = VariantProps<
  typeof productRootCardVariants
>;
export type ProductOptionDescriptionVariants = VariantProps<
  typeof productOptionDescriptionVariants
>;

// Ported from the retired basketProduct.config when develop's inline-config and
// card-list markup arrived: both key off `card`, which decides whether the row
// carries its own padding or leans on the enclosing card.
export const productRootConfigVariants = cva("empty:hidden", {
  variants: {
    card: {
      true: "px-6 pb-6 md:pb-9 lg:px-8",
      false: ""
    }
  },
  defaultVariants: { card: true }
});

export const productRootListVariants = cva("flex flex-col gap-4");

export const productRootItemsVariants = cva("flex flex-col", {
  variants: {
    card: {
      true: "gap-4",
      false:
        "divide-stroke divide-y divide-dashed *:py-6 *:first:pt-0 *:last:pb-0"
    }
  },
  defaultVariants: { card: true }
});

// The card row pads on its root, so the composed Card's own content box must
// not. The lg reset is needed too — a bare p-0 leaves the lg padding standing.
export const productRootCardContentVariants = cva("p-0 lg:p-0");

// The row's own box. `card` decides whether it presents as a card or lies flat
// inside a parent one; disabled only dims the carded form, hence the compound.
export const productRootContainerVariants = cva("", {
  variants: {
    card: {
      true: "relative flex list-none flex-col p-0 text-base lg:p-0",
      false: "flex flex-col gap-9"
    },
    isDisabled: { true: "", false: "" }
  },
  compoundVariants: [
    {
      card: true,
      isDisabled: true,
      class: "pointer-events-none cursor-not-allowed!"
    }
  ],
  defaultVariants: { card: true }
});
