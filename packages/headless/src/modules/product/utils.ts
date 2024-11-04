// --- internal
import { useSystem } from "../system";
import { TrialEndActionTypes } from "./services";

// --- utils
import { useTranslateName, useTranslateField } from "../../utils";
import { parseProductSummary } from "../basket/utils";
import {
  find,
  forEach,
  get,
  has,
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
  pick,
  reduce,
  set,
  some,
  toNumber,
  values,
  includes,
} from "lodash-es";

// --- types
import { PromotionDisplayTypes } from "./services";
import type { IProductModel, ProductConfigContext } from "./types";
// --------------------------------------------------------
// Parsing Models for an Item/Product that is queued/configuring for the basket

// --------------------------------------------------------
export const checkPriceOverride = (values: any, lookups: any) => {
  return some(values, (value, key) => {
    const item = find(lookups, ["id", key]);

    // make sure we only apply this IF this value is actually selected, ie has a value and is not empty
    return !isEmpty(value) && !!item?.price_override;
  });
};

export const parseQuantity = (quantity: number, data: any) => {
  quantity = toNumber(quantity) || 1; // ensure we have a number;
  // Check the data is available
  // Check the quantity is valid,
  //  - min Quantity matches the data min
  //  - max Quantity matches the data max
  //  - quantity is a multiple of the data step
  // ensure the quantity is at least the min, or 1
  if (quantity < Math.max(data?.min_order_quantity, 1)) {
    quantity = Math.max(data?.min_order_quantity, 1);
  }

  // ensure the quantity is at most the max (if set)
  if (data?.max_order_quantity && quantity > data?.max_order_quantity) {
    quantity = data?.max_order_quantity;
  }

  // ensure the quantity is a multiple of the step (if set)
  if (data?.unit_quantity && quantity % data?.unit_quantity !== 0) {
    quantity = Math.ceil(quantity / data.unit_quantity) * data.unit_quantity;
  }

  return quantity;
};

export const parseProduct = (
  data: any,
  basket_product?: ProductConfigContext["basket_product"]
) => {
  // Pick only the properties we need
  const product: any = pick(merge({}, data, basket_product), [
    "id",
    "name",
    "service_identifier",
    "description",
    "short_description",
    // ---
    "image",
    "images",
    // ---
    "display_price",
    // ---
    "unit_quantity",
    "min_order_quantity",
    "max_order_quantity",
    // ---
    "provision_blueprint_id",
    "default_payment_period",
  ]);

  // ---
  // Ensure min values are set
  product.unit_quantity = product.unit_quantity || 1;
  product.min_order_quantity =
    product.min_order_quantity || product.unit_quantity;
  // ---
  // --------------------------------------------------------
  // then add some syntactic sugar / computed properties

  product.canChangeQuantity = data.order_type == 2;

  product.hasFreeTrial =
    data.trial_supported &&
    data.trial_end_action &&
    data.trial_force &&
    [TrialEndActionTypes.CANCEL].includes(data.trial_end_action);

  product.hasSavings = some(data.prices, "price_discounted");
  product.hasMixedPromotions = some(data.prices, "mixed_promotions");
  product.isOnPromotion = product.hasSavings || product.hasMixedPromotions;

  product.category = useTranslateName(data.category);
  return product;
};

export const parseTerms = (
  data: any,
  promotion_display_type: PromotionDisplayTypes
) => {
  const { getBillingCycle } = useSystem();

  // 1. sort the terms by billing_cycle_months
  const terms = orderBy(data, "billing_cycle_months");

  return map(terms, rawTerm => {
    // Pick only the properties we need
    const term: any = pick(rawTerm, [
      "billing_cycle_months",
      "mixed_promotions",
      "monthly_price_from_discounted",
      "monthly_price_from_discounted_formatted",
      "monthly_price_from",
      "monthly_price_from_formatted",
      "price",
      "price_discounted",
      "price_discounted_formatted",
      "price_formatted",
    ]);

    // --------------------------------------------------------
    // Ensure the name is set

    const cycle = getBillingCycle(rawTerm.billing_cycle_months);
    term.billing_cycle_name = cycle ? useTranslateName(cycle) : null;

    term.promotions = parsePromotion(rawTerm, promotion_display_type);

    return term;
  });
};

