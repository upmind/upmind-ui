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
        noInput: {
          true: "visibility-hidden h-0 w-0 opacity-0",
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
      "cursor-inherit appearance-none rounded border text-inherit outline-none ring-0",
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
            true: "text-base-foreground",
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
    text: cva("", {
      variants: {
        size: {
          sm: "text-sm",
          md: "text-md",
          lg: "text-lg",
        },
      },
      defaultVariants: {
        size: "md",
      },
    }),
  },
  // ---------------------------------------------------------------------------
  checkboxlist: {
    root: cva("m-0 grid w-full list-none p-0", {
      variants: {
        layout: {
          stacked: " grid-flow-row grid-cols-1 rounded-lg  border p-0",
          grid: " !auto-cols-fr grid-cols-3 gap-x-2   ",
          inline: "grid-flow-col grid-rows-1 gap-x-2 ",
        },
      },
      defaultVariants: {
        layout: "vertical",
        isStretched: false,
      },
      compoundVariants: [
        {
          isInvalid: true,
          isDisabled: false,
          class:
            "border-control-error focus-within:ring-control-error border focus-within:ring-4 focus-within:ring-opacity-20",
        },
        {
          layout: "inline",
          isStretched: true,
          class: "",
        },
        {
          layout: "inline",
          isStretched: false,
          class: "auto-cols-max",
        },
      ],
    }),
    item: cva("m-0 cursor-pointer p-0", {
      variants: {
        layout: {
          stacked: "border-b last-of-type:border-b-0",
          grid: " rounded-lg border",
          inline: "",
        },
      },
    }),

    checkbox: {
      wrapper: cva("border-transparent", {
        variants: {
          layout: {
            grid: "py-6",
          },
        },
      }),
      input: cva("", {}),
    },
  },
};
