import type {
  Product,
  Benefit,
  ProductDetails,
  PriceDetail,
  ProductSummaryMeta,
  ProductSummaryDetailWithPrice,
  TermDetails,
  UseMetaResult
} from "@upmind-automation/headless";
import { UIContext } from "@upmind-automation/headless";
import type { VariantProps } from "class-variance-authority";
import { rootVariant } from "./card.config";
import type { ButtonProps, ImageProps } from "@upmind-automation/upmind-ui";
import type { RouteLocationAsRelativeGeneric } from "vue-router";
import type { HTMLAttributes } from "vue";

export type RootVariants = VariantProps<typeof rootVariant>;

export interface ProductCardProps extends Omit<Product, "price" | "pricing"> {
  configureRoute: RouteLocationAsRelativeGeneric;
  disabled?: boolean;
  loading?: boolean;
  variant?: RootVariants["variant"];
  price?: PriceDetail;
  pricing?: ProductSummaryDetailWithPrice[];
  hideBenefits?: boolean;
  hideDescription?: boolean;
  hideTerms?: boolean;
  hideTermSummary?: boolean;
  preservePromotion?: boolean;
  navigate?: boolean;
  color?: ButtonProps["color"];
  ratio?: ImageProps["ratio"];
}

export interface ProductInfo {
  configureRoute: RouteLocationAsRelativeGeneric;
  id?: string;
  title: string;
  productDetails: ProductDetails;
  price?: PriceDetail;
  meta?: ProductSummaryMeta;
  productMeta?: UseMetaResult;
  hideDescription?: boolean;
  hideImage?: boolean;
  preservePromotion?: boolean;
  navigate?: boolean;
  processing?: boolean;
  selectedTerm?: string;
  hideAnchorPrice?: boolean;
}

export interface ProductBenefits {
  benefits?: Benefit[];
}

export interface ProductPrice extends TermDetails {
  hideTermSummary?: boolean;
}

export interface ProductTerm {
  modelValue?: string;
  prices?: ProductSummaryDetailWithPrice[];
  hideBadge?: boolean;
}

export interface ProductCardSkeletonProps {
  hideTerms?: boolean;
}

export interface ProductPriceProps extends Omit<ProductPrice, "name"> {
  hidePrice?: boolean;
  hideTermSummary?: boolean;
}

export interface ProductDescriptionProps {
  description?: Product["productDetails"]["description"];
  lineclamp?: boolean;
  lines?: number;
  class?: HTMLAttributes["class"];
}
