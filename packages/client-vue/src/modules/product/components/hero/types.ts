import type { Product } from "@upmind-automation/headless";
import { variants } from "./product-hero.config";
import {
  parseVariants,
  type VariantValues
} from "@upmind-automation/upmind-ui";
import type { HTMLAttributes } from "vue";
import type { Badge } from "@upmind-automation/headless";
import type { UseMetaResult } from "@upmind-automation/headless";

export const PRODUCT_HEADER_DIRECTION = parseVariants(variants.direction);

export type PRODUCT_HEADER_DIRECTION = VariantValues<
  typeof PRODUCT_HEADER_DIRECTION
>;

export interface ProductHeaderProps {
  productDetails: Product["productDetails"];
  images?: Product["productDetails"]["images"];
  direction?: PRODUCT_HEADER_DIRECTION;
  image?: boolean;
  meta: UseMetaResult;
}

export interface ProductImageProps {
  class?: HTMLAttributes["class"];
  productDetails: Product["productDetails"];
  images?: Product["productDetails"]["images"];
  fallback?: boolean;
}
