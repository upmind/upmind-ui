// ---  external
import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const buttonConfig = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "text-primary-forground bg-primary hover:bg-primary/90",
        flat: "text-primary-forground bg-primary hover:bg-primary/90",
        destructive:
          "text-destructive-forground bg-destructive hover:bg-destructive/90",
        outline:
          "hover:text-accent-forground border border-input bg-background hover:bg-accent",
        secondary:
          "text-secondary-forground bg-secondary hover:bg-secondary/80",
        ghost: "hover:text-accent-forground hover:bg-accent",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        md: "h-10 px-4 py-2",
        xs: "h-7 rounded px-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

// -----------------------------------------------------------------------------

export default {
  button: {
    root: buttonConfig,
  },
};
