// --- internal
import { useSystem } from "../system";

// --- utils
import { useTranslateName, useTranslateField } from "../../utils";
import {
  find,
  forEach,
  get,
  has,
  includes,
  isEmpty,
  isNil,
  isObject,
  isString,
  map,
  merge,
  omitBy,
  orderBy,
  reduce,
  set,
  some,
  toNumber,
  values,
} from "lodash-es";

// --- types
import { PromotionDisplayTypes } from "./services";
import type {
  ProductModel,
  ProductConfigContext,
  UIMeta,
  IProductCategory,
} from "./types";

// --------------------------------------------------------
// Parsing Models for an Item/Product that is being configured for the basket

// --------------------------------------------------------
export const checkPriceOverride = (values: any, lookups: any) => {
  return some(values, (value, key) => {
    const item = find(lookups, ["id", key]);

    // make sure we only apply this IF this value is actually selected, ie has a value and is not empty
    return !isEmpty(value) && !!item?.priceOverride;
  });
};

export const parseQuantity = (quantity: number, product: any) => {
  quantity = toNumber(quantity) || 1; // ensure we have a number;
  // Check the product data is available
  // Check the quantity is valid,
  //  - min Quantity matches the product min
  //  - max Quantity matches the product max
  //  - quantity is a multiple of the product step
  // ensure the quantity is at least the min, or 1

  if (quantity < Math.max(product?.min, 1)) {
    quantity = Math.max(product?.min, 1);
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
};

export const parseProduct = (
  rawProduct: any,
  basketProduct?: ProductConfigContext["basketProduct"]
) => {
  const merged = merge({}, rawProduct, basketProduct);
  return {
    id: merged.id,
    name: useTranslateName(merged),
    categoryId: merged.category_id,
    category: useTranslateName(merged.category),
    serviceIdentifier: merged.service_identifier,
    cycle: merged.billing_cycle_months,
    // TODO check: cycle: merged.display_price_billing_cycle_months ?? merged.billing_cycle_months,
    quantity: merged.quantity,
    // //
    description: useTranslateField(merged, "description"),
    excerpt: useTranslateField(merged, "short_description"),
    imgUrl: merged?.product_image_url ?? merged?.image?.full_url,
    // image: merged.image,
    // images: merged.images,
    // ---
    quantifiable: merged.order_type == 2,
    step: merged.product?.unit_quantity || 1,
    min:
      merged.product?.min_order_quantity || merged.product?.unit_quantity || 1,
    max:
      merged.product?.max_order_quantity > 0
        ? merged.product?.max_order_quantity
        : Infinity,
    defaultPaymentPeriod: merged?.default_payment_period,
    meta: parseMeta(merged?.meta ?? {}, merged?.category),
    categoryMeta: merged?.category?.meta,
    // ---
    // displayAmount: merged.selling_price,
    // displayPrice: merged.selling_price_formatted,
    // meta: {
    //   discounted:
    //     some(merged.prices, "price_discounted") ||
    //     some(merged.prices, "mixed_promotions"),
    //   freeTrial:
    //     merged.trial_supported &&
    //     merged.trial_end_action &&
    //     merged.trial_force &&
    //     [TrialEndActionTypes.CANCEL].includes(merged.trial_end_action),
    // },
  };
};

export const parseMeta = (meta: UIMeta, category?: IProductCategory) => {
  return iterateParents(category, "meta", "top_category", meta);
};

/**
 * Recursively merges values from a property in a nested object hierarchy
 * @param item The current object in the hierarchy
 * @param valueKey The key to extract values from at each level
 * @param parentKey The key to navigate to the parent object
 * @param initialValue Optional initial value to merge with collected values
 * @returns Merged values from all levels of the hierarchy, with lower levels and then initial value taking priority
 */
const iterateParents = (
  item: any,
  valueKey: string,
  parentKey: string,
  initialValue?: any
): any => {
  if (!item) return initialValue;

  return merge(
    iterateParents(get(item, parentKey), valueKey, parentKey),
    get(item, valueKey),
    initialValue
  );
};

export const parseTerms = (
  raw: any,
  promotionDisplayType?: PromotionDisplayTypes
) => {
  const { getBillingCycle } = useSystem();

  return map(orderBy(raw, "billing_cycle_months"), rawTerm => {
    // Pick only the properties we need

    const term: any = {
      cycle: rawTerm.billing_cycle_months,
      mixedPromotions: rawTerm.mixed_promotions,
      // ---
      monthlyFromCurrentAmount:
        rawTerm.monthly_price_from_discounted ?? rawTerm.monthly_price_from,
      monthlyFromCurrentPrice:
        rawTerm.monthly_price_from_discounted_formatted ??
        rawTerm.monthly_price_from_formatted,
      monthlyFromRegularAmount: rawTerm.monthly_price_from,
      monthlyFromRegularPrice: rawTerm.monthly_price_from_formatted,

      currentAmount: rawTerm.price_discounted ?? rawTerm.price,
      currentPrice:
        rawTerm.price_discounted_formatted ?? rawTerm.price_formatted,
      regularAmount: rawTerm.price,
      regularPrice: rawTerm.price_formatted,

      meta: {
        discounted:
          (rawTerm.price_discounted ?? rawTerm.price) !== rawTerm.price,
        free: (rawTerm.price_discounted ?? rawTerm.price) == 0,
      },
    };

    // --------------------------------------------------------
    // Ensure the name is set

    const cycle = getBillingCycle(rawTerm.billing_cycle_months);
    term.name = cycle ? useTranslateName(cycle) : null;

    term.promotions = parsePromotion(rawTerm, promotionDisplayType);

    return term;
  });
};

export const parseSubproduct = (
  data: any,
  promotionDisplayType?: PromotionDisplayTypes,
  cycle?: number
) => {
  const { getBillingCycle } = useSystem();

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
  const options = reduce(
    sorted,
    (result, rawSubproduct) => {
      // create the option based on the category ... if it isnt already set
      const option = get(result, rawSubproduct.category_id, {
        id: rawSubproduct.category.id,
        name: useTranslateName(rawSubproduct.category),
        description: useTranslateField(rawSubproduct.category, "description"),
        excerpt: useTranslateField(rawSubproduct.category, "short_description"),
        multiple: rawSubproduct.category.multiple,
        required: rawSubproduct.category.required,
        priceOverride: rawSubproduct.category.price_override,
        meta: rawSubproduct?.category.meta,
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

      // add this raw option to the values, with limited properties

      const value: any = {
        default: !!rawSubproduct?.pivot?.default,
        id: rawSubproduct.id,
        name: useTranslateName(rawSubproduct),
        description: useTranslateField(rawSubproduct, "description"),
        excerpt: useTranslateField(rawSubproduct, "short_description"),
        // ---
        quantifiable: rawSubproduct.order_type == 2,
        step: rawSubproduct.unit_quantity || 1,
        min:
          rawSubproduct.min_order_quantity || rawSubproduct.unit_quantity || 1,
        max:
          rawSubproduct.max_order_quantity > 0
            ? rawSubproduct.max_order_quantity
            : Infinity,
        prices: map(rawSubproduct.prices, rawPrice => {
          const price: any = {
            mixedPromotions: rawPrice.mixed_promotions,
            cycle: rawPrice.billing_cycle_months,

            currentAmount: rawPrice.price_discounted ?? rawPrice.price,
            currentPrice:
              rawPrice.price_discounted_formatted ?? rawPrice.price_formatted,
            regularAmount: rawPrice.price,
            regularPrice: rawPrice.price_formatted,

            meta: {
              discounted:
                rawPrice.price_discounted &&
                rawPrice.price !== rawPrice.price_discounted,
              free: (rawPrice.price_discounted ?? rawPrice.price) == 0,
              overrides: rawSubproduct.category.price_override,
            },
          };

          const cycle = getBillingCycle(price.cycle);
          price.name = cycle ? useTranslateName(cycle) : null;

          price.promotions = parsePromotion(rawPrice, promotionDisplayType);

          return price;
        }),
        meta: rawSubproduct?.meta,
        order: rawSubproduct?.order,
      };

      // First, try get a one off price, othrwise try find the matching term price
      value.price =
        find(value.prices, ["cycle", 0]) ||
        find(value.prices, ["cycle", cycle]);

      // ensure we set the cycle to the price cycle
      value.cycle = value?.price?.cycle ?? rawSubproduct.billing_cycle_months;

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

export const parsePromotion = (
  data: any,
  promotionDisplayType: PromotionDisplayTypes = PromotionDisplayTypes.PERCENTAGE
) => {
  //  Promotions can be display in one of 3 ways:
  //  - As a generic summary label with no values, eg "SAVE"
  //  - As a sumamry percentage, eg "Save 20%"
  //  - As individual names, eg ["20% off", "Black Friday"]
  // NB: we always supply the amouns so we can show meta data if needed, eg a tooltip

  // ---

  if (!data?.promotions?.length) return [];

  // ---

  if (promotionDisplayType == PromotionDisplayTypes.NAME) {
    return map(data.promotions, rawPromo => {
      return {
        amount: rawPromo.amount,
        amountFormatted: rawPromo.amount_formatted,
        code: rawPromo.code,
        name: useTranslateName(rawPromo),
        description: useTranslateField(rawPromo, "description"),
        excerpt: useTranslateField(rawPromo, "short_description"),
        display: promotionDisplayType,
        mixed: data.mixed_promotions,
      };
    });
  } else {
    const saving =
      ((data.price - (data.price_discounted ?? data.price)) / data.price) * 100;
    const saving_formatted = `${Math.round(saving)}%`;

    return [
      {
        name: null,
        amount:
          isNil(data.price_discounted) || data.mixed_promotions ? 0 : saving,
        amountFormatted:
          isNil(data.price_discounted) || data.mixed_promotions
            ? ""
            : saving_formatted,
        code: map(data.promotions, "code"),
        display: promotionDisplayType,
        mixed: data.mixed_promotions,
      },
    ];
  }
};

export const parseProvisioningSchema = (data: any) => {
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

// ---

export const parseSummary = (raw: any, { model, lookups, error }: any) => {
  const summaryPricing = {
    name: lookups.product.name,
    category: lookups.product.category,
    serviceIdentifier: lookups.product.serviceIdentifier,
    cycle: model.term,
    quantity: model.quantity,
    // ---
    regularAmount: raw.total,
    regularPrice: raw.total_formatted,
    currentAmount: raw?.discounted || raw.total,
    currentPrice: raw?.discounted_formatted || raw.total_formatted,
    // ---
    meta: {
      oneoff: model.term > 0,
      discounted: (raw.discounted ?? raw.total) !== raw.total,
      free: (raw?.discounted ?? raw.total) == 0,
    },
  };
  // -------
  // this is an array of  key value pairs that can be used to display a summary of the configuration
  // typically used in the basket or checkout
  // it is in this format to preserve the order of the configuration
  // and allow for easy i18n
  const details = [];

  //  product category
  details.push({
    key: "category",
    name: lookups.product.category,
    category: undefined,
    cycle: undefined,
    quantity: undefined,
    discount: undefined,
    discount_formatted: undefined,
    total: undefined,
    total_formatted: undefined,
    invalid: false,
  });

  // term
  const term = parseSummaryTerm(model.term, lookups.terms, error?.term);
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

  // ---
  return {
    pricing: [summaryPricing],
    details,
  };
};

export function parsSummaryPrice(data: any) {
  const summary = {
    key: "",
    name: data.name,
    category: data.category,
    serviceIdentifier: data.serviceIdentifier,
    cycle: data.cycle,
    quantity: data.quantity || 1,

    regularAmount: data.regularAmount,
    regularPrice: data.regularPrice,
    currentAmount: data.currentAmount,
    currentPrice: data.currentPrice,

    meta: {
      oneoff: data.cycle > 0,
      discounted: data.currentAmount !== data.regularAmount,
      free: data.currentAmount == 0,
    },
  };
  return summary;
}

const parseSummaryTerm = (term: any, terms: any, error?: any) => {
  const cycle = find(terms, ["cycle", term]);
  if (cycle) {
    const term = parsSummaryPrice(cycle);
    term.key = "term";
    term.category = "Billing Cycle";
    term.name = cycle.name;
    return term;
  }

  return null;
};

const parseSummarySubproduct = (
  key: string,
  data: any,
  lookup: Array<any>,
  error?: any
) => {
  return reduce(
    data,
    (result, choices) => {
      if (choices) {
        const selected = reduce(
          choices,
          (result, choice, id) => {
            const category = find(lookup, { values: [{ id }] });
            const subproduct = find(category?.values, { id });

            if (subproduct) {
              result.push({
                key,
                quantity: choice.unit_quantity,
                category: category.name,
                name: subproduct.name,
                cycle: subproduct?.billing_cycle_months,
                // ---
                currentAmount: subproduct.price_discounted ?? subproduct.price,
                currentPrice:
                  subproduct.price_discounted_formatted ??
                  subproduct.price_formatted,
                regularAmount: subproduct?.price,
                regularPrice: subproduct.price_formatted,
                meta: {
                  // NB: only show term pricing if recurring!
                  oneoff: subproduct.billing_cycle_months == 0,
                  discounted:
                    (subproduct.price_discounted ?? subproduct.price) !==
                    subproduct.price,
                  free: (subproduct.price_discounted ?? subproduct.price) == 0,
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
    [] as any[] // Provide initial value as an empty array
  );
};

const parseSummaryProvisionFields = (data: any, schema: any, error?: any) => {
  return reduce(
    schema?.properties,
    (result: any[], provisionField, key) => {
      let name = get(data, key);

      if (provisionField.oneOf) {
        name = find(provisionField.oneOf, ["const", name])?.title;
      }

      result.push({
        key: `provision_field.${key}`,
        category: get(provisionField, "title", key),
        name,
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
    [] as any[]
  );
};

// --------------------------------------------------------
//  Setting Model for an Item that is configuring,
//  this may be a new item, or an existing item that has been added to the basket

export const parseModel = (raw: any): ProductModel => {
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

export const parseBasketProductModel = (raw: any): ProductModel => {
  // map basket product raw
  return {
    // id: raw.id,
    quantity: raw.quantity,
    productId: raw.product_id,
    term: raw.billing_cycle_months,
    options: mapSubproductChoices(raw.options),
    attributes: mapSubproductChoices(raw.attributes),
    provisionFields: raw.provision_fields,
  };
};

// ---
const mapSubproductChoices = (values: any) => {
  return reduce(
    values,
    (result, value) => {
      // -- defensive
      if (!value?.product?.category_id || !value.product_id) {
        return result;
      }

      set(result, [value.product.category_id, value.product_id], {
        productId: value.product_id,
        quantity: parseQuantity(value.unit_quantity, value.product),
        cycle: value.billing_cycle_months,
      });
      return result;
    },
    {}
  );
};
