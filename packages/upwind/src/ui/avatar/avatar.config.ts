// ---  external
import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const avatarConfig = cva(
  "relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden bg-base-200 font-normal text-base-foreground",
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

export const iconConfig = cva("m-1 h-full w-full object-cover");

export const captionConfig = cva(
  "absolute bottom-0 left-0 right-0 top-0 z-0 inline-flex items-center justify-center text-center"
);

export const imageConfig = cva("relative z-10 h-full w-full object-cover");

// -----------------------------------------------------------------------------
export default {
  avatar: {
    root: avatarConfig,
    icon: iconConfig,
    caption: captionConfig,
    image: imageConfig,
  },
};
