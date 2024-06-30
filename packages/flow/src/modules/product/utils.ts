// --- internal
import { useSystem } from "../system";
import { TrialEndActionTypes } from "./services";
// --- utils
import {
  find,
  forEach,
  get,
  isEmpty,
  isNil,
  map,
  mapValues,
  omit,
  omitBy,
  orderBy,
  pick,
  reduce,
  set,
  some,
  values,
} from "lodash-es";
// --------------------------------------------------------
// Parsing Models for an Item/Product that is queued/configuring for the basket

// check for a translated name, if it exists, use it, otherwise use the default
const translateName = item => item?.name_translated || item.name;

// --------------------------------------------------------
export const useHasPriceOverride = (values, lookups) => {
  return some(values, (value, key) => {
    const { price_override = false } = find(lookups, ["id", key]);
    // make sure we only apply this IF this value is actually selected, ie has a value and is not empty
    return !isEmpty(value) && !!price_override;
  });
};

export const useQuantityParser = (quantity: number, data: any) => {
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

export const useProductParser = (data: any) => {
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

  product.category = translateName(data.category);
  return product;
};

export const useTermsParser = (data: any) => {
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

    term.billing_cycle_name = getBillingCycle(
      rawTerm.billing_cycle_months
    )?.name;

    // --------------------------------------------------------
    // then add some syntactic sugar / computed properties

    //  product.hasSavings = some(
    //    data.prices,
    //    ({ price, discountedPrice }) =>
    //      ((price - discountedPrice) / price) * 100
    //  );

    // --- Coupon Syntax Sugar

    term.promotions = map(rawTerm.promotions, promo => `'${promo.code}'`);

    // --- Savings Syntax Sugar - When promotion has been applied
    term.saving = !isNil(term.price_discounted)
      ? ((term.price - term.price_discounted) / term.price) * 100
      : 0;

    term.saving_formatted = `${Math.round(term.saving)}%`;

    return term;
  });
};

export const useSubproductParser = (data: any) => {
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
    (result, rawOption) => {
      // create the option based on the category ... if it isnt already set
      const option = get(
        result,
        rawOption.category_id,
        pick(rawOption.category, [
          "id",
          "name",
          "multiple",
          "required",
          "price_override",
        ])
      );
      option.name = translateName(rawOption.category);
      // get the prev values...if there are any
      const values = get(option, "values", []);

      // add this raw option to the values, with limited properties
      const value = pick(rawOption, [
        "id",
        "name",
        "id",
        "order_type",
        "unit_quantity",
        "max_order_quantity",
        "min_order_quantity",
      ]);
      value.name = translateName(rawOption);
      value.canChangeQuantity = rawOption.order_type == 2;

      // add the prices to the value, with limited properties
      value.prices = map(rawOption.prices, price =>
        pick(price, [
          "mixed_promotions",
          "billing_cycle_months",
          "price",
          "price_discounted",
          "price_formatted",
          "price_discounted_formatted",
          "promotions",
        ])
      );

      // then set the updated values
      values.push(value);

      set(option, "values", values);

      // finally  set the updated option
      set(result, rawOption.category_id, option);
      return result;
    },
    {}
  );

  // return just the values of the reduced object.
  return values(options);
};

export const useProvisioningParser = (data: any) => {
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
      description: field.description,
      default: field.default,
      enum: field.options?.length ? field.options : undefined,
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

export const useSummaryParser = ({ summary, prices, model }) => {
  // this is an array of  key value pairs that can be used to display a summary of the configuration
  // typically used in the basket or checkout
  // it is in this format to preserve the order of the configuration
  // an d allow for easy i18n
  const details = [];

  // term
  details.push({
    key: "term",
    category: "Billing Cycle",
    name: model.term.billing_cycle_name,
    cycle: model.term.billing_cycle_months,
    quantity: model.quantity,
    discount: prices.term.discount,
    total: prices.term.total,
    formatted: prices.term.formatted,
  });

  // attributes
  const attributes = useSummaryDetailsParser("attribute", model.attributes);
  details.push(...attributes);

  // options
  const options = useSummaryDetailsParser("option", model.options);
  details.push(...options);

  // provision fields
  reduce(
    model.provision_fields,
    (result, value, field) => {
      result.push({
        key: `provision_field.${field}`,
        category: field, // todo get field name
        name: value,
      });
      return result;
    },
    details
  );

  return { ...summary, details };
};

export const useSummaryDetailsParser = (key: string, data: any) => {
  return reduce(
    data,
    (result, choices) => {
      if (choices) {
        const selected = values(
          mapValues(choices, choice => {
            return {
              key,
              category: choice.category,
              name: choice.name,
              cycle: choice.billing_cycle_months,
              quantity: choice.unit_quantity,
              discount: choice.total_discounted,
              total: choice.total,
              formatted: choice.total_formatted,
            };
          })
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

export const useModelParser = (data: any) => {
  // handle new product model
  const model = pick(data, [
    "quantity",
    "product_id",
    "term",
    "attributes",
    "options",
    "provision_fields",
  ]);
  // ---
  // handle existing products that have been added to the basket
  if (data?.id) {
    // set(model, "id", data.id);
    set(model, "term", data.billing_cycle_months);
    set(model, "product_id", data.product_id);
    set(model, "attributes", useChoiceParser(data.attributes));
    set(model, "options", useChoiceParser(data.options));
    set(
      model,
      "provision_fields",
      useAddProvisioningParser(data.provision_fields)
    );
  }

  // ---
  return model;
};

// ---
const useChoiceParser = (values: any) => {
  return reduce(
    values,
    (result, value) => {
      set(result, [value.product.category_id, value.product_id], {
        id: value?.id,
        product_id: value.product_id,
        unit_quantity: value.unit_quantity,
        billing_cycle_months: value.billing_cycle_months,
        name: translateName(value.product),
        category: translateName(value.product.category),
      });
      return result;
    },
    {}
  );
};

const useAddProvisioningParser = (data: any) => {
  // const fields = reduce(
  //   data,
  //   (result, value, key) => {
  //     set(result, key, value);
  //     return result;
  //   },
  //   {}
  // );
  return data;
};

// --------------------------------------------------------

export const useBasketConfigParser = (data: any) => {
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

export const useValidationParser = (error: any) => {
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
