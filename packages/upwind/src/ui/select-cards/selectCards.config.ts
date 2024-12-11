import { cva } from "class-variance-authority";

// -----------------------------------------------------------------------------

export const selectVariants = cva(
  "hover:bg-control-active-hover !flex !items-center justify-center space-x-2 bg-control !py-[1.375rem] !pl-4 !pr-2 !text-md text-control-foreground transition-all duration-200"
);

// -----------------------------------------------------------------------------
export default {
  select: selectVariants,
};
