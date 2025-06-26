import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
export default {
  card: {
    root: cva(
      "rounded-lg bg-base-background p-5 px-6 text-base-foreground shadow-sm md:p-8 md:px-9",
      {
        variants: {
          isDisabled: {
            true: "pointer-events-none opacity-50",
          },
          width: {
            full: "w-full",
          },
        },
        defaultVariants: {
          isDisabled: false,
        },
      }
    ),
    container: cva("", {
      variants: {
        width: {
          app: "w-app",
        },
      },
    }),
  },
};
