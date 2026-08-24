import { cva, type VariantProps } from "class-variance-authority";

// -----------------------------------------------------------------------------
// Product card variants (token utilities) — the in-component cva
// class-organisers (ADR-024 D-3, replaces the retired useStyles/*.config.ts).

export const cardRootVariants = cva("relative flex h-full flex-col text-base", {
  variants: {
    variant: {
      flush: "",
      carded: "bg-surface rounded-lg border p-9",
      "flush-carded": "bg-surface"
    }
  }
});

export const cardContentVariants = cva("flex h-full flex-col", {
  variants: {
    variant: {
      flush: "gap-8",
      carded: "gap-8",
      "flush-carded": ""
    }
  }
});

export const cardDetailsVariants = cva("flex flex-1 flex-col gap-8", {
  variants: {
    variant: {
      flush: "",
      carded: "",
      "flush-carded": "rounded-b-lg border border-t-0 p-9"
    },
    hideTerms: {
      true: "gap-8",
      false: "gap-3"
    }
  }
});

export const cardImageContainerVariants = cva("relative w-full", {
  variants: {
    variant: {
      flush: "rounded-image",
      carded: "rounded-image",
      "flush-carded": "rounded-t-(--radius-slot-image)"
    },
    isImageEmpty: {
      true: "",
      false: ""
    }
  },
  compoundVariants: [
    {
      variant: "flush-carded",
      isImageEmpty: true,
      class: "border"
    }
  ]
});

export const cardImageRootVariants = cva("w-full", {
  variants: {
    variant: {
      flush: "",
      carded: "",
      "flush-carded": "rounded-t-(--radius-slot-image) [&_img]:rounded-b-none!"
    },
    isLoading: {
      true: "opacity-50"
    }
  }
});

export const cardImageLinkVariants = cva("block w-full");
export const cardImageBadgeVariants = cva("absolute top-4 left-4");

export const cardHeaderRootVariants = cva(
  "flex flex-1 list-none flex-col gap-6"
);

export const cardHeaderInfoRootVariants = cva("flex flex-col gap-3");
export const cardHeaderInfoContainerVariants = cva("flex flex-col gap-2");
export const cardHeaderInfoTitleVariants = cva(
  "m-0 inline-block text-2xl font-medium"
);
export const cardHeaderInfoTermsVariants = cva("m-0 text-base");
export const cardHeaderInfoDescriptionVariants = cva(
  "text-muted m-0 line-clamp-3 text-sm"
);
export const cardHeaderInfoPromotionVariants = cva("", {
  variants: {
    preservePromotion: {
      true: "opacity-0 select-none",
      false: ""
    }
  }
});

export const cardHeaderBenefitsRootVariants = cva(
  "border-stroke m-0 flex flex-col border-y py-3"
);
export const cardHeaderBenefitsItemVariants = cva(
  "m-0 flex items-start justify-start gap-2 text-base font-medium"
);
export const cardHeaderBenefitsIconVariants = cva(
  "flex h-lh items-center justify-center"
);

export const cardHeaderPriceRootVariants = cva(
  "flex flex-1 flex-col justify-end gap-0.5"
);
export const cardHeaderPriceRegularPriceVariants = cva(
  "text-muted flex items-center gap-2 text-sm"
);
export const cardHeaderPriceCurrentPriceRootVariants = cva(
  "flex items-end gap-1"
);
export const cardHeaderPriceCurrentPriceAmountVariants = cva(
  "text-3xl font-medium"
);
export const cardHeaderPriceCurrentPriceTermVariants = cva("text-sm");
export const cardHeaderPriceTotalVariants = cva("text-muted text-sm");

export const cardFooterVariants = cva("flex flex-col gap-3");

export type CardRootVariants = VariantProps<typeof cardRootVariants>;
