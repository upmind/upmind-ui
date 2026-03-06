import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
export default {
  card: {
    root: cva("bg-surface card-radius border-control w-full border text-base", {
      variants: {
        isDisabled: {
          true: "pointer-events-none opacity-50"
        },
        width: {
          full: "w-full"
        },
        padding: {
          md: "p-6 lg:px-8 lg:py-9",
          lg: "p-6 lg:p-18"
        }
      },
      defaultVariants: {
        isDisabled: false,
        padding: "lg"
      }
    })
  }
};
