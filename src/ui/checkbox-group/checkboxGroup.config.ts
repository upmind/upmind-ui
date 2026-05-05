// --- external
import { cva } from "class-variance-authority";

// -----------------------------------------------------------------------------

export const checkboxVariants = cva(
  [
    "group-focus-visible:ring-control-ring ring-offset-control-surface outline-hidden group-focus-visible:ring-2 group-focus-visible:ring-offset-2",
    "flex aspect-square shrink-0 items-center justify-center rounded-sm",
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
