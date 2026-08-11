// --- external
import { cva } from "class-variance-authority";
import { focusWithinRing } from "../../assets/styles";

/**
 * `Button`'s own interactive selector, verbatim from `button.config`'s
 * compound variants. Repeated here so `tailwind-merge` sees the SAME modifier
 * and drops the ghost hover background — without it the ghost's light hover
 * outranks the pressed fill and the active segment washes out on hover/focus.
 */
const interactive =
  "&:hover:not(:disabled),&:focus-within:not(:disabled),&[data-hover=true]:not([data-disabled=true]),&[data-focus=true]:not([data-disabled=true])";

export const rootVariants = cva(
  `control-radius divide-border-control-default shadow-control-default bg-control-surface [&:hover,&:focus-within]:shadow-control-hover flex divide-x overflow-hidden ${focusWithinRing}`
);

export const itemVariants = cva("px-1 py-1 leading-none");

export const buttonVariants = cva("control-radius");

export const activeVariants = cva(
  `bg-control-checked text-control-checked-contrast shadow-control-checked [${interactive}]:bg-control-checked-hover`
);

export default {
  buttonGroup: {
    root: rootVariants,
    item: itemVariants,
    button: buttonVariants,
    active: activeVariants
  }
};
