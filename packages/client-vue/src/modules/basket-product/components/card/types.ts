import type {
  BasketProduct,
  BasketOptionSummary,
  BasketUpsellSummary,
  ProductSummaryDetailWithPrice,
  SubproductDetails,
  TermDetails,
  ProductModel
} from "@upmind-automation/headless";
import type { RouteLocationAsRelativeGeneric } from "vue-router";

export interface BasketProductProps extends BasketProduct {
  open?: boolean;
  loading?: boolean;
  processing?: boolean;
  disabled?: boolean;
  editRoute: RouteLocationAsRelativeGeneric;
  // own Card (default) vs flat inside a parent card
  card?: boolean;
}

export interface BasketProductContentProps {
  id: BasketProduct["id"];
  summary: ProductSummaryDetailWithPrice;
  productDetails: BasketProduct["productDetails"];
  serviceIdentifier?: BasketProduct["serviceIdentifier"];
  quantity: BasketProduct["configuration"]["quantity"];
  details: BasketProduct["details"];
  pricing: string[];
  // ---
  open: boolean;
  image: boolean;
  error: boolean;
  // a product error nothing on the card explains — warning presentation
  warning?: boolean;
  processing: boolean;
  loading: boolean;
  pricesUpdating?: boolean;
  editRoute: RouteLocationAsRelativeGeneric;
  // --- inline errors
  configErrors?: BasketProduct["errors"];
  // --- inline controls
  inlineMeta?: {
    hasInlineControls: boolean;
    showOptionUpsells: boolean;
    showTermSelector: boolean;
    showQuantity: boolean;
  };
  upsellOptions?: SubproductDetails[];
  terms?: TermDetails[];
  modelValue?: ProductModel;
  // configured inline: suppresses the "add missing data" alert
  configurable?: boolean;
}

export interface BasketProductSummaryProps {
  summary: BasketOptionSummary;
}

export interface BasketProductSubItemProps {
  summary: BasketOptionSummary;
}

export interface BasketProductUpsellProps {
  id: BasketProduct["id"];
  summary: BasketUpsellSummary;
  option: SubproductDetails;
  error: boolean;
  processing: boolean;
}

export interface BasketProductConfigDetailsProps {
  id: string;
  summary: ProductSummaryDetailWithPrice;
  details: BasketProduct["details"];
  editRoute: RouteLocationAsRelativeGeneric;
}

export interface BasketProductCardsProps {
  open?: boolean;
  editRoute: RouteLocationAsRelativeGeneric;
  disabled?: boolean;
}

export interface BasketProductSkeletonsProps {
  card?: boolean;
}

export interface BasketProductSkeletonProps {
  card?: boolean;
}
