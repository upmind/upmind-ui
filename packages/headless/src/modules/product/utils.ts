// --- internal
import { useSystem } from "../system";
import { TrialEndActionTypes } from "./services";

// --- utils
import { useTranslateName, useTranslateField } from "../../utils";
export { parseBasketProduct } from "../basket/utils";
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
  mapValues,
  merge,
  omit,
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
import type { ProductModel, ProductConfigContext } from "./types";

// --- types
import type { BasketProductConfig } from "./types";

// --------------------------------------------------------
// Parsing Models for an Item/Product that is queued/configuring for the basket

// --------------------------------------------------------
export const checkPriceOverride = (values: any, lookups: any) => {
  return some(values, (value, key) => {
    const item = find(lookups, ["id", key]);

    // make sure we only apply this IF this value is actually selected, ie has a value and is not empty

    // DC:  this may be raw and need to be converted to camelCase

    return !isEmpty(value) && !!item?.price_override;
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
  // combine the rawProduct data with the basket product data to augment the product
  // DC: cant remember why... to investigate
  // DC:  this may be rawProduct and need to be converted to camelCase

  const merged = merge({}, rawProduct, basketProduct);

  return {
    id: merged.id,
    name: merged.name,
    category: useTranslateName(merged.category),
    serviceIdentifier: merged.service_identifier,
    description: merged.description,
    shortDescription: merged.short_description,
    // ---
    image: merged.image,
    images: merged.images,
    // ---
    quantifiable: merged.order_type == 2,
    step: merged.unit_quantity || 1,
    min: merged.min_order_quantity || merged.unit_quantity,
    max: merged.max_order_quantity > 0 ? merged.max_order_quantity : Infinity,
    // ---
    displayPrice: merged.display_price,
    defaultPaymentPeriod: merged.default_payment_period,
    hasFreeTrial:
      merged.trial_supported &&
      merged.trial_end_action &&
      merged.trial_force &&
      [TrialEndActionTypes.CANCEL].includes(merged.trial_end_action),

    hasDiscount:
      some(merged.prices, "price_discounted") ||
      some(merged.prices, "mixed_promotions"),
  };
};

export const parseTerms = (
  raw: any,
  promotionDisplayType: PromotionDisplayTypes
) => {
  const { getBillingCycle } = useSystem();

  return map(orderBy(raw, "billing_cycle_months"), rawTerm => {
    // Pick only the properties we need

    const term: any = {
      cycle: rawTerm.billing_cycle_months,
      mixedPromotions: rawTerm.mixed_promotions,
      // ---
      monthlyPriceFromDiscounted: rawTerm.monthly_price_from_discounted,
      monthlyPriceFromDiscountedFormatted:
        rawTerm.monthly_price_from_discounted_formatted,
      monthlyPriceFrom: rawTerm.monthly_price_from,
      monthlyPriceFromFormatted: rawTerm.monthly_price_from_formatted,

      price: rawTerm.price,
      priceDiscounted: rawTerm.price_discounted,
      priceDiscountedFormatted: rawTerm.price_discounted_formatted,
      priceFormatted: rawTerm.price_formatted,
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
  promotionDisplayType: PromotionDisplayTypes,
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
        short_description: useTranslateField(
          rawSubproduct.category,
          "short_description"
        ),
        multiple: rawSubproduct.category.multiple,
        required: rawSubproduct.category.required,
        price_override: rawSubproduct.category.price_override,
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
        id: rawSubproduct.id,
        name: useTranslateName(rawSubproduct),
        description: useTranslateField(rawSubproduct, "description"),
        shortDescription: useTranslateField(rawSubproduct, "short_description"),
        quantifiable: rawSubproduct.order_type == 2,
        cycle: rawSubproduct.billing_cycle_months,
        step: rawSubproduct.unit_quantity,
        min: rawSubproduct.min_order_quantity || rawSubproduct.unit_quantity,
        max:
          rawSubproduct.max_order_quantity > 0
            ? rawSubproduct.max_order_quantity
            : Infinity,
        prices: map(rawSubproduct.prices, rawPrice => {
          const price: any = {
            mixedPromotions: rawPrice.mixed_promotions,
            cycle: rawPrice.billing_cycle_months,
            price: rawPrice.price,
            priceDiscounted: rawPrice.price_discounted,
            priceFormatted: rawPrice.price_formatted,
            priceDiscountedFormatted: rawPrice.price_discounted_formatted,
          };

          const cycle = getBillingCycle(price.cycle);
          price.name = cycle ? useTranslateName(cycle) : null;

          price.promotions = parsePromotion(rawPrice, promotionDisplayType);

          return price;
        }),
      };

      // First, try get a one off price, othrwise try find the matching term price
      value.price =
        find(value.prices, ["cycle", 0]) ||
        find(value.prices, ["cycle", cycle]);

      values.push(value);
      set(option, "values", values);

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
  promotionDisplayType: PromotionDisplayTypes
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
        shortDescription: useTranslateField(rawPromo, "short_description"),
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
        amount_formatted:
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
  };
};

// ---

export const parseSummary = (raw: any, { model, lookups, error }: any) => {
  // this is an array of  key value pairs that can be used to display a summary of the configuration
  // typically used in the basket or checkout
  // it is in this format to preserve the order of the configuration
  // an d allow for easy i18n
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

  //  product meta

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

  return {
    regularPrice: raw.total,
    regularPriceFormatted: raw.total_formatted,
    currentPrice: raw?.discounted || raw.total,
    currentPriceFormatted: raw?.discounted_formatted || raw.total_formatted,
    hasDiscount: raw.discounted && raw.total !== raw.discounted,
    details,
  };
};

const parseSummaryTerm = (data: any, terms: any, error?: any) => {
  const term = find(terms, [
    "billing_cycle_months",
    data?.billing_cycle_months,
  ]);

  if (term) {
    // NB: only show term pricing if recurring!
    return {
      key: "term",
      category: "Billing Cycle",
      name: term.billing_cycle_name,
      cycle: term.billing_cycle_months,
      quantity: data?.quantity,
      currentPrice: term.price_discounted,
      currentPriceFormatted: term.price_discounted_formatted,
      regularPrice: term?.price,
      regularPriceFormatted: term.price_formatted,
      hasDiscount: term?.price_discounted > 0,
      invalid: !isEmpty(error),
    };
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
                currentPrice: subproduct.price_discounted,
                currentPriceFormatted: subproduct.price_discounted_formatted,
                regularPrice: subproduct?.price,
                regularPriceFormatted: subproduct.price_formatted,
                hasDiscount: subproduct?.price_discounted > 0,
                invalid: has(error, `${key}.${id}`),
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
        invalid: some(error, ["data.schemaPath", key]),
        cycle: undefined,
        quantity: undefined,
        currentPrice: undefined,
        currentPriceFormatted: undefined,
        regularPrice: undefined,
        regularPriceFormatted: undefined,
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
    // id: raw.id,
    quantity: raw?.quantity || 1,
    productId: raw.productId,
    term: raw.term,
    options: raw.options,
    attributes: raw.attributes,
    provisionFields: raw.provision_fields,
    subproducts: raw.sub_pids,
  };
};

export const parseBasketProductModel = (raw: any): ProductModel => {
  // map basket product raw
  return {
    // id: raw.id,
    quantity: raw.quantity,
    productId: raw.productId,
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
        debugger;
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

// --------------------------------------------------------

export function buildBasketItem(
  model: ProductConfigContext["model"],
  promotions?: ProductConfigContext["promotions"]
): BasketProductConfig {
  // strip out any falsy values
  return {
    product_id: model?.productId,
    quantity: model?.quantity,
    billing_cycle_months: model?.term,
    // ---
    attributes: reduce(
      model?.attributes,
      (result, attribute) => {
        if (attribute) {
          const selected = values(
            mapValues(attribute, choice => ({
              product_id: choice?.productId,
              quantity: choice?.quantity,
              billing_cycle_months: choice?.cycle,
            }))
          );
          // @ts-ignore
          result.push(...selected);
        }
        return result;
      },
      []
    ),
    options: reduce(
      model?.options,
      (result, option) => {
        if (option) {
          const selected = values(
            mapValues(option, choice => ({
              product_id: choice?.productId,
              quantity: choice?.quantity,
              billing_cycle_months: choice?.cycle,
            }))
          );
          // @ts-ignore
          result.push(...selected);
        }
        return result;
      },
      []
    ),
    provision_field_values: model.provisionFields || [],
    promotions, //NB do we need t opass the current promotions here?
    // ---
  } as BasketProductConfig;
}
