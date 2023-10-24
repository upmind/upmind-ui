// --- external

// --- internal
import { useApi } from "../api";
import { useBrand, BrandConfigKeys } from "../brand";
const { getConfig } = useBrand();

import type { ProductConfigContext } from "./types.d";

// --- utils
import {
  filter,
  first,
  forEach,
  get,
  includes,
  intersectionWith,
  isArray,
  isEqual,
  isNumber,
  maxBy,
  minBy,
  reduce,
  set,
  some
} from "lodash-es";

// --------------------------------------------------------
// ENUMS

export enum DefaultPaymentPeriod {
  INHERIT_FROM_BRAND = 0,
  LOWEST_PRICE = 1,
  LOWEST_MONTHLY_PRICE = 2,
  HIGHEST_PRICE = 3
}

// --------------------------------------------------------
// HELPERS

async function calculateBillingTerm(
  period: DefaultPaymentPeriod,
  availableTerms: any
) {
  // because we have multiple options, we need to select one base don the following strategy:

  let term;

  const brandPaymentPeriod: DefaultPaymentPeriod | any = await getConfig(
    BrandConfigKeys.PRICE_TAX_PRICE_DEFAULT_PAYMENT_PERIOD
  ).then(response =>
    get(response, BrandConfigKeys.PRICE_TAX_PRICE_DEFAULT_PAYMENT_PERIOD)
  );

  switch (period) {
    case DefaultPaymentPeriod.HIGHEST_PRICE:
      term = maxBy(availableTerms, "price");
      break;
    case DefaultPaymentPeriod.LOWEST_PRICE:
      term = minBy(availableTerms, "price");
      break;
    case DefaultPaymentPeriod.LOWEST_MONTHLY_PRICE:
      term = minBy(availableTerms, "monthly_price_from");
      break;
    case DefaultPaymentPeriod.INHERIT_FROM_BRAND:
      term = await calculateBillingTerm(brandPaymentPeriod, availableTerms);
      break;

    default:
      term = first(availableTerms);
      break;
  }
  return term;
}

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data
// this will process the request and return a promise

async function getProduct({ values }: ProductConfigContext, _event: any) {
  const { productId } = values;

  if (!productId) return Promise.reject("No Product ID provided");

  const { get, useUrl } = useApi();
  return get({
    url: useUrl(`basket/products/${productId}`, {
      // promotions: "": todo,
      with_staged_imports: true,
      with: [
        "allowed_migrations",
        "allowed_migrations.migration_product",
        "category.top_category.top_category.top_category.top_category",
        "image",
        "images",
        "import.credentials",
        "import.source",
        "prices",
        "products_attributes",
        "products_options",
        "products_options.prices",
        "provision_blueprint",
        "set_products",
        "sets",
        "trial_migration_rule",
        "trial_migration_rule.new_product",
        "trial_migration_rule.new_product.prices"
      ].join()
    }),
    withAccessToken: true
  }).then(({ data }) => data);
}

async function checkQuantity(
  { available, values }: ProductConfigContext,
  _event: any
) {
  const { product } = available;
  let { quantity } = values;
  // ---

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

  return new Promise((resolve, reject) => {
    if (isNumber(quantity)) resolve(quantity);
    else reject("Invalid Quantity Selected");
  });
}

/**
 * This Checks if the Product has any/multiple Term/Billing Cycle
 * If there is no/one option, it will automatically select it
 * We will also check that any values option is valid
 * @param context
 * @param _event
 * @returns {Promise<void>}
 * We Reject any invalid or empty selections
 * We Resolve the valid Selected option
 */
async function checkTerm(
  { available, values }: ProductConfigContext,
  _event: any
) {
  let term = 0;

  if (!available?.terms?.length) {
    return Promise.resolve(term.billing_cycle_months);
  }

  // ---

  if (available.terms.length === 1) {
    term = first(available.terms);
  } else if (!values?.term) {
    term = await calculateBillingTerm(
      available.product.default_payment_period,
      available.terms
    );
  } else if (values?.term) {
    const valid = some(available.terms, values.term);
    if (valid) term = values.term;
  }

  return new Promise((resolve, reject) => {
    if (term) resolve(term.billing_cycle_months);
    else reject("Invalid Term Selected");
  });
}

async function checkAttributes(
  { available, values }: ProductConfigContext,
  _event: any
) {
  // safety check, resolve if we have no attributes to check
  if (!available?.attributes?.length) {
    return Promise.resolve([]);
  }

  const errors = [];

  // ---
  // for attributes we have to check a few things:
  // do we have any attributes that are:
  // required?
  // single vs multiple?
  // invalid : ie values but not actually available values
  // able to be auto values?

  // make sure we have a values object with only valid attribute values
  // let attributes = filter(values?.attributes, ({ product_id }) =>
  //   some(available.attributes, ({ values }) => includes(values, product_id))
  // );

  const attributes = reduce(
    available.attributes,
    (result, attribute, index) => {
      const selected = get(
        values,
        `attributes.${attribute.id}`,
        attribute?.multiple ? [] : null
      );

      // TODO: check if our values exists as an available option

      // check if we are missing required attribute
      if (attribute?.required && !selected?.length)
        errors.push({ message: "Is required", attribute });

      // check if we values too many values for this attribute
      if (!attribute?.multiple && isArray(selected) && selected?.length > 1) {
        errors.push({ message: "Multiple choice not allowed", attribute });
      }
      // ---
      set(result, attribute.id, selected);
      return result;
    },
    {}
  );

  return new Promise((resolve, reject) => {
    if (errors?.length) reject({ attributes, errors });
    else resolve(attributes);
  });
}

// --------------------------------------------------------
// EXPORTS

export default <Object>{
  getProduct,
  // ---
  checkQuantity,
  checkTerm,
  checkAttributes
};
