// -----------------------------------------------------------------------------
/**
 * @module domain/types
 * @description Type definitions for domain module components.
 */

import {
  DomainTypes,
  type DomainModel,
  type DomainProduct,
  type UseDac
} from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

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
  /**
   * `true` while a "Load more" page is being fetched. Used to show the
   * Load more button in a loading state and to disable the per-card
   * Add to basket buttons until the new page arrives.
   */
  searchingMore?: boolean;
  valid?: boolean;
  disabled?: boolean;
  /** Whether the "Load more" button should render (page < totalPages, etc.). */
  hasMore?: boolean;
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
  transferLabel?: DomainProduct["meta"]["transferLabel"];
  /**
   * Brand-supplied transfer-price override (e.g. "FREE" or "£10"). When
   * present, replaces the parent product's price in the transfer copy.
   * Resolved by `getTransferOptionPrice` from the transfer sub-product's
   * `category.price_override`.
   */
  transferOptionPrice?: DomainProduct["meta"]["transferOptionPrice"];
  /**
   * `true` when the transfer-price override resolved to `0` — drives the
   * footer copy between "transfer today" and "transfer FREE" without
   * locale-sniffing the formatted label.
   */
  transferOptionIsFree?: DomainProduct["meta"]["transferOptionIsFree"];
  unavailable?: DomainProduct["meta"]["unavailable"];
  /** `true` while pricing/product data is being fetched from /suggestions/tlds. */
  priceLoading?: boolean;
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
  isPriceLoading: boolean;
}

export interface DomainCardSkeletonProps {
  active?: boolean;
  exactMatch?: boolean;
}

export interface SmartDomainFieldProps {
  modelValue?: string | null;
  disabled?: boolean;
  required?: boolean;
  errors?: string[];
  touched?: boolean;
}

export interface SmartDomainSummaryProps {
  domain: string;
  disabled?: boolean;
}

export type SmartDomainExistingProps = {
  modelValue: string | null;
  owned?: DomainProduct[];
  filteredOwned?: DomainProduct[] | null;
  isDomainLike?: boolean;
  disabled?: boolean;
  validating?: boolean;
  checked?: boolean;
  registerable?: boolean;
  registering?: boolean;
  transferred?: boolean;
  transferring?: boolean;
  removing?: boolean;
  unavailable?: boolean;
  dnsOnly?: boolean;
  transferPrice?: string;
  /**
   * The parent product's **regular** (undiscounted) price for the
   * resolved billing term. Used in the renewal half of the transfer copy
   * ("Subsequent renewals charged at …") because renewals aren't subject
   * to first-term promotions — keeps the SmartDomainField line aligned
   * with the DAC card's "Renewals start from {regularPrice}/{term}".
   */
  renewalPrice?: string;
  /**
   * Brand-supplied transfer-price override (e.g. "FREE" or "£10").
   * When present, the transfer-info copy uses this in place of the parent
   * product's `transferPrice`. Resolved from the transfer sub-product's
   * `category.price_override` flag — see `getTransferOptionPrice`.
   */
  transferOptionPrice?: string;
  /**
   * `true` when the transfer-price override resolved to `0`. Drives the
   * choice between `transfer_info` ("for only {price}") and
   * `transfer_info_free` ("for free") — see SmartDomainExisting template.
   */
  transferOptionIsFree?: boolean;
  registerPrice?: string;
  cycle?: number;
};

export const SMART_DOMAIN_CHOICES_ORDER = [
  DomainTypes.skip,
  DomainTypes.register,
  DomainTypes.existing,
  DomainTypes.basket
];

export interface SmartDomainDrawerProps {
  open: boolean;
  query: string;
  searchQuery?: string;
  type?: DomainTypes;
  added: UseDac["model"]["value"];
  available: DomainProduct[];
  offset: number;
  resultCount: number;
  searching: boolean;
  processing: boolean;
  loading: boolean;
  valid: boolean;
  empty: boolean;
}
