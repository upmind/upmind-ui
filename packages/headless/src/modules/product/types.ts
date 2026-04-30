import type { ActorRef } from "xstate";
import type { ErrorObject } from "ajv";
import type { JsonSchema7, UISchemaElement } from "@jsonforms/core";

import type {
  IBasketProduct,
  IProduct,
  IClient,
  ICurrency,
  IBasketPromotion,
  IRelatedObject,
  IProvisionFieldValue,
  IBlueprintField,
  IBlueprint
} from "@upmind-automation/types";
import { PromotionDisplayTypes } from "@upmind-automation/types";
import type { Recommendation } from "../recommendations";
import type { Badge } from "../config/schema";
import type { BasketProduct } from "../basketProduct";
import { type ResponseError } from "../../utils";

export {
  PromotionDisplayTypes,
  PriceDisplayTypes
} from "@upmind-automation/types";

// -----------------------------------------------------------------------------
/**
 * The price details for any price, allowing for gross/net and discount breakdowns.
 */
export interface Price {
  /**
   * The total price of the product or item.
   */
  total: number;
  /**
   * The formatted total price of the product (e.g. "£120.00").
   */
  totalFormatted: string;
  /**
   * The subtotal price of the product (before discounts or taxes, depending on context).
   */
  subtotal: number;
  /**
   * The formatted subtotal price of the product (e.g. "£100.00").
   */
  subtotalFormatted: string;
  /**
   * The discount amount applied to the product.
   */
  discount: number;
  /**
   * The formatted discount price of the product (e.g. "£20.00").
   */
  discountFormatted: string;
}

/**
 * The display price structure for any price that is shown in the UI.
 * This structure always provides full price details based on the total configuration,
 * which may be gross or net depending on brand settings. It includes quantity modifiers,
 * discounts, and any other adjustments. Essentially, this is the final price that
 * should be presented to the customer.
 */
export type PriceDisplay = {
  /**
   * The current numerical amount of the price, *after* all applied coupons and discounts.
   */
  currentAmount: number;
  /**
   * The current price, formatted as a string, *after* all applied coupons and discounts.
   */
  currentPrice: string;
  // ---
  /**
   * The regular numerical amount of the price *before* any coupons and discounts.
   */
  regularAmount: number;
  /**
   * The regular price, formatted as a string, *before* any coupons and discounts.
   */
  regularPrice: string;
  // ---
  /**
   * The numerical amount saved due to discounts.
   */
  savingAmount: number;
  /**
   * The saving amount, formatted as a string.
   */
  savingPrice: string;
  /**
   * The saving amount, formatted as a percentage string (e.g. "10%").
   */
  savingPercent: string;
  // ---
  /**
   * The base numerical amount of the price *before* any coupons and discounts,
   * always excluding tax (net). Used for summary displays where math needs to add up.
   */
  baseAmount?: number;
  /**
   * The base price, formatted as a string, *before* any coupons and discounts,
   * always excluding tax (net). Used for summary displays where math needs to add up.
   */
  basePrice?: string;
  // ---
  /**
   * The calculated monthly amount from the current price, if applicable.
   */
  monthlyFromCurrentAmount?: number;
  /**
   * The calculated monthly price from the current price, formatted as a string, if applicable.
   */
  monthlyFromCurrentPrice?: string;
  /**
   * The calculated monthly amount from the regular price, if applicable.
   */
  monthlyFromRegularAmount?: number;
  /**
   * The calculated monthly price from the regular price, formatted as a string, if applicable.
   */
  monthlyFromRegularPrice?: string;
};

/**
 * The full price details for any product or item displayed in the UI.
 * This type extends {@link PriceDisplay} and provides additional breakdowns
 * for display and tracking purposes, including individual unit prices (gross and net)
 * and the total configuration price (gross and net).
 */
export type PriceDetail = PriceDisplay & {
  /**
   * The individual unit price, representing the base price of the product before
   * any adjustments or quantity modifiers.
   */
  unit?: Price;
  /**
   * The configuration price, representing the total price of the product,
   * including any adjustments or quantity modifiers.
   */
  configuration?: Price;
};

// -----------------------------------------------------------------------------

/**
 * Represents a "configured" product with its configuration, pricing, and associated details.
 * This type aggregates all information necessary for displaying and managing a product
 * in various contexts, such as a product page or shopping basket.
 */
