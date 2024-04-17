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
            true: "border-success-300 focus-within:border-success focus-within:ring-success",
          },
          isInvalid: {
            true: "border-error-300 focus-within:!border-error focus-within:!ring-error focus-within:!ring-opacity-20",
          },
        },
      }
    ),

    icon: cva("size-[1.5em]"),
    avatar: cva("size-[1.5em] overflow-hidden rounded-full"),

    status: cva("text-base-500 size-[1.5em]", {
      variants: {
        isValid: {
          true: "text-success",
        },
        isInvalid: {
          true: "text-error",
        },
      },
    }),

    prefix: cva(
      "bg-base-100 -ml-2 flex items-center self-stretch rounded-s-lg p-3"
    ),

    suffix: cva(
      "bg-base-100 -mr-2 flex items-center self-stretch rounded-e-lg p-3"
    ),

    feedback: cva(
      "text-base-content flex  items-center gap-x-2 text-xs transition-opacity duration-300",
      {
        variants: {
          hasFeedback: {
            false: "invisible w-0 overflow-hidden text-nowrap opacity-0",
          },
          isInvalid: {
            true: "text-error",
          },
        },
      }
    ),
  },

  inputControlLabel: {
    root: cva(
      "text-base-content flex w-full items-center justify-between gap-x-3"
    ),
    text: cva("text-[0.875em]"),
    required: cva("text-base-500 text-xs leading-tight"),
    optional: cva("text-base-500 text-xs leading-tight"),
  },
};
