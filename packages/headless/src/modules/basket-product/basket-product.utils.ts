import {
  DeferModes,
  ProductOrderTypes,
  PromotionDisplayTypes
} from "@upmind-automation/types";
import { useBrand } from "../brand";
import {
  useUischemaTitle,
  useProductName,
  parseProductDetails,
  parseBasketProductModel,
  parseTermDetails,
  parseSubproductDetails
} from "../product/product.utils";
import { useI18n } from "../system-localisation";
import {
  useTranslateName,
  DetailedError,
  responseCodes,
  parseScalarErrors,
  parseNestedErrors,
  ErrorOrigin,
  parseArrayErrors
} from "../../utils";
import {
  compact,
  constant,
  filter,
  find,
  findLast,
  first,
  flatMap,
  forEach,
  get,
  has,
  isEmpty,
  isNil,
  isObjectLike,
  isString,
  keys,
  map,
  mapValues,
  merge,
  omit,
  omitBy,
  reduce,
  set,
  some,
  values
} from "lodash-es";
import type {
  BasketProduct,
  BasketUpsellSummary,
  IBasketProductModel,
  IBasketSubproductModel
} from "./basket-product.types";
import type {
  PromotionDetails,
  ProductModel,
  SubproductModel,
  SubproductDetails,
  SubproductValue,
  ProductSummaryDetailWithPrice,
  ProductSummaryDetail,
  PriceDetail,
  ProductProps,
  Benefit
} from "../product";
import type {
  IBasket,
  IBasketProduct,
  IBasketPromotion
} from "@upmind-automation/types";
import type { ErrorObject } from "ajv";

// -----------------------------------------------------------------------------

export const parseBasketProduct = (
  raw: IBasketProduct,
  basketErrors?: any
): BasketProduct => {
  const errors = get(basketErrors, raw?.id);
  // Get price object matching `display_price_billing_cycle_months`
  const pricing = parsSummaryWithPrice(raw);

  const basketProduct: BasketProduct = {
    id: raw.id,
    serviceIdentifier: raw?.service_identifier ?? undefined,

    // --- model/configuration
    configuration: parseBasketProductModel(raw),

    // --- product details
    productDetails: parseProductDetails(raw.product, raw),

    // --- source IProduct for product.* conditional state on basket screens
    product: raw.product,

    // --- meta details
    meta: pricing.meta,
    // --- summary details
    price: pricing.price,
    pricing: [pricing], // may be added to below
    details: [], // will be built up below

    // --- errors
    errors: errors,

    // --- inline editing lookups
    availableTerms: parseTermDetails(raw.product, raw.base_price_currency_id),
    availableOptions: parseSubproductDetails(
      raw.product?.products_options,
      raw.billing_cycle_months,
      raw.base_price_currency_id
    )
  };

  // --- because we are a full basket product, we may have a service identifier
  //     so we should regenerate the product title
  basketProduct.productDetails.title = useUischemaTitle(raw.product, {
    basketProduct: raw,
    valueKey: "meta.uischema.title",
    fallback: useProductName(raw.product, raw)
  });

  // --- Now build up our details
  const term = parseTermSummary(raw);
  if (term) {
    basketProduct.details.push(term);
  }
  // ---
  forEach(raw?.options, option => {
    const subproduct = parsSummaryWithPrice(option);
    if (subproduct) {
      // Add our non-quantifiable pricing
      if (option.product.order_type === ProductOrderTypes.SINGLE_OPTION)
        basketProduct.pricing.push(subproduct);

      subproduct.name = "option";

      basketProduct.details.push(subproduct as ProductSummaryDetailWithPrice);
    }
  });

  // --- build upsells from available options (selected + unselected)
  basketProduct.upsells = parseOptionUpsells(
    raw?.options,
    basketProduct.availableOptions
  );

  // ---
  forEach(raw?.attributes, attribute => {
    const subproduct = parseSummary(attribute);
    if (subproduct) {
      subproduct.name = "attribute";
      basketProduct.details.push(subproduct as ProductSummaryDetail);
    }
  });

  // ---
  forEach(raw?.provision_fields, (value, key) => {
    const fieldError = filter(
      errors,
      e => e?.instancePath === `/provisionFields/${key}`
    );
    const field = parseProvisionFieldSummary(key.toString(), value, fieldError);
    if (field) basketProduct.details.push(field);
  });

  // ---

  return basketProduct;
};

