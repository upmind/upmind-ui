import type {
  BasketProduct,
  ProductSummaryDetailWithPrice,
} from "@upmind-automation/headless-vue";
import type { ButtonProps } from "@upmind-automation/upmind-ui";

import type { RouteLocationRaw } from "vue-router";

export interface BasketProductProps extends BasketProduct {
  open?: boolean;
  color?: ButtonProps["color"];
}

export interface BasketProductActionsProps {
  id: string;
  details: BasketProduct["details"]; // any[]
  // ---
  open: boolean;
  disabled: boolean;
  editLink: RouteLocationRaw;
  color?: ButtonProps["color"];
}

export interface BasketProductSummaryProps {
  id: BasketProduct["id"];
  price: ProductSummaryDetailWithPrice;
  productDetails: BasketProduct["productDetails"];
  quantity: BasketProduct["configuration"]["quantity"];
  // ---
  error: boolean;
  primary: boolean;
  processing: boolean;
  loading: boolean;
  editLink: RouteLocationRaw;
}

export interface BasketProductConfigDetailsProps {
  id: string;
  details: BasketProduct["details"];
}

export interface BasketProductCardsProps {
  open: boolean;
  color?: ButtonProps["color"];
}
