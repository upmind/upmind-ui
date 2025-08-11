import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
export default {
  card: {
    root: cva(
      "w-full rounded-lg border bg-base-background px-7 py-8 text-base-foreground md:px-[60px] md:py-12",
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
