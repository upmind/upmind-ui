// --- utils
import {
  filter,
  find,
  first,
  get,
  isArray,
  isEmpty,
  isNil,
  map,
  orderBy,
  pick,
  reject,
  set,
  uniqBy,
  unset,
  pickBy,
  identity
} from "lodash-es";
// --------------------------------------------------------
// Parsing Models for an Item/Product that is queued/configuring for the basket
export const useProductTermsParser = (data: any) => {
  // 1. sort the terms by billing_cycle_months
  let terms = orderBy(data, "billing_cycle_months");

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
  return data;
};

export const useProductParser = (data: any) => {
  return data;
};

export const useProductConfigParser = (data: any) => {
  // strip out any falsy values
  return pickBy(
    {
      product_id: data?.id,
      quantity: data?.unit_quantity,
      billing_cycle_months: data?.billing_cycle_months,
      // ---
      attributes: data?.attributes,
      options: data?.options,
      promotions: data?.promtions,
      // ---
      selling_price: data?.selling_price,
      total: data?.total,
      start_trial: data?.start_trial
    },
    identity
  );
};
