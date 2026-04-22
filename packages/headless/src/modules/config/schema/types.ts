import type { UISchema, DataSchema } from "./schema";
import type { Benefit, IProductConfig } from "../../product/types";

export type { Benefit };

export const VISIBILITY = {
  VISIBLE: "visible",
  HIDDEN: "hidden"
} as const;
export type Visibility = (typeof VISIBILITY)[keyof typeof VISIBILITY];

export const IMAGE_RATIO = {
  "1:1": "1:1",
  "3:2": "3:2",
  "4:3": "4:3",
  "16:9": "16:9",
  "18:6": "18:6",
  AUTO: "auto"
} as const;
export type ImageRatio = (typeof IMAGE_RATIO)[keyof typeof IMAGE_RATIO];

export const GRID_LAYOUT = {
  ONE_COL: "1-col",
  TWO_COL: "2-col",
  THREE_COL: "3-col",
  FOUR_COL: "4-col"
} as const;
export type GridLayout = (typeof GRID_LAYOUT)[keyof typeof GRID_LAYOUT];

export const TAXES_DISPLAY = {
  CONSOLIDATED: "consolidated",
  VISIBLE: "visible"
} as const;
export type TaxesDisplay = (typeof TAXES_DISPLAY)[keyof typeof TAXES_DISPLAY];

export const LIST_STYLE = {
  GRID: "grid",
  GRID_FACET: "grid-facet",
  CAROUSEL: "carousel"
} as const;
export type ListStyle = (typeof LIST_STYLE)[keyof typeof LIST_STYLE];

export const CATEGORY_GRID_LAYOUT = {
  ONE_COL: "1-col",
  TWO_COL: "2-col",
  THREE_COL: "3-col",
  FOUR_COL: "4-col",
  FIVE_COL: "5-col",
  SIX_COL: "6-col"
} as const;
export type CategoryGridLayout =
  (typeof CATEGORY_GRID_LAYOUT)[keyof typeof CATEGORY_GRID_LAYOUT];

export const EDITABILITY = {
  READONLY: "readonly",
  EDITABLE: "editable"
} as const;
export type Editability = (typeof EDITABILITY)[keyof typeof EDITABILITY];

export const GATEWAY_CAP = {
  ONE: "1",
  TWO: "2",
  THREE: "3",
  FOUR: "4",
  FIVE: "5",
  SIX: "6",
  SEVEN: "7",
  EIGHT: "8",
  NONE: "none"
} as const;
export type GatewayCap = (typeof GATEWAY_CAP)[keyof typeof GATEWAY_CAP];

export const BREADCRUMBS = {
  HIDDEN: "hidden",
  CONDENSED: "condensed",
  PARENT: "parent",
  VISIBLE: "visible"
} as const;
export type Breadcrumbs = (typeof BREADCRUMBS)[keyof typeof BREADCRUMBS];

export const OPTION_SELECTOR = {
  RADIO_GRID: "radio-grid",
  RADIO_ROWS: "radio-rows",
  SELECT: "select",
  SELECT_GROUPED: "select-grouped"
} as const;
export type OptionSelector =
  (typeof OPTION_SELECTOR)[keyof typeof OPTION_SELECTOR];

export const DESCRIPTION_DISPLAY = {
  TOOLTIP: "tooltip",
  INLINE: "inline",
  HIDDEN: "hidden"
} as const;
export type DescriptionDisplay =
  (typeof DESCRIPTION_DISPLAY)[keyof typeof DESCRIPTION_DISPLAY];

export const PRODUCT_LIST_STYLE = {
  GRID: "grid",
  CAROUSEL: "carousel",
  DAC: "dac"
} as const;
export type ProductListStyle =
  (typeof PRODUCT_LIST_STYLE)[keyof typeof PRODUCT_LIST_STYLE];

export const IMAGES_STYLE = {
  SINGLE: "single",
  CAROUSEL: "carousel",
  GRID: "grid",
  AUTO: "auto"
} as const;
export type ImagesStyle = (typeof IMAGES_STYLE)[keyof typeof IMAGES_STYLE];

export const ORIENTATION = {
  VERTICAL: "vertical",
  HORIZONTAL: "horizontal"
} as const;
export type Orientation = (typeof ORIENTATION)[keyof typeof ORIENTATION];

export const PRODUCT_STYLE = {
  FLUSH: "flush",
  CARDED: "carded",
  "FLUSH-CARDED": "flush-carded"
} as const;
export type ProductStyle = (typeof PRODUCT_STYLE)[keyof typeof PRODUCT_STYLE];

export const CLAMPABLE_VISIBILITY = {
  VISIBLE: "visible",
  HIDDEN: "hidden",
  CLAMPED: "clamped"
} as const;
export type ClampableVisibility =
  (typeof CLAMPABLE_VISIBILITY)[keyof typeof CLAMPABLE_VISIBILITY];

export const CLAMP_LINES = {
  THREE: "3",
  FOUR: "4",
  FIVE: "5",
  SIX: "6",
  SEVEN: "7",
  EIGHT: "8"
} as const;
export type ClampLines = (typeof CLAMP_LINES)[keyof typeof CLAMP_LINES];

export const ZERO_PRICE_DISPLAY = {
  NUMERIC: "numeric",
  LABEL: "label"
} as const;
export type ZeroPriceDisplay =
  (typeof ZERO_PRICE_DISPLAY)[keyof typeof ZERO_PRICE_DISPLAY];

export const TERM_SELECTOR = {
  RADIO_GRID: "radio-grid",
  RADIO_ROWS: "radio-rows",
  SELECT: "select"
} as const;
export type TermSelector = (typeof TERM_SELECTOR)[keyof typeof TERM_SELECTOR];

