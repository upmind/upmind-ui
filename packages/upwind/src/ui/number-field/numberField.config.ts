import { cva } from "class-variance-authority";

// -----------------------------------------------------------------------------

export const numberFieldRootVariants = cva("group inline-block", {
  variants: {
    width: {
      auto: "w-auto min-w-14",
      sm: "w-20",
      md: "w-32",
      lg: "w-48",
      full: "w-full",
      app: "w-app",
    },
  },
  defaultVariants: {
    width: "full",
  },
});

export const numberFieldVariants = cva(
  "bg-control-background group-aria-invalid:!ring-invalid group-aria-invalid:!ring-2 group-aria-invalid:!ring-offset-2 focus-visible:ring-ring inline-flex w-full rounded-md text-center font-medium text-control-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        flat: "border border-control",
        minimal: "!border-none",
      },
      size: {
        sm: "h-8 px-3 py-2 text-sm",
        md: "h-10 px-3 py-2 text-md",
        lg: "h-12 px-3 py-2 text-lg",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "flat",
    },
  }
);

export const numberFieldInputVariants = cva("", {
  variants: {
    variant: {
      flat: "",
      minimal: "rounded-lg border border-control p-0.5",
    },
  },
  defaultVariants: {
    variant: "flat",
  },
});

// -----------------------------------------------------------------------------
export default {
  numberField: {
    field: numberFieldVariants,
    root: numberFieldRootVariants,
    input: numberFieldInputVariants,
  },
};
