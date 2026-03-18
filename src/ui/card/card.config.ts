import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
export const rootVariants = cva(
  "bg-surface card-radius shadow-border-surface w-full text-base",
  {
    variants: {
      isDisabled: {
        true: "pointer-events-none opacity-50"
      },
      width: {
        app: "",
        full: "w-full"
      },
      size: {
        sm: "p-6 lg:p-8",
        md: "p-6 lg:p-12",
        lg: "p-6 lg:p-18"
      }
    },
    defaultVariants: {
      isDisabled: false,
      size: "md"
    }
  }
);

export default {
  card: {
    root: rootVariants
  }
};
