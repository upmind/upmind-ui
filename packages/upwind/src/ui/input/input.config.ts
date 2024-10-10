// ---  external
import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const inputVariants = cva(
  "bg-control-background  flex w-full rounded-md border border-control text-control-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground invalid:ring-2 invalid:ring-control-error invalid:ring-opacity-20 invalid:ring-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      size: {
        sm: "h-8 px-3 py-2 text-sm",
        md: "h-10 px-3 py-2 text-md",
        lg: "h-12 px-3 py-2 text-lg",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

// -----------------------------------------------------------------------------
export default {
  input: inputVariants,
};
