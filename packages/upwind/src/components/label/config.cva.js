import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  label: {
    root: cva("inline-flex w-full truncate text-current outline-none", {
      variants: {
        showLabel: {
          false: "sr-only",
        },
      },
    }),
    text: cva("flex-1 truncate", {
      variants: {
        size: {
          sm: "text-xs",
          md: "text-sm",
          lg: "text-md",
        },
      },
      defaultVariants: {
        size: "md",
      },
    }),
    alt: cva("mx-2"),
    required: cva(""),
    optional: cva(""),
    status: cva(
      "text-base-500 ml-auto inline-flex items-center gap-2 text-xs leading-tight"
    ),
    icon: cva("size-4"),
  },
};
