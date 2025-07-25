// ---  external
import { cva } from "class-variance-authority";
import { ringClasses, invalidRingClasses } from "../../assets/styles";
// -----------------------------------------------------------------------------

export const checkboxVariants = cva(
  `bg-control-background data-[state=checked]:text-control-active-foreground data-[state=checked]:border-active peer shrink-0 rounded-sm border border-control text-control-foreground ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-control-active ${ringClasses} ${invalidRingClasses}`,
  {
    variants: {
      width: {
        auto: "w-auto",
        full: "w-full"
      },
      size: {
        sm: "!h-3 !w-3",
        md: "!h-4 !w-4",
        lg: "!h-6 !w-6"
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
