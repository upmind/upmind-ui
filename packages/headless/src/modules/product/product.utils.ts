import {
  BrandConfigKeys,
  DefaultPaymentPeriod,
  PriceDisplayTypes,
  PriceType,
  ProductTypes,
  PromotionDisplayTypes,
  ProvisionCategoryCodes,
  PaymentTermDesignations,
  QUERY_PARAMS
} from "@upmind-automation/types";
import { useBrand } from "../brand";
import { UIContext } from "../config";
import { useConfig } from "../config/useConfig";
import { useSystem } from "../system";
import { useI18n } from "../system-localisation";
import { UI_SCHEMA_DEFAULTS } from "./product.types";
import {
  DetailedError,
  ErrorOrigin,
  responseCodes,
  useCalculate,
  useLaravalSchemaParser,
  useTranslateField,
  useTranslateName,
  useImageUrl
} from "../../utils";
import {
  compact,
  concat,
  filter,
  find,
  first,
  flatMap,
  forEach,
  get,
  has,
  isArray,
  isEmpty,
  isEqual,
  isFunction,
  isNil,
  isString,
  map,
  maxBy,
  merge,
  minBy,
  orderBy,
  reduce,
  reverse,
  set,
  some,
  split,
  subtract,
  toNumber,
  toString,
  trim,
  trimStart,
  uniq,
  values
} from "lodash-es";
import type {
  PriceCalculations,
  PriceDetail,
  PriceDisplay,
  PriceEntry,
  Product,
  ProductConfigContext,
  ProductDetails,
  ProductImage,
  TermDetails,
  ProductModel,
  ProductProps,
  SubproductModel,
  SubproductValue,
  PromotionDetails,
  SubproductDetails,
  ProductSummaryDetail,
  ProductSummaryDetailWithPrice,
  SubproductModelValue,
  UIMeta,
  ProductBreadcrumb
} from "./product.types";
import type { BrandMeta } from "../brand/brand.types";
import type { ProductBundleConfig } from "../config";
import type {
  IBasketProduct,
  IImage,
  IProduct,
  IProductAttribute,
  IProductPrice,
  IProductOption,
  IProductCategory
} from "@upmind-automation/types";
import type { ErrorObject } from "ajv";

// -----------------------------------------------------------------------------

/**
 * Normalises sub_pids which may be array, string, or CSV to a string array.
 * Handles arrays that contain CSV strings (e.g. ["id1,id2"]).
 */
export function normaliseSubPids(input?: string | string[]): string[] {
  if (isEmpty(input)) return [];
  if (isArray(input)) return compact(flatMap(input, item => split(item, ",")));
  if (isString(input)) return compact(split(input, ","));
  return [];
}

/**
 * Computes the title for a product based on a template string derived from the product's UiMeta > uischema
 * The template string can contain placeholders in the form of {{key}} which will be replaced with the value of the key from the product
 * Templates may be nested through the product's category hierarchy, with the first template found being used
 * If no template is found or is empty, the fallback title is used
 *
 * @param product The product to compute the title for
 * @param basketProduct The basket product to use for translations
 * @param valueKey The key to extract values from at each level
 * @param fallback The fallback title to use if no template is found
 * @returns The computed title
 */
export function useUischemaTitle(
  product: IProduct,
  {
    basketProduct,
    valueKey,
    fallback
  }: {
    basketProduct?: IBasketProduct;
    valueKey: string;
    fallback: string;
  }
): string {
  const templates = compact(
    uniq(
      iterateParents(product.category, [get(product, valueKey)], {
        valueKey,
        parentKey: "top_category"
      })
    )
  ) as string[];

  if (isEmpty(templates)) return fallback;

  // ---
  const template = first(templates) ?? "";
  const result = template.replace(
    /{{([^{}]+)}}/g,
    (_keyExpr, key) =>
      useTranslateField(basketProduct, key) ??
      useTranslateField(product, key) ??
      ""
  );

  return isEmpty(result) ? fallback : result;
}

/**
 * Computes the name for a product based on the type of product and its translations
 * This allows us to make assumptions on the most appropriate name to use based on the product type
 * eg: for a domain product, we would use the service_identifier as the name where possible
 *
 * @param product The product to compute the name for
 * @param basketProduct The basket product to use for translations
 * @returns The computed name
 *
 */
export function useProductName(
  product: IProduct,
  basketProduct?: IBasketProduct
): string {
  const name = useTranslateName(product);

  if (!basketProduct?.service_identifier) return name;

  // individual product types may have different naming conventions
  switch (basketProduct?.product.provision_blueprint?.category?.code) {
    case ProvisionCategoryCodes.DOMAIN_NAMES:
      return basketProduct?.service_identifier;

    case ProvisionCategoryCodes.SHARED_HOSTING:
    case ProvisionCategoryCodes.AUTO_LOGIN:
    case ProvisionCategoryCodes.SEO:
    case ProvisionCategoryCodes.WEBSITE_BUILDERS:
    case ProvisionCategoryCodes.SOFTWARE_LICENSES:
    case ProvisionCategoryCodes.SERVERS:
    default:
      return trim(`${name} (${basketProduct.service_identifier})`);
  }
}

/**
 * This function determines the price display type for a product based on a hierarchy of settings
 * 1. It first checks for a price display type set in the product's category hierarchy (meta.uischema.price_display_type)
 * 2. If not found, it checks for a product-specific override based on the product's provision blueprint code
 * 3. If still not found, it falls back to a brand-wide default price display type from the brand configuration
 * @param product
 * @param category
 * @returns
 */
function getPriceDisplayType(raw: IProduct): PriceDisplayTypes | undefined {
  const { getConfigValue } = useBrand();

  const brandDisplayType = getConfigValue<PriceDisplayTypes>(
    BrandConfigKeys.PRICE_DISPLAY_TYPE
  );

  const meta = parseMeta(raw?.meta ?? {}, raw.category);
  const configDisplayType = get(meta, "uischema.price_display_type");
  // ----

  let productDisplayType = undefined;
  // individual product types may have different naming conventions
  switch (raw.provision_blueprint?.category?.code) {
    case ProvisionCategoryCodes.DOMAIN_NAMES:
      productDisplayType ??= PriceDisplayTypes.CYCLE;
      break;

    case ProvisionCategoryCodes.SHARED_HOSTING:
    case ProvisionCategoryCodes.AUTO_LOGIN:
    case ProvisionCategoryCodes.SEO:
    case ProvisionCategoryCodes.WEBSITE_BUILDERS:
    case ProvisionCategoryCodes.SOFTWARE_LICENSES:
    case ProvisionCategoryCodes.SERVERS:
    default:
      productDisplayType ??= undefined;
      break;
  }

  return configDisplayType ?? productDisplayType ?? brandDisplayType;
}

/**
 * Recursively merges values from a property in a nested object hierarchy
 * @param item The current object in the hierarchy
 * @param result The array to collect values into
 * @param valueKey The key to extract values from at each level
 * @param parentKey The key to navigate to the parent object
 * @param initialValue Optional initial value to merge with collected values
 * @returns Merged values from all levels of the hierarchy, with lower levels and then initial value taking priority
 */
