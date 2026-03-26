// --- external
import { cva } from "class-variance-authority";
import { ringClasses, invalidRingClasses } from "../../assets/styles";
// -----------------------------------------------------------------------------

export const containerVariants = cva(
  "group flex items-center gap-2 transition-opacity duration-200 has-disabled:opacity-50",
  {
    variants: {
      width: {
        auto: "w-auto",
        full: "w-full"
      }
    },
    defaultVariants: {
      width: "full"
    }
  }
);

// Each OTP slot mirrors Input containerVariants (surface, shadow, radius, ring, transition)
// with slot-specific overrides: fixed size (h-10 w-10), centered text, no padding.
export const slotVariants = cva(
  `bg-control-surface shadow-control-default hover:shadow-control-hover autofill control-radius flex h-10 w-10 items-center justify-center text-base transition-[border-color,opacity,box-shadow] duration-200`,
  {
    variants: {
      hasRing: {
        true: `${ringClasses}`,
        false: ""
      },
      isFocused: {
        true: "z-10 outline-(--color-control-ring)",
        false: ""
      }
    },
    compoundVariants: [
      {
        hasRing: true,
        isFocused: false,
        class: `${invalidRingClasses}`
      }
    ]
  }
);

export const caretVariants = cva(
  "animate-caret-blink bg-default pointer-events-none absolute inset-y-[25%] left-1/2 w-px duration-1000"
);

// -----------------------------------------------------------------------------
export default {
  input: {
    container: containerVariants,
    slot: slotVariants,
    caret: caretVariants
  }
};
