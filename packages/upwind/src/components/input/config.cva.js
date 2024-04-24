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
            class: "border-success-300",
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
          sm: "my-2 size-5",
          md: "my-3 size-6",
          lg: "my-4 size-7",
        },
      },
      defaultVariants: {
        size: "md",
      },
    }),

    avatar: cva("my-3  overflow-hidden rounded-full", {
      variants: {
        size: {
          sm: "my-2 size-5",
          md: "my-3 size-6",
          lg: "my-4 size-7",
        },
      },
      defaultVariants: {
        size: "md",
      },
    }),

    prepend: cva(
      "bg-base-100 border-base-300 -ml-2 flex items-start self-stretch rounded-s-lg border-r leading-none",
      {
        variants: {
          size: {
            sm: "px-3 py-2 leading-5",
            md: "px-3 py-3 leading-6",
            lg: "px-3 py-4 leading-7",
          },
        },
        defaultVariants: {
          size: "md",
        },
      }
    ),

    append: cva(
      "bg-base-100 border-base-300 -mr-2 flex items-start self-stretch rounded-e-lg border-l",
      {
        variants: {
          size: {
            sm: "px-3 py-2 leading-5",
            md: "px-3 py-3 leading-6",
            lg: "px-3 py-4 leading-7",
          },
        },
        defaultVariants: {
          size: "md",
        },
      }
    ),
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
