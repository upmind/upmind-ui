// ---  external
import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const switchVariants = cva(
  "shadow-control-default data-[state=checked]:bg-control-checked data-[state=checked]:shadow-control-checked data-[state=unchecked]:bg-control-unchecked w-9!"
);

// -----------------------------------------------------------------------------
export default {
  switch: switchVariants
};
