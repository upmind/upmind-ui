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

export const useProductParser = (data: any) => {
  // todo pick only the properties we need
  return omit(data, ["prices", "products_attributes", "products_options"]);
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
        pick(rawAttribute.category, [
          "id",
          "name",
          "name_translated",
          "multiple",
          "required"
        ])
      );

      // get the prev values...if there are any
      const values = get(attribute, "values", []);

      // add this raw attribute to the values, with limited properties
      const value = pick(rawAttribute, ["id", "name", "name_translated"]);
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
          "name_translated",
          "multiple",
          "required",
          "price_override"
        ])
      );

      // get the prev values...if there are any
      const values = get(option, "values", []);

      // add this raw option to the values, with limited properties
      const value = pick(rawOption, [
        "id",
        "name",
        "name_translated",
        "id",
        "order_type",
        "unit_quantity",
        "max_order_quantity",
        "min_order_quantity"
      ]);

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

export const useProductValuesParser = (data: any) => {
  // todo, map these safetly
  return data;
};

// --------------------------------------------------------

export const quantityParser = (quantity: number, product: any) => {
  console.log("quantityParser", quantity, product);

  // Check the product is available
  // Check the quantity is valid,
  //  - min Quantity matches the product min
  //  - max Quantity matches the product max
  //  - quantity is a multiple of the product step

  // ensure the quantity is at least the min, or 1
  if (quantity < Math.max(product.min_order_quantity, 1)) {
    quantity = Math.max(product.min_order_quantity, 1);
  }

  // ensure the quantity is at most the max (if set)
  if (product.max_order_quantity && quantity > product.max_order_quantity) {
    quantity = product.max_order_quantity;
  }

  // ensure the quantity is a multiple of the step (if set)
  if (product.unit_quantity && quantity % product.unit_quantity !== 0) {
    quantity =
      Math.ceil(quantity / product.unit_quantity) * product.unit_quantity;
  }

  return quantity;
};

// --------------------------------------------------------

export const useProductConfigParser = (data: any) => {
  // strip out any falsy values
  return {
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
};
