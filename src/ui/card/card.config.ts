import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
export default {
  card: {
    root: cva(
      "w-full rounded-lg bg-base-background px-[60px] py-12 text-base-foreground",
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
