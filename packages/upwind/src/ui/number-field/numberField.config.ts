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
    size: {
      sm: "text-sm",
      md: "text-md",
      lg: "text-lg",
    },
  },
  defaultVariants: {
    width: "full",
  },
});

export const numberFieldVariants = cva(
  "group-aria-invalid:!ring-invalid group-aria-invalid:!ring-2 group-aria-invalid:!ring-offset-2 focus-visible:ring-ring inline-flex w-full rounded-md bg-transparent text-center font-medium text-control-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        flat: "h-10 border border-control",
        minimal: "h-4 !border-none",
      },
    },
    defaultVariants: {
      variant: "flat",
    },
  }
);

export const numberFieldInputVariants = cva("bg-control-background", {
  variants: {
    variant: {
      flat: "h-10 border border-control",
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
