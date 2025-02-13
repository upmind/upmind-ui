import { type BasketProduct } from "@upmind-automation/headless-vue";
import { type ButtonProps } from "@upmind-automation/upmind-ui";
import {
  type BasketProductSummaryPrice,
  type BasketProductDetails,
  type BasketProductSummaryDetail,
} from "@upmind-automation/headless-vue";
import { type RouteLocationRaw } from "vue-router";

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
  id: string;
  pricing: BasketProductSummaryPrice;
  product: BasketProductDetails;
  error: boolean;
  primary: boolean;
  processing: boolean;
  loading: boolean;
  taxes: boolean;
  editLink: RouteLocationRaw;
}

export interface BasketProductConfigDetailsProps {
  id: string;
  details: BasketProductSummaryDetail[];
}

export interface BasketProductCardsProps {
  open: boolean;
  color?: ButtonProps["color"];
}
