// ---  external
import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const ringClasses =
  "ring-offset-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 rounded-lg group-focus-within:ring-0 group-focus-within:ring-offset-0";

export const invalidRingClasses =
  "aria-invalid:!ring-invalid aria-invalid:!ring-2 aria-invalid:!ring-offset-2";

export const inputContainerVariants = cva(
  `flex items-center ${ringClasses} ${invalidRingClasses} bg-control-background rounded-lg border border-control text-control-foreground transition-all duration-300 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50`,
  {
    variants: {
      width: {
        auto: "w-auto min-w-[3.75rem]",
        full: "w-full",
      },
      inputSize: {
        sm: "px-3 py-2 text-sm",
        md: "px-3 py-2 text-md md:text-lg",
        lg: "px-4 py-3 text-md md:text-xl",
        xl: "px-5 py-4 text-xl md:text-xl",
      },
    },
    defaultVariants: {
      inputSize: "md",
      width: "full",
    },
  }
);

// -----------------------------------------------------------------------------
export default {
  container: inputContainerVariants,
};
