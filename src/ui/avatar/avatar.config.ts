// ---  external
import { cva } from "class-variance-authority";
import { ringClasses } from "../../assets/ring.styles";
// -----------------------------------------------------------------------------

export const variants = {
  color: {
    primary: "bg-background-primary",
    blue: "bg-background-blue",
    pink: "bg-background-pink",
    orange: "bg-background-orange",
    green: "bg-background-green",
    yellow: "bg-background-yellow",
    purple: "bg-background-purple"
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
    color: "base",
    circle: "rounded-full",
    square: "rounded-md"
  },
  focusable: {
    true: `${ringClasses}`
  }
};

export const avatarVariants = cva(
  "text-text-white relative inline-flex aspect-square shrink-0 items-center justify-center overflow-hidden font-medium select-none",
  {
    variants,
    defaultVariants: {
      fit: "cover",
      size: "md",
      shape: "circle",
      color: "blue"
    }
  }
);

export default {
  avatar: avatarVariants
};
