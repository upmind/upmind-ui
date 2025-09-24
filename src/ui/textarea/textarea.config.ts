// ---  external
import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const textareaVariants = cva(
  "bg-background-control-surface hover:border-border-control-strong aria-invalid:ring-invalid! focus-visible:ring-ring border-border-control-default text-control-foreground ring-offset-background-canvas placeholder:text-muted-foreground flex w-full rounded border transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-2! aria-invalid:ring-offset-2!",
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