export function iterateParents(
  item: any,
  result: any[],
  {
    valueKey,
    parentKey,
    transform
  }: {
    valueKey: string;
    parentKey: string;
    transform?: (value: any) => any;
  }
): unknown[] {
  if (!item) return result;
  const parsed = isFunction(transform) ? transform(item) : get(item, valueKey);
  result.push(parsed);

  let parents = get(item, parentKey);
  if (isEmpty(parents)) return result;

  if (!isArray(parents)) parents = [parents];

  const nested = flatMap(parents, parent =>
    iterateParents(parent, [], {
      valueKey,
      parentKey,
      transform
    })
  );
  result.push(...nested);

  return result;
}

export function checkPriceOverride(
  values: SubproductModel,
  lookups: SubproductDetails[]
) {
  return some(values, (value, key) => {
    const item = find(lookups, ["id", key]);
    // make sure we only apply this IF this value is actually selected, ie has a value and is not empty
    return !isEmpty(value) && !!item?.meta?.overrides;
  });
}

/**
 * Build a flat PriceEntry[] from the lookups.prices breakdown for sending to
 * cart/calculate. When `overrides` is true the term price is excluded (the
 * options have already taken its place).
 *
 * Arrays always route to sum-mode in useCalculate (DD-4), so a bare list of
 * numbers is the correct shape — no quantity-1 wrapping needed.
 */
export function buildPriceEntries(
  prices: PriceCalculations,
  overrides: boolean
): PriceEntry[] {
  return filter(
    concat(overrides ? [] : prices?.term, prices?.attributes, prices?.options),
    value => !isNil(value)
  ) as PriceEntry[];
}

// -----------------------------------------------------------------------------

export const calculateBillingTerm = (
  period: DefaultPaymentPeriod | undefined,
  available: TermDetails[]
): TermDetails => {
  const { t } = useI18n();

  // because we have multiple options, we need to select one base don the following strategy:

  if (isEmpty(available))
    throw new DetailedError(
      t("error.terms_not_available"),
      responseCodes.Not_Found,
      ErrorOrigin.Headless
    );

  const { defaultPaymentPeriod } = useBrand();

  // Shortest billing cycle wins when prices tie: pre-sort ascending by cycle so
  // the min/max-By selectors (which return the first match in array order) and
  // the brand-inherit recursion all break ties toward the shortest period.
  available = orderBy(available, "cycle", "asc");

  let term;

  switch (period) {
    case DefaultPaymentPeriod.HIGHEST_PRICE:
      term = maxBy(available, "price.currentAmount");
      break;

    case DefaultPaymentPeriod.LOWEST_PRICE:
      term = minBy(available, "price.currentAmount");
      break;

    case DefaultPaymentPeriod.LOWEST_MONTHLY_PRICE:
      term = minBy(available, "price.monthlyFromCurrentAmount");
      break;

    case DefaultPaymentPeriod.INHERIT_FROM_BRAND:
    default:
      term = calculateBillingTerm(defaultPaymentPeriod.value, available);
      break;
  }
  term ??= first(available);

  if (isEmpty(term))
    throw new DetailedError(
      t("error.terms_not_available"),
      responseCodes.Not_Found,
      ErrorOrigin.Headless
    );

  return term;
};

export function parseQuantity(
  quantity: number,
  product?: ProductDetails
): number {
  quantity = toNumber(quantity) || 1; // ensure we have a number;

  // Check the product data is available
  // Check the quantity is valid,
  //  - min Quantity matches the product min
  //  - max Quantity matches the product max
  //  - quantity is a multiple of the product step
  // ensure the quantity is at least the min, or 1

  if (quantity < Math.max(product?.min ?? 1, 1)) {
    quantity = Math.max(product?.min ?? 1, 1);
  }

  // ensure the quantity is at most the max (if set)
  if (product?.max && quantity > product?.max) {
    quantity = product?.max;
  }

  // ensure the quantity is a multiple of the step (if set)
  if (product?.step && quantity % product?.step !== 0) {
    quantity = Math.ceil(quantity / product.step) * product.step;
  }

  return quantity;
}

/**
 * Resolves the trial state: force-enables when required, preserves existing selection.
 * Default value is handled by the schema.
 */
export function parseTrial(
  value: boolean | undefined,
  product?: ProductDetails
): boolean | undefined {
  return product?.trialForce || value;
}

export function parseTerm(
  { lookups }: ProductConfigContext,
  value?: ProductModel["term"],
  quantity?: ProductModel["quantity"]
): { term: ProductModel["term"]; price: PriceCalculations["term"] } {
  const { pushPrice } = useCalculate();
  const price: PriceCalculations["term"] = [];
  const terms = lookups?.terms ?? [];

  // Resolve the requested term, enforcing the default when the requested cycle
  // isn't available — e.g. an out-of-range `?bcm=` URL param. Mirrors the
  // schema's default (calculateBillingTerm) so an invalid value falls back to
  // the default instead of leaving no term selected (FE-2676).
  const fallback = isEmpty(terms)
    ? undefined
    : terms.length === 1
      ? first(terms)
      : calculateBillingTerm(lookups?.product?.defaultPaymentPeriod, terms);
  const term = find(terms, ["cycle", value]) ?? fallback;

  // set price values, taking into account the quantity and unit quantity
  // NB: we NEVER add, we always push into an array for the backend to handle
  pushPrice(price, term?.price?.currentAmount ?? 0, quantity ?? 0);
  return { term: get(term, "cycle") as number, price };
}

// -----------------------------------------------------------------------------
// GOTCHA: Merge and enrich basket product subproducts into lookups
// -----------------------------------------------------------------------------
// 1. Hidden-in-catalog options (hide_catalog: true) won't appear in product
//    lookup data but exist in rawBasketProduct - we add them.
// 2. Options with empty prices in API but present in basket - we enrich them
//    with pricing from basket data.
// -----------------------------------------------------------------------------
/**
 * Maps a basket item to an IProductPrice-compatible object.
 * This allows hidden/restricted items to flow through the normal pricing pipeline.
 *
 * @see parsePrice() for how these fields are consumed
 */
function mapHiddenSubproductPrice(basketItem: IBasketProduct): IProductPrice {
  const { includesTax } = useBrand();
  const isOverridden = basketItem.price_type === PriceType.MANUAL;

  return {
    billing_cycle_months: basketItem.billing_cycle_months,
    currency_id: basketItem.base_price_currency_id,
    // Regular price
    price: includesTax.value
      ? basketItem.configuration_total_amount_converted
      : basketItem.configuration_net_amount_converted,
    price_formatted: includesTax.value
      ? basketItem.configuration_total_amount_formatted
      : basketItem.configuration_net_amount_formatted,
    // Discounted price
    price_discounted: includesTax.value
      ? basketItem.configuration_total_discounted_amount_converted
      : basketItem.configuration_net_amount_discounted_converted,
    price_discounted_formatted: includesTax.value
      ? basketItem.configuration_total_discounted_amount_formatted
      : basketItem.configuration_net_amount_discounted_formatted,
    // Original catalog price (before manual override)
    original_price: basketItem.base_price,
    original_price_formatted: basketItem.base_price_formatted,
    // Override flag
    overridden_price: isOverridden
  } as IProductPrice;
}

/**
 * Merges hidden basket subproducts into product lookups.
 *
 * Hidden items (hide_catalog: true) aren't returned by the product API but exist
 * in the basket. This adds them so they appear in the configuration UI.
 */
