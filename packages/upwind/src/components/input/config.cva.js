import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  input: {
    root: cva("relative flex flex-col gap-1", {
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

    wrapper: cva("group flex w-full items-start gap-3 rounded-lg ring-0", {
      variants: {
        variant: {
          outlined: "border-base-300  border px-2",
          flat: "",
        },
        layout: {
          stacked: "",
          inline: "",
        },

        isDisabled: {
          true: "bg-base-100 pointer-events-none opacity-50",
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
          size: "sm",
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
            " focus-within:border-primary focus-within:ring-primary focus-within:ring-4 focus-within:ring-opacity-20",
        },
        {
          variant: "outlined",
          isInvalid: true,
          isDisabled: false,
          class:
            " focus-within:border-error focus-within:ring-error focus-within:ring-4 focus-within:ring-opacity-20",
        },
        {
          variant: "outlined",
          isValid: true,
          isDisabled: false,
          class:
            " focus-within:border-success focus-within:ring-success focus-within:ring-4 focus-within:ring-opacity-20",
        },
      ],
      defaultVariants: {
        variant: "outlined",
        layout: "stacked",
        size: "md",
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
