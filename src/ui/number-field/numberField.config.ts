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
      app: "w-app"
    },
    text: {
      sm: "text-sm",
      md: "text-md",
      lg: "text-lg"
    }
  },
  defaultVariants: {
    width: "md",
    text: "md"
  }
});

export const numberFieldVariants = cva(
  "group-aria-invalid:!ring-invalid group-aria-invalid:!ring-2 group-aria-invalid:!ring-offset-2 focus-visible:ring-ring inline-flex w-full rounded-lg bg-transparent text-center font-medium text-control-foreground text-inherit ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        flat: "border border-control",
        minimal: "!border-none"
      },
      height: {
        sm: "",
        md: "",
        lg: ""
      }
    },
    compoundVariants: [
      {
        variant: "minimal",
        class: "h-4" // Fixed height for minimal
      },
      {
        variant: "flat",
        height: "sm",
        class: "h-8"
      },
      {
        variant: "flat",
        height: "md",
        class: "h-10"
      },
      {
        variant: "flat",
        height: "lg",
        class: "h-12"
      }
    ],
    defaultVariants: {
      variant: "flat",
      height: "md"
    }
  }
);

export const numberFieldInputVariants = cva("bg-control-background", {
  variants: {
    variant: {
      flat: "hover:border-control-strong border border-control transition-all duration-200",
      minimal: "rounded border border-control p-0.5"
    },
    height: {
      sm: "",
      md: "",
      lg: ""
    }
  },
  compoundVariants: [
    {
      variant: "flat",
      height: "sm",
      class: "h-8"
    },
    {
      variant: "flat",
      height: "md",
      class: "h-10"
    },
    {
      variant: "flat",
      height: "lg",
      class: "h-12"
    }
  ],
  defaultVariants: {
    variant: "flat",
    height: "md"
  }
});

// -----------------------------------------------------------------------------
export default {
  numberField: {
    field: numberFieldVariants,
    root: numberFieldRootVariants,
    input: numberFieldInputVariants
  }
};
