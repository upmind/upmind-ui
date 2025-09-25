// ---  external
import { cva } from "class-variance-authority";
import { ringClasses, invalidRingClasses } from "../../assets/ring.styles";

export const textareaVariants = cva(
  `bg-background-control-surface hover:border-border-control-hover border-border-control-default text-control-foreground placeholder:text-muted-foreground flex w-full rounded border transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50 ${ringClasses} ${invalidRingClasses}`,
  {
    variants: {
      size: {
        sm: "min-h-16 px-3 py-2 text-sm",
        md: "text-md min-h-20 px-3 py-2",
        lg: "min-h-24 px-3 py-2 text-lg"
      }
    },
    defaultVariants: {
      size: "md"
    }
  }
);

// -----------------------------------------------------------------------------
export default {
  textarea: textareaVariants
};
