// ---  external
import { cva } from "class-variance-authority";
import { ringClasses, invalidRingClasses } from "../../assets/ring.styles";
// -----------------------------------------------------------------------------

export const checkboxVariants = cva(
  `bg-base-background data-[state=checked]:text-control-active-foreground data-[state=checked]:border-active shadow-border-border-control text-control-foreground ring-offset-background data-[state=checked]:bg-control-active peer shrink-0 rounded-xs disabled:cursor-not-allowed disabled:opacity-50 ${ringClasses} ${invalidRingClasses}`,
  {
    variants: {
      width: {
        auto: "w-auto",
        full: "w-full"
      },
      size: {
        sm: "h-3! w-3!",
        md: "h-4! w-4!",
        lg: "h-6! w-6!"
      }
    },
    defaultVariants: {
      size: "md",
      width: "full"
    }
  }
);

// -----------------------------------------------------------------------------
export default {
  checkbox: checkboxVariants
};
