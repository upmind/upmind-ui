// --- internal
import { useSystem } from "../system";
import { useBrand } from "../brand";

// --- utils
import {
  useTranslateName,
  useTranslateField,
  DetailedError,
  responseCodes,
  useValidation,
  useLaravalSchemaParser,
} from "../../utils";

import {
  compact,
  concat,
  find,
  first,
  forEach,
  get,
  has,
  isEmpty,
  isFunction,
  isNil,
  isNumber,
  isArray,
  keys,
  map,
  maxBy,
  merge,
  minBy,
  omitBy,
  orderBy,
  reduce,
  reverse,
  set,
  some,
  subtract,
  times,
  toNumber,
  uniq,
  values,
} from "lodash-es";

// --- types

import {
  PromotionDisplayTypes,
  BrandConfigKeys,
  DefaultPaymentPeriod,
  ProductTypes,
} from "@upmind-automation/types";

import type {
  IBasketProduct,
  IProduct,
  IProductAttribute,
  IProductCategory,
  IProductOption,
  IProductPrice,
} from "@upmind-automation/types";

import type {
  ExternalError,
  IProductConfig,
  PriceCalculations,
  PriceDetail,
  PriceDisplay,
  Product,
  ProductBundle,
  ProductBundles,
  ProductConfigContext,
  ProductDetails,
  ProductModel,
  ProductProps,
  ProductSummaryDetail,
  ProductSummaryDetailWithPrice,
  PromotionDetails,
  SubproductDetails,
  SubproductModel,
  SubproductModelValue,
  SubproductValue,
  TermDetails,
  UIMeta,
} from "./types";
import { ErrorObject } from "ajv";

