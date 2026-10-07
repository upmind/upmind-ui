import type {
  ProductSummaryDetail,
  PriceDetail,
  TermDetails,
  Product
} from "@upmind-automation/headless";
import type { RouteLocationAsRelativeGeneric } from "vue-router";

// -----------------------------------------------------------------------------

export type DetailsGroupProps = {
  id: string;
  category?: string;
  items: Product["details"];
};

export type DetailsItemProps = ProductSummaryDetail & {
  price?: PriceDetail;
};

export type QuantityFieldProps = {
  id: string;
  quantifiable?: boolean;
  min?: number;
  max?: number;
  step?: number;
  quantity?: number;
  disabled?: boolean;
};

export type RequiredAlertProps = {
  id: string;
  editRoute: RouteLocationAsRelativeGeneric;
};

export type TermSelectorProps = {
  /** Available billing terms. */
  terms: TermDetails[];
  /** Currently selected term cycle in months. */
  modelValue?: number;
  /** Whether the selector is disabled. */
  disabled?: boolean;
  /** Whether an update is processing. */
  processing?: boolean;
};

export type RenewDescriptionProps = {
  cycle?: number;
  discounted?: boolean;
  freeTrial?: boolean;
  oneoff?: boolean;
  regularPrice?: string;
  renewalPrice?: string;
};
