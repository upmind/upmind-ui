import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
export default {
  card: {
    root: cva(
      "bg-base-background text-base-foreground card-radius w-full border px-7 py-8",
      {
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
      }
    )
  }
};
