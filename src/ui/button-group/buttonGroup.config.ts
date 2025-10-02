// --- external
import { cva, cx } from "class-variance-authority";

export const rootVariants = cva(
  "control-radius divide-border-control-default shadow-border-control-default flex gap-0 divide-x overflow-hidden p-0"
);

export const buttonVariants = cva("px-3 py-1");

export default {
  buttonGroup: {
    root: rootVariants,
    item: cva("flex items-center justify-center px-1 py-1"),
    button: buttonVariants
  }
};
