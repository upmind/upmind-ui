import { cva } from "class-variance-authority";
import { focusRing } from "../../assets/styles";
// -----------------------------------------------------------------------------
export const rootVariant = cva("h-full w-full", {
  variants: {
    carouselPosition: {
      first: "image-radius-l",
      middle: "",
      last: "image-radius-r"
    },
    isEmpty: {
      true: "text-accent-neutral flex items-center justify-center"
    },
    fit: {
      cover: "object-cover",
      contain: "object-contain",
      fill: "object-fill",
      stretch: "object-fill",
      "scale-down": "object-scale-down",
      none: "object-none"
    },
    position: {
      center: "object-center",
      top: "object-top",
      bottom: "object-bottom",
      left: "object-left",
      right: "object-right",
      "left-top": "object-top-left",
      "left-bottom": "object-bottom-left",
      "right-top": "object-top-right",
      "right-bottom": "object-bottom-right"
    }
  },
  defaultVariants: {
    fit: "cover",
    position: "center",
    carouselPosition: "middle"
  }
});

export const containerVariant = cva(
  `group image-radius relative block w-full overflow-hidden`,
  {
    variants: {
      ratio: {
        auto: "h-full",
        "1:1": "aspect-square",
        "3:2": "aspect-3/2",
        "4:3": "aspect-4/3",
        "16:9": "aspect-video",
        "18:6": "aspect-18/6"
      },
      hasFallback: {
        true: "opacity-20"
      },
      isCarousel: {
        true: `${focusRing} transition-all duration-200`,
        false: ""
      }
    },
    compoundVariants: [
      {
        ratio: "auto",
        hasFallback: true,
        class: "aspect-square"
      }
    ],
    defaultVariants: {
      ratio: "1:1"
    }
  }
);

export const indicatorVariant = cva(
  "h-2 w-2 cursor-pointer rounded-full bg-current",
  {
    variants: {
      isActive: {
        true: "",
        false: "opacity-50"
      }
    },
    defaultVariants: {
      isActive: true
    }
  }
);

export default {
  image: {
    container: containerVariant,
    root: rootVariant,
    picture: cva("contents w-full"),
    icon: cva("bg-surface p-2"),
    expand: cva(
      "bg-overlay [&:hover:not(:disabled),&:focus-within:not(:disabled),&[data-hover=true]:not([data-disabled=true]),&[data-focus=true]:not([data-disabled=true])]:bg-overlay absolute top-4 right-4 z-10 rounded-full text-white opacity-0 group-hover:opacity-70 group-focus-within:opacity-100 hover:opacity-100"
    ),
    carousel: {
      content: cva("ml-0 h-full"),
      list: cva("m-0 flex p-0"),
      item: cva("pl-0")
    },
    nav: {
      root: cva("absolute right-5.5 bottom-5.5 flex gap-0.5"),
      item: cva("grid size-3 place-items-center text-white"),
      dot: indicatorVariant
    }
  },
  preview: {
    dialog: cva(
      "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fill-mode-both animation-duration-200 bg-overlay fixed inset-0 z-50 flex touch-none items-center justify-center overflow-hidden p-4 outline-none"
    ),
    image: cva(
      "image-radius max-h-[90vh] max-w-[90vw] object-contain select-none",
      {
        variants: {
          isZoomed: {
            true: "cursor-zoom-out",
            false: "cursor-zoom-in"
          }
        },
        defaultVariants: {
          isZoomed: false
        }
      }
    ),
    close: cva("text-tooltip absolute top-4 right-4 z-10")
  }
};
