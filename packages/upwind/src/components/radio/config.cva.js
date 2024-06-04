import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  radio: {
    root: cva("relative flex shrink-0 items-center justify-center", {
      variants: {
        size: {
          sm: "size-5",
          md: "size-6",
          lg: "size-7",
        },
      },
      defaultVariants: {
        size: "sm",
      },
    }),
    input: cva(
      "border-base-300 cursor-pointer appearance-none rounded-[100%] border text-inherit outline-none ring-0",
      {
        variants: {
          size: {
            sm: "size-4",
            md: "size-5",
            lg: "size-6",
          },
          isDisabled: {
            true: "bg-base-100",
          },
          isChecked: {
            true: `border-current bg-current`,
          },
        },
        compoundVariants: [
          {
            isInvalid: true,
            isDisabled: false,
            class: "border-error-300",
          },
          {
            isValid: true,
            isDisabled: false,
            class: "",
          },
          {
            variant: "outlined",
            isInvalid: false,
            isValid: false,
            isDisabled: false,
            class:
              "focus-within:border-primary focus-within:ring-primary focus-within:ring-4 focus-within:ring-opacity-20",
          },

          {
            variant: "outlined",
            isInvalid: true,
            isDisabled: false,
            class:
              "focus-within:border-error focus-within:ring-error focus-within:ring-4 focus-within:ring-opacity-20",
          },
          {
            variant: "outlined",
            isValid: true,
            isDisabled: false,
            class:
              "focus-within:border-success focus-within:ring-success focus-within:ring-4 focus-within:ring-opacity-20",
          },
        ],
        defaultVariants: {
          size: "sm",
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
            true: "text-base-content",
          },
          isChecked: {
            true: `text-base`,
          },
        },
        defaultVariants: {
          size: "sm",
        },
      }
    ),
  },
  label: {
    root: cva("cursor-pointer"),
  },
  // ---------------------------------------------------------------------------
  radiolist: {
    root: cva("m-0 grid w-full list-none gap-2 p-0", {
      variants: {
        layout: {
          grid: "!auto-cols-fr grid-cols-3",
          stacked: "grid-flow-row grid-cols-1",
          inline: "grid-flow-col grid-rows-1 ",
        },
      },
      defaultVariants: {
        layout: "vertical",
        isStretched: false,
      },
      compoundVariants: [
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
          grid: "",
        },
      },
      defaultVariants: {
        layout: "vertical",
        isStretched: false,
      },
    }),

    radio: {
      wrapper: cva("", {
        variants: {
          layout: {
            grid: "py-6",
          },
        },
      }),
    },
  },
};
