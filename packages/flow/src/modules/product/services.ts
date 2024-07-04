// --- external

// --- internal
import { useApi } from "../api";
import { useBrand, BrandConfigKeys } from "../brand";

import type { ProductConfigContext } from "./types.d";

// --- utils
import { useTime, useValidation } from "../../utils";
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
  pickBy,
  reduce,
  set,
  some,
  sumBy,
  values,
} from "lodash-es";

// --------------------------------------------------------
// ENUMS

export enum DefaultPaymentPeriod {
  INHERIT_FROM_BRAND = 0,
  LOWEST_PRICE = 1,
  LOWEST_MONTHLY_PRICE = 2,
  HIGHEST_PRICE = 3,
}

export enum TrialEndActionTypes {
  CONTINUE = 0,
  MIGRATE = 1,
  CANCEL = 2,
}
export enum PromotionDisplayTypes {
  NAME = "name",
  LABEL = "label",
  PERCENTAGE = "percentage",
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
      term = await getConfig(
        BrandConfigKeys.PRICE_TAX_PRICE_DEFAULT_PAYMENT_PERIOD
      ).then(config => {
        const period = get(
          config,
          BrandConfigKeys.PRICE_TAX_PRICE_DEFAULT_PAYMENT_PERIOD
        );
        return calculateBillingTerm(period, availableTerms);
      });

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

async function load(
  { model, currency_id, promotions }: ProductConfigContext,
  _event: any
) {
  const { product_id } = model;
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
        "provision_field_values",

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
      ].join(),
    }),
    useCache: true,
    maxAge: useTime()?.DAY, // product data is not updated often, so we can cache for a day
    withAccessToken: true,
  }).then(({ data }) => data);

  // lets get our provision_fields fields early, so we can make them lookups
  const provisioningPromise = loadProvisioningFields(product_id);

  return Promise.all([productPromise, provisioningPromise]).then(
    ([product, provision_fields]) => {
      set(product, "products_provisioning", provision_fields);
      return product;
    }
  );
}

async function loadProvisioningFields(product_id) {
  const { get, useUrl } = useApi();
  if (!product_id) return Promise.reject("No Product ID provided");
  // we dont cache provision_fields fields, as they can change with diferent options/attributes being selected
  return get({
    url: useUrl(`basket/products/${product_id}/provision_fields`),
    useCache: false,
    withAccessToken: true,
  }).then(({ data }) => data);
}
// ---

async function checkQuantity(
  { lookups, model }: ProductConfigContext,
  { data }: any
) {
  const { product } = lookups;
  let quantity = data?.quantity || model?.quantity;
  // ---
  quantity = useQuantityParser(quantity, product);

  return new Promise((resolve, reject) => {
    if (isNumber(quantity)) resolve({ quantity });
    else reject("Invalid Quantity Selected");
  });
}

async function checkTerm(
  { error, lookups, model }: ProductConfigContext,
  _event: any
) {
  let term = null;
  const price = { discount: 0, subtotal: 0, total: 0, formatted: null };
  const errors = [];
  // ---

  if (!lookups?.terms?.length) {
    return Promise.reject({
      term,
      price,
      error: { ...error, term: "No Terms available" },
    });
  }

  // ---
  // try ge the full term object from the lookups terms

  term = find(lookups.terms, [
    "billing_cycle_months",
    model?.term?.billing_cycle_months || model?.term,
  ]);

  if (!term) {
    if (lookups.terms.length === 1) {
      term = first(lookups.terms);
    } else {
      term = await calculateBillingTerm(
        lookups.product.default_payment_period,
        lookups.terms
      );
    }
  }

  if (isNil(term)) errors.push("Valid Term is required");

  // ---
  const subtotal = model.quantity * term?.price || 0;
  const total = model.quantity * term?.price_discounted || 0;
  const discount = total ? subtotal - total : 0;
  price.discount = discount;
  price.subtotal = discount ? subtotal : 0;
  price.total = discount ? total : subtotal; // cater for no discount
  price.formatted = term?.price_formatted;

  return new Promise((resolve, reject) => {
    if (errors.length)
      reject({ term, price, error: { ...error, term: errors } });
    else {
      resolve({ term, price });
    }
  });
}

async function checkAttributes(
  { error, lookups, model }: ProductConfigContext,
  _event: any
) {
  return checkSubproducts({ error, lookups, model }, { type: "attributes" });
}

async function checkOptions(
  { error, lookups, model }: ProductConfigContext,
  _event: any
) {
  return checkSubproducts({ error, lookups, model }, { type: "options" });
}