export type Product = {
  /**
   * The unique identifier of the product. Optional, as pending products may not have an ID yet.
   */
  id?: string;

  /**
   * The configuration model of the product. This contains the settings and values
   * used for editing or defining the product, built and verified against a schema.
   */
  configuration: ProductProps;

  /**
   * Detailed information about the actual product, including its title, description, etc.
   */
  productDetails: ProductDetails;

  /**
   * An array of {@link PromotionDetails} that are currently applied to the product.
   */
  promotions?: PromotionDetails[];

  /**
   * Meta-information about the product's summary state.
   */
  meta: ProductSummaryMeta;

  /**
   * The display price details for the product. This represents the total configured pricing,
   * including any discounts or adjustments. It is always the price shown to the customer,
   * and its tax inclusion depends on the brand's settings.
   */
  price: PriceDetail;

  /**
   * A breakdown of the product's pricing details.
   * This may contain multiple entries, e.g. for different configuration options.
   */
  pricing: ProductSummaryDetailWithPrice[];

  /**
   * A summary of the product configuration, providing details that may or may not
   * include pricing information, depending on the context.
   * e.g. terms will have pricing information, a subproduct may have pricing information
   * depending on if it is an option or attribute, provision fields will not have pricing information.
   */
  details: (ProductSummaryDetail | ProductSummaryDetailWithPrice)[];

  /**
   * An optional object containing errors related to various aspects of the product's configuration.
   */
  errors?: ErrorObject[];

  /**
   * Available billing terms parsed from the product's prices.
   * Used for inline term selection in the basket.
   */
  availableTerms?: TermDetails[];

  /**
   * Available option categories and their values parsed from the product's options.
   * Used for inline option toggling in the basket.
   */
  availableOptions?: SubproductDetails[];

  /**
   * Option upsell summaries for available-but-unselected options.
   * Pre-computed during basket product parsing for direct rendering.
   */
  upsells?: ProductSummaryDetailWithPrice[];
};

/**
 * Type alias for a product breadcrumb item, used for navigational paths.
 */
export type ProductBreadcrumb = {
  /** The unique identifier of the breadcrumb item (e.g. category ID). */
  id: string;
  /** The display label for the breadcrumb item. */
  label: string;
};

/**
 * Represents the actual store product details, typically retrieved from the API.
 * This contains all the displayable and configurable information for a product.
 */
export type ProductDetails = {
  /** The unique identifier of the product. */
  id: string;
  /** The display title of the product, typically translated. */
  title: string;
  /** The untranslated name of the product, often used for reporting purposes. */
  name: string;
  /** The service identifier (e.g., domain name). Only present for basket products. */
  serviceIdentifier?: string;
  /** The brand associated with the product. */
  brand: string;
  /** An optional {@link Badge} to display with the product. */
  badge?: Badge;
  /** The ID of the primary category the product belongs to. */
  categoryId: string;
  /** The name of the primary category the product belongs to. */
  category: string;
  /** An array of parent category names for the product, if applicable. */
  categories?: string[];
  /** An array of {@link ProductBreadcrumb} items, defining the navigational path to the product. */
  breadcrumb?: ProductBreadcrumb[];
  /** The default billing cycle in months for the product. */
  cycle: number;
  /** Optional {@link TermDetails} for how the price is displayed for this term. */
  displayPrice?: TermDetails;
  /** A detailed description of the product. */
  description?: string;
  /** A short excerpt or summary of the product description. */
  excerpt?: string;
  /** The URL of the main image for the product. */
  imgUrl?: string;
  /** An array of {@link ProductImage} objects for the product. */
  images?: ProductImage[];

  /**The Products blueprint code that we can use to determine what kind of product this is */
  blueprintCode?: IBlueprint["code"];

  /** Indicates whether the product is configurable. ie has terms, options, attributes or provision fields that need configuring */
  configurable?: boolean;

  /** `true` if the product has options or attributes that can be configured inline (e.g. upsells on the basket card). */
  configurableInline?: boolean;

  /** `true` if the product allows quantity selection, `false` otherwise. */
  quantifiable: boolean;
  /** The default or current quantity of the product. */
  quantity: number;
  /** The step increment for quantity selection. */
  step: number;
  /** The minimum allowed quantity for the product. */
  min: number;
  /** The maximum allowed quantity for the product, or `Infinity`. */
  max: number;
  /** The default payment period in days, if different from the billing cycle. */
  defaultPaymentPeriod?: number;
  /** An array of {@link Benefit} objects associated with the product. */
  benefits?: Benefit[];
  /** Optional {@link UIMeta} for UI-specific product configuration. */
  uiMeta?: UIMeta;
  /** Optional UI meta-data specific to the product's category. */
  uiCategoryMeta?: Record<string, any>;
  // --- trial
  /** `true` if the product supports a free trial period. */
  trialSupported?: boolean;
  /** The trial duration in days. */
  trialDuration?: number;
  /** `true` if the trial is forced (user cannot opt out). */
  trialForce?: boolean;
  /** The action taken when the trial ends. See `TrialEndActionTypes`. */
  trialEndAction?: number;
  // --- locked
  /** `true` if the product contains non-orderable subproducts and cannot be modified. */
  readonly?: boolean;
};