export function mergeBasketSubproducts(
  productSubproducts: (IProductOption | IProductAttribute)[] | undefined,
  basketSubproducts: IBasketProduct[] | undefined
): (IProductOption | IProductAttribute)[] {
  if (!basketSubproducts?.length) return productSubproducts ?? [];

  // Add hidden items not in product lookups
  const productIds = new Set(map(productSubproducts, "id"));
  const hidden = reduce(
    basketSubproducts,
    (result: (IProductOption | IProductAttribute)[], basketProduct) => {
      if (!productIds.has(basketProduct.product_id) && basketProduct.product) {
        result.push({
          ...basketProduct.product,
          pivot: { order: get(basketProduct.product, "order", 0) },
          prices: [mapHiddenSubproductPrice(basketProduct)]
        } as unknown as IProductOption | IProductAttribute);
      }
      return result;
    },
    []
  );

  return [...(productSubproducts ?? []), ...hidden];
}

/**
 * Checks if a basket product contains any options/attributes that can no longer
 * be ordered (clients_can_order: 0). When true, the product should be readonly.
 */
export function hasNonOrderableSubproducts(
  rawBasketProduct: IBasketProduct | undefined
): boolean {
  if (!rawBasketProduct) return false;

  const subproducts = concat(
    rawBasketProduct.options ?? [],
    rawBasketProduct.attributes ?? []
  );
  return some(subproducts, ["product.clients_can_order", 0]);
}

export function parseSubproducts(
  type: "attributes" | "options",
  { lookups, model, subproducts: subproductIds }: Partial<ProductConfigContext>,
  values: ProductModel["attributes"] | ProductModel["options"],
  quantity?: ProductModel["quantity"]
): {
  subproducts?: ProductModel["attributes"] | ProductModel["options"];
  price: PriceCalculations["attributes"] | PriceCalculations["options"];
} {
  const { pushPrice } = useCalculate();
  let subproducts: SubproductModel = {};
  const price: any[] = [];
  // ---
  // safety check, resolve if we have no attributes to check
  if (!lookups?.[type]?.length) return { subproducts, price };

  subproducts = reduce(
    lookups[type],
    (result, subproduct: SubproductDetails) => {
      // NB dont create an empty object here as it will break defautls being applied. only init the object when needed for an actual value
      let selected: Record<string, SubproductModelValue> | undefined = get(
        values,
        subproduct.id
      );

      // try set any matching pre-selected values for this subproduct ( subproductIds ),
      // NB: ONLY when values is being set for the first time
      if (isEmpty(values)) {
        forEach(subproductIds, pid => {
          if (some(subproduct.values, ["id", pid])) {
            selected ??= {};
            set(selected, pid, { productId: pid });
          }
        });
      }

      // if we have selected values, ensure they are valid and fully formed
      if (!isEmpty(selected)) {
        // only include valid values, stripping out any invalid ones, if we have any
        // selected = pickBy(selected, (_value, id) =>
        //   some(subproduct.values, ["id", id])
        // );

        // then parse each selected value, and ensure it has all its required and VALID values
        selected = reduce(
          selected,
          (
            result: Record<string, SubproductModelValue>,
            value: SubproductModelValue,
            id: string
          ) => {
            const product = find(subproduct.values, ["id", value.productId]);

            // safety check, ensure we have a valid product otherwise bail
            if (isEmpty(product)) return result;

            // Check if the product has pricing for the selected term
            // Do not filter out products with cycle 0 (one-time purchases)
            // NB: Only check products WITH pricing (aka options)
            if (
              !isEmpty(product.pricing) &&
              !some(product.pricing, ["cycle", model?.term]) &&
              !some(product.pricing, ["cycle", 0])
            )
              return result;

            // ensure we have a valid unit_quantity
            value.quantity = parseQuantity(Number(value.quantity), product);

            // ensure we map the product cycle to the value of the term ( if set ), but only if this is a recurring product
            // ie: if the cycle is 0, then we use the product cycle, otherwise we use the model term, fallbacking to the preferred product cycle
            value.cycle =
              product.cycle == 0
                ? product.cycle
                : (model?.term ?? product.cycle);

            set(result, id, value);

            // if we have a price, set price values, taking into account the quantity and unit quantity
            // NB: we NEVER add, we always push into an array for the backend to handle
            if (!isEmpty(product?.price)) {
              pushPrice(
                price,
                product?.price?.currentAmount ?? 0,
                value.quantity * (quantity ?? 1)
              );
            }

            // ---
            return result;
          },
          {}
        );
      }

      // --- only store non-empty selections; absent keys get defaults via AJV
      set(result, subproduct.id, selected);

      return result;
    },
    {}
  );

  return { subproducts, price };
}

export const parseProductDetails = (
  rawProduct: IProduct,
  rawBasketProduct?: IBasketProduct
): ProductDetails => {
  const readonly = hasNonOrderableSubproducts(rawBasketProduct);
  return {
    id: rawProduct?.id,
    name: rawProduct.name,
    serviceIdentifier: rawBasketProduct?.service_identifier || undefined,
    title: useUischemaTitle(rawProduct, {
      basketProduct: rawBasketProduct,
      valueKey: "meta.uischema.title",
      fallback: useProductName(rawProduct, rawBasketProduct)
    }),
    brand: useTranslateName(rawProduct?.brand),
    blueprintCode: rawProduct?.provision_blueprint?.category?.code,
    categoryId: rawProduct?.category_id,
    category: useTranslateName(rawProduct?.category),
    categories: reverse(
      iterateParents(rawProduct.category, [], {
        valueKey: "name",
        parentKey: "top_category",
        transform: useTranslateName
      })
    ) as string[],
    breadcrumb: iterateParents(rawProduct.category, [], {
      valueKey: "name",
      parentKey: "top_category",
      transform: (category: IProductCategory) => {
        return {
          id: category.id,
          label: useTranslateName(category)
        } as ProductBreadcrumb;
      }
    }) as ProductBreadcrumb[],
    // ---
    cycle: rawProduct?.billing_cycle_months, // TODO check: cycle: rawProduct?.display_price_billing_cycle_months ?? rawProduct?.billing_cycle_months,
    defaultPaymentPeriod: rawProduct?.default_payment_period,
    displayPrice: find(parseTermDetails(rawProduct), [
      "cycle",
      rawProduct.display_price_billing_cycle_months
    ]),
    // ---
    description: useTranslateField(rawProduct, "description"),
    excerpt: useTranslateField(rawProduct, "short_description"),
    imgUrl: useImageUrl(rawProduct?.image?.full_url, "400x400"),
    iconUrl: useImageUrl(rawProduct?.icon?.full_url),
    images: parseProductImages(rawProduct?.images),
    // ---
    configurable:
      !readonly &&
      (rawProduct.prices?.length > 1 ||
        !isEmpty(rawProduct.products_attributes) ||
        !isEmpty(rawProduct.products_options) ||
        !isEmpty(rawProduct.provision_fields)),
    configurableTerm: !readonly && rawProduct.prices?.length > 1,
    configurableSubproducts:
      !readonly &&
      (!isEmpty(rawProduct.products_options) ||
        !isEmpty(rawProduct.products_attributes)),
    configurableProvisionFields:
      !readonly && !isEmpty(rawProduct.provision_fields),

    configurableInline:
      !readonly &&
      (() => {
        const config = useConfig();
        return (
          some(rawProduct.products_options, option => {
            const { data } = config.with({
              product: () => ({ productDetails: { uiMeta: rawProduct.meta } }),
              option: () => ({ uiMeta: option.meta })
            });
            return !!data.optionUpsellEnabled;
          }) ||
          some(rawProduct.products_attributes, attr => {
            const { data } = config.with({
              product: () => ({ productDetails: { uiMeta: rawProduct.meta } }),
              option: () => ({ uiMeta: attr.meta })
            });
            return !!data.optionUpsellEnabled;
          })
        );
      })(),

    quantity: rawProduct?.min_order_quantity || rawProduct?.unit_quantity || 1,
    quantifiable: !readonly && rawProduct?.order_type == 2,
    step: rawProduct?.unit_quantity || 1,
    min: rawProduct?.min_order_quantity || rawProduct?.unit_quantity || 1,
    max:
      rawProduct?.max_order_quantity > 0
        ? rawProduct?.max_order_quantity
        : Infinity,
    // ---
    uiMeta: parseMeta(
      rawProduct?.meta ?? {},
      rawProduct?.category as IProductCategory,
      (rawProduct?.brand?.meta as BrandMeta)?.cart?.ui ?? {}
    ),
    uiCategoryMeta: rawProduct?.category?.meta || undefined,
    // --- trial
    trialSupported: !!rawProduct?.trial_supported,
    trialDuration: rawProduct?.trial_duration,
    trialForce: !!rawProduct?.trial_force,
    trialEndAction: rawProduct?.trial_end_action,
    // --- locked
    readonly
  };
};