export function parseSummary(subproduct: IBasketProduct): ProductSummaryDetail {
  return {
    id: subproduct.product_id,
    name: subproduct.product.name,
    title: useUischemaTitle(subproduct.product, {
      basketProduct: subproduct,
      valueKey: "meta.uischema.title",
      fallback: useProductName(subproduct.product, subproduct)
    }),
    category: useTranslateName(subproduct.product.category),
    cycle: subproduct.billing_cycle_months,
    // quantity of this subproduct across all units of the parent product
    quantity: subproduct.quantity,
    // quantity of this subproduct within a single unit of the parent product
    unitQuantity: subproduct.unit_quantity,
    meta: {}
  };
}

export function parsSummaryWithPrice(
  raw: IBasketProduct
): ProductSummaryDetailWithPrice {
  const { includesTax } = useBrand();

  const summary = parseSummary(raw) as Partial<ProductSummaryDetailWithPrice>;

  summary.meta = {
    oneoff: raw.billing_cycle_months == 0,
    discounted: raw.configuration_net_amount_discount_converted > 0,
    free: raw.configuration_net_amount_discounted_converted == 0,
    freeTrial: !!raw?.in_trial,
    deferred: some(
      raw.product?.provision_fields,
      f =>
        f.defer_mode === DeferModes.OPTIONAL ||
        f.defer_mode === DeferModes.HIDDEN
    ),
    custom: raw.price_type === "manual",
    renewalPrice: find(raw.product?.prices, {
      billing_cycle_months: raw.billing_cycle_months,
      currency_id: raw.base_price_currency_id
    })?.price_formatted,
    overrides: raw?.product?.category?.price_override,
    mixed: raw?.product?.mixed_promotions, //TODO: check if this is correct
    includesTax: includesTax.value
  };

  summary.promotions = parsePromotionDetails(raw);
  summary.price = parsePrice(raw);

  return summary as ProductSummaryDetailWithPrice;
}

export function parsePrice(raw: IBasketProduct): PriceDetail {
  const { includesTax } = useBrand();

  const discounted = raw.configuration_net_amount_discount_converted > 0;

  const regularAmount = includesTax.value
    ? raw.configuration_total_amount_converted
    : raw.configuration_net_amount_converted;
  const regularPrice = includesTax.value
    ? raw.configuration_total_amount_formatted
    : raw.configuration_net_amount_formatted;
  //  ---
  const currentAmount = includesTax.value
    ? raw.configuration_total_discounted_amount_converted
    : raw.configuration_net_amount_discounted_converted;
  const currentPrice = includesTax.value
    ? raw.configuration_total_discounted_amount_formatted
    : raw.configuration_net_amount_discounted_formatted;
  // ---
  const savingAmount = includesTax.value
    ? raw.configuration_total_discount_amount_converted
    : raw.configuration_net_amount_discount_converted; //TODO: MISSING net price discount
  const savingPrice = includesTax.value
    ? raw.configuration_total_discount_amount_formatted
    : raw.configuration_net_amount_discount_formatted;

  const savingPercent = discounted
    ? `${Math.round((savingAmount / regularAmount) * 100)}%`
    : "";

  const unit =
    raw.quantity > 1
      ? {
          total: includesTax.value
            ? raw.selling_price_converted
            : raw.net_selling_price_discounted_converted,
          totalFormatted: includesTax.value
            ? raw.selling_price_formatted
            : raw.net_selling_price_discounted_formatted,
          subtotal: includesTax.value
            ? raw.selling_price_converted
            : raw.net_selling_price,
          subtotalFormatted: includesTax.value
            ? raw.selling_price_formatted
            : raw.net_selling_price_formatted
        }
      : undefined;

  // product-only unit price before promotions, read at any quantity — `unit` is
  // only built when the product is bought more than once. `net_selling_price_*`
  // arrives discount-applied, so it never reconciles with a pre-discount total
  let unitPrice = raw.net_selling_price_base_formatted;
  if (includesTax.value) {
    unitPrice = raw.selling_price_formatted;
  }

  let configurationUnitPrice = raw.configuration_net_selling_price_formatted;
  if (includesTax.value) {
    configurationUnitPrice = raw.configuration_selling_price_formatted;
  }

  const configuration = {
    total: includesTax.value ? raw.total_amount : raw.net_amount,
    totalFormatted: includesTax.value
      ? raw.total_amount_formatted
      : raw.net_amount_formatted,
    subtotal: includesTax.value ? raw.total_amount : raw.net_selling_price,
    subtotalFormatted: includesTax.value
      ? raw.total_amount_formatted
      : raw.net_selling_price_formatted,
    discount: includesTax.value
      ? raw.configuration_total_discount_amount_converted
      : raw.configuration_net_amount_discount_converted,
    discountFormatted: includesTax.value
      ? raw.configuration_total_discount_amount_formatted
      : raw.configuration_net_amount_discount_formatted
  };

  return {
    regularAmount,
    regularPrice,
    currentAmount,
    currentPrice,
    savingAmount,
    savingPrice,
    savingPercent,
    // Base prices (always excluding tax, e.g for summary displays)
    baseAmount: raw.configuration_net_amount_converted,
    basePrice: raw.configuration_net_amount_formatted,
    unit,
    configuration,
    // per-unit price of the product on its own — every configuration_* field
    // folds in the options, so a product-only line has to read this
    unitPrice,
    // per-unit price of the whole configuration (incl options), pre-discount —
    // the one-unit companion to regularPrice's all-units aggregate
    configurationUnitPrice
  } as PriceDetail;
}

