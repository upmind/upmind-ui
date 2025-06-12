// ---  external
import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const switchVariants = cva(
  "border-control-border !w-10 data-[state=checked]:bg-control-active data-[state=unchecked]:bg-control"
);

// -----------------------------------------------------------------------------
export default {
  switch: switchVariants,
};
