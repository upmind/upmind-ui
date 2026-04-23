// --- external
import { cva } from "class-variance-authority";

// -----------------------------------------------------------------------------

export const checkboxVariants = cva(
  [
    "outline-hidden group-focus-visible:ring-2 group-focus-visible:ring-control-ring group-focus-visible:ring-offset-2 ring-offset-control-surface",
    "aspect-square rounded-sm flex shrink-0 items-center justify-center",
    "shadow-control-default group-data-[state=checked]:shadow-control-checked",
    "bg-control-surface group-data-[state=checked]:bg-control-checked",
    "group-hover:shadow-control-hover group-data-[state=checked]:group-hover:shadow-control-checked",
    "group-data-[disabled]:cursor-not-allowed group-data-[disabled]:opacity-50"
  ],
  {
    variants: {
      size: {
        sm: "h-3 w-3",
        md: "h-4 w-4"
      }
    },
    defaultVariants: {
      size: "md"
    }
  }
);

// -----------------------------------------------------------------------------

export default {
  checkbox: checkboxVariants
};