// -----------------------------------------------------------------------------

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
    fallback,
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
        parentKey: "top_category",
      })
    )
  ) as string[];

  if (isEmpty(templates)) fallback;

  // ---
  const template = first(templates) ?? "";
  const result = template.replace(
    /{{([^{}]+)}}/g,
    (keyExpr, key) =>
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

  // TODO: check product type based on if (product.provision_blueprint?.code == "domain-names" | ProvisionCategoryCodes.DOMAINS) {}
  // for now...we will just append the service identifier if it exists
  if (basketProduct?.service_identifier) {
    return `${name} (${basketProduct.service_identifier})`;
  }

  return name;
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
export function iterateParents<
  ItemType,
  ValueKey extends keyof ItemType = keyof ItemType,
  ParentKey extends keyof ItemType = keyof ItemType,
  ResultValueType = ValueKey extends keyof ItemType
    ? ItemType[ValueKey]
    : never,
>(
  item: ItemType | undefined | null,
  result: ResultValueType[],
  {
    valueKey,
    parentKey,
    transform,
  }: {
    valueKey: ValueKey;
    parentKey: ParentKey;
    transform?: (item: ItemType) => ResultValueType;
  }
): ResultValueType[] {
  if (!item) return result;
  const parsed = isFunction(transform)
    ? transform(item)
    : (get(item, valueKey) as ResultValueType);
  result.push(parsed);
  return iterateParents(
    get(item, parentKey as string) as ItemType | undefined | null,
    result,
    {
      valueKey,
      parentKey,
      transform,
    }
  );
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
// -----------------------------------------------------------------------------

export function checkQuantity(
  { lookups }: ProductConfigContext,
  value?: number
): string | undefined {
  const product = get(lookups, "product");
  const quantity = parseQuantity(value ?? 0, product);

  return !isNumber(value) || value < 1 || value !== quantity
    ? "Invalid Quantity Selected"
    : undefined;
}

export function checkTerm(
  { lookups }: ProductConfigContext,
  value?: number
): string | undefined {
  let term: TermDetails | undefined = undefined;

  term = find(lookups?.terms, ["cycle", value]);

  return isNil(term) ? "Valid Term is required" : undefined;
}

export function checkSubproducts(
  type: "attributes" | "options",
  { lookups, model, subproducts: subproductIds }: ProductConfigContext,
  values?: ProductModel["attributes"] | ProductModel["options"]
): Record<string, string[]> | undefined {
  const errors: any = {};
  // ---
  // safety check, resolve if we have no attributes to check
  if (!lookups?.[type]?.length && isEmpty(values)) return undefined;

  forEach(lookups?.[type], (subproduct: SubproductDetails) => {
    let selected: Record<string, SubproductModelValue> = get(
      values,
      subproduct.id,
      {}
    );

    let error = [];

    // check if we are missing required subproduct, if we are (and its not multiple) then automaticaly select the first one
    // NB we only do this on the initial load, not when we are updating the values
    if (isEmpty(selected) && subproduct?.meta.required) {
      error.push(`${subproduct.name} is required`);
    }

    // if we have selected values, ensure they are valid and fully formed

    // then parse each selected value, and ensure it has all its required and VALID values
    forEach(selected, (value: SubproductModelValue, id: string) => {
      const product = find(subproduct.values, ["id", value.productId]);

      // safety check, ensure we have a valid product otherwise bail
      if (isEmpty(product))
        error.push(`${subproduct.name} is not a valid product`);
    });

    // check if we values too many values for this subproduct
    if (!subproduct?.meta.multiple && keys(selected)?.length > 1)
      error.push(`${subproduct.name} does not allow multiple choice`);

    if (!isEmpty(error)) errors[subproduct.id] = error;
  });

  return !isEmpty(errors) ? errors : undefined;
}

export function checkProvisioning(
  { lookups }: ProductConfigContext,
  values?: ProductModel["provisionFields"]
): ErrorObject[] {
  // this is our bypass for the validation when e are doing an express add
  // bail if we dont actually have any provision fields to check
  if (isEmpty(lookups?.provisionFields?.properties)) return [];
  const { validate } = useValidation();

  const errors = lookups?.provisionFields
    ? validate(lookups.provisionFields, values)
    : [];
  return errors;
}

export const calculateBillingTerm = (
  period: DefaultPaymentPeriod | undefined,
  available: TermDetails[]
): TermDetails => {
  // because we have multiple options, we need to select one base don the following strategy:

  if (isEmpty(available))
    throw new DetailedError(
      "[headless] getBillingTerms on product not found",
      responseCodes.Not_Found
    );

  const { defaultPaymentPeriod } = useBrand();

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
      term = calculateBillingTerm(defaultPaymentPeriod.value, available);
      break;

    default:
      break;
  }
  term ??= first(available);

  if (isEmpty(term))
    throw new DetailedError(
      "[headless] getBillingTerm on product not found",
      responseCodes.Not_Found
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

export function parseTerm(
  { lookups }: ProductConfigContext,
  value?: ProductModel["term"],
  quantity?: ProductModel["quantity"]
): { term: ProductModel["term"]; price: PriceCalculations["term"] } {
  let term: TermDetails | undefined = undefined;
  const price: number[] = [];
  // ---
  // try ge the full term object from the lookups terms
  term = find(lookups?.terms, ["cycle", value]);
  if (!term) {
    if (lookups?.terms?.length === 1) {
      term = first(lookups?.terms);
    } else {
      term = calculateBillingTerm(
        lookups?.product?.defaultPaymentPeriod,
        lookups?.terms ?? []
      );
    }
  }

  // set price values, taking into account the quantity and unit quantity
  // NB: we NEVER add, we always push into an array for the backend to handle
  times(quantity ?? 0, () => {
    price.push(term?.price?.currentAmount ?? 0);
  });

  return { term: get(term, "cycle") as number, price };
}

export function parseSubproducts(
  type: "attributes" | "options",
  { lookups, model, subproducts: subproductIds }: ProductConfigContext,
  values: ProductModel["attributes"] | ProductModel["options"],
  quantity?: ProductModel["quantity"]
): {
  subproducts?: ProductModel["attributes"] | ProductModel["options"];
  price: PriceCalculations["attributes"] | PriceCalculations["options"];
} {
  let subproducts: SubproductModel = {};
  const price: any[] = [];
  // ---
  // safety check, resolve if we have no attributes to check
  if (!lookups?.[type]?.length) return { subproducts, price };

  const isInitial = isEmpty(model?.[type]);

  subproducts = reduce(
    lookups[type],
    (result, subproduct: SubproductDetails) => {
      let selected: Record<string, SubproductModelValue> = get(
        values,
        subproduct.id,
        {}
      );

      // try set anymatching pre-selected values for this subproduct ( subproductIds ),
      // NB: ONLY when values is being set for the first time
      if (isEmpty(values)) {
        forEach(subproductIds, pid => {
          if (some(subproduct.values, ["id", pid])) {
            set(selected, pid, { productId: pid });
          }
        });
      }

      // check if we are missing required subproduct, if we are (and its not multiple) then automaticaly select the first one
      // NB we only do this on the initial load, not when we are updating the values
      if (isEmpty(selected) && isInitial) {
        const defaultSubproduct = find(
          subproduct.values,
          "meta.default"
        ) as SubproductValue;

        if (defaultSubproduct) {
          set(selected, defaultSubproduct.id, {
            productId: defaultSubproduct.id,
          });
        } else if (
          (subproduct?.meta.required && !subproduct.meta.multiple) ||
          (subproduct.meta.multiple && subproduct.values?.length === 1)
        ) {
          const pid = get(first(subproduct.values), "id");
          if (pid) set(selected, pid, { productId: pid });
        }
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

            // ensure we have a valid unit_quantity
            value.quantity = parseQuantity(Number(value.quantity), product);

            // ensure we map the product cycle to the value
            value.cycle = product.cycle;

            set(result, id, value);

            // if we have a price, set price values, taking into account the quantity and unit quantity
            // NB: we NEVER add, we always push into an array for the backend to handle
            if (!isEmpty(product?.price)) {
              times(value.quantity * (quantity ?? 1), () => {
                price.push(product?.price?.currentAmount);
              });
            }

            // ---
            return result;
          },
          {}
        );
      }

      // ---
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
  return {
    id: rawProduct?.id,
    name: rawProduct.name,
    title: useUischemaTitle(rawProduct, {
      basketProduct: rawBasketProduct,
      valueKey: "meta.uischema.title",
      fallback: useProductName(rawProduct, rawBasketProduct),
    }),
    brand: useTranslateName(rawProduct?.brand),
    categoryId: rawProduct?.category_id,
    category: useTranslateName(rawProduct?.category),
    categories: reverse(
      iterateParents(rawProduct.category, [], {
        valueKey: "name",
        parentKey: "top_category",
        transform: useTranslateName,
      })
    ) as string[],
    // ---
    cycle: rawProduct?.billing_cycle_months, // TODO check: cycle: rawProduct?.display_price_billing_cycle_months ?? rawProduct?.billing_cycle_months,
    defaultPaymentPeriod: rawProduct?.default_payment_period,
    // ---
    description: useTranslateField(rawProduct, "description"),
    excerpt: useTranslateField(rawProduct, "short_description"),
    imgUrl: rawProduct?.image?.full_url,
    // ---
    quantity: rawProduct?.min_order_quantity || rawProduct?.unit_quantity || 1,
    quantifiable: rawProduct?.order_type == 2,
    step: rawProduct?.unit_quantity || 1,
    min: rawProduct?.min_order_quantity || rawProduct?.unit_quantity || 1,
    max:
      rawProduct?.max_order_quantity > 0
        ? rawProduct?.max_order_quantity
        : Infinity,
    // ---
    uiMeta: parseMeta(rawProduct?.meta ?? {}, rawProduct?.category),
    uiCategoryMeta: rawProduct?.category?.meta || undefined,
  };
};

export const parseMeta = (
  meta: UIMeta,
  category?: IProductCategory
): Record<string, any> => {
  const all = iterateParents(category, [], {
    valueKey: "meta",
    parentKey: "top_category",
  });

  return reduce(
    all,
    (result, value) => {
      result = merge({}, result, value);
      return result;
    },
    meta || {}
  );
};

export const parseTermDetails = (raw: IProductPrice[]): TermDetails[] => {
  return map(orderBy(raw, "billing_cycle_months"), rawTerm => {
    const details: TermDetails = parseSummaryDetailWithPrice(rawTerm);

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
  cycle?: number
): SubproductDetails[] => {
  const { includesTax } = useBrand();

  // safety check, bail if we have no data
  if (isEmpty(data)) return [];
  // When getting the attributes from the API, we get a flat list of attributes
  // We would rather have the attributes grouped by their category
  // And with each category having a list of attributes
  // so to do this we have to do the following:

  // 0. sort the data by attached_order for further lookups
  const sorted = orderBy(data, "attached_order");

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
        uiMeta: parseMeta(rawSubproduct?.meta ?? {}, rawSubproduct?.category),
        uiCategoryMeta: rawSubproduct?.category?.meta || undefined,
        meta: {
          multiple: rawSubproduct.category.multiple,
          required: rawSubproduct.category.required,
          overrides: rawSubproduct.category.price_override,
        },
      });

      // check EARLY if we have a price for one of the following:
      //  * no billing cycle set
      //  * a one off price
      //  * a matching billing cycle

      const valid =
        isNil(cycle) ||
        rawSubproduct.billing_cycle_months == 0 ||
        some(rawSubproduct.prices, ["billing_cycle_months", cycle]);

      // bail if the value is not valid, ie has no price that matches the current billing cycle
      if (!valid) return result;

      // get the prev values...if there are any
      const values: SubproductValue[] = get(option, "values", []);

      // ---
      const pricing: ProductSummaryDetailWithPrice[] = map(
        rawSubproduct.prices,
        rawPrice =>
          parseSummaryDetailWithPrice(
            rawPrice,
            rawSubproduct.category.price_override
          )
      );

      const price =
        find(pricing, ["cycle", 0]) || find(pricing, ["cycle", cycle]);

      const productDetails = parseProductDetails(rawSubproduct);

      const value: SubproductValue = {
        ...productDetails,
        cycle: price?.cycle ?? productDetails.cycle,
        price: price?.price,
        pricing: pricing,
        promotions: price?.promotions,
        meta: {
          // NB: only show term pricing if recurring!
          oneoff: rawSubproduct.billing_cycle_months == 0,
          discounted: !!price?.meta?.discounted,
          includesTax: includesTax.value,
          free: price?.price?.currentAmount == 0,
          overrides: rawSubproduct.category.price_override,
          default: !!rawSubproduct?.pivot?.default,
        },
        order: rawSubproduct.pivot.order,
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
  overrides?: boolean
): ProductSummaryDetailWithPrice => {
  const { getBillingCycle } = useSystem();
  const { includesTax } = useBrand();
  const cycle = getBillingCycle(raw.billing_cycle_months);

  const discounted =
    !!raw.price_discounted && raw.price !== raw.price_discounted;

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
      overrides: !!overrides,
    },
  } as ProductSummaryDetailWithPrice;
};

export const parsePrice = (raw: IProductPrice): PriceDetail => {
  //  TODO: currently IProductPrice does not provide nett/gross values, only the brand setting
  // const { checkIncludesTax } = useBrand();

  const savingAmount =
    Math.round(subtract(raw.price, raw?.price_discounted || raw.price) * 100) /
    100;

  const discounted =
    !!raw.price_discounted && raw.price !== raw.price_discounted;

  return {
    currentAmount: raw.price_discounted ?? raw.price,
    currentPrice: raw.price_discounted_formatted ?? raw.price_formatted,
    regularAmount: raw.price,
    regularPrice: raw.price_formatted,
    savingAmount,
    savingPrice: "", //TODO: missing formatted value
    savingPercent: discounted
      ? `${Math.round((savingAmount / raw.price) * 100)}%`
      : "",
  };
};

export const parseSummaryDetailWithPrice = (
  raw: IProductPrice,
  overrides?: boolean
): ProductSummaryDetailWithPrice => {
  const result: ProductSummaryDetailWithPrice = parseSummaryDetail(
    raw,
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
    return map(
      raw.promotions,
      rawPromo =>
        ({
          code: rawPromo.code,
          name: rawPromo.name,
          title: useTranslateName(rawPromo),
          description: useTranslateField(rawPromo, "description"),
          excerpt: useTranslateField(rawPromo, "short_description"),
          meta: {
            display: promotionDisplayType,
            mixed: !!raw.mixed_promotions,
            discounted: !isEmpty(rawPromo.amount),
          },
          price: {
            savingAmount: toNumber(rawPromo.amount),
            savingPrice: rawPromo.amount_formatted,
            savingPercent: "", //TODO: missing % value from response
          },
        }) as PromotionDetails
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
          discounted: !isNil(raw.price_discounted) && !raw.mixed_promotions,
        },
        price: {
          savingAmount:
            isNil(raw.price_discounted) || raw.mixed_promotions ? 0 : saving,
          savingPrice: "", // TODO: misisng formatted value
          savingPercent:
            isNil(raw.price_discounted) || raw.mixed_promotions
              ? ""
              : saving_formatted,
        },
      } as PromotionDetails,
    ];
  }
};

