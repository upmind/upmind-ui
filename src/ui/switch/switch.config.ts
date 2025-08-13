// ---  external
import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const switchVariants = cva(
  "border-control data-[state=checked]:bg-control-active data-[state=unchecked]:bg-control-foreground w-11!"
);

// -----------------------------------------------------------------------------
export default {
  switch: switchVariants
};
