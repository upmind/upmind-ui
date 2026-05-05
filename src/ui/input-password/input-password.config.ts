// --- external
import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

// Resting appearance for any append-slot icon link (generator, etc.) — always muted, full on hover.
export const actionVariants = cva("opacity-50 hover:opacity-100");

// Mask toggle: same resting state, but sticks at full opacity while the password is unmasked.
export const toggleVariants = cva("", {
  variants: {
    active: {
      true: "opacity-100",
      false: "opacity-50 hover:opacity-100"
    }
  },
  defaultVariants: {
    active: false
  }
});

export const strengthRootVariants = cva("mt-3 space-y-2");

export const barsVariants = cva("flex gap-1");

export const barVariants = cva(
  "h-1 flex-1 rounded-full transition-all duration-300",
  {
    variants: {
      state: {
        empty: "bg-skeleton",
        weak: "bg-accent-danger",
        medium: "bg-accent-warning",
        strong: "bg-accent-success"
      }
    },
    defaultVariants: {
      state: "empty"
    }
  }
);

export const messageVariants = cva(
  "text-sm leading-4 transition-colors duration-200",
  {
    variants: {
      hasError: {
        true: "text-accent-danger",
        false: "text-muted"
      }
    },
    defaultVariants: {
      hasError: false
    }
  }
);
// -----------------------------------------------------------------------------
export default {
  inputPassword: {
    action: actionVariants,
    toggle: toggleVariants
  },
  passwordStrength: {
    root: strengthRootVariants,
    bars: barsVariants,
    bar: barVariants,
    message: messageVariants
  }
};