export const parseMeta = (
  productMeta?: UIMeta,
  category?: IProductCategory,
  brandMeta?: UIMeta
): Record<string, any> => {
  productMeta ??= {};
  brandMeta ??= {};

  const categoryMeta = iterateParents(category, [], {
    valueKey: "meta",
    parentKey: "top_category"
  });

  // Priority order: brand (lowest) → categories → product (highest)
  // Start with brand meta, then merge each category meta, then product meta
  let result = merge({}, brandMeta);

  result = reduce(
    categoryMeta,
    (result, categoryMetaItem) => {
      return merge({}, result, categoryMetaItem);
    },
    result
  );

  // Product meta has highest priority, so merge it last
  result = merge({}, result, productMeta);

  // Apply defaults if no value is provided
  if (result.uischema) {
    result.uischema = merge({}, UI_SCHEMA_DEFAULTS, result.uischema);
  }

  return result;
};

export const parseTermDetails = (
  raw: IProduct,
  currencyIdOrOverride?: string | boolean
): TermDetails[] => {
  const currencyId =
    typeof currencyIdOrOverride === "string" ? currencyIdOrOverride : undefined;
  const priceOptionOverride =
    typeof currencyIdOrOverride === "boolean"
      ? currencyIdOrOverride
      : undefined;

  const prices = currencyId
    ? filter(raw?.prices, { currency_id: currencyId })
    : raw?.prices;

  return map(orderBy(prices, "billing_cycle_months"), rawTerm => {
    const details: TermDetails = parseSummaryDetailWithPrice(rawTerm, raw);

    details.meta.custom = details.meta.custom && !priceOptionOverride;

    details.price.monthlyFromCurrentAmount =
      rawTerm.monthly_price_from_discounted ?? rawTerm.monthly_price_from;
    details.price.monthlyFromCurrentPrice =
      rawTerm.monthly_price_from_discounted_formatted ??
      rawTerm.monthly_price_from_formatted;
    details.price.monthlyFromRegularAmount = rawTerm.monthly_price_from;
    details.price.monthlyFromRegularPrice =
      rawTerm.monthly_price_from_formatted;

    return details;
  });
};

export const parseSubproductDetails = (
  data?: (IProductAttribute | IProductOption)[],
  cycle?: number,
  currencyId?: string
): SubproductDetails[] => {
  const { includesTax } = useBrand();

  // safety check, bail if we have no data
  if (isEmpty(data)) return [];
  // When getting the attributes from the API, we get a flat list of attributes
  // We would rather have the attributes grouped by their category
  // And with each category having a list of attributes
  // so to do this we have to do the following:

  // 0. sort the data by `pivot.order` (the canonical sort field on
  // IProductOption / IProductAttribute) so downstream `first(values)`
  // picks the same default the configurator and add-to-basket flows would.
  const sorted = orderBy(data, "pivot.order");

  // then reduce the sorted data, creating a new object keyed by the category id
  // with the parsed data as the values
  const options: Record<string, SubproductDetails> = reduce(
    sorted,
    (result, rawSubproduct) => {
      // create the option based on the category ... if it isnt already set
      const option: SubproductDetails = get(result, rawSubproduct.category_id, {
        id: rawSubproduct.category.id,
        name: rawSubproduct.category.name,
        title: useTranslateName(rawSubproduct.category),
        description: useTranslateField(rawSubproduct.category, "description"),
        excerpt: useTranslateField(rawSubproduct.category, "short_description"),
        uiCategorymeta: rawSubproduct?.category.meta,
        uiMeta: parseMeta(
          {},
          rawSubproduct?.category as IProductCategory,
          (rawSubproduct?.brand?.meta as BrandMeta)?.cart?.ui
        ),
        uiCategoryMeta: rawSubproduct?.category?.meta || undefined,
        meta: {
          multiple: rawSubproduct.category.multiple,
          required: rawSubproduct.category.required,
          overrides: rawSubproduct.category.price_override
        }
      });

      // filter prices by currency if provided (eg basket products have a known currency)
      const prices = currencyId
        ? filter(rawSubproduct.prices, { currency_id: currencyId })
        : rawSubproduct.prices;

      // check EARLY if we have a price for one of the following:
      //  * no billing cycle set
      //  * a one off price
      //  * a matching billing cycle

      const valid =
        isNil(cycle) ||
        rawSubproduct.billing_cycle_months == 0 ||
        some(prices, ["billing_cycle_months", cycle]);

      // bail if the value is not valid, ie has no price that matches the current billing cycle
      if (!valid) return result;

      // get the prev values...if there are any
      const values: SubproductValue[] = get(option, "values", []);

      // ---
      const pricing: ProductSummaryDetailWithPrice[] = map(prices, rawPrice =>
        parseSummaryDetailWithPrice(
          rawPrice,
          rawSubproduct,
          rawSubproduct.category.price_override
        )
      );

      const price =
        find(pricing, ["cycle", 0]) || find(pricing, ["cycle", cycle]);

      const productDetails = parseProductDetails(rawSubproduct);
      const value: SubproductValue = {
        ...productDetails,
        uiMeta: rawSubproduct?.meta ?? {},
        cycle: price?.cycle ?? productDetails.cycle,
        price: price?.price,
        pricing: pricing,
        promotions: price?.promotions,
        meta: {
          oneoff: !!price?.meta.oneoff,
          discounted: !!price?.meta?.discounted,
          includesTax: includesTax.value,
          free: price?.price?.currentAmount == 0,
          overrides: !!price?.meta.overrides,
          custom: price?.meta.custom,
          default: !!rawSubproduct?.pivot?.default
        },
        order: rawSubproduct?.pivot?.order ?? 0
      };
      // ---
      values.push(value as SubproductValue);
      set(option, "values", orderBy(values, "order"));

      // finally  set the updated option
      set(result, rawSubproduct.category_id, option);
      return result;
    },
    {}
  );

  // return just the values of the reduced object.
  return values(options);
};

