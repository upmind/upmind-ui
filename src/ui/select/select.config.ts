import { cva } from "class-variance-authority";
import { ringClasses, invalidRingClasses } from "../../assets/ring.styles";
// -----------------------------------------------------------------------------

export const rootVariants = cva(
  "bg-control-background text-md text-control-foreground placeholder:text-muted-foreground flex cursor-pointer rounded px-4 py-2 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        outline: "shadow-border-control border-none",
        ghost: "border-none"
      },
      width: {
        auto: "w-auto min-w-15",
        full: "w-full"
      },
      size: {
        sm: "text-sm",
        md: "text-md"
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
          false: "text-text-muted"
        }
      }
    }),
    item: cva(
      "focus:bg-control-active-hover focus:text-control-foreground data-[state=unchecked]:text-text-muted hover:!text-text-base focus:!text-text-base text-md cursor-pointer gap-3 rounded px-4 py-2 font-medium transition-all duration-300"
    ),
    content: cva("mt-2 p-2")
  }
};
