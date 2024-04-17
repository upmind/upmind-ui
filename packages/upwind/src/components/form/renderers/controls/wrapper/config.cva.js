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
      "border-base-300 focus-within:border-primary focus-within:ring-primary group inline-flex w-full items-center gap-x-3 rounded-lg border px-2 py-0 ring-0 focus-within:ring-4 focus-within:ring-opacity-20",
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

    icon: cva("size-[1.5em]"),

    avatar: cva("size-[1.5em] overflow-hidden rounded-full"),

    prefix: cva(
      "bg-base-100 -ml-2 flex items-center self-stretch rounded-s-lg p-3"
    ),

    suffix: cva(
      "bg-base-100 -mr-2 flex items-center self-stretch rounded-e-lg p-3"
    ),

    feedback: cva(
      "text-base-content text-base-500 flex items-center gap-x-2 text-xs transition-opacity duration-300",
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
    feedbackIcon: cva("size-4"),
  },

  inputControlLabel: {
    root: cva(
      "text-base-content flex w-full items-center justify-between gap-x-3 outline-none"
    ),
    text: cva("text-[0.875em]"),
    required: cva(""),
    optional: cva(""),
    status: cva(
      "text-base-500 inline-flex items-center gap-2 text-xs leading-tight",
      {
        variants: {
          isValid: {
            true: "text-success",
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