export const parseSummaryDetail = (
  raw: IProductPrice,
  rawProduct: IProduct,
  overrides?: boolean
): ProductSummaryDetailWithPrice => {
  const { getBillingCycle } = useSystem();
  const { includesTax, getConfigValue: _getConfigValue } = useBrand();

  const cycle = getBillingCycle(raw.billing_cycle_months);

  const discounted =
    !raw.overridden_price &&
    !isNil(raw.price_discounted) &&
    raw.price !== raw.price_discounted;

  const displayType = getPriceDisplayType(rawProduct);

  // NB: Context for displaying price as "/month" vs "/cycle":
  // There are multiple brand settings that affect how prices are shown:
  // - "lowest_monthly_price" and "abs_min": Both indicate that the price should be displayed as a monthly amount (e.g., "$5/month").
  // - "min": Indicates that the price should be shown for the actual billing cycle (e.g., "$60/year" for a yearly cycle).
  //
  // Historically, we only had two options: show the regular cycle price, or show the lowest monthly price (by dividing the highest term price by its months).
  // However, sometimes the lowest monthly price is not from the longest term, so we introduced "lowest_monthly_term" to calculate the true lowest monthly price.
  //
  // In summary:
  // - Use "/month" display for "lowest_monthly_price" and "abs_min" settings.
  // - Use "/cycle" display for "min" setting.
  // - "lowest_monthly_term" ensures the actual lowest monthly price is shown, regardless of term length.
  // This logic ensures price display is consistent with brand configuration and user expectations.
  const useMonthlyFromPrice =
    (cycle?.months ?? 0) > 1 && displayType !== PriceDisplayTypes.CYCLE;

  return {
    cycle: raw.billing_cycle_months,
    title: cycle ? useTranslateName(cycle) : useTranslateName(raw),
    name: cycle?.name,
    promotions: parsePromotionDetails(raw),
    meta: {
      oneoff: raw.billing_cycle_months == 0,
      mixed: raw.mixed_promotions,
      discounted,
      includesTax: includesTax.value,
      free: (raw.price_discounted ?? raw.price) == 0,
      freeTrial: !!rawProduct?.trial_supported,
      overrides: !!overrides,
      custom: !!raw.overridden_price,
      useMonthlyFromPrice
    }
  } as ProductSummaryDetailWithPrice;
};

export const parsePrice = (raw: IProductPrice): PriceDetail => {
  //  TODO: currently IProductPrice does not provide nett/gross values, only the brand setting
  // When a price is manually overridden, promotions don't apply — ignore price_discounted entirely.
  const discounted =
    !raw.overridden_price &&
    !isNil(raw.price_discounted) &&
    raw.price !== raw.price_discounted;

  const savingAmount = discounted
    ? Math.round(subtract(raw.price, raw.price_discounted!) * 100) / 100
    : 0;

  // When a price has been manually overridden, `price` is the custom amount
  // and `original_price` is the pre-override pricelist price.
  const regularAmount = raw.overridden_price
    ? (raw.original_price ?? raw.price)
    : raw.price;
  const regularPrice = raw.overridden_price
    ? (raw.original_price_formatted ?? raw.price_formatted ?? "")
    : (raw.price_formatted ?? "");

  return {
    currentAmount: discounted ? (raw.price_discounted ?? raw.price) : raw.price,
    currentPrice: discounted
      ? (raw.price_discounted_formatted ?? raw.price_formatted ?? "")
      : (raw.price_formatted ?? ""),
    regularAmount,
    regularPrice,
    savingAmount,
    savingPrice: "", //TODO: missing formatted value
    savingPercent: discounted
      ? `${Math.round((savingAmount / raw.price) * 100)}%`
      : ""
  };
};

/**
 * Parses a raw product price into a ProductSummaryDetailWithPrice.
 *
 * **⚠️ FE-1698 lazy `useSystem`:** This function calls `getBillingCycle()`
 * synchronously. The caller's machine `load` service (or upstream composable
 * like `useBasket`) MUST `await ensureBillingCycles()` before this runs,
 * otherwise the cycle label will be `undefined`. See
 * `system/docs/gotchas.md#1` for the pattern.
 */
export const parseSummaryDetailWithPrice = (
  raw: IProductPrice,
  rawProduct: IProduct,
  overrides?: boolean
): ProductSummaryDetailWithPrice => {
  const result: ProductSummaryDetailWithPrice = parseSummaryDetail(
    raw,
    rawProduct,
    overrides
  );
  result.price = parsePrice(raw);
  return result;
};

export const parsePromotionDetails = (
  raw: IProductPrice
): PromotionDetails[] => {
  //  Promotions can be display in one of 3 ways:
  //  - As a generic summary label with no values, eg "SAVE"
  //  - As a summary percentage, eg "Save 20%"
  //  - As individual names, eg ["20% off", "Black Friday"]
  // NB: we always supply the amounts so we can show meta data if needed, eg a tooltip
  // ---
  const { getConfig } = useBrand();

  const promotionDisplayType: PromotionDisplayTypes = get(
    getConfig(BrandConfigKeys.SHOW_PROMOTION_AS),
    BrandConfigKeys.SHOW_PROMOTION_AS,
    PromotionDisplayTypes.PERCENTAGE
  );

  if (isEmpty(raw?.promotions)) return [];

  // ---

  if (promotionDisplayType == PromotionDisplayTypes.NAME) {
    return reduce(
      raw.promotions,
      (acc: PromotionDetails[], rawPromo) => {
        if (rawPromo?.hidden) return acc;

        acc.push({
          id: rawPromo.id,
          code: rawPromo.code,
          name: rawPromo.name,
          title: useTranslateName(rawPromo),
          description: useTranslateField(rawPromo, "description"),
          excerpt: useTranslateField(rawPromo, "short_description"),
          meta: {
            display: promotionDisplayType,
            mixed: !!raw.mixed_promotions,
            discounted: !isEmpty(rawPromo.amount)
          },
          price: {
            savingAmount: toNumber(rawPromo.amount),
            savingPrice: rawPromo.amount_formatted,
            savingPercent: "" //TODO: missing % value from response
          }
        } as PromotionDetails);

        return acc;
      },
      []
    );
  } else {
    const saving =
      ((raw.price - (raw.price_discounted ?? raw.price)) / raw.price) * 100;
    const saving_formatted = `${Math.round(saving)}%`;

    return [
      {
        code: map(raw.promotions, "code").toString(),
        name: map(raw.promotions, "name").toString(),
        title: map(raw.promotions, useTranslateName).toString(),
        meta: {
          display: promotionDisplayType,
          mixed: !!raw.mixed_promotions,
          discounted: !isNil(raw.price_discounted) && !raw.mixed_promotions
        },
        price: {
          savingAmount:
            isNil(raw.price_discounted) || raw.mixed_promotions ? 0 : saving,
          savingPrice: "", // TODO: misisng formatted value
          savingPercent:
            isNil(raw.price_discounted) || raw.mixed_promotions
              ? ""
              : saving_formatted
        }
      } as PromotionDetails
    ];
  }
};

