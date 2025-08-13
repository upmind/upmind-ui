import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
export default {
  card: {
    root: cva(
      "bg-base-background text-base-foreground w-full rounded-lg p-5 px-6 shadow-2xs md:p-8 md:px-9",
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
