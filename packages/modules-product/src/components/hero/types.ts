import {
  createVariantConstants,
  type VariantValue
} from "@upmind-automation/foundation";
import { variants } from "./variants";
import type { Product } from "@upmind-automation/headless";
import type { UseMetaResult } from "@upmind-automation/headless";
import type { HTMLAttributes } from "vue";

export const PRODUCT_HERO_DIRECTION = createVariantConstants(
  variants.direction
);

export type PRODUCT_HERO_DIRECTION = VariantValue<
  typeof PRODUCT_HERO_DIRECTION
>;

export interface ProductHeaderProps {
  productDetails: Product["productDetails"];
  images?: Product["productDetails"]["images"];
  direction?: PRODUCT_HERO_DIRECTION;
  image?: boolean;
  meta: UseMetaResult;
}

export interface ProductImageProps {
  class?: HTMLAttributes["class"];
  productDetails: Product["productDetails"];
  direction?: PRODUCT_HERO_DIRECTION;
  fallback?: boolean;
  previewSize?: string;
}
