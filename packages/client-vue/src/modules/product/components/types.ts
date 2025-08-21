import type { Product } from "@upmind-automation/headless";

export interface ProductHeaderProps {
  productDetails: Product["productDetails"];
  images?: Product["productDetails"]["images"];
}