export const parseSubproduct = (
  data: any,
  promotion_display_type: PromotionDisplayTypes,
  billing_cycle_months?: number
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
      const option = get(
        result,
        rawSubproduct.category_id,
        pick(rawSubproduct.category, [
          "id",
          "name",
          "description",
          "short_description",
          "multiple",
          "required",
          "price_override",
        ])
      );
      option.name = useTranslateName(rawSubproduct.category);
      option.description = useTranslateField(
        rawSubproduct.category,
        "description"
      );
      option.short_description = useTranslateField(
        rawSubproduct.category,
        "short_description"
      );
      // get the prev values...if there are any
      const values = get(option, "values", []);

      // add this raw option to the values, with limited properties
      const value: any = pick(rawSubproduct, [
        "id",
        "name",
        "id",
        "order_type",
        "billing_cycle_months",
        "unit_quantity",
        "max_order_quantity",
        "min_order_quantity",
      ]);
      value.name = useTranslateName(rawSubproduct);
      value.description = useTranslateField(rawSubproduct, "description");
      value.short_description = useTranslateField(
        rawSubproduct,
        "short_description"
      );
      value.canChangeQuantity = rawSubproduct.order_type == 2;

      // get the prices for this subproduct
      value.prices = map(rawSubproduct.prices, rawPrice => {
        const price: any = pick(rawPrice, [
          "mixed_promotions",
          "billing_cycle_months",
          "price",
          "price_discounted",
          "price_formatted",
          "price_discounted_formatted",
        ]);

        const cycle = getBillingCycle(price.billing_cycle_months);
        price.billing_cycle_name = cycle ? useTranslateName(cycle) : null;

        price.promotions = parsePromotion(rawPrice, promotion_display_type);

        return price;
      });

      // check if we have a price for the current billing cycle ( if provided )
      if (!isNil(billing_cycle_months) && value.prices?.length) {
        // First, try get a one off price, if it exists
        value.price = find(value.prices, ["billing_cycle_months", 0]);

        // othrwise try find the matching term price
        if (!value.price)
          value.price = find(value.prices, [
            "billing_cycle_months",
            billing_cycle_months,
          ]);

        // finally...only include the value if we have a price
        // @ts-ignore
        if (value.price) values.push(value);
      } else if (!value?.billing_cycle_months) {
        // otherwise set the updated values if we DON'T have a billing cycle
        // this is so products with no billing cycle doesnt show subproducts that do
        // @ts-ignore
        values.push(value);
      }

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
  promotion_display_type: PromotionDisplayTypes
) => {
  //  Promotions can be display in one of 3 ways:
  //  - As a generic summary label with no values, eg "SAVE"
  //  - As a sumamry percentage, eg "Save 20%"
  //  - As individual names, eg ["20% off", "Black Friday"]
  // NB: we always supply the amouns so we can show meta data if needed, eg a tooltip

  // ---

  if (!data?.promotions?.length) return [];

  // ---

  if (promotion_display_type == PromotionDisplayTypes.NAME) {
    return map(data.promotions, rawPromo => {
      const promo: any = pick(rawPromo, ["amount", "amount_formatted", "code"]);
      promo.name = useTranslateName(rawPromo);
      promo.description = useTranslateField(rawPromo, "description");
      promo.short_description = useTranslateField(
        rawPromo,
        "short_description"
      );
      promo.display = promotion_display_type;
      promo.mixed = data.mixed_promotions;
      return promo;
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
        display: promotion_display_type,
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

export const parseSummary = ({ summary, model, lookups, error }: any) => {
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
    total: undefined,
    formatted: undefined,
    invalid: false,
  });

  //  product meta

  // term
  const term = find(lookups.terms, [
    "billing_cycle_months",
    model?.term?.billing_cycle_months,
  ]);

  if (term) {
    // NB: only show term pricing if recurring!
    details.push({
      key: "term",
      category: "Billing Cycle",
      name: term.billing_cycle_name,
      cycle: term.billing_cycle_months,
      quantity: model.quantity,
      discount: term.price_discounted,
      total: term.price,
      formatted: term.price_formatted,
      invalid: !isEmpty(error?.term),
    });
  }

  // attributes
  const attributes = parseSummarySubproduct(
    "attribute",
    model.attributes,
    lookups.attributes,
    error?.attributes
  );
  details.push(...attributes);

  // options
  const options = parseSummarySubproduct(
    "option",
    model.options,
    lookups.options,
    error?.options
  );
  details.push(...options);

  // provision fields
  reduce(
    lookups.provision_fields?.properties,
    (result, provisionField, key) => {
      result.push({
        key: `provision_field.${key}`,
        category: get(provisionField, "title", key),
        name: get(model.provision_fields, key),
        invalid: some(error?.provision_fields?.data, ["schemaPath", key]),
        cycle: undefined,
        quantity: undefined,
        discount: undefined,
        total: undefined,
        formatted: undefined,
      });

      return result;
    },
    details
  );

  return { ...summary, details };
};

export const parseSummarySubproduct = (
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
                discount: subproduct?.price?.price_discounted,
                total: subproduct?.price?.price,
                formatted: subproduct?.price?.price_formatted,
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

export const parseBasketProductSummary = (basket_product: any) => {
  const summary = parseProductSummary(basket_product);
  return {
    discount: summary?.discount,
    discount_formatted: summary?.discount_formatted,
    subtotal: summary?.subtotal,
    subtotal_formatted: summary?.subtotal_formatted,
    total: summary?.total,
    total_formatted: summary?.total_formatted,
  };
};

// --------------------------------------------------------
//  Setting Model for an Item that is configuring,
//  this may be a new item, or an existing item that has been added to the basket

export const parseModel = (data: any): IProductModel => {
  // handle  product model
  return pick(data, [
    "id",
    "quantity",
    "product_id",
    "term",
    "attributes",
    "options",
    "provision_fields",
    "sub_pids",
  ]);
};

export const parseBasketProduct = (data: any): IProductModel => {
  // map basket product data
  return {
    id: data.id,
    quantity: data.quantity,
    product_id: data.product_id,
    term: { billing_cycle_months: data.billing_cycle_months },
    options: mapSubproductChoices(data.options),
    attributes: mapSubproductChoices(data.attributes),
    provision_fields: data.provision_fields,
  };
};

// ---
const mapSubproductChoices = (values: any) => {
  return reduce(
    values,
    (result, value) => {
      set(result, [value.product.category_id, value.product_id], {
        product_id: value.product_id,
        unit_quantity: parseQuantity(value.unit_quantity, value.product),
        billing_cycle_months: value.billing_cycle_months,
      });
      return result;
    },
    {}
  );
};

// --------------------------------------------------------

export const buildBasketItem = (data: any) => {
  // strip out any falsy values
  const config = {
    product_id: data?.product_id,
    quantity: data?.quantity,
    billing_cycle_months: data?.term?.billing_cycle_months,
    // ---
    attributes: reduce(
      data?.attributes,
      (result, attribute) => {
        if (attribute) {
          const selected = values(
            mapValues(attribute, choice => omit(choice, ["price", "total"]))
          );
          // @ts-ignore
          result.push(...selected);
        }
        return result;
      },
      []
    ),
    options: reduce(
      data?.options,
      (result, option) => {
        if (option) {
          const selected = values(
            mapValues(option, choice => omit(choice, ["price", "total"]))
          );
          // @ts-ignore
          result.push(...selected);
        }
        return result;
      },
      []
    ),
    provision_field_values: data.provision_fields,
    // promotions: data?.promtions,
    // ---
    start_trial: !!data?.start_trial,
  };

  return config;
};
