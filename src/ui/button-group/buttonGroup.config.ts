// --- external
import { cva, cx } from "class-variance-authority";
import { focusWithinRing } from "../../assets/ring.styles";

export const rootVariants = cva(
  `control-radius divide-border-control-default shadow-control-default bg-control-surface [&:hover,&:focus-within]:shadow-control-hover flex divide-x overflow-hidden ${focusWithinRing}`
);

export const buttonVariants = cva("px-3 py-1");

export default {
  buttonGroup: {
    root: rootVariants,
    item: cva("px-1 py-1 leading-none"),
    button: buttonVariants
  }
};
