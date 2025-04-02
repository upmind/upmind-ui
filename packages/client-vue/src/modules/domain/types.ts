import type {
  DomainLookup,
  DomainTypes,
} from "@upmind-automation/headless-vue";
import type { ButtonProps } from "@upmind-automation/upmind-ui";

export interface DomainProps {
  type?: DomainTypes;
  modelValue?: string;
  multiple?: boolean;
  color?: ButtonProps["color"];
  errors?: any;
  touched?: boolean;
}

export interface DacProps {
  id: string;
  modelValue?: string;
  query?: string;
  color?: ButtonProps["color"];
  offset?: number;
  values?: string[];
  items?: DomainLookup[];
  dialog?: boolean;
  loading?: boolean;
  processing?: boolean;
  disabled?: boolean;
  complete?: boolean;
  more?: boolean;
  type?: string;
}

export interface DomainCardsProps {
  i18n?: string;
  modelValue?: string | string[];
  items: DomainLookup[];
  offset?: number;
  // ---
  color?: ButtonProps["color"];
  // ---
  loading?: boolean;
  processing?: boolean;
  disabled?: boolean;
}

export interface DomainCardProps extends DomainLookup {
  selected?: boolean;
  processing?: boolean;
  basket?: boolean;
  // ---
  color?: ButtonProps["color"];
}

export interface DomainPricesProps {
  summary?: {
    currentPrice?: DomainLookup["summary"]["currentPrice"];
    regularPrice?: DomainLookup["summary"]["regularPrice"];
    meta: {
      discounted?: DomainLookup["summary"]["meta"]["discounted"];
    };
  };
}
export interface DomainDescriptionProps
  extends Omit<DomainLookup, "sld" | "productId" | "quantity" | "term"> {}

export interface DomainActionProps extends DomainDescriptionProps {
  color?: string;
  processing?: boolean;
}

export interface DomainSearchProps {
  modelValue?: string;
  searchClass?: string;
  showComplete?: boolean;
  isLoading?: boolean;
  type?: string;
}
