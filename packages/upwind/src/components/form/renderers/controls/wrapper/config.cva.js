import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  inputControl: {
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
      "border-base-300 focus-within:border-primary focus-within:ring-primary group inline-flex w-full items-start gap-x-3 rounded-lg border px-2 py-0 ring-0 focus-within:ring-4 focus-within:ring-opacity-20",
      {
        variants: {
          isDisabled: {
            true: "bg-base-100 pointer-events-none opacity-50",
          },
          isValid: {
            true: "focus-within:border-success focus-within:ring-success",
          },
          isInvalid: {
            true: "border-error-300 focus-within:!border-error focus-within:!ring-error focus-within:!ring-opacity-20",
          },
        },
      }
    ),

    inline: cva("group flex w-full items-center gap-x-3 p-0 ring-0", {
      variants: {
        isDisabled: {
          true: "pointer-events-none opacity-50",
        },
      },
    }),

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

    prefix: cva(
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

    suffix: cva(
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
  feedback: {
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
