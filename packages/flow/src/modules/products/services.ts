// --- external

// --- internal
import { useApi } from "../api";
import { useBrand, BrandConfigKeys } from "../brand";

import type { ProductConfigContext } from "./types";

// --- utils
import { useTime } from "../../utils";
import { useQuantityParser, useHasPriceOverride } from "./utils";

import {
  defaultsDeep,
  find,
  first,
  get,
  isEmpty,
  isNil,
  isNumber,
  isObject,
  keys,
  map,
  mapValues,
  maxBy,
  minBy,
  pick,
  pickBy,
  reduce,
  set,
  some,
  sum,
  sumBy,
  values as objectValues
} from "lodash-es";

// --------------------------------------------------------
// ENUMS

export enum DefaultPaymentPeriod {
  INHERIT_FROM_BRAND = 0,
  LOWEST_PRICE = 1,
  LOWEST_MONTHLY_PRICE = 2,
  HIGHEST_PRICE = 3
}

export enum TrialEndActionTypes {
  CONTINUE = 0,
  MIGRATE = 1,
  CANCEL = 2
}
export enum PromotionDisplayTypes {
  NAME = "name",
  LABEL = "label",
  PERCENTAGE = "percentage"
}

// --------------------------------------------------------
// HELPERS

async function calculateBillingTerm(
  period: DefaultPaymentPeriod,
  availableTerms: any
) {
  // because we have multiple options, we need to select one base don the following strategy:

  const { getConfig } = useBrand();

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

async function getProduct(
  { values, currency_id, promotions }: ProductConfigContext,
  _event: any
) {
  const { product_id } = values;
  if (!product_id) return Promise.reject("No Product ID provided");

  const { get, useUrl } = useApi();
  const productPromise = get({
    url: useUrl(`basket/products/${product_id}`, {
      currency_id,
      promotions: map(promotions, "promotion.code"), // ensure we pass any applied promotions to get the correct prices
      with_staged_imports: true,
      with: [
        "image",
        "images",
        "prices",
        "products_attributes",
        "products_options",
        "products_options.prices",
        "provision_field_values"

        // "provision_blueprint"

        // "allowed_migrations",
        // "allowed_migrations.migration_product",
        // "category.top_category.top_category.top_category.top_category",
        // "import.credentials",
        // "import.source",
        // "set_products"
        // "sets",
        // "trial_migration_rule",
        // "trial_migration_rule.new_product",
        // "trial_migration_rule.new_product.prices"
      ].join()
    }),
    useCache: true,
    maxAge: useTime()?.DAY, // product data is not updated often, so we can cache for a day
    withAccessToken: true
  }).then(({ data }) => data);

  // lets get our provision_fields fields early, so we can make them available
  const provisioningPromise = getProvisioningFields({ values }, _event);

  return Promise.all([productPromise, provisioningPromise]).then(
    ([product, provision_fields]) => {
      set(product, "products_provisioning", provision_fields);
      return product;
    }
  );
}

// ---

async function getProvisioningFields(
  { values }: ProductConfigContext,
  _event: any
) {
  const { get, useUrl } = useApi();
  const { product_id } = values;

  // we dont cache provision_fields fields, as they can change with diferent options/attributes being selected
  return get({
    url: useUrl(`basket/products/${product_id}/provision_fields`),
    useCache: false,
    withAccessToken: true
  }).then(({ data }) => data);
}

async function checkProvisioning(
  { available, values }: ProductConfigContext,
  _event: any
) {
  // safety check, resolve if we have no attributes to check
  if (!available?.provision_fields?.length) {
    return Promise.resolve([]);
  }

  const errors = [];

  const provision_fields = reduce(
    available.provision_fields,
    (result, field, index) => {
      // try get any selected values for this provision_fields,
      let selected = get(values, `provision_fields.${field.name}`, null);

      // todo: validation

      // if we have selected values, ensure they are valid and fully formed
      // if (!isEmpty(selected)) {
      //   // only include valid values, stripping out any invalid ones, if we have any
      //   selected = pickBy(selected, (_value, id) =>
      //     some(field.values, ["id", id])
      //   );

      //   // then parse each selected value, and ensure it has all its required attributes
      //   // and that it has valid values for each of those attributes
      //   selected = mapValues(selected, (value, id) => {
      //     // ensure we have an object
      //     if (!isObject(value)) value = { product_id: id };
      //     const product = find(field.values, ["id", value.product_id]);

      //     //  ensure we have the required attributes
      //     value = defaultsDeep(value, {
      //       billing_cycle_months: values?.term,
      //       unit_quantity: 1
      //     });

      //     // ensure we have a valid unit_quantity
      //     value.unit_quantity = useQuantityParser(
      //       value?.unit_quantity,
      //       product
      //     );

      //     return value;
      //   });
      // }

      // check if we are missing required field
      if (field?.required && isEmpty(selected))
        errors.push({ message: "Is required", field });

      // ---
      set(result, field.name, selected);
      // if (selected) set(result, field.name, selected);
      // else unset(result, field.name);
      return result;
    },
    {}
  );

  return new Promise((resolve, reject) => {
    if (errors?.length) reject({ provision_fields, errors });
    else resolve(provision_fields);
  });
}

// ---

async function checkQuantity(
  { available, values }: ProductConfigContext,
  _event: any
) {
  const { product } = available;
  let { quantity } = values;
  // ---
  quantity = useQuantityParser(quantity, product);

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
  let term;

  if (!available?.terms?.length) {
    return Promise.reject("No Terms available");
  }

  // ---
  // try ge the full term object from the available terms
  term = find(available.terms, ["billing_cycle_months", values.term]);

  if (!term) {
    if (available.terms.length === 1) {
      term = first(available.terms);
    } else {
      term = await calculateBillingTerm(
        available.product.default_payment_period,
        available.terms
      );
    }
  }

  // now just return the billing_cycle_months, if we have one
  // term = get(term, "billing_cycle_months", null);
  term = pick(term, ["billing_cycle_months", "price"]);

  return new Promise((resolve, reject) => {
    if (!isNil(term)) resolve(term);
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
      let selected = get(values, `attributes.${attribute.id}`, {});

      // only include valid values, if we have any
      if (!isEmpty(selected)) {
        selected = pickBy(selected, (_value, id) =>
          some(attribute.values, ["id", id])
        );

        // then parse each selected value, and ensure it has all its required attributes
        // and that it has valid values for each of those attributes
        selected = mapValues(selected, (value, id) => {
          // ensure we have an object
          if (!isObject(value)) value = { product_id: id };
          const product = find(attribute.values, ["id", value.product_id]);

          //  ensure we have the required attributes
          value = defaultsDeep(value, {
            billing_cycle_months: values?.term?.billing_cycle_months,
            unit_quantity: 1
          });

          // ensure we have a valid unit_quantity
          value.unit_quantity = useQuantityParser(
            value?.unit_quantity,
            product
          );

          value.price = find(product.prices, [
            "billing_cycle_months",
            value.billing_cycle_months
          ]);

          value.total = value.unit_quantity * (value.price?.price || 0);

          value.total_discounted =
            value.unit_quantity * (value.price?.price_discounted || 0);

          return value;
        });
      }

      // check if we are missing required attribute
      if (attribute?.required && isEmpty(selected))
        errors.push({ message: "Is required", attribute });

      // check if we values too many values for this attribute
      if (!attribute?.multiple && keys(selected)?.length > 1) {
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

async function checkOptions(
  { available, values }: ProductConfigContext,
  _event: any
) {
  // safety check, resolve if we have no attributes to check
  if (!available?.options?.length) {
    return Promise.resolve([]);
  }

  const errors = [];

  const options = reduce(
    available.options,
    (result, option, index) => {
      // try get any selected values for this option,

      let selected = get(values, `options.${option.id}`, {});

      // if we have selected values, ensure they are valid and fully formed
      if (!isEmpty(selected)) {
        // only include valid values, stripping out any invalid ones, if we have any
        selected = pickBy(selected, (_value, id) =>
          some(option.values, ["id", id])
        );

        // then parse each selected value, and ensure it has all its required attributes
        // and that it has valid values for each of those attributes
        selected = mapValues(selected, (value, id) => {
          // ensure we have an object
          if (!isObject(value)) value = { product_id: id };
          const product = find(option.values, ["id", value.product_id]);

          //  ensure we have the required attributes
          value = defaultsDeep(value, {
            billing_cycle_months: values?.term?.billing_cycle_months,
            unit_quantity: 1
          });

          // ensure we have a valid unit_quantity
          value.unit_quantity = useQuantityParser(
            value?.unit_quantity,
            product
          );

          value.price = find(product.prices, [
            "billing_cycle_months",
            value.billing_cycle_months
          ]);

          value.total = value.unit_quantity * (value.price?.price || 0);

          value.total_discounted =
            value.unit_quantity * (value.price?.price_discounted || 0);

          return value;
        });
      }

      // check if we are missing required option
      if (option?.required && isEmpty(selected))
        errors.push({ message: "Is required", option });

      // check if we values too many values for this option
      if (!option?.multiple && keys(selected)?.length > 1) {
        errors.push({ message: "Multiple choice not allowed", option });
      }
      // ---
      set(result, option.id, selected);
      return result;
    },
    {}
  );

  return new Promise((resolve, reject) => {
    if (errors?.length) reject({ options, errors });
    else resolve(options);
  });
}

// --------------------------------------------------------
// This is a relatively expensive operation,
// ineffect we are calculating the price of the item based on its configuration
// We use the values that have been selected alongside the available data
// and based on the combination of those values, we calculate the price
// The really tricky bit is the fact that options can have price overrides,
// so its not always as simple as just adding up the prices of the selected options
// If we do have price overrides, we then just reset the term price to 0
// thats WHY we have an object of prices, so we can easily remove the term price
// and then just sum the rest of the prices values
async function calculateSummary(
  { available, values, summary, currency_id }: BasketContext,
  _event: any
) {
  const { post, useUrl } = useApi();
  // ---
  let prices = {
    term: { subtotal: 0, total: 0, discount: 0 },
    attributes: { subtotal: 0, total: 0, discount: 0 },
    options: { subtotal: 0, total: 0, discount: 0 }
  };
  // ---
  // only calculate the term price if we dont have any price overrides
  if (!useHasPriceOverride(values.options, available.options)) {
    const term = find(available.terms, [
      "billing_cycle_months",
      values.term?.billing_cycle_months
    ]);
    const subtotal = values.quantity * term?.price || 0;
    const total = values.quantity * term?.price_discounted || 0;
    const discount = total ? subtotal - total : 0;
    prices.term.discount += discount;
    prices.term.subtotal += discount ? subtotal : 0;
    prices.term.total += discount ? total : subtotal; // cater for no discount
  }
  //  ---
  prices.attributes = reduce(
    values.attributes,
    (result, attribute, id) => {
      const subtotal = sumBy(objectValues(attribute), "total") || 0;
      const total = sumBy(objectValues(attribute), "total_discounted") || 0;
      const discount = subtotal - total;
      result.discount += discount;
      result.subtotal += discount ? subtotal : 0;
      result.total += discount ? total : subtotal; // cater for no discount
      return result;
    },
    { subtotal: 0, total: 0, discount: 0 }
  );
  // ---
  prices.options = reduce(
    values.options,
    (result, option, id) => {
      const subtotal = sumBy(objectValues(option), "total") || 0;
      const total = sumBy(objectValues(option), "total_discounted") || 0;
      const discount = total ? subtotal - total : 0;
      result.discount += discount;
      result.subtotal += discount ? subtotal : 0;
      result.total += discount ? total : subtotal; // cater for no discount
      return result;
    },
    { subtotal: 0, total: 0, discount: 0 }
  );

  // ---
  const subtotalPromise = await post({
    url: useUrl("cart/calculate", {}),
    withAccessToken: true,
    data: {
      currency_id,
      prices: [
        prices.term.subtotal,
        prices.attributes.subtotal,
        prices.options.subtotal
      ]
    }
  }).then(({ data }) => data);

  const discountPromise = await post({
    url: useUrl("cart/calculate", {}),
    withAccessToken: true,
    data: {
      currency_id,
      prices: [
        prices.term.discount,
        prices.attributes.discount,
        prices.options.discount
      ]
    }
  }).then(({ data }) => data);

  const totalPromise = await post({
    url: useUrl("cart/calculate", {}),
    withAccessToken: true,
    data: {
      currency_id,
      prices: [prices.term.total, prices.attributes.total, prices.options.total]
    }
  }).then(({ data }) => data);

  return Promise.all([subtotalPromise, discountPromise, totalPromise]).then(
    ([subtotal, discount, total]) => {
      const newSummary = {
        currency_id: summary?.currency_id,
        subtotal: subtotal?.total,
        subtotalFormatted: subtotal?.total_formatted,
        discount: discount?.total,
        discountFormatted: discount?.total_formatted,
        total: total?.total,
        totalFormatted: total?.total_formatted
      };
      return newSummary;
    }
  );
}

// --------------------------------------------------------
// EXPORTS

export default <Object>{
  getProduct,
  // ---
  checkQuantity,
  checkTerm,
  checkAttributes,
  checkOptions,
  checkProvisioning,
  // ---
  calculateSummary
};
