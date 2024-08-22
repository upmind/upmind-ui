// ---  external
import { cva } from "class-variance-authority";

export const avatarConfig = cva(
  "bg-base-200 text-base-foreground inline-flex shrink-0 select-none items-center justify-center overflow-hidden font-normal",
  {
    variants: {
      size: {
        sm: "h-10 w-10 text-xs",
        md: "h-16 w-16 text-2xl",
        lg: "h-32 w-32 text-5xl",
      },
      shape: {
        circle: "rounded-full",
        square: "rounded-md",
      },
    },
    defaultVariants: {
      size: "md",
      shape: "circle",
    },
  }
);

// -----------------------------------------------------------------------------
export default {
  avatar: {
    root: avatarConfig,
    icon: cva("m-1 h-full w-full object-cover"),
    caption: cva("absolute"),
    image: cva("h-full w-full object-cover"),
  },
};
