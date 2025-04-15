import type {
  DomainProduct,
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
  items?: DomainProduct[];
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
  items: DomainProduct[];
  offset?: number;
  // ---
  color?: ButtonProps["color"];
  // ---
  loading?: boolean;
  processing?: boolean;
  disabled?: boolean;
}

export type DomainCardProps = DomainProduct & {
  selected?: boolean;
  processing?: boolean;
  color?: ButtonProps["color"];
};

export interface DomainSummaryProps {
  price: DomainProduct["price"];
  meta: DomainProduct["meta"];
}

export interface DomainActionProps extends DomainSummaryProps {
  domain: DomainProduct["domain"];
  tld: DomainProduct["tld"];
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
