import { cva, type VariantProps } from "class-variance-authority";

// -----------------------------------------------------------------------------
// Product hero variants (token utilities) — the in-component cva
// class-organisers (ADR-024 D-3, replaces the retired useStyles/*.config.ts).
// The raw `variants` map feeds prop-type derivation (parseVariants) in
// ./types.ts.

export const variants = {
  direction: {
    horizontal: "flex-col md:flex-row md:justify-between",
    vertical: "flex-col-reverse"
  }
};

export const headerRootVariants = cva("flex w-full gap-6", {
  variants,
  defaultVariants: {
    direction: "horizontal"
  }
});

export const headerDetailsVariants = cva("w-full md:flex-1 md:pr-6", {
  variants: {
    hasImage: {
      true: "max-w-xl",
      false: "max-w-2xl"
    }
  },
  defaultVariants: {
    hasImage: false
  }
});

export const headerPriceVariants = cva("font-normal", {
  variants: {
    direction: {
      horizontal: "text-xl",
      vertical: "text-lg"
    }
  },
  defaultVariants: {
    direction: "horizontal"
  }
});

export const headerAsideVariants = cva("text-right", {
  variants: {
    direction: {
      horizontal: "md:h-[var(--details-h)] md:max-h-64 md:max-w-1/2",
      vertical: ""
    }
  },
  defaultVariants: {
    direction: "horizontal"
  }
});

export const headerImageRootVariants = cva("inline-block h-full max-w-full");
export const headerImageProductVariants = cva("h-full");
export const headerImageGridVariants = cva("ml-auto", {
  variants: {
    direction: {
      horizontal: "lg:max-w-64",
      vertical: ""
    }
  },
  defaultVariants: {
    direction: "vertical"
  }
});

export type HeaderVariants = VariantProps<typeof headerRootVariants>;

// Direction-keyed typography merged onto the shared Hero's title/description
// (restores the retired product-hero.config heroTitle/heroDescription overrides).
export const headerHeroTitleVariants = cva("", {
  variants: {
    direction: { horizontal: "", vertical: "md:text-4xl" }
  },
  defaultVariants: { direction: "horizontal" }
});

export const headerHeroDescriptionVariants = cva("", {
  variants: {
    direction: { horizontal: "", vertical: "md:text-base" }
  },
  defaultVariants: { direction: "horizontal" }
});
