import type { BadgeVariants } from "@upmind/ui";
import type {
  ProductSummaryDetail,
  PriceDetail,
  PromotionDetails,
  TermDetails,
  Product
} from "@upmind-automation/headless";
import type { RouteLocationAsRelativeGeneric } from "vue-router";

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
  size?: BadgeVariants["size"];
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

export interface TermSelectorProps {
  /** Available billing terms. */
  terms: TermDetails[];
  /** Currently selected term cycle in months. */
  modelValue?: number;
  /** Whether the selector is disabled. */
  disabled?: boolean;
  /** Whether an update is processing. */
  processing?: boolean;
}

export interface RenewDescriptionProps {
  cycle?: number;
  discounted?: boolean;
  freeTrial?: boolean;
  oneoff?: boolean;
  regularPrice?: string;
  renewalPrice?: string;
}
