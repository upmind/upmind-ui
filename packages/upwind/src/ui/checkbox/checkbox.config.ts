// ---  external
import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const checkboxVariants = cva(
  "bg-control-background aria-invalid:!ring-invalid data-[state=checked]:text-control-active-foreground data-[state=checked]:border-active aria-invalid:!ring-2 aria-invalid:!ring-offset-2 focus-visible:ring-ring peer shrink-0 rounded-sm border border-control text-control-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-control-active",
  {
    variants: {
      width: {
        auto: "w-auto",
        full: "w-full",
      },
      size: {
        sm: "!h-3 !w-3",
        md: "!h-4 !w-4",
        lg: "!h-6 !w-6",
      },
    },
    defaultVariants: {
      size: "md",
      width: "full",
    },
  }
);

// -----------------------------------------------------------------------------
export default {
  checkbox: checkboxVariants,
};
