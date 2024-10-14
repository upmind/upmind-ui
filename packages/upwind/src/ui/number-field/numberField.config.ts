import { cva } from "class-variance-authority";

// -----------------------------------------------------------------------------

export const numberFieldVariants = cva(
  "bg-control-background group-aria-invalid:!ring-invalid group-aria-invalid:!ring-2 group-aria-invalid:!ring-offset-2 flex w-full rounded-md border border-control text-center text-control-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
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

export const numberFieldRootVariants = cva("group inline-block", {
  variants: {
    width: {
      auto: "w-auto min-w-[3.75rem]",
      full: "w-full",
    },
  },
  defaultVariants: {
    width: "auto",
  },
});

// -----------------------------------------------------------------------------
export default {
  numberField: {
    input: numberFieldVariants,
    root: numberFieldRootVariants,
  },
};
