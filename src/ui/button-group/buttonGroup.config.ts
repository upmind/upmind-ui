// --- external
import { cva } from "class-variance-authority";

export const rootVariants = cva(
  `ring-offset-background focus-within:ring-ring relative inline-flex rounded transition-all duration-300 focus-within:ring-2 focus-within:ring-offset-2`,
  {
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
  }
);

export default {
  buttonGroup: {
    root: rootVariants
  }
};
