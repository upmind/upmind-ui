import { cva } from "class-variance-authority";

// -----------------------------------------------------------------------------

export const selectVariants = cva(
  "hover:bg-control-active-hover !flex w-full !items-center justify-center gap-0 space-x-2 rounded-md border border-control bg-control !py-3 !pl-4 !pr-2 !text-md text-control-foreground shadow-sm transition-all duration-200"
);

export const itemVariants = cva(
  "!text-emphasis-medium !hover:text-emphasis-none"
);

// -----------------------------------------------------------------------------
export default {
  select: selectVariants,
  item: itemVariants,
};
