// ---  external
import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const textareaVariants = cva(
  "bg-control-background hover:border-control-strong aria-invalid:!ring-invalid aria-invalid:!ring-2 aria-invalid:!ring-offset-2 focus-visible:ring-ring flex w-full rounded-lg border border-control text-control-foreground ring-offset-background transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      size: {
        sm: "min-h-16 px-3 py-2 text-sm",
        md: "min-h-20 px-3 py-2 text-md",
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