export const ICON_VARIANT = {
  LINE: "line",
  SOLID: "solid",
  DUOTONE: "duotone",
  DUOCOLOR: "duocolor"
} as const;
export type IconVariant = (typeof ICON_VARIANT)[keyof typeof ICON_VARIANT];

export const DIVIDER_STYLE = {
  HIDDEN: "hidden",
  SOLID: "solid",
  DASHED: "dashed",
  DOTTED: "dotted"
} as const;
export type DividerStyle = (typeof DIVIDER_STYLE)[keyof typeof DIVIDER_STYLE];

export const OPTION_GROUP_SPACING = {
  TWO: "2",
  FOUR: "4",
  SIX: "6",
  EIGHT: "8",
  TEN: "10"
} as const;
export type OptionGroupSpacing =
  (typeof OPTION_GROUP_SPACING)[keyof typeof OPTION_GROUP_SPACING];

export interface BadgeObject {
  label: string;
  icon?: string;
  color?: string;
  variant?: string;
}
export type Badge = string | BadgeObject;

export enum UIContext {
  ALL = "all",
  CATALOGUE = "catalogue",
  CONFIGURE = "configure",
  RECOMMENDATIONS = "recommendations",
  BASKET = "basket",
  AUTH = "auth",
  BILLING_DETAILS = "billing_details",
  CHECKOUT = "checkout",
  CONFIRMATION = "confirmation"
}

export enum UIScope {
  BRAND = "brand",
  PRODUCT_CATEGORY = "product_category",
  PRODUCT = "product",
  OPTION_CATEGORY = "option_category",
  OPTION = "option"
}

export const ALL_CONTEXTS = [
  UIContext.CATALOGUE,
  UIContext.CONFIGURE,
  UIContext.RECOMMENDATIONS,
  UIContext.BASKET,
  UIContext.AUTH,
  UIContext.BILLING_DETAILS,
  UIContext.CHECKOUT,
  UIContext.CONFIRMATION
];

export type ValueType =
  | typeof VISIBILITY
  | typeof IMAGE_RATIO
  | typeof GRID_LAYOUT
  | typeof PRODUCT_LIST_STYLE
  | typeof IMAGES_STYLE
  | typeof ORIENTATION
  | typeof PRODUCT_STYLE
  | typeof CLAMPABLE_VISIBILITY
  | typeof CLAMP_LINES
  | typeof ZERO_PRICE_DISPLAY
  | typeof LIST_STYLE
  | typeof CATEGORY_GRID_LAYOUT
  | typeof OPTION_SELECTOR
  | typeof DESCRIPTION_DISPLAY
  | typeof TERM_SELECTOR
  | typeof TAXES_DISPLAY
  | typeof EDITABILITY
  | typeof GATEWAY_CAP
  | typeof BREADCRUMBS
  | typeof ICON_VARIANT
  | typeof DIVIDER_STYLE
  | typeof OPTION_GROUP_SPACING;

export interface UIPropertyDefinition {
  type?: ValueType;
  default?: string;
  contexts: UIContext[];
  scopes: UIScope[];
  locked?: Partial<Record<UIContext, string>>;
}

export interface DataPropertyDefinition {
  default: string | boolean | Benefit[] | undefined;
  contexts: UIContext[];
  scopes: UIScope[];
}

export type UIDefinitions = Record<keyof UISchema, UIPropertyDefinition>;

export type DataDefinitions = Record<keyof DataSchema, DataPropertyDefinition>;

/**
 * Configuration for a product bundle item.
 * Used in `@data.productsToBundle` to define products that should be automatically added.
 */
export interface ProductBundleConfig {
  /** The product ID to bundle */
  object_id: string;
  /** The type of object being bundled (typically "product") */
  object_type: "product" | string;
  /** Whether this bundle item is active */
  active: boolean;
  /** Product configuration to apply when adding the bundle to basket */
  config?: ProductRecommendConfigOptions;
}

/**
 * Configuration for a product recommendation item.
 * Used in `@data.productsToRecommend` to define cross-sell recommendations.
 */
export interface ProductRecommendConfig {
  /** Optional unique identifier for this recommendation (auto-generated if not provided) */
  id?: string;
  /** The product ID to recommend */
  object_id: string;
  /** The type of object being recommended (typically "product") */
  object_type: "product" | string;
  /** Whether this recommendation is active */
  active: boolean;
  /** Optional display order for sorting recommendations */
  order?: number;
  /** Optional display label to override the product's default (e.g. "Add & claim 2 free meetings") */
  label?: string;
  /** Optional name override for the recommendation */
  name?: string;
  /** Optional description override for the recommendation */
  description?: string;
  /** Optional short description override for the recommendation */
  short_description?: string | null;
  /** Optional image URL override for the recommendation */
  image_url?: string;
  /** Optional badge to display with the recommendation */
  badge?: Badge;
  /** Optional benefits to display with the recommendation */
  benefits?: Benefit[];
  /** Product configuration to apply when adding the recommendation to basket */
  config?: ProductRecommendConfigOptions;
}

/**
 * Configuration options for a product recommendation.
 * Defines quantity, billing cycle, subproducts, provision fields, and coupons.
 */
export interface ProductRecommendConfigOptions {
  /** Quantity to add */
  qty?: number;
  /** Billing cycle in months */
  bcm?: number;
  /** Sub-product IDs (may be array, string, or CSV) */
  sub_pids?: string | string[];
  /** Provision field values */
  pfields?: Record<string, any> | any[];
  /** Coupon codes to apply */
  coupons?: string[];
}