/**
 * Represents the product model used for configuration, which is built and verified by a schema.
 * This is the core data structure for configuring a product's attributes, options, and provision fields.
 */
export type ProductModel = {
  /** The unique identifier of the product instance (if existing). */
  id?: string;
  /** The unique identifier of the base product. */
  productId: string;
  /** The quantity of the product. */
  quantity: number;
  // ---
  /** The selected billing term in months. */
  term?: number;
  /** Optional subproduct model for attributes. */
  attributes?: SubproductModel;
  /** Optional subproduct model for options. */
  options?: SubproductModel;
  /** Key-value pairs for provision field values. */
  provisionFields?: Record<string, any>;
  // --- trial
  /** `true` to start a free trial for this product. */
  startTrial?: boolean;
};

/**
 * Type alias for a subproduct model value, defining the configuration for a single subproduct instance.
 */
export type SubproductModelValue = {
  /** The unique identifier of the subproduct. */
  productId: string;
  /** The billing cycle duration in months for the subproduct. */
  cycle: number;
  /** The quantity of the subproduct. */
  quantity: number;
};

/**
 * Type alias for a subproduct model, structured as a nested record to organise subproducts
 * by category ID and then by their value ID.
 */
export type SubproductModel = Record<
  string, // Category ID
  Record<
    string, // Value ID
    SubproductModelValue
  >
>;

/**
 * Type alias for a promotion model, containing the promotion code.
 */
export type PromotionModel = {
  /** The promotional code. */
  code: string;
};

/**
 * Interface defining the properties required to create or configure a product.
 * It extends {@link ProductModel} with additional client, currency, and promotion details.
 */
export interface ProductProps extends ProductModel {
  /** The ID of the currency to use for pricing. */
  currencyId?: ICurrency["id"];
  /** The ISO code of the currency to use for pricing. */
  currencyCode?: ICurrency["code"];
  /** The ID of the client for whom the product is being configured. */
  clientId?: IClient["id"];

  // /** An array of {@link IBasketPromotion} objects. These are needed to determine if the price needs recalculation. */
  // promotions?: IBasketPromotion[];

  /** An array of coupon codes passed via URL or configuration that are not yet in the basket. */
  coupons?: string[];
  /** An array of IDs of subproducts passed via URL or configuration that are not yet in the model/config. */
  subproducts?: string[];
  /**
   * An optional bundle ID. If provided, indicates that this product should apply
   * a specific bundle configuration. If set to `false`, forces no bundles to be applied.
   */
  bundle?: string;
  // ---
  /**
   * If `true`, indicates that provision fields should not be validated, treating this
   * as a bulk or background operation.
   */
  silent?: boolean;
}

/**
 * Interface representing raw product configuration properties, typically passed
 * from a backend API or extracted from URL parameters.
 */
export interface IProductConfig {
  /** Product ID. */
  pid?: string;
  /** Quantity. */
  qty?: number;
  /** Billing cycle in months. */
  bcm?: number;
  /** Sub-product IDs. */
  sub_pids?: string[];
  /** Provision field key-value pairs. */
  pfields?: Record<string, any>;
  /** Coupon codes. */
  coupons?: string[];
}

