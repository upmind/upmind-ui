import type {
  BasketProduct,
  BasketProductSummaryDetail,
  BasketProductSummaryPrice,
} from "@upmind-automation/headless-vue";
import type { ButtonProps } from "@upmind-automation/upmind-ui";

import type { RouteLocationRaw } from "vue-router";

export interface BasketProductProps extends BasketProduct {
  open?: boolean;
  color?: ButtonProps["color"];
}

export interface BasketProductActionsProps {
  id: string;
  open: boolean;
  details: any[];
  disabled: boolean;
  editLink: RouteLocationRaw;
  color?: ButtonProps["color"];
}

export interface BasketProductSummaryProps {
  id: BasketProduct["id"];
  pricing: BasketProductSummaryPrice;
  product: BasketProduct["product"];
  error: boolean;
  primary: boolean;
  processing: boolean;
  loading: boolean;
  editLink: RouteLocationRaw;
}

export interface BasketProductConfigDetailsProps {
  id: string;
  details: (BasketProductSummaryPrice | BasketProductSummaryDetail)[];
}

export interface BasketProductCardsProps {
  open: boolean;
  color?: ButtonProps["color"];
}
