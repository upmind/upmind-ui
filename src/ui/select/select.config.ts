import { cva } from "class-variance-authority";

// -----------------------------------------------------------------------------

export const selectVariants = cva(
  "bg-control-background aria-invalid:!ring-invalid aria-invalid:!ring-2 aria-invalid:!ring-offset-2 focus-visible:ring-ring flex rounded-lg border border-control text-center text-control-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
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
  select: selectVariants,
};