/**
 * Type alias for a product summary, aggregating key pricing and detail information.
 */
export type ProductSummary = {
  /** The display price details for the product. */
  price: Product["price"];
  /** A breakdown of the product's pricing details. */
  pricing: Product["pricing"];
  /** A summary of the product configuration details. */
  details: Product["details"];
};

/**
 * Type alias for meta-information about a product summary.
 */
export type ProductSummaryMeta = {
  /** `true` if the product is a one-off purchase. */
  oneoff?: boolean;
  /** `true` if the product allows quantity selection. */
  quantifiable?: boolean;
  /** `true` if the product has a discount applied. */
  discounted?: boolean;
  /** `true` if the product is free. */
  free?: boolean;
  /** `true` if the product's configuration is invalid. */
  invalid?: boolean;
  /** `true` if the product's configuration overrides a default. */
  overrides?: boolean;
  /** `true` if the product has an overridden custom price*/
  overridden?: boolean;
  /** `true` if the product has mixed configuration options. */
  mixed?: boolean;
  /** `true` if the product includes other items. */
  includes?: boolean;
  /** `true` if the product is already added to the basket. */
  added?: boolean;
  /** `true` if the product is available. */
  available?: boolean;
  /** `true` if the price includes tax. */
  includesTax?: boolean;
  /** `true` if the product is the default selection. */
  default?: boolean;
  /** `true` if the product offers a free trial. */
  freeTrial?: boolean;
  /** `true` if the product has provision fields with deferred mode (optional/hidden). */
  deferred?: boolean;
  /** The formatted renewal price for the current billing cycle (e.g. "$9.99"). */
  renewalPrice?: string;
  /** `true` if monthly pricing should be derived from the product's price. */
  useMonthlyFromPrice?: boolean;
  /** `true` if the product's price has been overridden. */
  overriden?: boolean;
};

/**
 * Type alias for a product summary detail, providing name, title, cycle, and meta-information.
 */
export type ProductSummaryDetail = {
  /** The unique identifier of the product. */
  id?: string;
  /** The untranslated name of the item, often used for reporting purposes. */
  name: string;
  /** The display title of the item, typically translated. */
  title?: string;
  /** The billing cycle duration in months for the item. */
  cycle?: number;
  /** The category name of the item. */
  category?: string;
  /** The quantity of the item. */
  quantity?: number;
  /** An array of {@link PromotionDetails} applied to this item. */
  promotions?: PromotionDetails[];
  /** Meta-information about this summary detail. */
  meta: ProductSummaryMeta;
  /** Optional array of Ajv {@link ErrorObject} if there are validation errors. */
  error?: ErrorObject[];
};

/**
 * Type alias for a product summary detail that also includes pricing information.
 */
export type ProductSummaryDetailWithPrice = ProductSummaryDetail & {
  /** The detailed price information for the item. */
  price: PriceDetail;
};

/**
 * Type alias for various formats of billing cycle descriptions.
 */
export type BillingCycleFormats = {
  /** Adverbial variant, e.g. `Monthly`, `Annually`, `One time`. */
  adverbial: string;
  /** Descriptive variant, e.g. `month`, `3 years`. */
  descriptive: string;
  /** Monthly variant, e.g. `month`, `6 months`. */
  monthly: string;
  /** Abbreviated suffix variant, e.g. `mo` for 1 month, `2-yr` for 2 years. */
  suffix: string;
  /** Numeric variant, e.g. `1-month` or `2-year`. */
  numeric: string;
};

/**
 * Type alias for term-specific details in a product summary, including pricing and tax display options.
 */
export type TermDetails = ProductSummaryDetail & {
  /** The detailed price information for the term. */
  price: PriceDetail;
  /** `true` if taxes should be explicitly shown for this term. */
  showTaxes?: boolean;
};

/**
 * Type alias for detailed information about a subproduct.
 */
