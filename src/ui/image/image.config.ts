import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
export const rootVariant = cva("h-full w-full", {
  variants: {
    position: {
      first: "rounded-l-lg",
      middle: "",
      last: "rounded-r-lg"
    },
    isEmpty: {
      true: "flex items-center justify-center bg-secondary text-secondary-foreground"
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
    position: "middle"
  }
});

export const containerVariant = cva("h-full overflow-hidden rounded-lg", {
  variants: {
    ratio: {
      default: "",
      "1:1": "aspect-square",
      "4:3": "aspect-[4/3]",
      "3:2": "aspect-[3/2]",
      "16:9": "aspect-video",
      "18:6": "aspect-[18/6]"
    }
  },
  defaultVariants: {
    ratio: "1:1"
  }
});

export default {
  image: {
    container: containerVariant,
    root: rootVariant,
    icon: cva("opacity-25"),
    carousel: {
      content: cva(""),
      list: cva("m-0 flex p-0"),
      item: cva("pl-0")
    },
    nav: {
      root: cva("bottom-5.5 right-5.5 absolute flex gap-0.5"),
      item: cva("grid size-3 place-items-center text-white")
    }
  }
};
