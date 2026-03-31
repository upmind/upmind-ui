// --- external
import type { ActorRef } from "xstate";
import type { IProduct } from "@upmind-automation/types";

// --- internal
import type { Product, ProductSummaryDetail } from "../product";
import type { BasketHelperContext } from "../basketProduct";
import type { ResponseError } from "../../utils";

// -----------------------------------------------------------------------------

/**
 * A single domain result from the /suggestions endpoint.
 */
export interface IDomainSuggestionResult {
  domain: string;
  sld: string;
  tld: string;
  can_register: boolean;
  can_transfer: boolean;
  product_id: string;
}

/**
 * The full response shape from /suggestions.
 * `data` contains the suggestion results, and `related.products` is a map
 * of product_id → full IProduct objects.
 */
export interface IDomainSuggestionsResponse {
  data: IDomainSuggestionResult[];
  related: {
    products: Record<string, IProduct>;
  };
  total: number;
}

/**
 * The response shape from /availability/{domain}.
 */
export interface IDomainAvailabilityResponse {
  can_register: boolean;
  can_transfer: boolean;
  is_premium: boolean;
  product?: IProduct;
}

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
   * Represents the flow for **transferring an existing domain name** from another registrar.
   * Used when a customer wants to consolidate domain management under Upmind.
   */
  transfer = "transfer",
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
    };
    /**
     * Optional reference to the raw IProduct data from the API.
     * Stored so we can re-run parseProductProps when the domain mode changes
     * (e.g. register → transfer after a domain_transfer_only error).
     */
    rawProduct?: IProduct;
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
 * Type alias for options that configure the behaviour of the `useDomain` composable,
 * specifically the {@link DomainTypes} to manage.
 */
export type DomainProps = {
  /**
   * The specific {@link DomainTypes} to manage (e.g., 'register', 'transfer').
   */
  type?: DomainTypes;
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
  mode?: DomainTypes;
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
    /** The number of results to skip (for pagination). */
    offset: number;
    /** The total number of available results for the current search. */
    total: number;
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
   * The domain currently being availability-checked (set when ADD event fires).
   */
  checkingDomain?: string;
}

export interface DomainContext extends BasketHelperContext<DomainProduct> {
  /**
   * An array of available {@link DomainTypes} to choose from.
   */
  choices: DomainTypes[];
  /**
   * The currently active {@link DomainTypes} being managed.
   */
  type?: DomainProps["type"];
  /**
   * Whether the domain field is required.
   * - `true`: skip excluded, no default type
   * - `false`: skip enabled, skip is default type
   * - `undefined`: legacy/default (no skip, auto-select fallback)
   */
  required?: boolean;
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
   * Stored availability result for transfer price/renewal display
   * and for building the basket product model in addExistingTransfer.
   */
  availabilityResult?: IDomainAvailabilityResponse;
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
   * True while `removing` invoke is in-flight.
   */
  removalInFlight: boolean;
}

// -----------------------------------------------------------------------------
// Registrant Details (FE-2457)
// -----------------------------------------------------------------------------

/**
 * Registrant-specific fields for domain provision.
 * Maps to ICANN/registrar-required registrant contact data.
 */
export type RegistrantDetails = {
  /** Full name of the registrant. */
  name: string;
  /** Organisation name (optional — not required by all registrars). */
  organisation: string;
  /** Contact email for the registrant. */
  email: string;
  /** Contact phone number for the registrant (with country code). */
  phone: string;
  /** Street address (line 1) for the registrant. */
  address1: string;
  /** City for the registrant. */
  city: string;
  /** State or region for the registrant (optional — not required in all countries). */
  state: string;
  /** Postcode / zip code for the registrant. */
  postcode: string;
  /** Country code (ISO 3166-1 alpha-2) for the registrant. */
  country: string;
};

/**
 * Per-domain registrant status — tracks completeness of registrant data
 * for a single domain product in the basket.
 */
export type DomainRegistrantStatus = {
  /** Basket product ID. */
  productId: string;
  /** Domain name (e.g. "bondiyoga.com"). */
  domain: string;
  /** Current registrant details for this domain. */
  registrant: RegistrantDetails;
  /** `true` when all required registrant fields are populated. */
  complete: boolean;
  /** Names of required fields that are missing values. */
  missingFields: (keyof RegistrantDetails)[];
  /** `true` when the user has explicitly skipped registrant assignment. */
  skipped: boolean;
};

/**
 * Single entry in the billing → registrant → provision field mapping.
 */
export type RegistrantFieldMapEntry = {
  /** Key in the billing/client data source. */
  billingKey: string;
  /** Key in the RegistrantDetails type. */
  registrantKey: keyof RegistrantDetails;
  /** Provision field key sent to the API. */
  provisionKey: string;
  /** Whether this field is required for registrant completeness. */
  required: boolean;
};

/**
 * Maps billing/client data fields → registrant fields → domain provision field keys.
 * Used to pre-fill registrant details from billing and to transform registrant
 * data into provision field values for the basket product API.
 */
export const REGISTRANT_FIELD_MAP: RegistrantFieldMapEntry[] = [
  {
    billingKey: "name",
    registrantKey: "name",
    provisionKey: "registrant_name",
    required: true
  },
  {
    billingKey: "company",
    registrantKey: "organisation",
    provisionKey: "registrant_organisation",
    required: false
  },
  {
    billingKey: "email",
    registrantKey: "email",
    provisionKey: "registrant_email",
    required: true
  },
  {
    billingKey: "phone",
    registrantKey: "phone",
    provisionKey: "registrant_phone",
    required: true
  },
  {
    billingKey: "address_1",
    registrantKey: "address1",
    provisionKey: "registrant_address_1",
    required: true
  },
  {
    billingKey: "city",
    registrantKey: "city",
    provisionKey: "registrant_city",
    required: true
  },
  {
    billingKey: "state",
    registrantKey: "state",
    provisionKey: "registrant_state",
    required: false
  },
  {
    billingKey: "postcode",
    registrantKey: "postcode",
    provisionKey: "registrant_postcode",
    required: true
  },
  {
    billingKey: "country",
    registrantKey: "country",
    provisionKey: "registrant_country",
    required: true
  }
] as const;

/**
 * Required registrant field keys — derived from REGISTRANT_FIELD_MAP.
 * Only fields with `required: true` are included.
 */
export const REQUIRED_REGISTRANT_FIELDS: (keyof RegistrantDetails)[] = [
  "name",
  "email",
  "phone",
  "address1",
  "city",
  "postcode",
  "country"
] as const;
