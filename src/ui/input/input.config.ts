// ---  external
import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const ringClasses =
  "ring-offset-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 rounded-md group-focus-within:ring-0 group-focus-within:ring-offset-0";

export const invalidRingClasses =
  "aria-invalid:!ring-invalid aria-invalid:!ring-2 aria-invalid:!ring-offset-2";

export const inputVariants = cva(
  `${ringClasses} ${invalidRingClasses} bg-control-background flex rounded-md border border-control text-control-foreground file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50`,
  {
    variants: {
      width: {
        auto: "w-auto min-w-[3.75rem]",
        full: "w-full",
      },
      size: {
        sm: "h-8 px-3 py-2 text-sm",
        md: "h-10 px-3 py-2 text-md",
        lg: "h-12 px-3 py-2 text-lg",
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
  input: inputVariants,
};