async function checkSubproducts(
  { error, lookups, model }: ProductConfigContext,
  { type }: any
) {
  let subproducts = null;
  const price = { discount: 0, subtotal: 0, total: 0, formatted: null };
  const errors = [];
  // ---
  // safety check, resolve if we have no attributes to check
  if (!lookups?.[type]?.length) {
    return Promise.resolve({
      subproducts,
      price,
    });
  }

  subproducts = reduce(
    lookups[type],
    (result, subproduct) => {
      // try get any selected values for this subproduct,

      let selected = get(model, `${type}.${subproduct.id}`, {});

      // if we have selected values, ensure they are valid and fully formed
      if (!isEmpty(selected)) {
        // only include valid values, stripping out any invalid ones, if we have any
        selected = pickBy(selected, (_value, id) =>
          some(subproduct.values, ["id", id])
        );

        // then parse each selected value, and ensure it has all its required attributes
        // and that it has valid values for each of those attributes
        selected = mapValues(selected, (value, id) => {
          // ensure we have an object
          if (!isObject(value)) value = { product_id: id };
          const product = find(subproduct.values, ["id", value.product_id]);
          //  ensure we have the required attributes
          value = defaultsDeep(value, {
            billing_cycle_months: some(product.prices, price => {
              return (
                price.billing_cycle_months === model?.term?.billing_cycle_months
              );
            })
              ? model?.term?.billing_cycle_months
              : first(product.prices)?.billing_cycle_months || 0,
            unit_quantity: 1,
          });

          // ensure we have a valid unit_quantity
          value.unit_quantity = useQuantityParser(
            value?.unit_quantity,
            product
          );

          value.price = find(product.prices, [
            "billing_cycle_months",
            value.billing_cycle_months,
          ]);

          value.total =
            value.unit_quantity * (value.price?.price || 0) * model.quantity;

          value.total_discounted =
            value.unit_quantity * (value.price?.price_discounted || 0);

          return value;
        });
      }

      // check if we are missing required subproduct
      if (subproduct?.required && isEmpty(selected))
        errors.push(`${subproduct.name} is required`);

      // check if we values too many values for this subproduct
      if (!subproduct?.multiple && keys(selected)?.length > 1) {
        errors.push(`${subproduct.name} does not multiple choice`);
      }
      // ---
      set(result, subproduct.id, selected);
      return result;
    },
    {}
  );

  reduce(
    subproducts,
    (result, subproduct) => {
      const subtotal = sumBy(values(subproduct), "total") || 0;
      const total = sumBy(values(subproduct), "total_discounted") || 0;
      const discount = total ? subtotal - total : 0;
      result.discount += discount;
      result.subtotal += discount ? subtotal : 0;
      result.total += discount ? total : subtotal; // cater for no discount
      result.formatted = null;
      return result;
    },
    price
  );

  return new Promise((resolve, reject) => {
    if (errors.length)
      reject({
        [type]: subproducts,
        price,
        error: { ...error, subproducts: errors },
      });
    else resolve({ [type]: subproducts, price });
  });
}

async function checkProvisioning(
  { error, lookups, model }: ProductConfigContext,
  _event: any
) {
  model.provision_fields ??= {};

  const { validate } = useValidation();
  const errors = validate(model.provision_fields, lookups.provision_fields);

  return new Promise((resolve, reject) => {
    if (errors.length)
      reject({
        provision_fields: model?.provision_fields,
        error: { ...error, provision_fields: errors },
      });
    else resolve({ provision_fields: model.provision_fields });
  });
}

// --------------------------------------------------------
// This is a relatively expensive operation,
// ineffect we are calculating the price of the item based on its configuration
// We use the values that have been selected alongside the lookups data
// and based on the combination of those values, we calculate the price
// The really tricky bit is the fact that options can have price overrides,
// so its not always as simple as just adding up the prices of the selected options
// If we do have price overrides, we then just reset the term price to 0
// thats WHY we have an object of prices, so we can easily remove the term price
// and then just sum the rest of the prices values
async function calculateSummary(
  { currency_id, prices, model, lookups }: BasketContext,
  _event: any
) {
  const { post, useUrl } = useApi();

  // no prices to calculate, so bail out
  if (
    prices.term.total > 0 &&
    prices.attributes.total > 0 &&
    prices.options.total > 0
  ) {
    return Promise.reject("No prices to calculate");
  }

  // remove the term price if we have any price overrides
  const hasPriceOverride = useHasPriceOverride(model.options, lookups.options);
  // ---
  const hasSubtotal =
    prices.term.subtotal > 0 &&
    prices.attributes.subtotal > 0 &&
    prices.options.subtotal > 0;
  const subtotalPromise = !hasSubtotal
    ? Promise.resolve(0)
    : post({
        url: useUrl("cart/calculate", {}),
        withAccessToken: true,
        data: {
          currency_id,
          prices: [
            hasPriceOverride ? 0 : prices.term.subtotal,
            prices.attributes.subtotal,
            prices.options.subtotal,
          ],
        },
      }).then(response => response?.data);

  // ---

  const hasDiscount =
    prices.term.discount > 0 &&
    prices.attributes.discount > 0 &&
    prices.options.discount > 0;
  const discountPromise = !hasDiscount
    ? Promise.resolve(0)
    : post({
        url: useUrl("cart/calculate", {}),
        withAccessToken: true,
        data: {
          currency_id,
          prices: [
            hasPriceOverride ? 0 : prices.term.discount,
            prices.attributes.discount,
            prices.options.discount,
          ],
        },
      }).then(response => response?.data);

  // ---

  const totalPromise = post({
    url: useUrl("cart/calculate", {}),
    withAccessToken: true,
    data: {
      currency_id,
      prices: [
        hasPriceOverride ? 0 : prices.term.total,
        prices.attributes.total,
        prices.options.total,
      ],
    },
  }).then(response => response?.data);

  return Promise.all([subtotalPromise, discountPromise, totalPromise]).then(
    ([subtotal, discount, total]) => ({
      subtotal: subtotal?.total || 0,
      subtotal_formatted: subtotal?.total_formatted,
      discount: discount?.total || 0,
      discount_formatted: discount?.total_formatted,
      total: total?.total || 0,
      total_formatted: total?.total_formatted,
    })
  );
}

// --------------------------------------------------------
// EXPORTS

export default <Object>{
  load,
  // ---
  checkQuantity,
  checkTerm,
  checkAttributes,
  checkOptions,
  checkProvisioning,
  // ---
  calculateSummary,
};