export type SubproductDetails = {
  /** The unique identifier of the subproduct. */
  id: string;
  /** The untranslated name of the subproduct, often used for reporting purposes. */
  name: string;
  /** The display title of the subproduct, typically translated. */
  title: string;
  /** A detailed description of the subproduct. */
  description?: string;
  /** A short excerpt or summary of the subproduct description. */
  excerpt?: string;
  /** Optional UI meta-data specific to the subproduct. */
  uiMeta?: Record<string, any>;
  /** Optional UI meta-data specific to the subproduct's category. */
  uiCategoryMeta?: Record<string, any>;
  // ---
  /** Meta-information about the subproduct's behaviour. */
  meta: {
    /** `true` if multiple instances of this subproduct can be selected. */
    multiple: boolean;
    /** `true` if selection of this subproduct is required. */
    required: boolean;
    /** `true` if this subproduct selection overrides a default. */
    overrides: boolean;
    /** `true` if the product has an overridden custom price*/
    overridden?: boolean;
  };
  // ---
  /** An array of {@link SubproductValue} objects representing the available choices for this subproduct. */
  values?: SubproductValue[];
};

/**
 * Type alias for a specific value/option of a subproduct, extending {@link ProductDetails}.
 */
export type SubproductValue = ProductDetails & {
  /** Meta-information about this subproduct value. */
  meta: ProductSummaryMeta;
  /** Optional detailed price information for this subproduct value. */
  price?: PriceDetail;
  /** Optional array of {@link PromotionDetails} applied to this subproduct value. */
  promotions?: PromotionDetails[];
  /** Optional array of {@link ProductSummaryDetailWithPrice} for pricing breakdown. */
  pricing?: ProductSummaryDetailWithPrice[];
  /** The display order of this subproduct value. */
  order: number;
};

/**
 * Type alias for detailed information about a promotion.
 */
export type PromotionDetails = {
  id: string;
  /** The promotion code. */
  code: string;
  /** The untranslated name of the promotion, often for reporting. */
  name: string;
  /** The display title of the promotion, typically translated. */
  title: string;
  /** A detailed description of the promotion. */
  description?: string;
  /** A short excerpt or summary of the promotion description. */
  excerpt?: string;
  //  ---
  /** Meta-information about the promotion's display and effects. */
  meta?: {
    /** The display type of the promotion (e.g. `PromotionDisplayTypes.FREE_PRODUCT`). */
    display?: PromotionDisplayTypes;
    /** `true` if the promotion involves mixed effects (e.g. discount and free item). */
    mixed?: boolean;
    /** `true` if the promotion applies a discount. */
    discounted?: boolean;
  };
  /** Optional pricing details related to the promotion's savings. */
  price?: {
    /** The numerical saving amount. */
    savingAmount: PriceDetail["savingAmount"];
    /** The formatted saving price. */
    savingPrice: PriceDetail["savingPrice"];
    /** The saving percentage formatted as a string. */
    savingPercent: PriceDetail["savingPercent"];
  };
};

export enum BreadcrumbVariant {
  HIDDEN = "hidden",
  CONDENSED = "condensed",
  PARENT = "parent",
  VISIBLE = "visible"
}

export interface UIMeta {
  ui?: UIConfig;
  uischema?: UISchema;
  related?: Recommendation[];
  product?: UIProductMeta;
}

export interface UIProductMeta {
  variant?: string;
  image: {
    hide?: boolean;
    carousel?: boolean;
    ratio?: string;
  };
  display_price?: {
    trim_trailing_zeroes?: boolean;
  };
  card: {
    benefits: {
      hide?: boolean;
      data?: Benefit[];
    };
    description: {
      hide?: boolean;
    };
    breakdown: {
      hide?: boolean;
    };
    price: {
      hide?: boolean;
    };
    terms: {
      hide?: boolean;
    };
  };
}

export interface UIConfig {
  summary?: {
    append?: string;
  };
}

export interface UISchema {
  billing?: {
    control?: string;
  };
  primary?: boolean;
  group?: string;
  group_name?: string;
  icon?: string;
  config?: {
    summary?: {
      append?: string;
    };
    breadcrumbs?: BreadcrumbVariant;
  };
  productConfig?: {
    summary?: {
      append?: string;
    };
  };
}

export const UI_SCHEMA_DEFAULTS: UISchema = {
  // Allow the context to set the default (e.g category for configuration/edit pages)
  // config: {
  //   breadcrumbs: BreadcrumbVariant.VISIBLE
  // }
} as const;

/**
 * Type alias for a product image.
 */
export type ProductImage = {
  /** The URL of the image. */
  url: string;
  /** `true` if this is the default image for the product. */
  default: boolean;
  /** The display order of the image. */
  order: number;
};

