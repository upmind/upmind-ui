import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
export const rootVariant = cva("w-full rounded-lg", {
  variants: {
    ratio: {
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
    nav: {
      root: cva("absolute bottom-[22px] right-[22px] flex"),
      item: cva("text-white")
    }
  }
};
