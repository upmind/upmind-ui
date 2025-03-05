// ---  external
import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const ringClasses =
  "ring-offset-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 rounded-md group-focus-within:ring-0 group-focus-within:ring-offset-0";

export const invalidRingClasses =
  "aria-invalid:!ring-invalid aria-invalid:!ring-2 aria-invalid:!ring-offset-2";

export const inputContainerVariants = cva(
  `flex items-center ${ringClasses} ${invalidRingClasses} bg-control-background rounded-md border border-control text-control-foreground transition-all duration-300 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50`,
  {
    variants: {
      width: {
        auto: "w-auto min-w-[3.75rem]",
        full: "w-full",
      },
      size: {
        sm: "",
        md: "",
        lg: "px-4 py-3",
        xl: "px-4 py-3",
      },
    },
    defaultVariants: {
      size: "md",
      width: "full",
    },
  }
);

export const inputExtendedVariants = cva("", {
  variants: {
    height: {
      sm: "h-8",
      md: "h-10",
      lg: "h-12",
      xl: "h-14",
      "2xl": "h-16",
    },
    text: {
      sm: "text-sm",
      md: "text-md",
      lg: "text-lg",
      xl: "text-xl",
    },
  },
  defaultVariants: {
    height: "md",
    text: "md",
  },
});

// -----------------------------------------------------------------------------
export default {
  container: inputContainerVariants,
  input: inputExtendedVariants,
};
