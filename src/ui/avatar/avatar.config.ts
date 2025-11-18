// ---  external
import { cva } from "class-variance-authority";
import { ringClasses } from "../../assets/styles";
// -----------------------------------------------------------------------------

export const variants = {
  color: {
    primary: "bg-primary-default text-button-primary",
    secondary: "bg-secondary-default text-button-secondary"
  },
  fit: {
    cover: "object-cover",
    contain: "object-contain p-[0.5em]"
  },
  size: {
    xs: "size-6 text-xs leading-6",
    sm: "size-8 text-sm leading-6",
    md: "size-10 text-md leading-6",
    lg: "size-12 text-lg leading-6",
    xl: "size-14 text-xl leading-8",
    "2xl": "size-16 text-2xl leading-8"
  },
  shape: {
    circle: "rounded-full",
    square: ""
  },
  focusable: {
    true: `${ringClasses}`
  }
};

export const avatarVariants = cva(
  "relative inline-flex aspect-square shrink-0 items-center justify-center overflow-hidden font-medium text-white select-none",
  {
    variants,
    defaultVariants: {
      fit: "cover",
      size: "md",
      shape: "circle",
      color: "primary"
    }
  }
);

export default {
  avatar: avatarVariants
};
