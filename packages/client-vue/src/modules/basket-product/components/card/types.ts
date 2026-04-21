import type {
  BasketProduct,
  BasketOptionSummary,
  ProductSummaryDetailWithPrice,
  SubproductDetails,
  TermDetails,
  ProductModel
} from "@upmind-automation/headless";
import type { RouteLocationAsRelativeGeneric } from "vue-router";

export interface BasketProductProps extends BasketProduct {
  open?: boolean;
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
  processing: boolean;
  loading: boolean;
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
}

export interface BasketProductSummaryProps {
  summary: BasketOptionSummary;
}

export interface BasketProductSubItemProps {
  summary: BasketOptionSummary;
}

export interface BasketProductUpsellProps {
  id: BasketProduct["id"];
  summary: BasketOptionSummary;
  configOptions?: SubproductDetails[];
  error: boolean;
  processing: boolean;
}

export interface BasketProductConfigDetailsProps {
  id: string;
  summary: ProductSummaryDetailWithPrice;
  details: BasketProduct["details"];
  editRoute: RouteLocationAsRelativeGeneric;
}

export interface OptionTogglePayload {
  option: SubproductDetails;
  value: { id: string };
  enabled: boolean;
}

export interface BasketProductCardsProps {
  open?: boolean;
  editRoute: RouteLocationAsRelativeGeneric;
}
