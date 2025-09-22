// --- external
import { cva, cx } from "class-variance-authority";
import { rootVariants } from "../button/button.config";

export const buttonGroupVariants = cva(
  "control-radius divide-border gap-0 divide-x overflow-hidden p-0"
);

export const buttonVariants = cva(
  "focus:bg-control-active-hover px-3 py-1 ring-0"
);

export default {
  buttonGroup: {
    root: (meta: any) => cx(rootVariants(meta), buttonGroupVariants(meta)),
    item: cva("flex items-center justify-center px-1 py-1"),
    button: buttonVariants
  }
};