export const parseProvisioningSchema = (data: any, product: any) => {
  const { getCountry } = useSystem();

  const defaultCountry = getCountry();

  const schema = useLaravalSchemaParser(data, {
    defaultCountry,
    product,
  });

  // TODO: Implement a proper solution for this where field type is input_sld
  // if (field.name === "sld") {
  //   //   type = ["string"];
  //   format = "sld";
  //   // TODO: Set the raw TLD rather, not the product name
  //   field.description = product?.name;
  // "The sld may only contain letters, numbers, and dashes"
  // }

  return schema;
};

export const parseProduct = (
  price: PriceDisplay,
  { model, lookups, error, rawBasketProduct }: Partial<ProductConfigContext>
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
        savingPercent: "",
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
        price.currentAmount != price.regularAmount && price.regularAmount > 0,
    },
    promotions: term?.promotions,
    // ---
    price,
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
      meta: {},
    },
    {
      name: "category",
      title: lookups.product.category,
      meta: {},
    },
  ];

  const termDetails = parseSummaryTerm(
    model.term ?? 0,
    lookups.terms ?? [],
    (error as ExternalError)?.term
  );

  const optionDetails = parseSummarySubproduct(
    "option",
    model.options,
    lookups.options,
    (error as ExternalError)?.options
  );

  const attributeDetail = parseSummarySubproduct(
    "attribute",
    model.attributes,
    lookups.attributes,
    (error as ExternalError)?.attributes
  );

  const provisionFieldDetails = parseSummaryProvisionFields(
    model.provisionFields,
    lookups.provisionFields,
    (error as ExternalError)?.provisionFields
  );

  // ---------------------------------------------------------------------------
  return {
    id: model.id,
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
    errors: omitBy(error, isEmpty) as ExternalError,
  };
};

