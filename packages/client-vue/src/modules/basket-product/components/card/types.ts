import type {
  BasketProduct,
  ProductSummaryDetailWithPrice,
  SubproductDetails,
  TermDetails,
  ProductModel
} from "@upmind-automation/headless";
import type { RouteLocationAsRelativeGeneric } from "vue-router";

export interface BasketProductProps extends BasketProduct {
  open?: boolean;
}

export interface BasketProductActionsProps {
  id: string;
  details: BasketProduct["details"]; // any[]
  // ---
  open: boolean;
  disabled: boolean;
  editRoute: RouteLocationAsRelativeGeneric;
}

export interface BasketProductSummaryProps {
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
  processing: boolean;
  loading: boolean;
  editRoute: RouteLocationAsRelativeGeneric;
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
}
