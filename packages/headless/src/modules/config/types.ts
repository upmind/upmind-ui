import type { InjectionKey, MaybeRefOrGetter, UnwrapNestedRefs } from "vue";
import type {
  UIMetaSchema as UISchema,
  UI_META_DEFINITIONS,
  DataSchema
} from "./schema";
import type { IProduct, IBasket } from "@upmind-automation/types";
import type { BasketProduct } from "../basketProduct/types";
import { UIContext, UIScope } from "./schema";
import { type BrandMeta } from "../brand/types";
import { HELPERS } from "./utils";

// -----------------------------------------------------------------------------
// Conditional Rules Types & Enums
// -----------------------------------------------------------------------------

export enum ProductStateKey {
  TRIAL_DAYS = "product.trial_days",
  TERM_COUNT = "product.term_count",
  OPTION_COUNT = "product.option_count",
  BCM = "product.bcm"
}

export enum BasketProductStateKey {
  SUB_PIDS = "basketProduct.sub_pids",
  BCM = "basketProduct.bcm",
  QTY = "basketProduct.qty",
  TOTAL = "basketProduct.total"
}

export enum BasketStateKey {
  COUPONS = "basket.coupons",
  TOTAL = "basket.total",
  ITEM_COUNT = "basket.item_count",
  PIDS = "basket.pids"
}

export type ConditionStateKey =
  | ProductStateKey
  | BasketProductStateKey
  | BasketStateKey;

export enum ScalarOperator {
  EQ = "$eq",
  NE = "$ne",
  GT = "$gt",
  GTE = "$gte",
  LT = "$lt",
  LTE = "$lte",
  IN = "$in",
  NIN = "$nin"
}

export enum ArrayOperator {
  CONTAINS = "$contains",
  CONTAINS_ANY = "$contains_any",
  EXCLUDES = "$excludes",
  EMPTY = "$empty"
}

export type ComparisonOperator = ScalarOperator | ArrayOperator;

export type OperatorExpression = {
  [K in ComparisonOperator]?: unknown;
};

export type RuleCondition = {
  [K in ConditionStateKey]?: OperatorExpression;
};

export type Rule<T> = {
  when?: RuleCondition;
  then: T;
};

export type ConditionalValue<T> = {
  default: T;
  rules: Rule<T>[];
};

export type SettingValue<T> = T | ConditionalValue<T>;

export type ConditionState = Partial<
  Record<ConditionStateKey, string | number | boolean | string[]>
>;

export type ValidationSeverity = "error" | "warning" | "info";

export type ValidationIssue = {
  code: string;
  severity: ValidationSeverity;
  message: string;
  path: string;
};

export type ValidationResult = {
  issues: ValidationIssue[];
};

export type ConditionStateInputs = {
  product?: IProduct;
  basketProduct?: BasketProductInput;
  basket?: IBasket;
};

// --- Basic Types ---
export const CONFIG_KEY: InjectionKey<UseMetaResult> = Symbol("MODULE.CONFIG");

export type Viewport = "sm" | "md" | "lg";
export const VIEWPORT_ORDER: Viewport[] = ["sm", "md", "lg"];

export type RawMeta = Record<string, unknown>;

// --- Raw Input Types (from API/external sources) ---

export type CategoryInput = {
  uiMeta?: RawMeta;
};

export type ProductInput = {
  productDetails?: { uiMeta?: Record<string, any> };
  [key: string]: any;
};

/** Basket product input — parsed `BasketProduct` shape; index signature tolerates raw `IBasketProduct` extras. */
export type BasketProductInput = Partial<BasketProduct> & {
  [key: string]: any;
};

export type OptionInput = Record<string, any>;

// --- Engine Types (used by meta resolution) ---

/** Scope cascade order: highest → lowest priority */
export const SCOPE_ORDER = [
  UIScope.OPTION,
  UIScope.OPTION_CATEGORY,
  UIScope.PRODUCT,
  UIScope.PRODUCT_CATEGORY,
  UIScope.BRAND
] as const;

/** Definition for a single meta property (from schema) */
export type PropertyDefinition = {
  type?: Record<string, string>;
  default: unknown;
  contexts: UIContext[];
  scopes: UIScope[];
  locked?: Partial<Record<UIContext, unknown>>;
};

export const META_PREFIX = {
  CONTEXT: "@context",
  DATA: "@data"
} as const;
export type MetaPrefix = (typeof META_PREFIX)[keyof typeof META_PREFIX];

/**
 * Holds meta values at each scope level for resolution.
 *
 * Partial<T> - each scope only sets a few properties, not the full schema.
 * e.g., brand sets { gridLayout: "3-col" }, product sets { taxesDisplay: "hidden" }
 *
 * Generic T - provides type safety for different schemas:
 * - ScopeItems<UISchema> for UI properties (typed as MetaItems)
 * - ScopeItems<DataSchema> for data properties (typed as DataItems)
 * - ScopeItems (untyped) for internal engine functions
 */
export interface ScopeItems<T = Record<string, unknown>> {
  context?: UIContext;
  brand?: Partial<T>;
  category?: Partial<T>;
  product?: Partial<T>;
  optionGroup?: Partial<T>;
  option?: Partial<T>;
}

