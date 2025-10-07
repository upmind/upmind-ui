import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
export default {
  card: {
    root: cva("bg-surface card-radius w-full border px-7 py-8 text-base", {
      variants: {
        isDisabled: {
          true: "pointer-events-none opacity-50"
        },
        width: {
          full: "w-full"
        },
        aside: {
          true: "md:px-9 md:py-12",
          false: "md:px-15 md:py-12"
        }
      },
      defaultVariants: {
        isDisabled: false
      }
    })
  }
};
