// ---  external
import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const ringClasses =
  "ring-offset-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring rounded focus-within:ring-offset-2 group-focus-within:ring-0 group-focus-within:ring-offset-0";

export const invalidRingClasses =
  "aria-invalid:!ring-invalid aria-invalid:!ring-2 aria-invalid:!ring-offset-2";

export const containerVariants = cva(
  `border border-control transition-[background-color,border-color,opacity,box-shadow] duration-200 ${ringClasses} ${invalidRingClasses}`,
  {
    variants: {
      width: {
        auto: "w-auto min-w-[3.75rem]",
        full: "w-full"
      }
    },
    defaultVariants: {
      width: "full"
    }
  }
);

export const inputContainerVariants = cva("flex gap-3", {
  variants: {
    size: {
      sm: "",
      md: "gap-3 px-4 py-2 text-sm",
      lg: "gap-3 px-4 py-2 text-md",
      xl: ""
    }
  },
  defaultVariants: {
    size: "md"
  }
});

export const inputFieldVariants = cva(
  "w-full rounded text-control-foreground focus:outline-none focus:ring-0"
);

// -----------------------------------------------------------------------------
export default {
  container: containerVariants,
  input: {
    container: inputContainerVariants,
    field: inputFieldVariants,
    items: cva("text-color-base flex size-[1lh] items-center justify-center")
  }
};
