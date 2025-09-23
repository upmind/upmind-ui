import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const badgeVariants = cva(
  "focus:ring-ring inline-flex w-fit items-center rounded-lg whitespace-nowrap transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none",
  {
    variants: {
      variant: {
        solid: "",
        minimal: "",
        muted: ""
      },
      color: {
        primary: "",
        neutral: "",
        promo: "",
        danger: "",
        warning: "",
        success: "",
        info: ""
      },
      size: {
        sm: "px-2 py-1 text-xs/tight font-semibold",
        md: "px-3 py-1 text-sm/tight font-medium"
      }
    },
    defaultVariants: {
      color: "primary",
      variant: "solid",
      size: "md"
    },
    compoundVariants: [
      {
        variant: "solid",
        color: "primary",
        class: ""
      },
      {
        variant: "solid",
        color: "neutral",
        class: ""
      },
      {
        variant: "solid",
        color: "promo",
        class: ""
      },
      {
        variant: "solid",
        color: "danger",
        class: ""
      },
      {
        variant: "solid",
        color: "warning",
        class: ""
      },
      {
        variant: "solid",
        color: "success",
        class: ""
      },
      {
        variant: "solid",
        color: "info",
        class: ""
      }
    ]
  }
);

// -----------------------------------------------------------------------------
export default {
  badge: badgeVariants
};
