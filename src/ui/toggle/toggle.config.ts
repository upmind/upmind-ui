// ---  external
import { cva } from "class-variance-authority";

// -----------------------------------------------------------------------------

export const toggleVariants = cva(
  "hover:bg-base-muted focus-visible:ring-ring ring-offset-background-canvas hover:text-muted-foreground data-[state=on]:bg-accent data-[state=on]:text-accent-foreground inline-flex items-center justify-center rounded text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border-input hover:bg-accent hover:text-accent-foreground border bg-transparent"
      },
      size: {
        default: "h-10 px-3",
        sm: "h-9 px-2.5",
        lg: "h-11 px-5"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

// -----------------------------------------------------------------------------
export default {
  toggle: toggleVariants
};
