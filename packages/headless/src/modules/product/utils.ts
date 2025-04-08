// --- internal
import { useSystem } from "../system";
import { useBrand } from "../brand";

// --- utils
import { useTranslateName, useTranslateField } from "../../utils";
import {
  compact,
  find,
  first,
  forEach,
  get,
  has,
  includes,
  isEmpty,
  isFunction,
  isNil,
  isObject,
  isString,
  map,
  merge,
  omitBy,
  orderBy,
  reduce,
  reverse,
  set,
  some,
  subtract,
  toNumber,
  uniq,
  values,
} from "lodash-es";

// --- types
import { PromotionDisplayTypes } from "@upmind-automation/types";
import type {
  IBasketProduct,
  IProduct,
  IProductCategory,
  IProductPrice,
} from "@upmind-automation/types";

import type {
  ProductConfigContext,
  Product,
  ProductModel,
  Promotion,
  SubProductOptionValue,
  SubproductOption,
  SummaryDetails,
  ProductSummaryPrice,
  ProductSummaryDetail,
  Term,
  UIMeta,
} from "./types";

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

  if (isEmpty(templates)) return fallback;
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

  // TODO: check prodct type based on if (product.provision_blueprint?.code == "domain-names" | ProvisionCategoryCodes.DOMAINS) {}
  // for now...we will just append the service identifier if it exists
  if (basketProduct?.service_identifier) {
    return `${name} (${basketProduct.service_identifier})`;
  }

  return name;
}

