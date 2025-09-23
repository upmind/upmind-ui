// ---  external
import { cva } from "class-variance-authority";
import { ringClasses, invalidRingClasses } from "../../assets/ring.styles";
// -----------------------------------------------------------------------------

export const containerVariants = cva(
  `bg-background-control-surface shadow-border-border-control text-md autofill flex items-center gap-3 rounded px-4 py-2 transition-[border-color,opacity,box-shadow] duration-200`,
  {
    variants: {
      width: {
        auto: "w-auto min-w-15",
        full: "w-full"
      },
      hasRing: {
        true: `${ringClasses} ${invalidRingClasses}`,
        false: ""
      }
    },
    defaultVariants: {
      width: "full"
    }
  }
);

export const inputFieldVariants = cva(
  "text-control-foreground w-full bg-transparent focus:ring-0 focus:outline-none"
);

// -----------------------------------------------------------------------------
export default {
  input: {
    container: containerVariants,
    field: inputFieldVariants,
    items: cva("flex h-lh items-center justify-center")
  }
};
