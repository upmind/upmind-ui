import type { VariantProps } from "class-variance-authority";
import type { rootVariant } from "./image.config";

export type RootVariants = VariantProps<typeof rootVariant>;

export interface ImageProps {
  images: ImageItem[] | ImageItem;
  ratio?: RootVariants["ratio"];
  class?: string;
}

export interface ImageItem {
  url: string;
  alt: string;
}
