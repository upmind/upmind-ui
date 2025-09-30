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
  `bg-control-surface [&:hover,&:focus-within,&[data-hover=true],&[data-focus=true]]:shadow-border-control-hover [&:focus-within,&[data-focus=true]]:ring-ring control-radius shadow-border-control-default group flex cursor-pointer border-none px-4 py-2 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 [&:focus-within,&[data-focus=true]]:ring-2 [&:focus-within,&[data-focus=true]]:ring-offset-2 ${ringClasses} ${invalidRingClasses}`,
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
            "text-faint transition-colors duration-200 [.group:focus-within_&,.group[data-focus=true]_&]:text-base [.group:hover_&,.group[data-hover=true]_&]:text-base"
        }
      }
    }),
    item: cva(
      "data-[state=unchecked]:text-muted data-[state=checked]:bg-control-selected [&:hover,&[data-hover=true]]:bg-control-selected [&:focus,&[data-focus=true]]:bg-control-selected cursor-pointer gap-3 rounded px-4 py-2 font-normal transition-all duration-200 data-[state=checked]:text-base data-[state=unchecked]:hover:text-base data-[state=unchecked]:focus:text-base",
      {
        variants: {
          size: variants.size
        }
      }
    ),
    content: cva(
      `control-radius shadow-border-control-default bg-control-surface mt-2 border-none ${ringClasses} ${invalidRingClasses} p-0`
    )
  }
};
