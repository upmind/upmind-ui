import { cva, type VariantProps } from "class-variance-authority";

// -----------------------------------------------------------------------------
// Footer variants (token utilities) — the in-component cva class-organisers
// (ADR-024 D-3, replaces the retired useStyles/*.config.ts shape). The raw
// `variants` map feeds prop-type derivation (parseVariants) in ./types.ts.

export const variants = {
  position: {
    static: "",
    absolute: "absolute top-0"
  }
};

// --- stacked layout
export const footerStackedRootVariants = cva("bg-surface");
export const footerStackedColumnVariants = cva("", {
  variants: {
    isMinimal: {
      true: "py-2 lg:py-2"
    }
  },
  defaultVariants: {
    isMinimal: false
  }
});
export const footerStackedContentVariants = cva(
  "divide-stroke flex w-full flex-col divide-y"
);
export const footerStackedTopVariants = cva(
  "flex w-full justify-center gap-2 pb-6 md:justify-end"
);
export const footerStackedBottomVariants = cva(
  "flex w-full flex-col items-center justify-between gap-2 text-center md:flex-row md:gap-0 md:text-left",
  {
    variants: {
      isMinimal: {
        false: "pt-6"
      },
      showPoweredBy: {
        false: "md:justify-end"
      }
    },
    defaultVariants: {
      isMinimal: false,
      showPoweredBy: true
    }
  }
);

// --- flat layout
export const footerFlatRootVariants = cva("", {
  variants
});
export const footerFlatContainerVariants = cva("flex-row lg:flex-row");
export const footerFlatLeftColumnVariants = cva(
  "justify-end self-stretch pt-18 pb-9 lg:pt-18 lg:pb-9",
  {
    variants: {
      background: {
        surface: "",
        // pr-0 mirrors the inset layout's content column (its inner padding is
        // dropped so the cards meet the aside) — keeps the actions on the
        // section's right edge
        canvas: "flex-1 lg:pr-0",
        LTR: "flex-1",
        RTL: "bg-canvas flex-none"
      }
    }
  }
);
export const footerFlatLeftContentVariants = cva(
  "w-full flex-wrap gap-4 py-0 lg:py-0",
  {
    variants: {
      background: {
        surface: "",
        canvas: "",
        LTR: "",
        RTL: "max-w-app-aside lg:min-w-app-aside"
      }
    }
  }
);
export const footerFlatRightColumnVariants = cva(
  "justify-end self-stretch pt-18 pb-9 lg:pt-18 lg:pb-9",
  {
    variants: {
      background: {
        surface: "",
        // pl-0 mirrors the inset layout's aside column's dropped inner padding
        canvas: "flex-none lg:pl-0",
        LTR: "bg-canvas flex-none",
        RTL: "flex-1"
      }
    }
  }
);
export const footerFlatRightContentVariants = cva(
  "flex w-full gap-2 py-0 lg:py-0",
  {
    variants: {
      background: {
        surface: "",
        canvas: "max-w-app-aside lg:min-w-app-aside",
        LTR: "max-w-app-aside lg:min-w-app-aside",
        RTL: ""
      }
    }
  }
);

// --- copyright
export const footerCopyrightVariants = cva(
  "text-muted text-sm whitespace-nowrap"
);

export type FooterFlatRootVariants = VariantProps<
  typeof footerFlatRootVariants
>;
