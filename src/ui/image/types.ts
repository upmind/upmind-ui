import type { VariantProps } from "class-variance-authority";
import type { rootVariant } from "./image.config";
import type { HTMLAttributes } from "vue";

export type RootVariants = VariantProps<typeof rootVariant>;

export interface ImageProps {
  images?: ImageItem[] | ImageItem;
  ratio?: RootVariants["ratio"];
  fit?: RootVariants["fit"];
  // ---
  class?: HTMLAttributes["class"];
}

export interface ImageItem {
  url: string;
  alt: string;
}
