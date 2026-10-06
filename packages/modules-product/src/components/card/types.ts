import type { cardRootVariants } from "./variants";
import type { ButtonVariants } from "@upmind/ui";
import type { ImageProps } from "@upmind/ui";
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
import type { VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "vue";
import type { RouteLocationAsRelativeGeneric } from "vue-router";
// -----------------------------------------------------------------------------

export type RootVariants = VariantProps<typeof cardRootVariants>;

export type ProductCardProps = Omit<Product, "price" | "pricing"> & {
  configureRoute: RouteLocationAsRelativeGeneric;
  /**
   * Overrides the card's root `data-test-key`. Recommendations key this off the
   * recommended product's `configuration.productId` so the carousel card is
   * targetable by the stable product id (its own `id` is the recommendation
   * slot id, not the product). Falls back to `product-card-${id}`.
   */
  dataAttrs?: Record<`data-${string}`, string | number | boolean>;
  /**
   * When true (default), term-only products auto-add with the selected term.
   * When false, they route to the configure step instead so the term step
   * is part of the funnel. Catalogue passes `keepsUserInSitu` to switch
   * between the two flows.
   */
  inSitu?: boolean;
  /**
   * `true` while this product is in the basket. Sourced from
   * `useBasketProductsPending().meta.isInBasket`. The card uses this both for
   * the persistent "In basket" affordance and for a transient "Added!" flash
   * on the false → true transition.
   */
  inBasket?: boolean;
  /**
   * Duration in ms of the transient "Added!" flash + button-disable after a
   * product enters the basket. Defaults to 3000.
   */
  resetTimeout?: number;
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
  color?: ButtonVariants["variant"];
  ratio?: ImageProps["ratio"];
  /** Replaces the basket call-to-action label, for a card that does not add to a basket. */
  actionLabel?: string;
};

export type ProductInfo = {
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
};

export type ProductBenefits = {
  benefits?: Benefit[];
};

export type ProductPrice = TermDetails & {
  hideTermSummary?: boolean;
};

export type ProductTerm = {
  modelValue?: string;
  prices?: ProductSummaryDetailWithPrice[];
};

export type ProductCardSkeletonProps = {
  hideTerms?: boolean;
};

export type ProductPriceProps = Omit<ProductPrice, "name"> & {
  hidePrice?: boolean;
  hideTermSummary?: boolean;
};

export type ProductDescriptionProps = {
  description?: Product["productDetails"]["description"];
  lineclamp?: boolean;
  lines?: number;
  class?: HTMLAttributes["class"];
};
