import type {
  DomainModel,
  DomainProduct,
  DomainTypes,
  UseDac,
  UseDomain
} from "@upmind-automation/headless";

export enum DOMAIN_TEMPLATE {
  FULL = "full",
  DRAWER = "drawer",
  WIDGET = "widget"
}
export interface DomainProps {
  template?: DOMAIN_TEMPLATE;
  type?: string;
  modelValue?: string;
  touched?: boolean;
  disabled?: boolean;
}

export interface DacProps {
  template?: DOMAIN_TEMPLATE;
  type?: string;
  touched?: boolean;
}

export interface DomainCardsProps {
  template?: DOMAIN_TEMPLATE;
  modelValue?: UseDac["model"]["value"];
  items?: DomainProduct[];
  query?: UseDac["query"]["value"];
  offset?: UseDac["pagination"]["value"]["offset"];
  resultCount?: number;
  skeletonCount?: number;
  loading?: boolean;
  processing?: boolean;
  searching?: boolean;
  valid?: boolean;
  disabled?: boolean;
  // ---
}

export interface DomainSlotProps {
  modelValue: string;
  searching?: boolean;
  processing?: boolean;
  type?: DomainTypes;
}

export interface DomainActionsProps {
  cancel?: boolean;
  // ---
  empty?: boolean;
  required?: boolean;
  loading?: boolean;
  processing?: boolean;
  available?: boolean;
}

export type DomainCardProps = {
  domain: DomainProduct["domain"];
  sld: DomainModel["tld"];
  tld: DomainModel["tld"];
  price: DomainProduct["price"];
  cycle: DomainProduct["configuration"]["term"];
  disabled?: DomainProduct["meta"]["disabled"];
  processing?: DomainProduct["meta"]["processing"];
  available?: DomainProduct["meta"]["available"];
  added?: DomainProduct["meta"]["added"];
  owned?: DomainProduct["meta"]["owned"];
  discounted?: DomainProduct["meta"]["discounted"];
  free?: DomainProduct["meta"]["free"];
  canTransfer?: DomainProduct["meta"]["canTransfer"];
  unavailable?: DomainProduct["meta"]["unavailable"];
  exactMatch?: boolean;
};

export interface DomainSummaryProps {
  price: DomainProduct["price"];
  meta: DomainCardMeta;
  cycle: DomainProduct["configuration"]["term"];
}

export interface DomainCardMeta {
  isDisabled: boolean;
  isProcessing: boolean;
  isAvailable: boolean;
  isAdded: boolean;
  isExactMatch: boolean;
  isOwned: boolean;
  isDiscounted: boolean;
  isUnavailable: boolean;
  isTransferable: boolean;
}

export interface DomainCardSkeletonProps {
  active?: boolean;
  exactMatch?: boolean;
}

export interface SmartDomainFieldProps {
  modelValue?: string | null;
  disabled?: boolean;
  required?: boolean;
}

export type SmartDomainExistingProps = {
  modelValue: string | null;
  owned?: DomainProduct[];
  validating?: boolean;
  checked?: boolean;
  transferred?: boolean;
  transferring?: boolean;
  removing?: boolean;
  unavailable?: boolean;
  transferPrice?: string;
};
