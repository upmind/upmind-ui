import { cva } from "class-variance-authority";
import { ringClasses, outlineReset } from "../../assets/styles";

// -----------------------------------------------------------------------------

export const numberFieldRootVariants = cva("group inline-block", {
  variants: {
    width: {
      auto: "",
      sm: "",
      md: "",
      lg: "",
      full: "",
      app: ""
    },
    size: {
      sm: "text-sm",
      md: "text-sm",
      lg: "text-md"
    },
    count: {
      "1": "",
      "2": "",
      "3": "",
      "4": "",
      "5": "",
      "6": "",
      "7": "",
      "8": "",
      "9": "",
      "10": ""
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
      variant: "flat",
      class: "w-full"
    },
    {
      variant: "minimal",
      count: "1",
      class: "w-16"
    },
    {
      variant: "minimal",
      count: "2",
      class: "w-16"
    },
    {
      variant: "minimal",
      count: "3",
      class: "w-20"
    },
    {
      variant: "minimal",
      count: "4",
      class: "w-20"
    },
    {
      variant: "minimal",
      count: "5",
      class: "w-24"
    },
    {
      variant: "minimal",
      count: "6",
      class: "w-28"
    },
    {
      variant: "minimal",
      count: "7",
      class: "w-28"
    },
    {
      variant: "minimal",
      count: "8",
      class: "w-32"
    },
    {
      variant: "minimal",
      count: "9",
      class: "w-32"
    },
    {
      variant: "minimal",
      count: "10",
      class: "w-36"
    },
    {
      variant: "minimal",
      count: "10",
      class: "w-36"
    },

    {
      variant: "flat",
      width: "auto",
      class: "w-auto min-w-24"
    },
    {
      variant: "flat",
      width: "sm",
      class: "md:w-80"
    },
    {
      variant: "flat",
      width: "md",
      class: "md:w-84"
    },
    {
      variant: "flat",
      width: "lg",
      class: "md:w-96"
    },
    {
      variant: "flat",
      width: "full",
      class: "w-full"
    },
    {
      variant: "flat",
      width: "app",
      class: "w-app"
    }
  ],
  defaultVariants: {
    width: "full",
    size: "md",
    count: "1"
  }
});

export const numberFieldVariants = cva(
  `${ringClasses} text-control-foreground placeholder:text-muted-foreground ring-offset-control-surface inline-flex w-full rounded-lg border-none text-center font-medium text-inherit ring-offset-0 transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium focus:ring-offset-2`,
  {
    variants: {
      variant: {
        flat: `shadow-control-default bg-control-surface`,
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
        class: "h-4"
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

export const numberFieldInputVariants = cva(
  "bg-control-surface shadow-control-default hover:shadow-control-hover",
  {
    variants: {
      variant: {
        flat: "[&>i]:disabled:text-muted [&>i]:size-lh cursor-pointer transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-20 [&>i]:flex [&>i]:items-center [&>i]:justify-center",
        minimal: "control-radius flex h-5 w-5 items-center justify-center p-0"
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
        class: "w-1/3 py-2"
      },
      {
        variant: "flat",
        size: "md",
        class: "w-1/3 py-2"
      },
      {
        variant: "flat",
        size: "lg",
        class: "w-1/3 py-2"
      }
    ],
    defaultVariants: {
      variant: "flat",
      size: "md"
    }
  }
);

// -----------------------------------------------------------------------------
export default {
  numberField: {
    field: numberFieldVariants,
    root: numberFieldRootVariants,
    input: numberFieldInputVariants
  }
};
