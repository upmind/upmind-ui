import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
export default {
  card: {
    root: cva(
      "bg-base-background text-base-foreground md:px-14.5 w-full rounded-lg border px-7 py-8 md:py-12",
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
