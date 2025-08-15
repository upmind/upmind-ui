import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
export default {
  card: {
    root: cva(
      "md:px-14.5 w-full rounded-lg border bg-base-background px-7 py-8 text-base-foreground md:py-12",
      {
        variants: {
          isDisabled: {
            true: "pointer-events-none opacity-50"
          },
          width: {
            full: "w-full"
          }
        },
        defaultVariants: {
          isDisabled: false
        }
      }
    )
  }
};
