// --- external
import { cva, cx } from "class-variance-authority";
import { rootVariants } from "../button/button.config";

export const buttonGroupVariants = cva(
  "control-radius gap-0 overflow-hidden p-0",
  {
    variants: {
      variant: {
        outline: "divide-border divide-x"
      }
    }
  }
);

export const buttonVariants = cva("px-3 py-1 ring-0", {
  variants: {
    variant: {
      outline: "focus:bg-control-active-hover"
    }
  }
});

export default {
  buttonGroup: {
    root: (meta: any) => cx(rootVariants(meta), buttonGroupVariants(meta)),
    item: cva("flex items-center justify-center px-1 py-1"),
    button: buttonVariants
  }
};
