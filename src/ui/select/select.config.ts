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
        true: `ring-offset-background ${ringClasses} ${invalidRingClasses}`,
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
      "focus:bg-control-active-hover focus:text-control-foreground data-[state=unchecked]:text-emphasis-medium hover:!text-emphasis-none focus:!text-emphasis-none cursor-pointer gap-3 rounded px-4 py-2 text-sm font-medium transition-all duration-300"
    ),
    content: cva("mt-2 p-2")
  }
};
