import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  input: {
    root: cva("group relative flex flex-col gap-1", {
      variants: {
        size: {
          sm: "text-sm",
          md: "",
          lg: "text-lg",
        },
      },
      defaultVariants: {
        size: "md",
      },
    }),

    wrapper: cva(
      "group flex min-h-full w-full items-start items-center rounded-lg ring-0",
      {
        variants: {
          variant: {
            outlined: " border",
            flat: "",
          },
          layout: {
            stacked: "",
            inline: "",
          },

          isDisabled: {
            true: "opacity-50 ",
          },
        },
        compoundVariants: [
          {
            layout: "inline",
            variant: "flat",
            class: "p-0",
          },
          {
            layout: "inline",
            variant: "outlined",
            size: "md",
            class: "px-3 py-2 text-sm leading-5",
          },
          {
            layout: "inline",
            variant: "outlined",
            size: "md",
            class: "px-3 py-3 leading-6",
          },
          {
            layout: "inline",
            variant: "outlined",
            size: "lg",
            class: "px-3 py-4 text-lg leading-7",
          },
          // ---
          {
            isInvalid: true,
            isDisabled: false,
            class: "border-control-error",
          },
          {
            variant: "outlined",
            isInvalid: false,
            isDisabled: false,
            class:
              " focus-within:border-control-active focus-within:ring-4 focus-within:ring-control-active focus-within:ring-opacity-20",
          },
          {
            variant: "outlined",
            isInvalid: true,
            isDisabled: false,
            class:
              " focus-within:border-control-error focus-within:ring-4 focus-within:ring-control-error focus-within:ring-opacity-20",
          },
          // DEprecated the success variant
          // {
          //   variant: "outlined",
          //   isValid: true,
          //   isDisabled: false,
          //   class:
          //     " focus-within:border-success focus-within:ring-success focus-within:ring-4 focus-within:ring-opacity-20",
          // },
        ],
        defaultVariants: {
          variant: "outlined",
          layout: "stacked",
          size: "md",
        },
      }
    ),

    prependWrapper: cva("flex items-start gap-3 px-2 empty:hidden", {
      variants: {
        isDisabled: {
          true: "bg-base-100",
        },
      },
    }),

    control: cva("flex w-full flex-1 items-start"),

    appendWrapper: cva("flex items-start gap-3 px-2 empty:hidden", {
      variants: {
        isDisabled: {
          true: "bg-base-100",
        },
      },
    }),

    icon: cva("", {
      variants: {
        size: {
          sm: "size-5",
          md: "size-6",
          lg: "size-7",
        },
      },
      compoundVariants: [
        {
          size: "md",
          layout: "stacked",
          class: "my-2",
        },
        {
          size: "md",
          layout: "stacked",
          class: "my-3",
        },
        {
          size: "lg",
          layout: "stacked",
          class: "my-4",
        },
      ],
      defaultVariants: {
        size: "md",
      },
    }),

    avatar: cva("overflow-hidden rounded-full", {
      variants: {
        size: {
          sm: "size-5",
          md: "size-6",
          lg: "size-7",
        },
      },
      compoundVariants: [
        {
          size: "md",
          layout: "stacked",
          class: "my-2",
        },
        {
          size: "md",
          layout: "stacked",
          class: "my-3",
        },
        {
          size: "lg",
          layout: "stacked",
          class: "my-4",
        },
      ],
      defaultVariants: {
        size: "md",
      },
    }),

    prepend: cva("flex items-start self-stretch rounded-s-lg", {
      variants: {
        size: {
          sm: "leading-5",
          md: "leading-6",
          lg: "leading-7",
        },
        variant: {
          outlined: "border-r  bg-base-100 ",
          flat: "text-base-500",
        },
        layout: {
          stacked: "-ml-2",
        },
      },
      compoundVariants: [
        {
          size: "md",
          layout: "stacked",
          class: "px-3 py-2",
        },
        {
          size: "md",
          layout: "stacked",
          class: "px-3 py-3",
        },
        {
          size: "lg",
          layout: "stacked",
          class: "px-3 py-4",
        },
      ],
      defaultVariants: {
        size: "md",
      },
    }),

    append: cva("flex items-start self-stretch rounded-e-lg", {
      variants: {
        size: {
          sm: "leading-5",
          md: "leading-6",
          lg: "leading-7",
        },
        variant: {
          outlined: "border-l  bg-base-100",
          flat: "text-base-500",
        },
        layout: {
          stacked: "-mr-2",
        },
      },
      compoundVariants: [
        {
          size: "md",
          layout: "stacked",
          class: "px-3 py-2",
        },
        {
          size: "md",
          layout: "stacked",
          class: "px-3 py-3",
        },
        {
          size: "lg",
          layout: "stacked",
          class: "px-3 py-4",
        },
      ],
      defaultVariants: {
        size: "md",
      },
    }),

    feedback: {
      root: cva(
        "flex items-center gap-x-2 overflow-hidden text-xs text-base-500 transition-opacity duration-300",
        {
          variants: {
            hasFeedback: {
              false: "invisible h-0 w-0 text-nowrap opacity-0",
            },
            isInvalid: {
              true: "text-control-error",
            },
          },
          compoundVariants: [
            {
              isPersisted: false,
              hasFeedback: true,
              class:
                "invisible h-0 w-0 text-nowrap opacity-0 group-focus-within:visible group-focus-within:h-auto group-focus-within:w-auto group-focus-within:text-wrap group-focus-within:opacity-100",
            },
            {
              isPersisted: true,
              hasFeedback: true,
              class: "opacity-100",
            },
          ],
          defaultVariants: {
            isPersisted: false,
            hasFeedback: true,
            isInvalid: false,
          },
        }
      ),
      icon: cva("size-4"),
    },
  },
};