/**
 * Parses a raw provisioning schema, applying defaults like the user's country.
 *
 * **⚠️ FE-1698 lazy `useSystem`:** This function calls `getCountry()`
 * synchronously. The caller's machine `load` service MUST
 * `await ensureCountries()` before this runs, otherwise the default country
 * will be `undefined`. See `system/docs/gotchas.md#1` for the pattern.
 */
export const parseProvisioningSchema = (
  data: any,
  product: IProduct,
  readonly?: boolean
) => {
  const { getCountry } = useSystem();

  const defaultCountry = getCountry();

  const schema = useLaravalSchemaParser(data, {
    defaultCountry,
    product
  });

  // TODO: Implement a proper solution for this where field type is input_sld
  // if (field.name === "sld") {
  //   //type = "string";
  //   format = "sld";
  //   // TODO: Set the raw TLD rather, not the product name
  //   field.description = product?.name;
  // "The sld may only contain letters, numbers, and dashes"
  // }

  // Set readOnly on each property when product is locked
  if (readonly && schema.properties) {
    forEach(schema.properties, (prop: any) => {
      prop.readOnly = true;
    });
  }

  return schema;
};

export const parseProduct = (
  price: PriceDisplay,
  {
    model,
    lookups,
    error,
    rawBasketProduct: _rawBasketProduct,
    schema
  }: Partial<ProductConfigContext>
): Product => {
  // sanity check
  if (isEmpty(model) || isEmpty(lookups) || !lookups.product)
    return {} as Product;

  const term = find(lookups.terms, ["cycle", model.term]);
  price = !isNil(price?.regularPrice)
    ? price
    : term?.price || {
        currentAmount: 0,
        currentPrice: "",
        regularAmount: 0,
        regularPrice: "",
        savingAmount: 0,
        savingPrice: "",
        savingPercent: ""
      };
  // ---
  // TODO: Dont have the necessary data now to calculate this
  // price.unit: term?.price.unit,
  // price.configuration: {
  //   total: values.total,
  //   totalFormatted: values.total_formatted,
  //   subtotal: values.subtotal,
  //   subtotalFormatted: values.subtotal_formatted,
  //   discount: values.discounted,
  //   discountFormatted: values.discounted_formatted,
  // },

  const summaryDetailWithPrice: ProductSummaryDetailWithPrice = {
    name: "totals",
    title: lookups.product?.title ?? "",
    category: lookups.product?.category ?? "",
    cycle: model.term,
    quantity: model.quantity,
    meta: {
      ...(term?.meta ?? {}),
      free: price.currentAmount == 0,
      discounted:
        price.currentAmount != price.regularAmount && price.regularAmount > 0
    },
    promotions: term?.promotions,
    // ---
    price
  };
  // -------
  // this is an array of  key value pairs that can be used to display a summary of the configuration
  // typically used in the basket or checkout
  // it is in this format to preserve the order of the configuration
  // and allow for easy i18n
  const productDetails: ProductSummaryDetail[] = [
    {
      name: "product",
      title: lookups.product?.title,
      category: lookups.product?.category,
      meta: {}
    },
    {
      name: "category",
      title: lookups.product.category,
      meta: {}
    }
  ];

  const termDetails = parseSummaryTerm(
    model.term ?? 0,
    lookups.terms ?? [],
    error as ErrorObject[]
  );

  const optionDetails = parseSummarySubproduct(
    "option",
    model.options,
    lookups.options,
    error as ErrorObject[]
  );

  const attributeDetail = parseSummarySubproduct(
    "attribute",
    model.attributes,
    lookups.attributes,
    error as ErrorObject[]
  );

  const provisionFieldDetails = parseSummaryProvisionFields(
    model.provisionFields,
    get(schema, "properties.provisionFields"),
    error as ErrorObject[]
  );

  // ---------------------------------------------------------------------------
  return {
    id: rawBasketProduct?.id,
    configuration: model,
    productDetails: lookups.product,
    promotions: term?.promotions,
    meta: summaryDetailWithPrice.meta,
    price,
    pricing: [summaryDetailWithPrice],
    details: compact(
      concat(
        productDetails,
        termDetails,
        optionDetails,
        attributeDetail,
        provisionFieldDetails
      )
    ),
    errors: error as ErrorObject[]
  };
};

const parseSummaryTerm = (
  cycle: number,
  terms: TermDetails[],
  errors?: ErrorObject[]
): TermDetails | undefined => {
  const { t } = useI18n();
  const term = find(terms, ["cycle", cycle]);
  if (term) {
    term.name = "term";
    term.category = t("text.billing_cycle");
    term.meta = {
      ...term.meta,
      invalid: some(errors, e => e?.instancePath?.startsWith("/term"))
    };
    return term;
  }

  return undefined;
};

const parseSummarySubproduct = (
  key: string,
  data: ProductModel["options"],
  lookup?: SubproductDetails[],
  errors?: ErrorObject[]
): (ProductSummaryDetail | ProductSummaryDetailWithPrice)[] => {
  return reduce(
    data,
    (result, choices) => {
      if (choices) {
        const selected = reduce(
          choices,
          (result, choice, id) => {
            const category = find(lookup, {
              values: [{ id }]
            }) as SubproductDetails;

            const subproduct = find(category?.values, {
              id
            }) as SubproductValue;

            if (subproduct) {
              const summary:
                | ProductSummaryDetail
                | ProductSummaryDetailWithPrice = {
                name: key,
                quantity: choice.quantity,
                category: category?.title,
                title: subproduct.title,
                cycle: subproduct.cycle,
                // ---
                meta: {
                  ...subproduct.meta,
                  ...subproduct?.uiMeta,
                  invalid: some(errors, e =>
                    e?.instancePath?.includes(`/${id}`)
                  )
                },
                // ---
                ...(subproduct.price ?? {})
              };

              result.push(summary);
            }

            return result;
          },
          [] as (ProductSummaryDetail | ProductSummaryDetailWithPrice)[] // Provide initial value as an empty array
        );
        result.push(...selected);
      }
      return result;
    },
    [] as (ProductSummaryDetail | ProductSummaryDetailWithPrice)[] // Provide initial value as an empty array
  );
};

const parseSummaryProvisionFields = (
  data: any,
  schema: any,
  errors?: ErrorObject[]
): ProductSummaryDetail[] => {
  return reduce(
    schema?.properties,
    (result: any[], provisionField, key) => {
      let title = get(data, key);
      if (provisionField.oneOf) {
        title = find(provisionField.oneOf, ["const", title])?.title ?? title;
      }
      result.push({
        name: `provision_field.${key}`,
        category: get(provisionField, "title", key),
        title,
        cycle: undefined,
        quantity: undefined,
        currentAmount: undefined,
        currentPrice: undefined,
        regularAmount: undefined,
        regularPrice: undefined,
        meta: {
          invalid: some(errors, e =>
            e?.instancePath?.includes(`/provisionFields/${key}`)
          )
        }
      });
      return result;
    },
    [] as ProductSummaryDetail[]
  );
};

export const parseModel = (data: ProductModel): ProductModel => {
  // if we have subproducts, we need to handle those first and assign them to options/attributes

  // handle  product model
  return {
    quantity: data?.quantity || 1,
    productId: data.productId,
    term: data.term,
    options: data.options,
    attributes: data.attributes,
    provisionFields: data.provisionFields,
    startTrial: data?.startTrial
  };
};