const parseSummaryTerm = (
  cycle: number,
  terms: TermDetails[],
  error?: ExternalError["term"]
): TermDetails | undefined => {
  const term = find(terms, ["cycle", cycle]);
  if (term) {
    term.name = "term";
    term.category = "Billing Cycle";
    term.meta = {
      ...term.meta,
      invalid: has(error, "term"),
    };
    return term;
  }

  return undefined;
};

const parseSummarySubproduct = (
  key: string,
  data: ProductModel["options"],
  lookup?: SubproductDetails[],
  error?: ExternalError["options" | "attributes"]
): (ProductSummaryDetail | ProductSummaryDetailWithPrice)[] => {
  return reduce(
    data,
    (result, choices) => {
      if (choices) {
        const selected = reduce(
          choices,
          (result, choice, id) => {
            const category = find(lookup, {
              values: [{ id }],
            }) as SubproductDetails;

            const subproduct = find(category?.values, {
              id,
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
                  invalid: has(error, `${key}.${id}`),
                },
                // ---
                ...(subproduct.price ?? {}),
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
  error?: ExternalError["provisionFields"]
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
          invalid: some(error, ["data.schemaPath", key]),
        },
      });
      return result;
    },
    [] as ProductSummaryDetail[]
  );
};

export const parseModel = (data: ProductModel): ProductModel => {
  // handle  product model
  return {
    quantity: data?.quantity || 1,
    productId: data.productId,
    term: data.term,
    options: data.options,
    attributes: data.attributes,
    provisionFields: data.provisionFields,
  };
};

export const parseBasketProductModel = (raw: IBasketProduct): ProductModel => {
  // map basket product raw
  return {
    // id: raw.id,
    quantity: raw.quantity,
    productId: raw.product_id,
    term: raw.billing_cycle_months,
    options: parseSubproductDetailsChoices(raw.options),
    attributes: parseSubproductDetailsChoices(raw.attributes),
    provisionFields: raw.provision_fields,
  };
};

const parseSubproductDetailsChoices = (values: IBasketProduct[]) => {
  return reduce(
    values,
    (result, value) => {
      // -- defensive
      if (!value?.product?.category_id || !value.product_id) {
        return result;
      }

      set(result, [value.product.category_id, value.product_id], {
        productId: value.product_id,
        quantity: parseQuantity(
          value.unit_quantity,
          parseProductDetails(value.product)
        ),
        cycle: value.billing_cycle_months,
      });
      return result;
    },
    {}
  );
};

// -----------------------------------------------------------------------------

/**
 * Parses the given product and returns a list of bundled products.
 * The bundled products are extracted from the product, and only the single products are considered.
 * Inactive bundled products are not included.
 * NB: Bundles have a priority...
 *     if a product has bundles defined in its meta, those are used.
 *     otherwise we traverse the category hierarchy to find bundles and take the first set we find.
 * NB: Bundles may be an array or an Collection of key/value pairs.
 *     If we have an array, we use it directly, no key is needed.
 *     However, if we have a key/value object, we need to extract the bundle config based on the provided `bundle` key.
 *     if no key is provided, we will NOT include any bundles.
 *
 * @param {IProduct} raw - The raw product data to parse.
 * @returns {ProductProps[]} The parsed list of bundled products configurations.
 */
export function parseBundledProducts(
  raw: IProduct,
  bundle?: ProductConfigContext["bundle"]
): ProductProps[] {
  // safe check : dont include recommendations for products that are not single products
  if (raw?.product_type !== ProductTypes.SINGLE_PRODUCT) return [];
  let bundles: ProductBundles =
    raw?.meta?.bundle ??
    first(
      compact(
        iterateParents(raw.category, [], {
          valueKey: "meta.bundle",
          parentKey: "top_category",
          transform: (category: IProductCategory) =>
            get(category, "meta.bundle"),
        })
      )
    );
  if (!isArray(bundles)) {
    if (!bundle) bundles = [];
    else bundles = get(bundles, bundle, []) as ProductBundle[];
  }

  const bundledProducts = reduce(
    bundles,
    (result: ProductProps[], rawBundle) => {
      const model = parseBundleConfig(rawBundle);
      if (model) result.push(model);
      return result;
    },
    []
  ) as ProductProps[];

  return bundledProducts;
}

function parseBundleConfig(raw: ProductBundle): ProductProps | undefined {
  // safe check : dont include recommendations for products that are not single products

  const valid = raw?.object_type === "product" && raw?.active;
  if (!valid) return undefined; // skip if not a valid product bundle or inactive

  const config: IProductConfig = get(raw, "config", {});

  return {
    productId: raw.object_id,
    quantity: config?.qty || 1,
    term: config?.bcm ?? 0,
    subproducts: compact(config?.sub_pids?.toString()?.split(",") ?? []),
    provisionFields: config?.pfields ?? {},
    coupons: compact(config?.coupons?.toString()?.split(",") ?? []),
    // ---
    silent: true, // always silent for bundled products
  } as ProductProps;
}
