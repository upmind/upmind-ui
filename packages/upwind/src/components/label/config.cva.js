import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  label: {
    root: cva(
      "flex w-full items-center justify-between gap-x-3 text-current outline-none"
    ),
    text: cva("flex-1 text-[0.875em]"),
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
