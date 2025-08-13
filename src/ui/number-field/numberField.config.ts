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
  "group-aria-invalid:!ring-invalid focus-visible:ring-ring text-control-foreground ring-offset-background placeholder:text-muted-foreground inline-flex w-full rounded-lg bg-transparent text-center font-medium text-inherit group-aria-invalid:ring-2! group-aria-invalid:ring-offset-2! file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        flat: "border-control border",
        minimal: "border-none!"
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
      flat: "hover:border-control-strong border-control border transition-all duration-200",
      minimal: "border-control rounded-lg border p-0.5"
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
