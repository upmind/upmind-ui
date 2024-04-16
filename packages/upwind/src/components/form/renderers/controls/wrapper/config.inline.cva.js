import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  inputControl: {
    root: cva("relative flex flex-col gap-1", {
      variants: {
        size: {
          sm: "text-sm",
          default: "",
          lg: "text-lg",
        },
      },
    }),

    wrapper: cva("group flex w-full items-center gap-x-3 p-0 ring-0", {
      variants: {
        isDisabled: {
          true: "pointer-events-none opacity-50",
        },
      },
    }),

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
      "text-base-content inline-flex items-center justify-between gap-x-3 outline-none"
    ),
    text: cva("text-[0.875em]"),
    required: cva("text-base-500 text-xs leading-tight"),
    optional: cva("text-base-500 text-xs leading-tight"),
  },
};
