import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  label: {
    root: cva(
      "flex w-full flex-wrap items-center justify-between gap-x-3 text-current outline-none",
      {
        variants: {
          showLabel: {
            false: "sr-only",
          },
        },
      }
    ),
    text: cva("w flex-1 truncate text-[0.875em]"),
    alt: cva("text-base-500 w-full text-xs"),
    required: cva(""),
    optional: cva(""),
    status: cva(
      "text-base-500 inline-flex items-center gap-2 text-xs leading-tight",
      {
        variants: {
          isValid: {
            true: "hidden",
          },
          isInvalid: {
            // true: "text-error",
          },
        },
      }
    ),
    icon: cva("size-4"),
  },
};
