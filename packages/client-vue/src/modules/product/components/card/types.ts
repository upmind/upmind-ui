import type {
  Product,
  Benefit,
  ProductDetails,
  PriceDetail,
  ProductSummaryMeta,
  ProductSummaryDetailWithPrice,
  ProductSummaryDetail
} from "@upmind-automation/headless";
import type { VariantProps } from "class-variance-authority";
import { rootVariant } from "./product.config";
import type { RouteLocationRaw } from "vue-router";

export type RootVariants = VariantProps<typeof rootVariant>;

export interface ProductCardProps
  extends Omit<Product, "price" | "pricing" | "meta"> {
  variant?: RootVariants["variant"];
  price?: PriceDetail;
  pricing?: ProductSummaryDetailWithPrice[];
  meta?: ProductSummaryMeta;
  hideBenefits?: boolean;
  hideDescription?: boolean;
  hideTerms?: boolean;
  hideAnnualTerm?: boolean;
  preservePromotion?: boolean;
  navigate?: boolean;
}

export interface ProductInfo {
  productDetails: ProductDetails;
  price?: PriceDetail;
  meta?: ProductSummaryMeta;
  hideDescription?: boolean;
  preservePromotion?: boolean;
}

export interface ProductBenefits {
  benefits?: Benefit[];
}

export interface ProductPrice {
  productDetails: ProductDetails;
  price?: PriceDetail;
  pricing?: ProductSummaryDetailWithPrice[];
  meta?: ProductSummaryMeta;
  hideAnnualTerm?: boolean;
}

export interface ProductTerm {
  modelValue?: string;
  prices?: ProductSummaryDetailWithPrice[];
}

export interface ProductCardSkeletonProps
  extends Omit<
    ProductCardProps,
    "configuration" | "productDetails" | "details"
  > {
  configuration?: ProductSummaryDetail;
  productDetails?: ProductDetails;
  details?: ProductSummaryDetailWithPrice[];
}
