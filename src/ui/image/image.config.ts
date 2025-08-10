import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
export const rootVariant = cva("h-full w-full", {
  variants: {
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
    fit: "cover"
  }
});

export default {
  image: {
    container: cva("h-full overflow-hidden rounded-lg"),
    root: rootVariant,
    icon: cva("opacity-25"),
    carousel: {
      root: cva("h-full overflow-hidden rounded-lg", {
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
      }),
      content: cva(""),
      list: cva("m-0 flex p-0"),
      item: cva("pl-0", {
        variants: {
          ratio: {
            default: "h-auto w-full",
            "1:1": "h-full w-full",
            "4:3": "h-full w-full",
            "3:2": "h-full w-full",
            "16:9": "h-full w-full",
            "18:6": "h-full w-full"
          }
        },
        defaultVariants: {
          ratio: "1:1"
        }
      })
    },
    nav: {
      root: cva("absolute bottom-[22px] right-[22px] flex gap-0.5"),
      item: cva("grid size-3 place-items-center text-white")
    }
  }
};
