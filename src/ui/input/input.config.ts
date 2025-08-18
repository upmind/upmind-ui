// ---  external
import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const ringClasses =
  "ring-offset-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring rounded focus-within:ring-offset-2 group-focus-within:ring-0 group-focus-within:ring-offset-0";

export const invalidRingClasses =
  "aria-invalid:ring-invalid! aria-invalid:ring-2! aria-invalid:ring-offset-2!";

export const containerVariants = cva(
  `bg-control-background border-control text-md flex items-center gap-3 border px-4 py-2 transition-[background-color,border-color,opacity,box-shadow] duration-200 ${ringClasses} ${invalidRingClasses}`,
  {
    variants: {
      width: {
        auto: "min-w-15 w-auto",
        full: "w-full"
      }
    },
    defaultVariants: {
      width: "full"
    }
  }
);

export const inputFieldVariants = cva(
  "bg-base-background text-control-foreground w-full rounded focus:outline-none focus:ring-0"
);

// -----------------------------------------------------------------------------
export default {
  input: {
    container: containerVariants,
    field: inputFieldVariants,
    items: cva("h-lh flex items-center justify-center")
  }
};
