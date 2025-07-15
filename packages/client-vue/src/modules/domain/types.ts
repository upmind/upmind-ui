import type { DomainProduct, DomainTypes } from "@upmind-automation/headless";
import type { ButtonProps } from "@upmind-automation/upmind-ui";

export interface DomainProps {
  type?: DomainTypes;
  modelValue?: string;
  multiple?: boolean;
  color?: ButtonProps["color"];
  touched?: boolean;
}

export interface DacProps {
  id: string;
  modelValue?: string; // this is the primary domain
  selected?: string[]; // these ar the selected domains
  items?: DomainProduct[]; // this is the list of domains that can be selected
  query?: string;
  color?: ButtonProps["color"];
  offset?: number;
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
  modelValue?: string[];
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
  cycle: DomainProduct["configuration"]["term"];
}

export interface DomainActionProps extends DomainSummaryProps {
  domain: DomainProduct["domain"];
  tld: DomainProduct["tld"];
  selected?: boolean;
  processing?: boolean;
  color?: string;
}

export interface DomainSearchProps {
  modelValue?: string;
  searchClass?: string;
  showComplete?: boolean;
  isLoading?: boolean;
  type?: string;
}
