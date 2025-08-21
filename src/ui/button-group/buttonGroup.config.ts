// --- external
import { cva, cx } from "class-variance-authority";
import { rootVariants } from "../button/button.config";

const buttonGroupVariants = cva("p-0", {
  variants: {
    variant: {
      outline: "divide-border divide-x"
    }
  }
});

const buttonVariants = cva("rounded-none", {
  variants: {
    variant: {
      outline: "focus:opacity-50"
    }
  }
});

const dropdownVariants = cva("rounded");

export default {
  buttonGroup: {
    root: (meta: any) => cx(rootVariants(meta), buttonGroupVariants(meta)),
    button: buttonVariants,
    dropdown: dropdownVariants
  }
};
