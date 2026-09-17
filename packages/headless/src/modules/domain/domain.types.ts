import type { ResponseError } from "../../utils";
import type { BasketHelperContext } from "../basket-product";
import type { Product, ProductSummaryDetail } from "../product";
import type { QueryResponse } from "../query";
import type {
  IDomainAvailabilityResponse,
  IDomainSuggestionResultProduct,
  IProduct,
  TldsSortTypes
} from "@upmind-automation/types";
import type { ActorRef } from "xstate";

// --- internal

// -----------------------------------------------------------------------------

/**
 * Domain-specific envelope returned by `/suggestions`, `/suggestions/tlds`
 * and `/availability/{domain}`. Narrows the loosely-typed `related` and
 * `meta` on the generic `QueryResponse` to the concrete shapes those
 * endpoints surface — `related.products` (product_id → `IProduct`) and
 * `meta.total_pages` — so domain callers read them off the raw envelope
 * via `useQuery().request(...)` without `as` casts.
 */
export interface DomainEnvelopeResponse<T> extends QueryResponse<T> {
  related?: {
    products?: Record<string, IProduct>;
  } | null;
  meta?: {
    total_pages?: number;
  } | null;
}

// -----------------------------------------------------------------------------

/**
 * Enumeration defining the different types of domain management flows.
 * These types dictate the user interface, available actions, and underlying logic
 * for how a customer interacts with domain names, e.g. registering a new one,
 * transferring an existing one, or using one from their basket.
 *
 * @enum {string}
 */
export enum DomainTypes {
  /**
   * Represents the flow where the user explicitly defers domain selection ("I'll decide later").
   * Only available when the field is optional (`required === false`).
   * Produces a `null` model value.
   */
  skip = "skip",
  /**
   * Represents the flow for **registering a new domain name**.
   * Used when a customer wants to acquire an available domain.
   */
  register = "register",
  /**
   * Represents the flow where a customer chooses to **use an existing domain name** they already own,
   * without transferring it. They will typically update nameservers manually.
   */
  existing = "existing",
  /**
   * Represents the flow where a customer selects a domain name that is **already present in their shopping basket**.
   * Used for multistep checkouts or when combining items.
   */
  basket = "basket"
}

/**
 * Enumeration defining the internal operation mode for the Domain Availability Checker (DAC).
 * This is distinct from {@link DomainTypes} which represents user-facing choices.
 *
 * - `register`: runs suggestions + availability check (default search behaviour)
 * - `transfer`: skips suggestions, runs availability check + owned domain lookup only
 *
 * @enum {string}
 */
export enum DomainMode {
  register = "register",
  transfer = "transfer"
}

/**
 * Minimal context shape needed to derive DAC tracking meta. Both
 * `DacContext` (child machine) and `DomainContext` (parent machine) satisfy
 * this, so the helper can be called from either.
 */
export type DacEventContext = {
  mode?: DomainMode;
  useSuggestions?: boolean;
  search?: { query?: string };
};

/**
 * Represents a {@link Product} specifically for domain management, augmented with domain-specific
 * meta-information like availability, ownership, and selection status.
 * It extends {@link Product} and omits `selected` from `DomainModel` to merge `meta`.
 */
