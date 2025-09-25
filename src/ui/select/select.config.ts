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
  `bg-background-control-surface hover:border-border-control-strong control-radius border-border-control-default duration-200 disabled:cursor-not-allowed flex cursor-pointer px-4 py-2 transition-all disabled:opacity-50 group ${ringClasses} ${invalidRingClasses}`,
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
          false: "text-text-faint group-hover:text-text-base transition-colors duration-200"
        }
      }
    }),
    item: cva(
      "data-[state=unchecked]:text-text-muted hover:text-text-base focus:text-text-base cursor-pointer gap-3 px-4 py-2 font-normal transition-all duration-300",
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
