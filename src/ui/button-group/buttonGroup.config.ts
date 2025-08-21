// --- external
import { cva } from "class-variance-authority";
import { ringClasses } from "../../assets/ring.styles";

export const rootVariants = cva(`inline-flex rounded ${ringClasses}`, {
  variants: {
    color: {
      base: "",
      primary: "ring-primary!",
      secondary: "ring-secondary!",
      accent: "ring-accent!",
      promotion: "ring-promotion!",
      destructive: "ring-destructive!",
      success: "ring-success!",
      info: "ring-info!",
      error: "ring-error!",
      warning: "ring-warning!"
    },
    orientation: {
      horizontal: "flex-row",
      vertical: "flex-col"
    },
    isDisabled: {
      true: "pointer-events-none opacity-50"
    }
  },
  defaultVariants: {
    orientation: "horizontal"
  }
});

export default {
  buttonGroup: {
    root: rootVariants
  }
};
