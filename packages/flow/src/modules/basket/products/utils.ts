// ---internal
import { useBrand } from "../../brand";
const { getBillingCycle } = useBrand();

// --- utils
import {
  forEach,
  get,
  isArray,
  isEmpty,
  isNil,
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

export const useProductOptionsParser = (data: any) => {
  // this is quite complex...we have to do the followg steps:
  //  get the available product options
  //    a) get the available product option as a category
  //    b) map the category options
  //    c) remove any options that don't have any prices
  //    d) sort the options by the attached order

  return data;
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

export const useProductParser = (data: any) => {
  // todo pick only the properties we need
  return omit(data, ["prices", "products_attributes", "products_options"]);
};

export const useProductValuesParser = (data: any) => {
  // todo, map these safetly
  return data;
};

export const useProductConfigParser = (data: any) => {
  // strip out any falsy values
  return {
    product_id: data?.productId,
    quantity: data?.quantity,
    billing_cycle_months: data?.term,
    // ---
    attributes: reduce(
      data?.attributes,
      (result, value, attribute) => {
        if (value) {
          value = isArray(value) ? value : [value];
          forEach(value, product_id => result.push({ product_id }));
        }
        return result;
      },
      []
    ),
    // options: data?.options,
    // promotions: data?.promtions,
    // ---
    start_trial: !!data?.start_trial
  };
};

// --------------------------------------------------------
