import type { DomainLookup } from "@upmind-automation/headless-vue";
import type { ButtonProps } from "@upmind-automation/upmind-ui";

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
  // ---
  color?: ButtonProps["color"];
}
