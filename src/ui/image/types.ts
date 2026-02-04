import type { rootVariant, containerVariant } from "./image.config";
import type { IconProps } from "../icon";
import type { VariantProps } from "class-variance-authority";
import type { ImgHTMLAttributes } from "vue";

export type RootVariants = VariantProps<typeof rootVariant>;
export type ImageVariants = VariantProps<typeof containerVariant>;

export type ImageMode = "auto" | "single" | "carousel";

export interface ImageProps {
  mode?: ImageMode;
  image?: ImageItem[] | ImageItem | string;
  ratio?: ImageVariants["ratio"];
  fit?: RootVariants["fit"];
  position?: RootVariants["position"];
  icon?: IconProps["icon"];
  alt?: ImgHTMLAttributes["alt"];
  fallback?: boolean;
  // ---
  class?: ImgHTMLAttributes["class"];
}

export interface ImageItem {
  url: string;
  alt: string;
}

export interface CarouselImageProps {
  image: ImageItem;
  index?: number;
  total?: number;
  fit?: RootVariants["fit"];
  position?: RootVariants["position"];
}
