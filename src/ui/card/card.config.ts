import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
export default {
  card: {
    root: cva("bg-surface card-radius w-full text-base", {
      variants: {
        isDisabled: {
          true: "pointer-events-none opacity-50"
        },
        width: {
          full: "w-full"
        },
        spacious: {
          false: "px-7 py-8",
          true: "p-6 md:p-18"
        }
      },
      defaultVariants: {
        isDisabled: false
      }
    })
  }
};
