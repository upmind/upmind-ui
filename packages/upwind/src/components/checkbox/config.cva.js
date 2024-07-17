import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  checkbox: {
    root: cva("relative mr-3 flex shrink-0 items-center justify-center", {
      variants: {
        size: {
          sm: "size-5",
          md: "size-6",
          lg: "size-7",
        },
        isDisabled: {
          true: "cursor-not-allowed",
        },
        isProcessing: {
          true: "cursor-wait",
        },
      },
      defaultVariants: {
        size: "md",
      },
    }),
    input: cva(
      "border-base-300 cursor-inherit appearance-none rounded border text-inherit outline-none ring-0",
      {
        variants: {
          size: {
            sm: "size-4",
            md: "size-5",
            lg: "size-6",
          },
          isDisabled: {
            true: "bg-base-100 cursor-not-allowed ",
          },
          isProcessing: {
            true: "cursor-wait",
          },
          isChecked: {
            true: `border-control-active bg-control-active`,
          },
        },
        compoundVariants: [
          {
            isInvalid: true,
            isDisabled: false,
            isProcessing: false,
            class: "border-control-error-300 cursor-pointer",
          },

          {
            variant: "outlined",
            isInvalid: false,
            isDisabled: false,
            isProcessing: false,
            class:
              "focus-within:border-control-active focus-within:ring-control-active cursor-pointer focus-within:ring-4 focus-within:ring-opacity-20",
          },

          {
            variant: "outlined",
            isInvalid: true,
            isDisabled: false,
            isProcessing: false,
            class:
              "focus-within:border-control-error focus-within:ring-control-error focus-within:ring-4 focus-within:ring-opacity-20",
          },
          // deprecated success variant
          // {
          //   variant: "outlined",
          //   isValid: true,
          //   isDisabled: false,
          //   isProcessing: false,
          //   class:
          //     "focus-within:border-success focus-within:ring-success focus-within:ring-4 focus-within:ring-opacity-20",
          // },
        ],
        defaultVariants: {
          size: "md",
        },
      }
    ),
    icon: cva(
      "pointer-events-none absolute bottom-0 left-0 right-0 top-0 m-auto",
      {
        variants: {
          size: {
            sm: "size-4",
            md: "size-5",
            lg: "size-6",
          },
          isDisabled: {
            true: "text-base-content cursor-not-allowed",
          },
          isProcessing: {
            true: "cursor-wait",
          },
          isChecked: {
            true: `text-base`,
          },
        },
        defaultVariants: {
          size: "md",
        },
      }
    ),
  },
  label: {
    root: cva("cursor-pointer"),
  },
  // ---------------------------------------------------------------------------
  checkboxlist: {
    root: cva("m-0 flex w-full list-none flex-col gap-2 p-0"),
    item: cva("m-0 p-0"),
  },
};
