import { cva } from "class-variance-authority";
import { ringClasses, invalidRingClasses } from "../../assets/ring.styles";
// -----------------------------------------------------------------------------

export const variants = {
  width: {
    auto: "w-auto min-w-15",
    full: "w-full"
  },
  size: {
    sm: "text-sm",
    md: "text-md"
  },
  hasRing: {
    true: `${ringClasses} ${invalidRingClasses}`,
    false:
      "ring-0 ring-transparent outline-none focus:ring-0 focus:ring-transparent focus:outline-none"
  }
};

export const rootVariants = cva(
  `bg-background-control-surface hover:border-border-control-hover control-radius border-border-control-default group flex cursor-pointer px-4 py-2 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${ringClasses} ${invalidRingClasses}`,
  {
    variants,
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
          false:
            "text-text-faint group-hover:text-text-base transition-colors duration-200"
        }
      }
    }),
    item: cva(
      "data-[state=unchecked]:text-text-muted data-[state=unchecked]:hover:text-text-base data-[state=unchecked]:focus:text-text-base data-[state=checked]:text-text-base control-radius data-[state=checked]:bg-background-control-selected cursor-pointer gap-3 px-4 py-2 font-normal transition-all duration-200",
      {
        variants: {
          size: variants.size
        }
      }
    ),
    content: cva(
      `control-radius border-border-control-default mt-2 p-2 ${ringClasses} ${invalidRingClasses}`
    )
  }
};
