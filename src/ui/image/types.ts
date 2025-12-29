import type { VariantProps } from "class-variance-authority";
import type { rootVariant, containerVariant } from "./image.config";
import type { ImgHTMLAttributes } from "vue";
import type { IconProps } from "../icon";

export type RootVariants = VariantProps<typeof rootVariant>;
export type ImageVariants = VariantProps<typeof containerVariant>;

export interface ImageProps {
  carousel?: boolean;
  image?: ImageItem[] | ImageItem | string;
  ratio?: ImageVariants["ratio"];
  fit?: RootVariants["fit"];
  icon?: IconProps["icon"];
  alt?: ImgHTMLAttributes["alt"];
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
}
