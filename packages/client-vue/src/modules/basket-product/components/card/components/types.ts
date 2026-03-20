// --- types
import type {
  ProductSummaryDetail,
  PriceDetail,
  PromotionDetails,
  TermDetails,
  Product
} from "@upmind-automation/headless";
import type { RouteLocationAsRelativeGeneric } from "vue-router";
import type { BadgeProps } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------

export interface DetailsGroupProps {
  id: string;
  category?: string;
  items: Product["details"];
}

export interface DetailsItemProps extends ProductSummaryDetail {
  price?: PriceDetail;
}

export interface PromotionProps extends PromotionDetails {
  disabled?: boolean;
  size?: BadgeProps["size"];
}

export interface QuantityFieldProps {
  id: string;
  quantifiable?: boolean;
  min?: number;
  max?: number;
  step?: number;
  quantity?: number;
  disabled?: boolean;
}

export interface RequiredAlertProps {
  id: string;
  editRoute: RouteLocationAsRelativeGeneric;
}

export interface RenewDescriptionProps {
  cycle?: number;
  discounted?: boolean;
  freeTrial?: boolean;
  oneoff?: boolean;
  regularPrice?: string;
  renewalPrice?: string;
}

export interface TermsDescriptionProps extends TermDetails {
  separate?: boolean;
}
