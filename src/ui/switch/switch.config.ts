// ---  external
import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const switchVariants = cva(
  "w-11! border-control data-[state=checked]:bg-control-active data-[state=unchecked]:bg-control-foreground"
);

// -----------------------------------------------------------------------------
export default {
  switch: switchVariants
};
