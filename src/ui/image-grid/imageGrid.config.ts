import { cva } from "class-variance-authority";
import { focusRing } from "../../assets/styles";
// -----------------------------------------------------------------------------

export const thumbnailVariant = cva(
  `image-radius cursor-pointer overflow-hidden transition-opacity duration-200 ${focusRing}`,
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
    container: cva("flex flex-col gap-2"),
    preview: {
      wrapper: cva("group relative"),
      expand: cva(
        "bg-core-overlay/50! hover:bg-core-overlay/70! absolute top-2 right-2 z-10 rounded-full text-white opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
      )
    },
    thumbnails: {
      root: cva("overflow-hidden"),
      content: cva("-ml-2"),
      item: cva("min-w-0 basis-1/5 pl-2"),
      button: thumbnailVariant,
      image: cva("image-radius aspect-square w-full object-cover")
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
