import { cva } from "class-variance-authority";
import { ringClasses } from "../../assets/styles";
// -----------------------------------------------------------------------------
export const rootVariant = cva("h-full w-full", {
  variants: {
    position: {
      first: "rounded-l-lg",
      middle: "",
      last: "rounded-r-lg"
    },
    isEmpty: {
      true: "text-accent-neutral flex items-center justify-center"
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

export const containerVariant = cva(`h-full overflow-hidden rounded-lg`, {
  variants: {
    ratio: {
      default: "",
      "1:1": "aspect-square",
      "4:3": "aspect-4/3",
      "3:2": "aspect-3/2",
      "16:9": "aspect-video",
      "18:6": "aspect-18/6"
    },
    isEmpty: {
      true: "opacity-20"
    },
    isCarousel: {
      true: `${ringClasses} transition-all duration-200`,
      false: ""
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
    icon: cva("bg-surface p-2"),
    carousel: {
      content: cva(""),
      list: cva("m-0 flex p-0"),
      item: cva("pl-0")
    },
    nav: {
      root: cva("absolute right-5.5 bottom-5.5 flex gap-0.5"),
      item: cva("grid size-3 place-items-center text-white")
    }
  }
};
