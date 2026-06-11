import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const thumbnailVariant = cva(
  "image-radius cursor-pointer overflow-hidden border-2 border-transparent transition-opacity duration-200 outline-none [&:focus,&:focus-visible,&[data-focus=true]]:border-(--color-control-ring)",
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
    thumbnails: {
      root: cva("overflow-hidden"),
      content: cva("-ml-2"),
      item: cva("min-w-0 basis-1/5 pl-2"),
      button: thumbnailVariant,
      image: cva("image-radius aspect-square w-full object-cover")
    }
  }
};
