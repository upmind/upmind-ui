import { cva } from "class-variance-authority";
import { ringClasses, invalidRingClasses } from "../../assets/ring.styles";
// -----------------------------------------------------------------------------

export const rootVariants = cva(
  "bg-control-background text-md border-control text-control-foreground placeholder:text-muted-foreground border-control flex cursor-pointer rounded px-4 py-2 shadow-none transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        outline: "border-control",
        ghost: "border-none"
      },
      width: {
        auto: "w-auto min-w-15",
        full: "w-full"
      },
      hasRing: {
        true: `${ringClasses} ${invalidRingClasses}`,
        false:
          "ring-0 ring-transparent outline-none focus:ring-0 focus:ring-transparent focus:outline-none"
      }
    },
    defaultVariants: {
      width: "full"
    }
  }
);

// -----------------------------------------------------------------------------
export default {
  select: {
    root: rootVariants,
    value: cva("text-control-foreground", {
      variants: {
        hasValue: {
          true: "",
          false: "text-emphasis-disabled"
        }
      }
    }),
    item: cva(
      "focus:bg-control-active-hover focus:text-control-foreground rounded text-sm"
    )
  }
};