export const parseProductProps = (
  data: ProductProps,
  raw: IProduct,
  preferredCycle?: number // If we have chosen a term then we need to try use that term
): ProductModel => {
  const productDetails = parseProductDetails(raw);
  const terms = parseTermDetails(raw);
  const paymentPeriod = preferredCycle ?? productDetails.defaultPaymentPeriod;
  const defaultTerm = calculateBillingTerm(
    paymentPeriod || raw.default_payment_period,
    terms
  );

  // Subproduct cycles need to map to a real price entry — the option's own
  // `billing_cycle_months` is just a storage default (often 1) and not a
  // price key. Pass the resolved parent term so subproduct cycles can be
  // picked from each option's `prices` array.
  const term = data?.term ?? defaultTerm.cycle;

  // We need to find the  subbproducts id from the product option OR attributes, and then map it to that CategoryID
  const matchedOptions = filter(raw.products_options ?? raw.options, option =>
    data?.subproducts?.includes(option.id)
  ) as IProductOption[];
  const options: SubproductModel = parseSubproductDetailsChoices(
    matchedOptions,
    term
  );

  // The API often returns attributes under `raw.attributes` (mirroring
  // `raw.options`); fall back so we don't silently miss preselections.
  // `attributes` isn't on `IProduct` but the BE sometimes echoes it
  // back as a duplicate of `products_attributes` — a local intersection
  // type narrows the read site without polluting `IProduct`.
  const rawWithAttributeEcho = raw as IProduct & {
    attributes?: IProductAttribute[];
  };
  const rawAttributes =
    rawWithAttributeEcho.products_attributes ??
    rawWithAttributeEcho.attributes ??
    [];
  const matchedAttributes = filter(rawAttributes, attribute =>
    data?.subproducts?.includes(attribute.id)
  ) as IProductAttribute[];

  const attributes: SubproductModel = parseSubproductDetailsChoices(
    matchedAttributes,
    term
  );

  return {
    // id: raw.id,
    quantity: parseQuantity(data.quantity, productDetails),
    productId: data.productId,
    term,
    options: merge({}, options, data?.options),
    attributes: merge({}, attributes, data?.attributes),
    provisionFields: data.provisionFields || {},
    startTrial: data?.startTrial
  };
};

export const parseBasketProductModel = (raw: IBasketProduct): ProductModel => {
  // map basket product raw
  return {
    // id: raw.id,
    quantity: raw.quantity,
    productId: raw.product_id,
    term: raw.billing_cycle_months,
    options: parseBasketSubproductDetailsChoices(raw.options),
    attributes: parseBasketSubproductDetailsChoices(raw.attributes),
    provisionFields: raw.provision_fields,
    startTrial: !!raw?.in_trial
  };
};

const parseSubproductDetailsChoices = (
  values: IProductAttribute[] | IProductOption[],
  parentTerm?: number
): SubproductModel => {
  return reduce(
    values,
    (result: SubproductModel, value) => {
      // -- defensive
      if (!value?.category_id || !value.id) {
        return result;
      }

      // Recurring options inherit the parent product's term; one-time options
      // (cycle 0) stay at 0. Mirrors the rule used in parseSubproducts.
      const _cycle =
        value.billing_cycle_months == 0
          ? 0
          : (parentTerm ?? value.billing_cycle_months);

      set(result, [value.category_id, value.id], {
        productId: value.id,
        quantity: parseQuantity(
          value.unit_quantity,
          parseProductDetails(value)
        ),
        cycle: resolveSubproductCycle(value, parentTerm)
      });
      return result;
    },
    {}
  );
};

/**
 * Resolves the billing cycle to send to the basket for a subproduct.
 *
 * The subproduct entity's own `billing_cycle_months` is just a storage
 * default (often `1` for setup-style options) and rarely matches a real
 * price entry. The basket needs a cycle that maps to a `prices[*]` row,
 * preferably one that aligns with the parent product's selected term.
 *
 * Resolution order:
 *   1. Price entry matching the parent term
 *   2. One-off price (cycle 0)
 *   3. First available price entry
 *   4. Parent term fallback
 *   5. The subproduct's own `billing_cycle_months` (legacy fallback)
 */
const resolveSubproductCycle = (
  value: IProductAttribute | IProductOption,
  parentTerm?: number
): number => {
  const prices = value?.prices ?? [];

  if (parentTerm != null) {
    const match = find(prices, ["billing_cycle_months", parentTerm]);
    if (match?.billing_cycle_months != null) return match.billing_cycle_months;
  }

  const oneoff = find(prices, ["billing_cycle_months", 0]);
  if (oneoff?.billing_cycle_months != null) return oneoff.billing_cycle_months;

  const firstPriceCycle = prices[0]?.billing_cycle_months;
  if (firstPriceCycle != null) return firstPriceCycle;

  return parentTerm ?? value.billing_cycle_months;
};

const parseBasketSubproductDetailsChoices = (values: IBasketProduct[]) => {
  return reduce(
    values,
    (result, value) => {
      // -- defensive
      if (!value?.product?.category_id || !value.product_id) return result;

      set(result, [value.product.category_id, value.product_id], {
        productId: value.product_id,
        quantity: parseQuantity(
          value.unit_quantity,
          parseProductDetails(value.product)
        ),
        cycle: value.billing_cycle_months
      });
      return result;
    },
    {}
  );
};

// -----------------------------------------------------------------------------

/**
 * Parses the given product and returns a list of bundled products.
 *
 * Only single products are considered - bundles are not included for product sets/bundles.
 *
 * Bundles are resolved from the meta system which handles scope cascade (product → category → brand).
 *
 * NB: Bundles may be an array or a keyed object (Record):
 * - If we have an array, we use it directly, no key is needed.
 * - If we have a keyed object, we extract the bundle config based on the provided `bundleKey`.
 * - If no key is provided for a keyed object, we will NOT include any bundles.
 *
 * @param {IProduct} raw - The raw product data to parse.
 * @param {string} bundleKey - Optional key to select specific bundle variant (e.g. from `?bundle=validation`).
 * @returns {ProductProps[]} The parsed list of bundled products configurations.
 */
export function parseBundledProducts(
  raw: IProduct,
  bundleKey?: string
): ProductProps[] {
  // safe check: don't include bundles for products that are not single products
  if (raw?.product_type !== ProductTypes.SINGLE_PRODUCT) return [];

  const { data } = useConfig({
    context: UIContext.ALL,
    product: {
      productDetails: parseProductDetails(raw)
    }
  });

  // Handle both array and keyed object formats
  let bundleConfigs: ProductBundleConfig[] = [];
  const productsToBundle = data.productsToBundle;

  if (isArray(productsToBundle)) {
    // Direct array format - use as-is
    bundleConfigs = productsToBundle;
  } else if (productsToBundle && typeof productsToBundle === "object") {
    // Keyed object format - select by bundleKey
    if (bundleKey) {
      bundleConfigs = get(productsToBundle, bundleKey, []);
    }
    // If no bundleKey provided for keyed object, return empty (no bundles)
  }

  // Filter active bundles and map to ProductProps
  const activeBundles = filter(bundleConfigs, bundle => bundle.active);

  return map(activeBundles, bundle => ({
    productId: bundle.object_id,
    quantity: bundle.config?.qty || 1,
    term: bundle.config?.bcm ?? 0,
    subproducts: normaliseSubPids(bundle.config?.sub_pids),
    provisionFields: bundle.config?.pfields ?? {},
    coupons: compact(bundle.config?.coupons ?? []),
    silent: true // always silent for bundled products
  })) as ProductProps[];
}

