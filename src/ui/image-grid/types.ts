import type { ImageItem } from "../image/types";
import type { RootVariants, ImageVariants } from "../image/types";
import type { IconProps } from "../icon";
import type { ImgHTMLAttributes } from "vue";

// -----------------------------------------------------------------------------

export type ImageGridProps = {
  image?: ImageItem[];
  ratio?: ImageVariants["ratio"];
  fit?: RootVariants["fit"];
  position?: RootVariants["position"];
  icon?: IconProps["icon"];
  fallback?: boolean;
  autoplay?: number;
  // ---
  class?: ImgHTMLAttributes["class"];
};

export type ImagePreviewProps = {
  image: ImageItem;
  open: boolean;
};
