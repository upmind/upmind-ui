// ---internal
import { useBrand } from "../../brand";
const { getBillingCycle } = useBrand();

// --- utils
import {
  defaultsDeep,
  forEach,
  get,
  isArray,
  isEmpty,
  isNil,
  isString,
  map,
  omit,
  orderBy,
  pick,
  reduce,
  set,
  values
} from "lodash-es";
// --------------------------------------------------------
// Parsing Models for an Item/Product that is queued/configuring for the basket

// check for a translated name, if it exists, use it, otherwise use the default
const translateName = item => item?.name_translated || item.name;

// --------------------------------------------------------

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
  // TODO: pick only the properties we need
  const product = omit(data, [
    "prices",
    "products_attributes",
    "products_options"
  ]);
  product.canChangeQuantity = data.product_type == 2;

  return product;
};

export const useProductTermsParser = (data: any) => {
  // 1. sort the terms by billing_cycle_months
  let terms = orderBy(data, "billing_cycle_months");
  getBillingCycle;
  // 2. Parse the terms with
  //  - a limited number of properties
  //  - and some syntactic sugar
  return map(terms, rawTerm => {
    // --- Limit the properties
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

    term.billing_cycle_name = getBillingCycle(rawTerm.billing_cycle_months)
      ?.name;

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

export const useProductAttributesParser = (data: any) => {
  // safety check, bail if we have no data
  if (isEmpty(data)) return [];
  // When getting the attributes from the API, we get a flat list of attributes
  // We would rather have the attributes grouped by their category
  // And with each category having a list of attributes
  // so to do this we have to do the following:

  // 0. sort the data by attached_order for further lookups
  let sorted = orderBy(data, "attached_order");

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

export const useProductOptionsParser = (data: any) => {
  // safety check, bail if we have no data
  if (isEmpty(data)) return [];
  // When getting the attributes from the API, we get a flat list of attributes
  // We would rather have the attributes grouped by their category
  // And with each category having a list of attributes
  // so to do this we have to do the following:

  // 0. sort the data by attached_order for further lookups
  let sorted = orderBy(data, "attached_order");

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

export const useProductProvisioningParser = (data: any) => {};

// --------------------------------------------------------
//  Setting Values for an Item that is configuring,
//  this may be a new item, or an existing item that has been added to the basket

export const useProductValuesParser = (data: any) => {
  // handle new product values
  const values = pick(data, [
    "quantity",
    "productId",
    "term",
    "attributes",
    "options",
    "provisioning"
  ]);

  // ---
  // handle existing products that have been added to the basket
  if (data?.id) {
    set(values, "id", data.id);
    set(values, "term", data.billing_cycle_months);
    set(values, "productId", data.product_id);
    set(values, "attributes", useAddedAttributesParser(data.attributes));
    set(values, "options", useAddedOptionsParser(data.options)); // TODO:
    // set(values, "provisioning", null); // TODO:
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

// --------------------------------------------------------

export const useProductConfigParser = (data: any) => {
  // strip out any falsy values
  const config = {
    product_id: data?.productId,
    quantity: data?.quantity,
    billing_cycle_months: data?.term,
    // ---
    attributes: reduce(
      data?.attributes,
      (result, attribute) => {
        if (attribute) {
          result.push(...values(attribute));
        }
        return result;
      },
      []
    ),
    options: reduce(
      data?.options,
      (result, option) => {
        if (option) {
          result.push(...values(option));
        }
        return result;
      },
      []
    ), // promotions: data?.promtions,
    // ---
    start_trial: !!data?.start_trial
  };

  // only add the id if it exists
  if (data?.id) set(config, "id", data.id);

  return config;
};
