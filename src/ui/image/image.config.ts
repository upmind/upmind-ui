import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
export const rootVariant = cva("w-full", {
  variants: {
    isEmpty: {
      true: "flex items-center justify-center bg-secondary text-secondary-foreground"
    },
    ratio: {
      default: "h-auto w-full",
      "1:1": "aspect-square",
      "4:3": "aspect-[4/3]",
      "3:2": "aspect-[3/2]",
      "16:9": "aspect-video",
      "18:6": "aspect-[18/6]"
    },
    fit: {
      cover: "object-cover object-center",
      contain: "object-contain",
      fill: "object-fill",
      stretch: "object-fill",
      "scale-down": "object-scale-down",
      none: "object-none"
    }
  },
  defaultVariants: {
    fit: "cover",
    ratio: "3:2"
  }
});

export default {
  image: {
    container: cva("relative"),
    root: rootVariant,
    icon: cva("opacity-25"),
    carousel: {
      content: cva(""),
      list: cva("m-0 flex p-0"),
      item: cva("w-full")
    },
    nav: {
      root: cva("absolute bottom-[22px] right-[22px] flex gap-0.5"),
      item: cva("grid size-3 place-items-center text-white")
    }
  }
};
