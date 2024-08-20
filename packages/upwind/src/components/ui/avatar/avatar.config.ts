// ---  external
import { cva } from "class-variance-authority";

export const avatarVariant = {
  root: cva(
    "text-base-foreground bg-base-200 inline-flex shrink-0 select-none items-center justify-center overflow-hidden font-normal",
    {
      variants: {
        size: {
          sm: "h-10 w-10 text-xs",
          base: "h-16 w-16 text-2xl",
          lg: "h-32 w-32 text-5xl",
        },
        shape: {
          circle: "rounded-full",
          square: "rounded-md",
        },
      },
    }
  ),

  icon: cva("m-1 h-full w-full object-cover"),
  caption: cva("absolute"),
};

// -----------------------------------------------------------------------------
export default {
  avatar: avatarVariant,
};
