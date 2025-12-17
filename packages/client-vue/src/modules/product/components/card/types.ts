import type {
  Product,
  Benefit,
  ProductDetails,
  PriceDetail,
  ProductSummaryMeta,
  ProductSummaryDetailWithPrice,
  TermDetails
} from "@upmind-automation/headless";
import type { VariantProps } from "class-variance-authority";
import { rootVariant } from "./card.config";
import type { ButtonProps, ImageProps } from "@upmind-automation/upmind-ui";
import type { RouteLocationAsRelativeGeneric } from "vue-router";

export type RootVariants = VariantProps<typeof rootVariant>;

export interface ProductCardProps extends Omit<
  Product,
  "price" | "pricing" | "meta"
> {
  configureRoute: RouteLocationAsRelativeGeneric;
  disabled?: boolean;
  variant?: RootVariants["variant"];
  price?: PriceDetail;
  pricing?: ProductSummaryDetailWithPrice[];
  meta?: ProductSummaryMeta;
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
  productDetails: ProductDetails;
  price?: PriceDetail;
  meta?: ProductSummaryMeta;
  hideDescription?: boolean;
  preservePromotion?: boolean;
  navigate?: boolean;
  processing?: boolean;
  selectedTerm?: string;
  handleResolve?: () => void;
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
}

export interface ProductCardSkeletonProps {
  hideTerms?: boolean;
}