export const parsePromotionDetails = (
  raw: IBasketProduct
): PromotionDetails[] => {
  //  Basket Product Promotions can only be displayed in one of 2 ways:
  //  - As a generic summary label with no values when mixed, eg "SAVE"
  //  - As a summary percentage, eg "Save 20%"
  // NB: we always supply the amounts so we can show meta data if needed, eg a tooltip

  const price = parsePrice(raw);

  if (!price.savingAmount) return [];

  return [
    {
      code: "save",
      name: "save", // untranslated name for reporting purposes  category?: string;
      title: "Save",
      meta: {
        display: PromotionDisplayTypes.PERCENTAGE,
        mixed: raw.product.mixed_promotions,
        discounted: !!price.savingAmount || raw.product.mixed_promotions
      },
      price: {
        savingAmount: price.savingAmount,
        savingPrice: price.savingPrice,
        savingPercent: price.savingPercent
      }
    } as PromotionDetails
  ];
};

export function parseTermSummary(
  raw: IBasketProduct
): ProductSummaryDetailWithPrice {
  const summary = parsSummaryWithPrice(raw) as ProductSummaryDetailWithPrice;

  summary.name = "term";

  //  Allow for "price-overrrides"
  set(summary, "meta.free", raw.net_amount == 0);
  set(summary, "meta.overriden", raw.net_amount == 0);

  // if we have no price then we are being overridden, so we need to force the currentPricing to 0
  if (raw.net_amount == 0) {
    set(summary, "price.currentAmount", raw.net_amount);
    set(summary, "price.currentPrice", "");
  }

  return summary;
}

export function resolveOptionToggle(
  productId: string | undefined,
  availableOptions?: SubproductDetails[]
) {
  if (!productId || !availableOptions) return undefined;

  for (const option of availableOptions) {
    const value = find(option.values, { id: productId });
    if (value) {
      return {
        categoryId: option.id,
        valueId: value.id,
        cycle: value.cycle ?? 0,
        selected: true,
        benefits: map(value.benefits, (b: Benefit) =>
          isString(b) ? { label: b } : b
        )
      };
    }
  }

  return undefined;
}

export function parseOptionUpsells(
  selectedOptions: Pick<IBasketProduct, "product_id" | "unit_quantity">[],
  availableOptions?: SubproductDetails[]
): BasketUpsellSummary[] {
  if (isEmpty(availableOptions)) return [];

  return flatMap(availableOptions, option =>
    compact(
      map(option.values, (value: SubproductValue) => {
        const selectedOption = find(selectedOptions, { product_id: value.id });
        const selected = !!selectedOption;
        if (!selected && !value.price) return undefined;

        return {
          id: value.id,
          name: "option",
          title: value.title,
          category: option.title,
          cycle: value.cycle,
          quantity: selectedOption?.unit_quantity ?? value.quantity,
          min: value.min,
          max: value.max,
          step: value.step,
          promotions: value.promotions,
          uiMeta: value.uiMeta,
          meta: {
            ...value.meta,
            quantifiable: value.quantifiable
          },
          toggle: {
            categoryId: option.id,
            valueId: value.id,
            cycle: value.cycle ?? 0,
            selected,
            benefits: map(value.benefits, (b: Benefit) =>
              isString(b) ? { label: b } : b
            )
          },
          price: value.price
        } as BasketUpsellSummary;
      })
    )
  );
}

export function parseProvisionFieldSummary(
  key: string,
  data: any,
  error?: ErrorObject[]
): ProductSummaryDetail {
  const title = get(data, key, data); // just in case its an object > unti lwe have types
  return {
    name: `provision_field.${key}`,
    category: key,
    title,
    error,
    meta: {
      invalid: some(error, e =>
        e.instancePath?.includes(`/provisionFields/${key}`)
      )
    }
  };
}