/**
 * Interface representing UI meta-data for a product or view.
 * It encapsulates configurations for UI elements, related items, and product-specific overrides.
 */
export interface UIMeta {
  /** Optional {@link UIConfig} for general UI settings. */
  ui?: UIConfig;
  /** Optional {@link UISchema} for form UI layout. */
  uischema?: UISchema;
  /** Optional array of {@link Recommendation} for related products. */
  related?: Recommendation[];
  /** Optional {@link UIProductMeta} for product-specific UI overrides. */
  product?: UIProductMeta;
}

/**
 * Interface representing UI meta-data specific to a product, allowing for granular control
 * over how product components are displayed in the user interface.
 */
export interface UIProductMeta {
  /** Optional variant string for styling purposes. */
  variant?: string;
  /** Configuration for product images. */
  image: {
    /** `true` to hide product images. */
    hide?: boolean;
    /** `true` to enable an image carousel. */
    carousel?: boolean;
    /** The aspect ratio for product images (e.g. "16:9"). */
    ratio?: string;
  };
  /** Configuration for displaying product prices. */
  display_price?: {
    /** `true` to trim trailing zeros from displayed prices. */
    trim_trailing_zeroes?: boolean;
  };
  /** Configuration for the product card display. */
  card: {
    /** Configuration for product benefits. */
    benefits: {
      /** `true` to hide benefits on the card. */
      hide?: boolean;
      /** An array of {@link Benefit} data to display. */
      data?: Benefit[];
    };
    /** Configuration for product description. */
    description: {
      /** `true` to hide the description on the card. */
      hide?: boolean;
    };
    /** Configuration for price breakdown. */
    breakdown: {
      /** `true` to hide the price breakdown on the card. */
      hide?: boolean;
    };
    /** Configuration for product price display. */
    price: {
      /** `true` to hide the price on the card. */
      hide?: boolean;
    };
    /** Configuration for product terms. */
    terms: {
      /** `true` to hide the terms on the card. */
      hide?: boolean;
    };
  };
}

/**
 * Interface representing general UI configuration settings.
 */
export interface UIConfig {
  /** Summary display configuration. */
  summary?: {
    /** Optional string to append to the summary. */
    append?: string;
  };
}

/**
 * Interface representing a UI Schema for form rendering.
 * It provides configurations for billing, grouping, and other form-specific UI aspects.
 */
export interface UISchema {
  /** Billing-specific control configuration. */
  billing?: {
    /** The control type for billing. */
    control?: string;
  };
  /** `true` if this schema is for a primary form. */
  primary?: boolean;
  /** The grouping identifier for form fields. */
  group?: string;
  /** The display name of the group. */
  group_name?: string;
  /** The icon to display for the group. */
  icon?: string;
  /** Configuration specific to the UI. */
  config?: {
    /** Summary configuration. */
    summary?: {
      /** Optional string to append to the summary. */
      append?: string;
    };
    breadcrumbs?: BreadcrumbVariant;
  };
  /** Product configuration summary settings. */
  productConfig?: {
    /** Summary configuration. */
    summary?: {
      /** Optional string to append to the summary. */
      append?: string;
    };
  };
  payment?: {
    gateways: {
      clamp: number;
    };
  };
}

/**
 * Represents a benefit associated with a product.
 * Can be either a simple string label or an object with label and optional icon.
 */
export type Benefit =
  | string
  | {
      /** The display label for the benefit. */
      label: string;
      /** An optional icon string or component to display with the benefit. */
      icon?: string | any;
    };

/**
 * Type alias for displaying price calculation states.
 */
export type PriceEntry = number | { price: number; quantity: number };

export type PriceCalculations = {
  /** `true` if prices are currently being calculated. */
  calculating?: boolean;
  /** An array of billing terms that prices are calculated for. */
  term?: PriceEntry[];
  /** An array of option IDs for which prices are calculated. */
  options?: PriceEntry[];
  /** An array of attribute IDs for which prices are calculated. */
  attributes?: PriceEntry[];
};

/**
 * @deprecated Use `ErrorObject[]` directly. This alias is redundant.
 */
export type ExternalError = ErrorObject[];

/**
 * Interface representing a product bundle, extending {@link IRelatedObject}.
 */
