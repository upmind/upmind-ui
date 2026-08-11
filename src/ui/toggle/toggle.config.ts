// ---  external
import { cva } from "class-variance-authority";
import { focusVisibleRing } from "../../assets/styles";
import { variants as buttonStyles } from "../button/button.config";
// -----------------------------------------------------------------------------

export const toggleVariants = cva(
  `control-radius hover:bg-control-unchecked-hover hover:text-muted data-[state=on]:bg-control-checked data-[state=on]:text-control-checked-contrast data-[state=on]:shadow-control-checked data-[state=on]:hover:bg-control-checked-hover data-[state=on]:hover:text-control-checked-contrast inline-flex items-center justify-center text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 ${focusVisibleRing}`,
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border-control-default hover:bg-control-checked-hover hover:text-control-checked-contrast border bg-transparent"
      },
      // The registry's own `default | sm | lg` API, sized from `Button`'s size
      // tokens so a toggle sits at the same height as the rest of a control row.
      size: {
        default: buttonStyles.size.md,
        sm: buttonStyles.size.sm,
        lg: buttonStyles.size.lg
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
// -----------------------------------------------------------------------------
export default {
  toggle: toggleVariants
};
