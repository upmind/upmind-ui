// ---  external
import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const inputVariants = cva(
  "invalid:ring-2 invalid:ring-control-error invalid:ring-opacity-20 invalid:ring-offset-2"
);

// -----------------------------------------------------------------------------
export default {
  input: inputVariants,
};