/** For UI property resolution (getUIProperty) */
export type MetaItems = ScopeItems<UISchema>;
/** For data property resolution (getDataProperty) */
export type DataItems = ScopeItems<DataSchema>;

// --- Proxy Types (reactive proxies returned by composable) ---

/**
 * Extracts the value type enum from a property's definition.
 *
 * Each property in UI_META_DEFINITIONS has a `type` field containing its valid values enum.
 * e.g., gridLayout's definition has { type: GRID_LAYOUT, ... } where GRID_LAYOUT = { "2-col", "3-col", ... }
 *
 * This type looks up the definition for property K and extracts that enum,
 * which is then used to find the matching helper (e.g., GRID_LAYOUT → gridLayout helper).
 */
type DefinitionType<K extends keyof UISchema> =
  (typeof UI_META_DEFINITIONS)[K] extends { type: infer T } ? T : never;

/**
 * Reactive proxy for UI meta properties.
 *
 * Maps each UISchema property to an object with:
 * - `value`: the resolved property value (never undefined, uses default if needed)
 * - Helper methods based on the value type (e.g., isVisible, asNumber)
 *
 * e.g., ui.gridLayout → { value: "3-col", asNumber: 3 }
 *       ui.taxesDisplay → { value: "visible", isConsolidated: false, isVisible: true }
 *
 * `-?` makes all properties required (removes optionality from UISchema).
 */
export type UIMetaProxy = {
  readonly [K in keyof UISchema]-?: {
    value: NonNullable<UISchema[K]>;
  } & TypeToHelper<DefinitionType<K>>;
};

/**
 * Reactive proxy for data meta properties.
 *
 * Unlike UIMetaProxy, data properties are simple types (booleans, strings, objects)
 * without value type enums, so no helpers are needed.
 * e.g., data.catalogueDisabled → false, data.categoryBadge → { label: "Popular" }
 *
 * `-?` makes all properties required (removes optionality from DataSchema).
 */
export type DataProxy = {
  readonly [K in keyof DataSchema]-?: DataSchema[K];
};

// --- Composable Types ---

/** Raw input for meta resolution (before reactive wrapper) */
export interface MetaInput {
  context?: UIContext;
  viewport?: Viewport;
  brand?: RawMeta;
  category?: CategoryInput;
  product?: ProductInput;
  optionGroup?: OptionInput;
  option?: OptionInput;
}

/** Options for useConfig composable (reactive wrappers) */
export interface UseMetaOptions {
  brand?: MaybeRefOrGetter<BrandMeta["cart"]>;
  context?: MaybeRefOrGetter<UIContext | undefined>;
  category?: MaybeRefOrGetter<CategoryInput | undefined>;
  product?: MaybeRefOrGetter<ProductInput | undefined>;
  optionGroup?: MaybeRefOrGetter<any>;
  option?: MaybeRefOrGetter<any>;
  basket?: MaybeRefOrGetter<IBasket | undefined>;
  basketProduct?: MaybeRefOrGetter<BasketProductInput | undefined>;
  provide?: boolean;
}

/**
 * Options for .with() - extends meta with additional scopes.
 *
 * Useful when a parent component has brand/category context,
 * and a child needs to add product/optionGroup/option without prop drilling.
 * Returns a new UseMetaResult that inherits parent scopes.
 */
export interface WithMetaOptions {
  category?: MaybeRefOrGetter<CategoryInput | undefined>;
  product?: MaybeRefOrGetter<ProductInput | undefined>;
  optionGroup?: MaybeRefOrGetter<any>;
  option?: MaybeRefOrGetter<any>;
  basketProduct?: MaybeRefOrGetter<BasketProductInput | undefined>;
}

/** Return type for useConfig composable */
export interface UseMetaResult {
  ui: UIMetaProxy;
  data: DataProxy;
  /**
   * Extend this meta with additional scopes.
   * Returns a new UseMetaResult inheriting all parent scopes plus the new ones.
   * Useful for adding optionGroup/option scopes without prop drilling.
   */
  with: (options: WithMetaOptions) => UseMetaResult;
}

/**
 * Type utilities for extracting helper return types.
 *
 * Given a value type T (e.g., VISIBILITY), we need to get the return type
 * of the corresponding helper's create function (e.g., { isVisible, isHidden }).
 *
 * UnwrapNestedRefs is used because reactive() unwraps computed refs at runtime,
 * so the final type has plain booleans instead of Ref<boolean>.
 */

// Union of all helper definitions in the HELPERS array
type HelperEntry = (typeof HELPERS)[number];

// Find the helper matching type T, then get its create function
type CreateFnFor<T> = Extract<HelperEntry, { type: T }>["create"];

/**
 * Maps a value type T to its helper's return type (unwrapped).
 *
 * How it works:
 * 1. CreateFnFor<T> gets the create function for type T
 * 2. `extends (...args: any[]) => infer R` checks if it's a function and captures return type R
 * 3. UnwrapNestedRefs<R> converts Ref<boolean> → boolean (matching reactive() runtime behavior)
 * 4. Falls back to empty object if no matching helper exists
 *
 * Example: TypeToHelper<VISIBILITY> → { isVisible: boolean; isHidden: boolean }
 */
export type TypeToHelper<T> =
  CreateFnFor<T> extends (...args: any[]) => infer R
    ? UnwrapNestedRefs<R>
    : object;