export interface ProductBundle extends IRelatedObject {
  // --- config to be used in adding the bundle
  /** The {@link IProductConfig} to be used when adding this bundle to the basket. */
  config: IProductConfig;
}

/**
 * Type alias for a collection of product bundles.
 */
export type ProductBundles = ProductBundle[] | Record<string, ProductBundle>;

// -----------------------------------------------------------------------------

/**
 * Interface representing the context for product configuration, typically managed by an XState machine.
 * It holds the state for configuring a single product, including its model, lookups, pricing, and associated errors.
 */
export interface ProductConfigContext {
  /** The unique identifier for the product configuration instance. */
  id: string;
  /** Optional client ID for context. */
  clientId?: ProductProps["clientId"];
  /** Optional currency ID for pricing. */
  currencyId?: ProductProps["currencyId"];
  /** Optional currency code for pricing. */
  currencyCode?: ProductProps["currencyCode"];
  /** Optional array of {@link IBasketPromotion} for promotions. */
  promotions?: IBasketPromotion[];
  /** Optional array of coupon codes. */
  coupons?: ProductProps["coupons"];
  /** Optional array of subproduct IDs. */
  subproducts?: ProductProps["subproducts"];
  /** `true` if operating in silent mode (no provision field validation). */
  silent?: ProductProps["silent"];
  /** Optional bundle ID. */
  bundle?: ProductProps["bundle"];
  // ---
  /** The base {@link ProductModel} before modifications. */
  baseModel?: ProductModel;
  /** The current {@link ProductModel} being configured. */
  model?: ProductModel;
  // ---
  /** Lookups for various product-related data. */
  lookups?: {
    /** The {@link ProductDetails} of the base product. */
    product?: ProductDetails;
    /** An array of {@link TermDetails} for available billing terms. */
    terms?: TermDetails[];
    /** An array of {@link SubproductDetails} for available options. */
    options?: SubproductDetails[];
    /** An array of {@link SubproductDetails} for available attributes. */
    attributes?: SubproductDetails[];
    /** Raw provision fields from the API. Parsed into JSON schema during schema generation. */
    provisionFields?: IBlueprintField[];
    /** {@link PriceCalculations} for current pricing state. */
    prices?: PriceCalculations;
    /** An array of {@link ProductModel} for bundled products. */
    bundled?: ProductModel[];
  };
  // ---
  /** The fully configured {@link Product} object. */
  product?: Product;
  /** Optional {@link UIMeta} for UI-specific configuration. */
  meta?: UIMeta;
  /** Generated JSON schema for the unified product config form. */
  schema?: JsonSchema7;
  /** Generated UI schema for the unified product config form layout. */
  uischema?: UISchemaElement;
  // ---
  /** An `ActorRef` for a price calculation callback. */
  calculateCallback?: ActorRef<any>;
  /**
   * An {@link ResponseError} or `ErrorObject[]` if an error occurred during configuration.
   * @todo Implement the new response errors types from the API.
   */
  error?: ResponseError | ErrorObject[];
  /** External errors object. */
  basketErrors?: ResponseError | ErrorObject[];
  /** Number of attempts made for an operation. */
  attempts?: number;
  // ---
  /** The raw `IProduct` object from the API. */
  rawProduct?: IProduct;
  /** The raw `IBasketProduct` object if the product is already in the basket. */
  rawBasketProduct?: IBasketProduct;
  /** The raw provision fields as received from the API. */
  rawProvisionFields?: IBlueprintField[];
  // ---
  /** The ID of the current shopping basket. */
  basketId?: string;
  /** When `true`, the machine returns to `available` after update instead of `complete`. */
  allowMultipleEdits?: boolean;
  /** When `true`, the product cannot be edited (e.g. contains options with `clients_can_order: 0`). */
  readonly?: boolean;
  /** An `ActorRef` to the basket helper service. */
  basketHelper?: ActorRef<any>;
  /** A function to parse a {@link ProductModel} for the basket. */
  parseBasketProduct?: (item: ProductModel) => ProductModel;
  /** A function to parse a {@link BasketProduct} for comparison with a partial {@link ProductModel}. */
  parseBasketProductComparison?: (item: BasketProduct) => Partial<ProductModel>;
}
