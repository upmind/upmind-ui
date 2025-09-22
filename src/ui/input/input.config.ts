// ---  external
import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const ringClasses =
  "ring-offset-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring-control rounded focus-within:ring-offset-2 group-focus-within:ring-0 group-focus-within:ring-offset-0";

export const invalidRingClasses =
  "aria-invalid:ring-invalid! aria-invalid:ring-2! aria-invalid:ring-offset-2!";

export const containerVariants = cva(
  `bg-background-control-surface shadow-border-control-default text-md autofill flex items-center gap-3 rounded border px-4 py-2 transition-[border-color,opacity,box-shadow] duration-200`,
  {
    variants: {
      width: {
        auto: "w-auto min-w-15",
        full: "w-full"
      },
      hasRing: {
        true: `${ringClasses} ${invalidRingClasses}`,
        false: ""
      }
    },
    defaultVariants: {
      width: "full"
    }
  }
);

export const inputFieldVariants = cva(
  "text-control-foreground w-full bg-transparent focus:ring-0 focus:outline-none"
);

// -----------------------------------------------------------------------------
export default {
  input: {
    container: containerVariants,
    field: inputFieldVariants,
    items: cva("flex h-lh items-center justify-center")
  }
};
