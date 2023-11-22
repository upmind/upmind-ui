// ---internal
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
  values
} from "lodash-es";
// --------------------------------------------------------
// Parsing Models for an Item/Product that is queued/configuring for the basket

// check for a translated name, if it exists, use it, otherwise use the default
const translateName = item => item?.name_translated || item.name;

// --------------------------------------------------------
export const useHasPriceOverride = (values, available) => {
  return some(values, (value, key) => {
    const { price_override = false } = find(available, ["id", key]);
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
    "provision_blueprint_id"
  ]);

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

  return product;
};

export const useTermsParser = (data: any) => {
  const { getBillingCycle } = useSystem();

  // 1. sort the terms by billing_cycle_months
  const terms = orderBy(data, "billing_cycle_months");
  getBillingCycle;

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
      "price_formatted"
    ]);

    // --------------------------------------------------------
    // Ensure the name is set

    term.billing_cycle_name = getBillingCycle(rawTerm.billing_cycle_months)
      ?.name;

    // --------------------------------------------------------
    // then add some syntactic sugar / computed properties

    //  product.hasSavings = some(
    //    data.prices,
    //    ({ price, discountedPrice }) =>
    //      ((price - discountedPrice) / price) * 100
    //  );

    // --- Coupon Syntax Sugar

    term.coupons = map(rawTerm.promotions, promo => `'${promo.code}'`);

    // --- Savings Syntax Sugar - When promotion has been applied
    term.saving = !isNil(term.price_discounted)
      ? ((term.price - term.price_discounted) / term.price) * 100
      : 0;

    term.saving_formatted = `${Math.round(term.saving)}%`;

    return term;
  });
};

export const useAttributesParser = (data: any) => {
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
  const attributes = reduce(
    sorted,
    (result, rawAttribute) => {
      // create the attribute based on the category ... if it isnt already set
      const attribute = get(
        result,
        rawAttribute.category_id,
        pick(rawAttribute.category, ["id", "name", "multiple", "required"])
      );
      attribute.name = translateName(rawAttribute.category);

      // get the prev values...if there are any
      const values = get(attribute, "values", []);

      // add this raw attribute to the values, with limited properties
      const value = pick(rawAttribute, ["id", "name"]);
      value.name = translateName(rawAttribute);
      value.canChangeQuantity = rawAttribute.order_type == 2;

      values.push(value);

      // then set the updated values
      set(attribute, "values", values);

      // finally  set the updated attribute
      set(result, rawAttribute.category_id, attribute);
      return result;
    },
    {}
  );

  // return just the values of the reduced object.
  return values(attributes);
};

export const useOptionsParser = (data: any) => {
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
          "price_override"
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
        "min_order_quantity"
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
          "promotions"
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
      defer: field?.deferrable ? field?.defer_mode : undefined
    };

    set(properties, field.name, omitBy(schema, isNil));
  });

  // return a fully formed json schema
  return {
    type: "object",
    properties,
    required
  };
};

// ---

export const useSummaryParser = (data: any) => {
  const summary = {
    discount: data?.configuration_total_discount_amount_converted,
    discountFormatted: data?.configuration_total_discount_amount_formatted,

    subtotal: data?.configuration_total_amount_converted,
    subtotalFormatted: data?.configuration_total_amount_formatted,

    total: data?.invoice_total_amount,
    totalFormatted:
      data?.invoice_total_amount_formatted || data?.total_formatted
  };

  return summary;
};

// --------------------------------------------------------
//  Setting Values for an Item that is configuring,
//  this may be a new item, or an existing item that has been added to the basket

export const useValuesParser = (data: any) => {
  // handle new product values
  const values = pick(data, [
    "quantity",
    "product_id",
    "term",
    "attributes",
    "options",
    "provision_fields"
  ]);
  // ---
  // handle existing products that have been added to the basket
  if (data?.id) {
    set(values, "id", data.id);
    set(values, "term", data.billing_cycle_months);
    set(values, "product_id", data.product_id);
    set(values, "attributes", useAddedAttributesParser(data.attributes));
    set(values, "options", useAddedOptionsParser(data.options)); // TODO:
    set(
      values,
      "provision_fields",
      useAddProvisioningParser(data.provision_fields)
    );
  }

  // ---
  return values;
};

// ---
const useAddedAttributesParser = (data: any) => {
  const attributes = reduce(
    data,
    (result, attribute) => {
      set(result, [attribute.product.category_id, attribute.product_id], {
        id: attribute?.id,
        product_id: attribute.product_id,
        unit_quantity: attribute.unit_quantity,
        billing_cycle_months: attribute.billing_cycle_months
      });
      return result;
    },
    {}
  );

  return attributes;
};

const useAddedOptionsParser = (data: any) => {
  const options = reduce(
    data,
    (result, option) => {
      set(result, [option.product.category_id, option.product_id], {
        id: option?.id,
        product_id: option.product_id,
        unit_quantity: option.unit_quantity,
        billing_cycle_months: option.billing_cycle_months
      });
      return result;
    },
    {}
  );
  return options;
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

export const useProductConfigParser = (data: any) => {
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
    start_trial: !!data?.start_trial
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
      // handle any nested properties correctly, JSOn schema would have them withing properties
      instancePath.replace(".", "/properties/");

      const newError = {
        instancePath: `/${instancePath}`, // AJV style path to the property in the schema
        message: value.toString(), // in case the message is an array
        // --- optional
        schemaPath: "",
        keyword: "",
        params: {}
      };
      errors.push(newError);
    });

    error.data = errors;
  }

  return error;
};
