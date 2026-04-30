import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const previewVariant = cva(
  "group image-radius relative block w-full cursor-pointer overflow-hidden",
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
      isEmpty: {
        true: "text-accent-neutral flex items-center justify-center"
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

export const previewImageVariant = cva("h-full w-full", {
  variants: {
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
    position: "center"
  }
});

export const thumbnailVariant = cva(
  "image-radius cursor-pointer overflow-hidden transition-opacity duration-200",
  {
    variants: {
      isActive: {
        true: "opacity-100",
        false: "opacity-50 hover:opacity-75"
      }
    },
    defaultVariants: {
      isActive: false
    }
  }
);

export default {
  imageGrid: {
    container: cva("flex flex-col gap-2 overflow-hidden"),
    preview: previewVariant,
    previewImage: previewImageVariant,
    overlay: cva(
      "group-hover:bg-core-overlay/50 absolute inset-0 flex items-center justify-center bg-transparent transition-all duration-200"
    ),
    overlayIcon: cva(
      "scale-100 text-white opacity-0 transition-all duration-200 group-hover:scale-125 group-hover:opacity-100"
    ),
    icon: cva("bg-surface p-2"),
    thumbnails: cva("-ml-2"),
    thumbnailItem: cva("min-w-0 basis-1/5 pl-2"),
    thumbnail: thumbnailVariant,
    thumbnailImage: cva("image-radius aspect-square w-full object-cover")
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