export type DomainProduct = Product &
  Omit<DomainModel, "selected"> & {
    /**
     * Domain-specific meta-information, extending base {@link ProductSummaryDetail.meta}.
     */
    meta: ProductSummaryDetail["meta"] & {
      /** `true` if the domain is available for registration. */
      available?: boolean;
      /** `true` if the domain can be transferred (set after availability check). */
      canTransfer?: boolean;
      /**
       * Brand-supplied label for the transfer button when transfer is blocked
       * via `meta.overrides.dac.i18n.transfer` on the product or category.
       * UI renders this on the disabled transfer action (e.g. "Unavailable").
       */
      transferLabel?: string;
      /**
       * Brand-supplied transfer **price override**, formatted for display.
       * Resolved from the transfer sub-product's category (`price_override`)
       * by `getTransferOptionPrice`. Either a formatted price like `"£10"` or
       * the localised free label (e.g. `"FREE"`). `undefined` means no override
       * is configured — UI should fall back to the parent product's price.
       */
      transferOptionPrice?: string;
      /**
       * `true` when the transfer-price override resolved to `0` — i.e. the
       * brand has configured a free transfer. UI uses this to swap copy
       * between "transfer for free" and "transfer for only {price}" without
       * locale-sniffing the formatted price label.
       */
      transferOptionIsFree?: boolean;
      /** `true` if this basket product was added as a domain transfer (vs registration). */
      isTransfer?: boolean;
      /** `true` if the domain is fully unavailable (cannot register or transfer). */
      unavailable?: boolean;
      /** `true` once /availability has been called for this domain. */
      checkedAvailability?: boolean;
      /** `true` if the client already owns the domain. */
      owned?: boolean;
      /** `true` if the domain has been added to the basket. */
      added?: boolean;
      /** `true` if the domain is disabled or not selectable. */
      disabled?: boolean;
      /** `true` if the user selects this specific domain in the list. */
      selected?: boolean;
      /** `true` if the domain has been persisted in some way (e.g. saved). */
      persisted?: boolean;
      /** `true` if the domain exactly matches the search query. */
      exactMatch?: boolean;
      /** `true` if the domain is currently being processed (e.g. during 'add to basket'). */
      processing?: boolean;
      /**
       * `true` while the price/product details are still being fetched from the
       * `/suggestions/tlds` call. Rendered as a price skeleton in the card.
       */
      priceLoading?: boolean;
    };
    /**
     * Optional reference to the raw IProduct data from the API.
     * Stored so we can re-run parseProductProps when the domain mode changes
     * (e.g. register → transfer after a domain_transfer_only error).
     */
    rawProduct?: IDomainSuggestionResultProduct;
  };

/**
 * Represents the core data model for a domain name, including its parts and type.
 * This is used internally to manage the state of domains being processed.
 */
export type DomainModel = {
  /** The full domain name (e.g. "example.com"). */
  domain: string;
  /** The Top-Level Domain (TLD) part of the domain (e.g. ".com"). */
  tld: string;
  /** The Second-Level Domain (SLD) part of the domain (e.g. "example"). */
  sld: string;
  /** The {@link DomainTypes} defining the current management flow for this domain. */
  type?: DomainTypes;
  /** `true` if the user currently selects this domain. */
  selected?: boolean;
};

/**
 * Interface representing the context for the domain management XState machine.
 * It holds the state for domain availability checks, existing domains, basket integration,
 * search queries, and related lookups.
 */
export interface DacContext extends BasketHelperContext<DomainProduct> {
  /**
   * The domain flow mode: 'register' (default) runs suggestions + availability,
   * 'transfer' runs only checkAvailability.
   */
  mode?: DomainMode;
  /**
   * The current {@link DomainModel} or array of models representing the selected domains.
   */
  model?: DomainModel[];

  // ---
  /**
   * Lookups for domain data, including searched, history, owned, and basket domains.
   */
  lookups: {
    /** Domains found during searches. */
    searched: DomainProduct[];
    /** Domain search history. */
    history: DomainProduct[];
    /** Domains owned by the client. */
    owned: DomainProduct[];
    /** Domains currently in the client's basket. */
    basket: DomainProduct[];
  };

  /**
   * The preferred billing cycle duration in months for domains.
   */
  preferredCycle?: number;
  // ---
  /**
   * Parameters related to domain searching, including limits, offsets, and the query itself.
   */
  search?: {
    /** The number of results to fetch per page. */
    limit: number;
    /** The number of results to skip (for legacy offset pagination). */
    offset: number;
    /** The total number of available results for the current search (legacy). */
    total: number;
    /** The current page number for the suggestions/tlds endpoints (1-based). */
    page: number;
    /** The total number of pages reported by the suggestions/tlds endpoints. */
    totalPages: number;
    /** The current search query string. */
    query?: string;
  };
  /**
   * The currency code (e.g. "GBP") to be used for domain pricing.
   */
  currency?: string;
  /**
   * The unique identifier of the shopping basket.
   */
  basketId?: string;
  /**
   * The unique identifier of the brand.
   */
  brandId?: string;
  /**
   * An array of promotion codes applied to the domain operations.
   */
  coupons?: string[];

  /**
   * An array of available Top-Level Domains (TLDs).
   */
  tlds?: string[];
  /**
   * Sort order for `/suggestions` results. When set, the value is forwarded
   * as the `tlds_sort_by` query param on both `/suggestions` and
   * `/suggestions/tlds`. When omitted the API uses its default ordering.
   */
  tldsSort?: TldsSortTypes;
  // ---
  /**
   * An error object if any issue occurred during domain operations.
   */
  error?: ResponseError;
  // ---
  /**
   * An `ActorRef` to an authentication helper service.
   */
  authHelper?: ActorRef<any>;
  /**
   * An `ActorRef` to a basket helper service.
   */
  basketHelper?: ActorRef<any>;
  /**
   * An `ActorRef` to the domain availability pre-flight helper. Each ADD
   * click sends a `VERIFY` event to this actor so multiple checks can
   * run in parallel without contending for the machine's single invoke slot.
   */
  availabilityHelper?: ActorRef<any>;

