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
    size: {
      sm: "text-sm",
      md: "text-sm",
      lg: "text-md"
    },
    variant: {
      flat: "",
      minimal: ""
    },
    isDisabled: {
      true: "cursor-not-allowed opacity-50"
    }
  },
  compoundVariants: [
    {
      variant: "minimal",
      width: "auto",
      class: "w-auto min-w-12"
    },
    {
      variant: "minimal",
      width: "sm",
      class: "w-16"
    },
    {
      variant: "minimal",
      width: "md",
      class: "w-20"
    },
    {
      variant: "minimal",
      width: "lg",
      class: "w-28"
    }
  ],
  defaultVariants: {
    width: "full",
    size: "md"
  }
});

export const numberFieldVariants = cva(
  "group-aria-invalid:ring-invalid! focus-visible:ring-ring text-control-foreground ring-offset-background placeholder:text-muted-foreground bg-control-background inline-flex w-full rounded-lg border-none text-center font-medium text-inherit group-aria-invalid:ring-2! group-aria-invalid:ring-offset-2! file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
  {
    variants: {
      variant: {
        flat: "shadow-border",
        minimal: "shadow-none!"
      },
      size: {
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
        size: "sm",
        class: "h-auto px-0.5 py-2 text-sm"
      },
      {
        variant: "flat",
        size: "md",
        class: "h-auto px-3 py-2 text-sm"
      },
      {
        variant: "flat",
        size: "lg",
        class: "text-md h-auto px-4 py-2"
      }
    ],
    defaultVariants: {
      variant: "flat"
    }
  }
);

export const numberFieldInputVariants = cva("bg-control-background", {
  variants: {
    variant: {
      flat: "[&>i]:disabled:text-emphasis-disabled shadow-border [&>i]:size-lh transition-all duration-300 disabled:opacity-100 [&>i]:flex [&>i]:items-center [&>i]:justify-center",
      minimal:
        "shadow-border flex h-5 w-5 items-center justify-center rounded p-0"
    },
    size: {
      sm: "",
      md: "",
      lg: ""
    }
  },
  compoundVariants: [
    {
      variant: "flat",
      size: "sm",
      class: "px-0.5 py-2"
    },
    {
      variant: "flat",
      size: "md",
      class: "px-3 py-2"
    },
    {
      variant: "flat",
      size: "lg",
      class: "px-4 py-2"
    }
  ],
  defaultVariants: {
    variant: "flat",
    size: "md"
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