export function parsePromotionsOrCoupons(
  promotions?: IBasketPromotion[] | string[]
): string[] {
  return map(promotions, basketPromotion => {
    const promocode: string = has(basketPromotion, "promotion")
      ? (basketPromotion as IBasketPromotion).promotion.code
      : (basketPromotion as string);

    return promocode;
  });
}

export function parseBasketProductData(
  model: ProductProps,
  clean?: boolean
): IBasketProductModel {
  const data: IBasketProductModel = {
    product_id: model.productId,
    quantity: model.quantity,
    billing_cycle_months: model.term ?? 0,
    // ---
    attributes: parseBasketSubproductConfig(model?.attributes),
    options: parseBasketSubproductConfig(model?.options),
    // ---
    provision_field_values: model.provisionFields || {},
    provision_field_values_validate: !model.silent, // suppress prov field validation errors if silent is true
    // ---
    promotions: map(model.coupons, coupon => ({ promocode: coupon })),
    // ---
    start_trial: model?.startTrial
  };

  if (!clean) return data;

  return omitBy(data, value => {
    if (isObjectLike(value)) {
      return isEmpty(omitBy(value as object, isEmpty));
    }
    return isNil(value);
  }) as IBasketProductModel;
}

export function parseBasketSubproductConfig(
  subproducts?: SubproductModel
): IBasketSubproductModel[] {
  return reduce(
    subproducts ?? {},
    (result: IBasketSubproductModel[], subproduct) => {
      if (subproduct) {
        const selected = values(
          mapValues(subproduct, choice => {
            return {
              product_id: choice.productId,
              unit_quantity: choice.quantity,
              billing_cycle_months: choice.cycle
            };
          })
        );
        if (!isEmpty(selected)) {
          result.push(...selected);
        }
      }
      return result;
    },
    []
  );
}

export function getBasketProduct(id: string, basket: IBasket) {
  const { t } = useI18n();
  const value = find(basket?.products, { id });
  if (!value) {
    throw new DetailedError(
      t("error.basket_product_not_found"),
      responseCodes.Not_Found,
      ErrorOrigin.Headless
    );
  }

  return value;
}

/**
 * Maps API error responses to AJV-compatible ErrorObject[] with schema-aligned instancePaths.
 *
 * API field names differ from our schema property names:
 *   quantity                       → /quantity
 *   billing_cycle_months           → /term
 *   provision_field_values.{key}   → /provisionFields/{key}
 *   options[i].{field}             → /options
 *   attributes[i].{field}         → /attributes
 */
export function parseBasketProductError(rawError: any | any[]): ErrorObject[] {
  if (isNil(rawError) || isEmpty(rawError)) return [];

  return [
    ...parseScalarErrors(rawError, "quantity", "quantity"),
    ...parseScalarErrors(rawError, "billing_cycle_months", "term"),
    ...parseNestedErrors(rawError, "provision_field_values", "provisionFields"),
    ...parseArrayErrors(rawError, "options", "options"),
    ...parseArrayErrors(rawError, "attributes", "attributes")
  ];
}

/**
 * Reconstructs the user's "clear this field" intent before the wire serialiser.
 *
 * Any provisionField key present in `baseModel` but missing from `model` was
 * stripped by `useModelParser`'s `compactDeep` along the way — the user cleared
 * it. We re-thread those keys as `null` so the API receives an explicit wipe;
 * missing keys would otherwise be interpreted as "no change".
 */
export function reconcileProvisionFields(
  model: ProductProps,
  baseModel?: ProductProps
): ProductProps {
  const clears = mapValues(
    omit(baseModel?.provisionFields, keys(model?.provisionFields)),
    constant(null)
  );
  return merge({}, model, { provisionFields: clears });
}

/**
 * This allows us to dynamically inject values from our basket products
 * into the product model ( currently only provision fields) based on
 * template literals, eg  {{ service_identifier}} or {{provisioning_fields.someProperty}}
 * eg:
 *    This is epecially useful for setting things like the domain name for a hosting product based on a domain product
 * @param model
 * @param products  // The basket products that we can use to resolve dynamic values
 * @returns ProductModel | undefined
 */
export function transformProductDynamicValues(
  model: ProductModel,
  products: IBasketProduct[]
): ProductModel | undefined {
  if (!model || !model?.productId) return undefined;

  model.provisionFields = mapValues(
    model?.provisionFields ?? {},
    (value: any) => {
      // get any dynamic properties that we need to resolve
      const dynamicProperty: string = first(value.match(/(?<=\$\{).+?(?=\})/));
      const product = findLast(products, product =>
        has(product, dynamicProperty)
      );
      if (dynamicProperty && product) {
        return get(product, dynamicProperty, null);
      }
      return value;
    }
  );
  return model;
}
