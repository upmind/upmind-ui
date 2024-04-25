import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  input: {
    root: cva("relative inline-flex flex-col gap-1", {
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
      "group flex w-full items-start gap-3 rounded-lg px-2 py-0 ring-0",
      {
        variants: {
          variant: {
            outlined: "border-base-300  border ",
            flat: "",
          },
          layout: {
            stacked: "",
            inline: "border-none p-0 !ring-0",
          },

          isDisabled: {
            true: "bg-base-100 pointer-events-none opacity-50",
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
            isFocused: true,
            isInvalid: false,
            isValid: false,
            isDisabled: false,
            class: "border-primary ring-primary ring-4 ring-opacity-20",
          },
          {
            isFocused: true,
            isInvalid: true,
            isDisabled: false,
            class: "border-error ring-error ring-4 ring-opacity-20",
          },
          {
            isFocused: true,
            isValid: true,
            isDisabled: false,
            class: "border-success ring-success ring-4 ring-opacity-20",
          },
        ],
      }
    ),

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
          size: "sm",
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
          size: "sm",
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
          outlined: "bg-base-100 border-base-300 border-r ",
          flat: "text-base-500",
        },
        layout: {
          stacked: "-ml-2",
        },
      },
      compoundVariants: [
        {
          size: "sm",
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
          outlined: "bg-base-100 border-base-300 border-l",
          flat: "text-base-500",
        },
        layout: {
          stacked: "-mr-2",
        },
      },
      compoundVariants: [
        {
          size: "sm",
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
  },
  inputFeedback: {
    root: cva(
      "text-base-500 flex items-center gap-x-2 text-xs transition-opacity duration-300",
      {
        variants: {
          hasFeedback: {
            false: "invisible hidden w-0 overflow-hidden text-nowrap opacity-0",
          },
          isInvalid: {
            true: "text-error",
          },
        },
      }
    ),
    icon: cva("size-4"),
  },
};