  /**
   * The domain currently being availability-checked (set when ADD event fires).
   */
  checkingDomain?: string;

  /**
   * Cumulative `product_id` → `IProduct` map built up across paginated
   * `/suggestions/tlds` calls. Required because each `tlds` page returns a
   * different subset of TLD products — page-N suggestions often reference
   * page-(N-1) TLDs, so the parser needs every page's products available
   * to fully price each row.
   */
  productsMap?: Record<string, IProduct>;

  /**
   * When `true` (default), uses the new `/suggestions` + `/availability` parallel flow.
   * When `false`, falls back to the legacy `/search` endpoint.
   */
  useSuggestions?: boolean;
}

export interface DacOptions {
  mode?: DomainMode;
  limit?: number;
  tlds?: string[];
}

export interface DomainOptions {
  type?: DomainTypes;
  required?: boolean;
  tlds?: string[];
}

export interface DomainContext extends BasketHelperContext<DomainProduct> {
  /**
   * An array of available {@link DomainTypes} to choose from.
   */
  choices: DomainTypes[];
  /**
   * The currently active {@link DomainTypes} being managed.
   */
  type?: DomainTypes;
  /**
   * Whether the domain field is required. Defaults to `true`.
   * When `false`, skip is available and selected by default.
   */
  required: boolean;
  // ---
  /**
   * The current {@link DomainModel} representing the selected domain.
   * `null` when skip is selected (distinct from `undefined` = no value set).
   */
  model?: DomainModel | null;
  /**
   * The base {@link DomainModel}, representing the initial state before user modifications.
   */
  baseModel?: DomainModel | null;
  // ---
  /**
   * Lookups for domain data, including searched, history, owned, and basket domains.
   */
  lookups: {
    /** Domains owned by the client. */
    owned: DomainProduct[];
    /** Domains currently in the client's basket. */
    basket: DomainProduct[];
  };

  /**
   * The preferred billing cycle duration in months for domains.
   */
  preferredCycle?: number;
  // ---
  /**
   * The currency code (e.g. "GBP") to be used for domain pricing.
   */
  currency?: string;
  /**
   * The unique identifier of the shopping basket.
   */
  basketId?: string;
  /**
   * The unique identifier of the brand.
   */
  brandId?: string;
  /**
   * An array of promotion codes applied to the domain operations.
   */
  coupons?: string[];

  /**
   * An array of available Top-Level Domains (TLDs).
   */
  tlds?: string[];
  /**
   * Sort order for `/suggestions` results. When set, the value is forwarded
   * as the `tlds_sort_by` query param on both `/suggestions` and
   * `/suggestions/tlds`. When omitted the API uses its default ordering.
   */
  tldsSort?: TldsSortTypes;
  // ---
  /**
   * An error object if any issue occurred during domain operations.
   */
  error?: ResponseError;
  // ---
  /**
   * An `ActorRef` to an authentication helper service.
   */
  authHelper?: ActorRef<any>;
  /**
   * An `ActorRef` to a basket helper service.
   */
  basketHelper?: ActorRef<any>;

  // --- existing flow (availability check + transfer)

  /**
   * The domain currently being availability-checked in the existing flow.
   */
  checkingDomain?: string;
  /**
   * Stored availability response for transfer price/renewal display
   * and for building the basket product model in addExistingTransfer.
   */
  availability?: IDomainAvailabilityResponse;
  /**
   * The basket line item ID (bpid) of the added transfer product.
   * Used by removeExistingTransfer for exact-ID removal.
   */
  transferProductId?: string;
  /**
   * Stores the new domain input while the `removing` state processes basket removal.
   */
  pendingUpdate?: string;
  /**
   * Stores the target type for a blocked type-switch while `removing` processes basket removal.
   */
  pendingChoose?: DomainTypes;

  /**
   * When `true`, the dac child actor uses the new `/suggestions` +
   * `/suggestions/tlds` parallel flow. When `false` (default), falls back
   * to the legacy `/search` endpoint. Driven by the brand setting
   * `provisioning.domain_names.search_method` in `useDomain`/`useDac`.
   */
  useSuggestions?: boolean;
}
