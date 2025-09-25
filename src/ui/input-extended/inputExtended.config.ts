// ---  external
import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const ringClasses =
  "ring-offset-background-canvas focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 rounded group-focus-within:ring-0 group-focus-within:ring-offset-0";

export const invalidRingClasses =
  "aria-invalid:ring-invalid! aria-invalid:ring-2! aria-invalid:ring-offset-2!";

export const inputContainerVariants = cva(
  `flex items-center ${ringClasses} ${invalidRingClasses} bg-background-control-surface hover:border-border-control-hover border-border-control-default text-control-foreground placeholder:text-muted-foreground rounded border transition-[background-color,border-color,opacity,box-shadow] duration-300 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50`,
  {
    variants: {
      width: {
        auto: "w-auto min-w-15",
        full: "w-full"
      },
      inputSize: {
        sm: "px-3 py-2 text-sm",
        md: "text-md px-3 py-2",
        lg: "px-4 py-3 text-lg",
        xl: "px-5 py-4 text-xl"
      }
    },
    defaultVariants: {
      inputSize: "md",
      width: "full"
    }
  }
);

// -----------------------------------------------------------------------------
export default {
  container: inputContainerVariants
};
