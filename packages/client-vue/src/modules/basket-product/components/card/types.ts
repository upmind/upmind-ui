import type {
  BasketProduct,
  ProductSummaryDetailWithPrice
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
  quantity: BasketProduct["configuration"]["quantity"];
  details: BasketProduct["details"];
  pricing: string[];
  // ---
  open: boolean;
  error: boolean;
  processing: boolean;
  loading: boolean;
  editRoute: RouteLocationAsRelativeGeneric;
}

export interface BasketProductConfigDetailsProps {
  id: string;
  details: BasketProduct["details"];
  editRoute: RouteLocationAsRelativeGeneric;
}

export interface BasketProductCardsProps {
  open?: boolean;
  editRoute: RouteLocationAsRelativeGeneric;
}
