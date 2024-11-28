import { type ButtonProps } from "@upmind-automation/upwind";
import {
  type BasketProductSummaryPrice,
  type BasketProductDetails,
  type BasketProductSummaryDetail,
} from "@upmind-automation/client-vue";

export interface BasketProductProps {
  open?: boolean;
  color?: ButtonProps["color"];
}

export interface BasketProductActionsProps {
  id: string;
  open: boolean;
  details: any[];
  disabled: boolean;
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
}

export interface BasketProductConfigDetailsProps {
  id: string;
  details: BasketProductSummaryDetail[];
}

export interface BasketProductCardsProps {
  open: boolean;
  color?: ButtonProps["color"];
}
