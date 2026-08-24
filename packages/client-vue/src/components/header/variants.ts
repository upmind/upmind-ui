import { cva, type VariantProps } from "class-variance-authority";

// -----------------------------------------------------------------------------
// Header variants (token utilities) — the in-component cva class-organisers
// (ADR-024 D-3, replaces the retired useStyles/*.config.ts shape). The raw
// `variants` map feeds prop-type derivation (parseVariants) in ./types.ts;

export const variants = {
  position: {
    static: "",
    absolute: "absolute top-0"
  }
};

export const headerRootVariants = cva("z-10", {
  variants: {
    position: variants.position,
    visible: {
      true: "opacity-100 transition-opacity duration-300 ease-in-out",
      false: "opacity-0"
    }
  },
  defaultVariants: {
    position: "static",
    visible: true
  }
});

export const headerLinkVariants = cva("flex no-underline");
export const headerPictureVariants = cva("h-full w-full");
export const headerImageVariants = cva(
  "h-9 max-w-32 object-contain md:max-w-64"
);
export const headerNameVariants = cva("text-2xl font-medium");
export const headerContainerVariants = cva("flex-row lg:flex-row");

export const headerLeftColumnVariants = cva("py-0 lg:py-0", {
  variants: {
    background: {
      surface: "",
      canvas: "",
      LTR: "flex-1 pr-0",
      RTL: "flex-none"
    }
  }
});
export const headerLeftContentVariants = cva(
  "h-18 w-full py-0 lg:h-24 lg:py-0",
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
export const headerRightColumnVariants = cva("py-0 lg:py-0", {
  variants: {
    background: {
      surface: "",
      canvas: "",
      LTR: "flex-none",
      RTL: "flex-1 pl-0"
    }
  }
});
export const headerRightContentVariants = cva(
  "flex h-18 w-full gap-2 py-0 lg:h-24 lg:py-0",
  {
    variants: {
      background: {
        surface: "",
        canvas: "",
        LTR: "max-w-app-aside lg:min-w-app-aside",
        RTL: ""
      }
    }
  }
);

export type HeaderRootVariants = VariantProps<typeof headerRootVariants>;
