// --- internal
import { useSystem } from "../system";
import { TrialEndActionTypes } from "./services";

// --- utils
import { useTranslateName } from "../../utils";
import {
  find,
  forEach,
  get,
  isEmpty,
  isNil,
  isObject,
  isString,
  map,
  mapValues,
  omit,
  omitBy,
  orderBy,
  pick,
  reduce,
  set,
  some,
  toNumber,
  values,
} from "lodash-es";

// --- types
import { PromotionDisplayTypes } from "./services";
import type { IProductModel } from "./types.d";
// --------------------------------------------------------
// Parsing Models for an Item/Product that is queued/configuring for the basket

// --------------------------------------------------------
export const checkPriceOverride = (values, lookups) => {
  return some(values, (value, key) => {
    const { price_override = false } = find(lookups, ["id", key]);
    // make sure we only apply this IF this value is actually selected, ie has a value and is not empty
    return !isEmpty(value) && !!price_override;
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

export const parseProduct = (data: any) => {
  // Pick only the properties we need
  const product = pick(data, [
    "id",
    "name",
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

export const useTermsParser = (
  data: any,
  promotion_display_type: PromotionDisplayTypes
) => {
  const { getBillingCycle } = useSystem();

  // 1. sort the terms by billing_cycle_months
  const terms = orderBy(data, "billing_cycle_months");

  return map(terms, rawTerm => {
    // Pick only the properties we need
    const term = pick(rawTerm, [
      "billing_cycle_months",
      "mixed_promotions",
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
          "multiple",
          "required",
          "price_override",
        ])
      );
      option.name = useTranslateName(rawSubproduct.category);
      // get the prev values...if there are any
      const values = get(option, "values", []);

      // add this raw option to the values, with limited properties
      const value = pick(rawSubproduct, [
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
      value.canChangeQuantity = rawSubproduct.order_type == 2;

      // get the prices for this subproduct
      value.prices = map(rawSubproduct.prices, rawPrice => {
        const price = pick(rawPrice, [
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
        if (value.price) values.push(value);
      } else if (!value?.billing_cycle_months) {
        // otherwise set the updated values if we DON'T have a billing cycle
        // this is so products with no billing cycle doesnt show subproducts that do
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
      const promo = pick(rawPromo, ["amount", "amount_formatted", "code"]);
      promo.name = useTranslateName(rawPromo);
      promo.display = promotion_display_type;
      promo.mixed = data.mixed_promotions;
      return promo;
    });
  } else {
    const saving =
      ((data.price - (data.price_discounted || data.price)) / data.price) * 100;
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
    if (field.required) required.push(field.name);

    let type = "string";
    let format = field?.semantic_type;

    // lets map our field types...
    switch (field.type) {
      case "input_number":
        type = "number";
        break;
      case "input-checkbox":
        type = "boolean";
        break;
      case "input_date":
        type = "string";
        format = "date";
        break;
      case "input_datetime":
        type = "string";
        format = "date-time";
        break;
      case "input_email":
        type = "string";
        format = "email";
        break;
      case "input_url":
        type = "string";
        format = "uri";
        break;
      case "input_phone":
        type = "string";
        format = "phone";
        break;
      case "input_ip":
        type = "string";
        format = "ipv4";
        break;
      case "input_ipv6":
        type = "string";
        format = "ipv6";
        break;

      default:
        type = "string";
        break;
    }

    const schema = {
      type,
      format,
      title: field.field_label,
      description: field.description,
      default: field.default,
      enum: !some(field.options, isString) ? undefined : field.options,
      oneOf: !some(field.options, isObject)
        ? undefined
        : map(field.options, item => {
            return {
              const: item.value,
              title: item.label,
            };
          }),
      // ---
      defer: field?.deferrable ? field?.defer_mode : undefined,
    };

    set(properties, field.name, omitBy(schema, isNil));
  });

  // return a fully formed json schema
  return {
    type: "object",
    properties,
    required,
  };
};

// ---

export const parseSummary = ({ summary, model, lookups }) => {
  // this is an array of  key value pairs that can be used to display a summary of the configuration
  // typically used in the basket or checkout
  // it is in this format to preserve the order of the configuration
  // an d allow for easy i18n
  const details = [];

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
    });
  }

  // attributes
  const attributes = parseSummarySubproduct(
    "attribute",
    model.attributes,
    lookups.attributes
  );
  details.push(...attributes);

  // options
  const options = parseSummarySubproduct(
    "option",
    model.options,
    lookups.options
  );
  details.push(...options);

  // provision fields
  reduce(
    model.provision_fields,
    (result, name, field) => {
      result.push({
        key: `provision_field.${field}`,
        category: get(
          lookups.provision_fields,
          ["properties", field, "title"],
          field
        ),
        name,
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
  lookup: Array<any>
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
              });
            }

            return result;
          },
          []
        );
        result.push(...selected);
      }
      return result;
    },
    []
  );
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
  ]);
};

export const parseBasketProduct = (data: IBasketProduct): IProductModel => {
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
        unit_quantity: value.unit_quantity,
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

  // only add the id if it exists
  if (data?.id) set(config, "id", data.id);

  return config;
};

export const parseAddirtionalErrors = (error: any) => {
  if (error?.data) {
    error.message = "Validation error";

    const errors = [];

    forEach(error.data, (value, key) => {
      // because we have a specific schema for provision_fields, we dont need the prefix of the path
      const instancePath = key.replace("provision_field_values.", "");
      // handle any nested properties correctly, JSON schema would have them withing properties
      instancePath.replace(".", "/properties/");

      const newError = {
        instancePath: `/${instancePath}`, // AJV style path to the property in the schema
        message: value.toString(), // in case the message is an array
        // --- optional
        schemaPath: "",
        keyword: "",
        params: {},
      };
      errors.push(newError);
    });

    error.data = errors;
  }

  return error;
};