export const parseProductImages = (images: IImage[]): ProductImage[] => {
  return map(images, image => ({
    url: useImageUrl(image.full_url, "400x400"),
    default: !!image.default
  })) as ProductImage[];
};

/**
 * Maps a billing cycle duration in months to various descriptive formats.
 *
 * @param months - The duration of the billing cycle in months.
 * @returns An object with multiple representations of the billing cycle
 */

export function parseBillingCycle(months: number) {
  const years = months / 12;
  const { t } = useI18n();
  const { getConfigValue } = useBrand();

  const useMonthly =
    getConfigValue<PaymentTermDesignations>(
      BrandConfigKeys.BASKET_PAYMENT_TERM_DESCRIPTIONS
    ) === PaymentTermDesignations.MONTHLY && months >= 12;

  switch (months) {
    case 0:
      return {
        adverbial: t("term.once"), // Once
        descriptive: t("term.one_time"), // One time
        monthly: t("term.one_time"), // One time
        suffix: "", //
        numeric: t("term.one_time") // One time
      };
    case 1:
      return {
        adverbial: t("term.monthly"), // Monthly
        descriptive: t("term.n_months", months), // month
        monthly: t("term.n_months", months), // month
        suffix: t("term.n_mo", months), // mo
        numeric: t("term.n_month", { n: toString(months) }) // 1-month
      };
    case 3:
      return {
        adverbial: t("term.quarterly"), // Quarterly
        descriptive: t("term.n_months", months), // 3 months
        monthly: t("term.n_months", months), // 3 months
        suffix: t("term.n_mo", months), // 3mo
        numeric: t("term.n_month", { n: toString(months) }) // 3-month
      };
    case 6:
      return {
        adverbial: t("term.semiannually"), // Semiannually
        descriptive: t("term.n_months", months), // 6 months
        monthly: t("term.n_months", months), // 6 months
        suffix: t("term.n_mo", months), // 6mo
        numeric: t("term.n_month", { n: toString(months) }) // 6-month
      };
    case 12:
      return {
        adverbial: t("term.annually"), // Annually
        descriptive: useMonthly
          ? t("term.n_months", months) // 12 months
          : t("term.n_years", years), // year
        monthly: t("term.n_months", months), // 12 months
        suffix: t("term.n_yr", years), // yr
        numeric: useMonthly
          ? t("term.n_month", { n: months.toString() }) // 12-month
          : t("term.n_year", { n: years.toString() }) // 1-year
      };
    case 24:
      return {
        adverbial: t("term.biennially"), // Biennially
        descriptive: useMonthly
          ? t("term.n_months", months) // 24 months
          : t("term.n_years", years), // 2 years
        monthly: t("term.n_months", months), // 24 months
        suffix: t("term.n_yr", years), // 2yr
        numeric: useMonthly
          ? t("term.n_month", { n: months.toString() }) // 24-month
          : t("term.n_year", { n: years.toString() }) // 2-year
      };
    case 36:
      return {
        adverbial: t("term.triennially"), // Triennially
        descriptive: useMonthly
          ? t("term.n_months", months) // 36 months
          : t("term.n_years", years), // 3 years
        monthly: t("term.n_months", months), // 36 months
        suffix: t("term.n_yr", years), // 3yr
        numeric: useMonthly
          ? t("term.n_month", { n: months.toString() }) // 36-month
          : t("term.n_year", { n: years.toString() }) // 3-year
      };
    case 48:
    case 60:
    case 72:
    case 84:
    case 96:
    case 108:
    case 120:
      return {
        adverbial: t("term.n_years", years), // {n} years
        descriptive: useMonthly
          ? t("term.n_months", months) // {n} months
          : t("term.n_years", years), // {n} years
        monthly: t("term.n_months", months), // {n} months
        suffix: t("term.n_yr", years), // {n}yr
        numeric: useMonthly
          ? t("term.n_month", { n: months.toString() }) // {n}-month
          : t("term.n_year", { n: years.toString() }) // {n}-year
      };
    default:
      return {
        adverbial: t("term.n_months", months), // {n} months
        descriptive: t("term.n_months", months), // {n} months
        monthly: t("term.n_months", months), // {n} months
        suffix: t("term.n_mo", months), // {n}mo
        numeric: t("term.n_month", { n: toString(months) }) // {n}-month
      };
  }
}

/**
 * Returns a `hasError(scope)` checker for the given context. The scope uses
 * UISchema notation (e.g. `#/properties/term`) and is normalised to the
 * basket-error instance path format (e.g. `/term`) before lookup.
 *
 * Shared by the invalid schema/uischema builders so both stay in lock-step on
 * how errors are matched.
 */
export function hasScopeError(
  basketErrors: ProductConfigContext["basketErrors"]
): (scope: string) => boolean {
  const errorPaths = new Set(map(basketErrors, "instancePath"));

  return (scope: string): boolean => {
    const instancePath = scope
      .replace("#/properties/", "/")
      .replace(/\/properties\//g, "/");
    return errorPaths.has(instancePath);
  };
}

/**
 * Filters basketErrors down to those still outstanding given a live model.
 *
 * basketErrors is a snapshot from the BE — we never mutate it. As the user
 * edits fields the local `model` diverges from `baseModel`; an error is
 * considered "fixed" when its field's value has changed from base. This lets
 * the UI react to local edits without losing the source-of-truth snapshot.
 *
 * Both nilish/empty values are treated as equivalent — the user hasn't
 * meaningfully changed a field that went from undefined → null → "".
 */
export function getOutstandingBasketErrors(
  basketErrors: ProductConfigContext["basketErrors"],
  baseModel: Partial<ProductModel> | undefined,
  model: Partial<ProductModel> | undefined
): ErrorObject[] {
  if (!isArray(basketErrors)) return [];

  return filter(basketErrors, error => {
    const field = compact(split(trimStart(error.instancePath, "/"), "/"));
    const baseValue = get(baseModel, field);
    const newValue = get(model, field);

    // Both nilish/empty → still missing.
    if (!baseValue && !newValue) return true;
    // Unchanged from base → still outstanding.
    return isEqual(baseValue, newValue);
  });
}

export function generateShareUrlConfig(model: ProductModel) {
  const config: Record<string, string | number | undefined> = {};
  config[QUERY_PARAMS.QUANTITY] = model.quantity;
  config[QUERY_PARAMS.BILLING_CYCLE_MONTHS] = model.term;

  // Extract all SubproductModelValue items from the nested SubproductModel structure
  const attributeValues = flatMap(values(model.attributes), values);
  const optionValues = flatMap(values(model.options), values);
  const subproducts = concat(attributeValues, optionValues);

  if (subproducts.length) {
    config[QUERY_PARAMS.SUBPRODUCT_IDS] = map(
      subproducts,
      subproduct => subproduct.productId
    ).join(",");
    forEach(subproducts, subproduct => {
      if (has(subproduct, "unit_quantity")) {
        config[`${QUERY_PARAMS.SUBPRODUCT_QUANTITY}[${subproduct.productId}]`] =
          subproduct.unit_quantity;
      }
      return;
    });
  }

  return map(config, (value, key) => {
    return `${key}=${value}`;
  }).join("&");
}