/**
 * Recursively merges values from a property in a nested object hierarchy
 * @param item The current object in the hierarchy
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
    transform,
  }: {
    valueKey: string;
    parentKey: string;
    transform?: (value: any) => any;
  }
): unknown[] {
  if (!item) return result;
  const parsed = isFunction(transform) ? transform(item) : get(item, valueKey);
  result.push(parsed);
  return iterateParents(get(item, parentKey), result, {
    valueKey,
    parentKey,
    transform,
  });
}

export function checkPriceOverride(values: any, lookups: any) {
  return some(values, (value, key) => {
    const item = find(lookups, ["id", key]);

    // make sure we only apply this IF this value is actually selected, ie has a value and is not empty
    return !isEmpty(value) && !!item?.priceOverride;
  });
}
// -----------------------------------------------------------------------------

export function parseQuantity(quantity: number, product?: Product): number {
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

export const parseProduct = (rawProduct: IProduct): Product => {
  return {
    id: rawProduct?.id,
    title: useUischemaTitle(rawProduct, {
      valueKey: "meta.uischema.title",
      fallback: useTranslateName(rawProduct),
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
      return merge(result, value);
    },
    {}
  );
};

export const parseTerms = (
  raw: any,
  promotionDisplayType?: PromotionDisplayTypes
): Term[] => {
  return map(orderBy(raw, "billing_cycle_months"), rawTerm =>
    parsePrice(rawTerm, promotionDisplayType)
  );
};

export const parseSubproduct = (
  data: any,
  promotionDisplayType?: PromotionDisplayTypes,
  cycle?: number
): SubproductOption[] => {
  const { checkIncludesTax } = useBrand();

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
  const options: Record<string, SubproductOption> = reduce(
    sorted,
    (result, rawSubproduct) => {
      // create the option based on the category ... if it isnt already set
      const option: SubproductOption = get(result, rawSubproduct.category_id, {
        id: rawSubproduct.category.id,
        title: useTranslateName(rawSubproduct.category),
        description: useTranslateField(rawSubproduct.category, "description"),
        excerpt: useTranslateField(rawSubproduct.category, "short_description"),
        multiple: rawSubproduct.category.multiple,
        required: rawSubproduct.category.required,
        priceOverride: rawSubproduct.category.price_override,
        uiCategorymeta: rawSubproduct?.category.meta,
        uiMeta: parseMeta(rawSubproduct?.meta ?? {}, rawSubproduct?.category),
        uiCategoryMeta: rawSubproduct?.category?.meta || undefined,
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
      const values: any[] = get(option, "values", []);

      // ---
      const prices = map(rawSubproduct.prices, rawPrice =>
        parsePrice(
          rawPrice,
          promotionDisplayType,
          rawSubproduct.category.price_override
        )
      );

      const price =
        find(prices, ["cycle", 0]) || find(prices, ["cycle", cycle]);

      const value: SubProductOptionValue = {
        default: !!rawSubproduct?.pivot?.default,
        id: rawSubproduct.id,
        title: useTranslateName(rawSubproduct),
        description: useTranslateField(rawSubproduct, "description"),
        excerpt: useTranslateField(rawSubproduct, "short_description"),
        brand: useTranslateName(rawSubproduct?.brand),
        categoryId: rawSubproduct?.category_id,
        category: useTranslateName(rawSubproduct?.category),
        // ---
        cycle: price?.cycle ?? rawSubproduct.billing_cycle_months,
        // ---
        quantity: rawSubproduct?.unit_quantity || 1,
        quantifiable: rawSubproduct.order_type == 2,
        step: rawSubproduct.unit_quantity || 1,
        min:
          rawSubproduct.min_order_quantity || rawSubproduct.unit_quantity || 1,
        max:
          rawSubproduct.max_order_quantity > 0
            ? rawSubproduct.max_order_quantity
            : Infinity,
        prices,
        price,
        meta: {
          // NB: only show term pricing if recurring!
          oneoff: rawSubproduct.billing_cycle_months == 0,
          discounted:
            (rawSubproduct.price_discounted ?? rawSubproduct.price) !==
            rawSubproduct.price,
          includesTax: checkIncludesTax(),
          free: (rawSubproduct.price_discounted ?? rawSubproduct.price) == 0,
          overrides: rawSubproduct.category.price_override,
        },
        uiMeta: parseMeta(rawSubproduct?.meta ?? {}, rawSubproduct?.category),
        uiCategoryMeta: rawSubproduct?.category?.meta || undefined,
        order: rawSubproduct?.order,
      };

      // ---
      values.push(value);
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

export const parsePrice = (
  raw: IProductPrice,
  promotionDisplayType?: PromotionDisplayTypes,
  overrides?: boolean
): ProductSummaryPrice => {
  const { getBillingCycle } = useSystem();
  const { checkIncludesTax } = useBrand();
  const cycle = getBillingCycle(raw.billing_cycle_months);

  const savingAmount =
    Math.round(subtract(raw.price, raw?.price_discounted || raw.price) * 100) /
    100;

  const discounted =
    !!raw.price_discounted && raw.price !== raw.price_discounted;

  const price: ProductSummaryPrice = {
    cycle: raw.billing_cycle_months,
    title: cycle ? useTranslateName(cycle) : useTranslateName(raw),

    currentAmount: raw.price_discounted ?? raw.price,
    currentPrice: raw.price_discounted_formatted ?? raw.price_formatted,
    regularAmount: raw.price,
    regularPrice: raw.price_formatted,
    savingAmount,
    savingPrice: "", //TODO: missing formatted value
    savingPercent: discounted
      ? `${Math.round((savingAmount / raw.price) * 100)}%`
      : "",

    promotions: parsePromotion(raw, promotionDisplayType),

    meta: {
      oneoff: raw.billing_cycle_months == 0,
      mixed: raw.mixed_promotions,
      discounted,
      includesTax: checkIncludesTax(),
      free: (raw.price_discounted ?? raw.price) == 0,
      overrides: !!overrides,
    },
  };

  return price;
};

export const parsePromotion = (
  raw: IProductPrice,
  promotionDisplayType: PromotionDisplayTypes = PromotionDisplayTypes.PERCENTAGE
): Promotion[] => {
  //  Promotions can be display in one of 3 ways:
  //  - As a generic summary label with no values, eg "SAVE"
  //  - As a sumamry percentage, eg "Save 20%"
  //  - As individual names, eg ["20% off", "Black Friday"]
  // NB: we always supply the amouns so we can show meta data if needed, eg a tooltip

  // ---

  if (isEmpty(raw?.promotions)) return [];

  // ---

  if (promotionDisplayType == PromotionDisplayTypes.NAME) {
    return map(raw.promotions, rawPromo => {
      return {
        savingAmount: toNumber(rawPromo.amount),
        savingPrice: rawPromo.amount_formatted,
        savingPercent: "", //TODO: missing % value from response
        code: rawPromo.code,
        title: useTranslateName(rawPromo),
        description: useTranslateField(rawPromo, "description"),
        excerpt: useTranslateField(rawPromo, "short_description"),
        meta: {
          display: promotionDisplayType,
          mixed: !!raw.mixed_promotions,
          discounted: !isEmpty(rawPromo.amount),
        },
      };
    });
  } else {
    const saving =
      ((raw.price - (raw.price_discounted ?? raw.price)) / raw.price) * 100;
    const saving_formatted = `${Math.round(saving)}%`;

    return [
      {
        savingAmount:
          isNil(raw.price_discounted) || raw.mixed_promotions ? 0 : saving,
        savingPrice: "", // TODO: misisng formatted value
        savingPercent:
          isNil(raw.price_discounted) || raw.mixed_promotions
            ? ""
            : saving_formatted,
        code: map(raw.promotions, "code"),
        meta: {
          display: promotionDisplayType,
          mixed: !!raw.mixed_promotions,
          discounted: !isNil(raw.price_discounted) && !raw.mixed_promotions,
        },
      },
    ];
  }
};

export const parseProvisioningSchema = (data: any, product: any) => {
  const required: string[] = [];
  const properties = {};
  const errorMessage = {};

  forEach(data, field => {
    let type = ["string"];
    let format = null; //field?.format; // || field?.semantic_type;

    const fieldType = field?.semantic_type || field?.field_type || field?.type;
    // lets map our field types...
    switch (fieldType) {
      case "select":
        type = ["string", "number"];
        break;
      case "input_number":
        type = ["number"];
        break;
      case "input-checkbox":
        type = ["boolean"];
        break;
      case "input_date":
        type = ["string"];
        format = "date";
        break;
      case "input_datetime":
        type = ["string"];
        format = "date-time";
        break;
      case "input_email":
        type = ["string"];
        format = "email";
        break;
      case "input_url":
        type = ["string"];
        format = "uri";
        break;
      case "input_phone":
      case "input_tel":
        type = ["string"];
        // format = "phone";
        // todo ad dthe default country code
        // isPhoneNumber = defaultCountry?.code;
        break;
      case "input_ip":
        type = ["string"];
        format = "ipv4";
        break;
      case "input_ipv6":
        type = ["string"];
        format = "ipv6";
        break;
      case "domain_name":
        type = ["string"];
        format = "domain_name";
        set(
          errorMessage,
          ["properties", field.name],
          "Please enter a valid domain name"
        );
        break;

      default:
        type = ["string"];

        // TODO: Implement a proper solution for this where field type is input_sld
        if (field.name === "sld") {
          type = ["string"];
          format = "sld";
          // TODO: Set the raw TLD rather, not the product name
          field.description = product?.name;
        }

        // additional format checks
        if (includes(field.validation_rules, "email")) format = "email";
        if (includes(field.validation_rules, "url")) format = "uri";

        break;
    }

    if (field.required) {
      required.push(field.name);
    } else {
      type.push("null");
    }

    if (!field.deferrable || field.defer_mode != "hidden") {
      const schema = {
        type,
        format,
        title: field.field_label,
        description: field.description,
        default: field?.default || field?.default_value,
        enum: !some(field.options, isString) ? undefined : field.options,
        oneOf: !some(field.options, isObject)
          ? undefined
          : map(field.options, item => {
              return {
                const: item.value,
                title: item.label,
              };
            }),
      };

      set(properties, field.name, omitBy(schema, isNil));
    }
  });

  // return a fully formed json schema
  return {
    type: "object",
    properties,
    required,
    errorMessage,
  };
};

export const parseSummary = (
  raw: any,
  {
    model,
    lookups,
    error,
    rawProduct,
    basketProduct,
  }: Partial<ProductConfigContext>
): SummaryDetails => {
  // sanity check
  if (isEmpty(model) || isEmpty(lookups)) {
    return {
      pricing: [],
      details: [],
    };
  }

  // ---
  const { checkIncludesTax } = useBrand();

  const summaryPricing: ProductSummaryPrice = {
    name: "totals",
    title: lookups.product?.title ?? "",
    category: lookups.product?.category ?? "",
    cycle: model.term,
    quantity: model.quantity,
    // ---
    regularAmount: raw.total,
    regularPrice: raw.total_formatted,
    currentAmount: raw?.discounted || raw.total,
    currentPrice: raw?.discounted_formatted || raw.total_formatted,
    savingAmount:
      Math.round(subtract(raw.total, raw?.discounted || raw.total) * 100) / 100,
    savingPrice: "", //TODO: missing formatted value
    savingPercent: raw.discounted
      ? `${Math.round((raw.discounted / raw.total) * 100)}%`
      : "",

    // ---
    meta: {
      oneoff: model?.term == 0,
      discounted: (raw.discounted ?? raw.total) !== raw.total,
      includesTax: checkIncludesTax(),
      free: (raw?.discounted ?? raw.total) == 0,
    },
  };
  // -------
  // this is an array of  key value pairs that can be used to display a summary of the configuration
  // typically used in the basket or checkout
  // it is in this format to preserve the order of the configuration
  // and allow for easy i18n
  const details: ProductSummaryDetail[] = [];

  //  product title
  if (rawProduct) {
    details.push({
      name: "product",
      title: useUischemaTitle(rawProduct, {
        basketProduct,
        valueKey: "meta.uischema.summary.title.name",
        fallback: useProductName(rawProduct, basketProduct),
      }),
      category: useUischemaTitle(rawProduct, {
        basketProduct,
        valueKey: "meta.uischema.summary.title.category",
        fallback: "Product",
      }),
    });
  }

  //  product category
  if (lookups.product?.category) {
    details.push({
      name: "category",
      title: lookups.product.category,
      category: lookups.product.category,
    });
  }

  // term
  const term = parseSummaryTerm(
    model.term ?? 0,
    lookups.terms ?? [],
    error?.term
  );
  if (!isEmpty(term)) details.push(term);

  // options
  const options = parseSummarySubproduct(
    "option",
    model.options,
    lookups.options,
    error?.options
  );
  details.push(...options);

  // attributes
  const attributes = parseSummarySubproduct(
    "attribute",
    model.attributes,
    lookups.attributes,
    error?.attributes
  );
  details.push(...attributes);

  // provision fields
  const provisionFields = parseSummaryProvisionFields(
    model.provisionFields,
    lookups.provisionFields,
    error?.provisionFields
  );
  if (!isEmpty(provisionFields)) details.push(...provisionFields);

  // ---------------------------------------------------------------------------
  return {
    pricing: [summaryPricing],
    details,
  };
};

const parseSummaryTerm = (
  cycle: number,
  terms: Term[],
  error?: any
): Term | undefined => {
  const term = find(terms, ["cycle", cycle]);
  if (term) {
    term.name = "term";
    term.category = "Billing Cycle";
    return term;
  }

  return undefined;
};

const parseSummarySubproduct = (
  key: string,
  data: ProductModel["options"],
  lookup?: SubproductOption[],
  error?: any
): ProductSummaryDetail[] => {
  const { checkIncludesTax } = useBrand();

  return reduce(
    data,
    (result, choices) => {
      if (choices) {
        const selected = reduce(
          choices,
          (result, choice, id) => {
            const category = find(lookup, {
              values: [{ id }],
            }) as SubproductOption;
            const subproduct = find(category?.values, {
              id,
            }) as SubProductOptionValue;
            if (subproduct) {
              result.push({
                key,
                quantity: choice.quantity,
                category: category?.title,
                title: subproduct.title,
                cycle: subproduct.cycle,
                // ---
                price: subproduct.price,
                prices: subproduct.prices,
                // ---
                meta: {
                  ...subproduct.meta,
                  invalid: has(error, `${key}.${id}`),
                },
              });
            }

            return result;
          },
          [] as any[] // Provide initial value as an empty array
        );
        result.push(...selected);
      }
      return result;
    },
    [] as ProductSummaryDetail[] // Provide initial value as an empty array
  );
};

const parseSummaryProvisionFields = (
  data: any,
  schema: any,
  error?: any
): ProductSummaryDetail[] => {
  return reduce(
    schema?.properties,
    (result: any[], provisionField, key) => {
      let title = get(data, key);
      if (provisionField.oneOf) {
        title = find(provisionField.oneOf, ["const", title])?.title;
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

export const parseModel = (raw: ProductModel): ProductModel => {
  // handle  product model
  return {
    quantity: raw?.quantity || 1,
    productId: raw.productId,
    term: raw.term,
    options: raw.options,
    attributes: raw.attributes,
    provisionFields: raw.provisionFields,
    subproducts: raw.subproducts,
  };
};

export const parseBasketProductModel = (raw: IBasketProduct): ProductModel => {
  // map basket product raw
  return {
    // id: raw.id,
    quantity: raw.quantity,
    productId: raw.product_id,
    term: raw.billing_cycle_months,
    options: parseSubproductChoices(raw.options),
    attributes: parseSubproductChoices(raw.attributes),
    provisionFields: raw.provision_fields,
  };
};

const parseSubproductChoices = (values: IBasketProduct[]) => {
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
          parseProduct(value.product)
        ),
        cycle: value.billing_cycle_months,
      });
      return result;
    },
    {}
  );
};
