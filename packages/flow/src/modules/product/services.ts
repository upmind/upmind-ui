// --- external

// --- internal
import { useApi } from "../api";
import { useBrand, BrandConfigKeys } from "../brand";

import type { ProductConfigContext } from "./types.d";

// --- utils
import { useTime, useValidation } from "../../utils";
import { useQuantityParser, useHasPriceOverride } from "./utils";

import {
  compact,
  concat,
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
  reduce,
  set,
  times,
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

  const { get: getRequest, useUrl } = useApi();
  const productPromise = getRequest({
    url: useUrl(`basket/products/${product_id}`, {
      currency_id,
      promotions: map(promotions, "promotion.code").join(","), // ensure we pass any applied promotions to get the correct prices
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

  // lets also get some brand config for how we want to show promotions
  // Get the brands preference on how to display promotions
  const { getConfig } = useBrand();
  const configPromise = getConfig(BrandConfigKeys.SHOW_PROMOTION_AS).then(
    response =>
      get(
        response,
        BrandConfigKeys.SHOW_PROMOTION_AS,
        PromotionDisplayTypes.PERCENTAGE
      )
  );

  return Promise.all([productPromise, provisioningPromise, configPromise]).then(
    ([product, provision_fields, promotion_display_type]) => {
      set(product, "products_provisioning", provision_fields);
      set(product, "promotion_display_type", promotion_display_type);
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
  const price = [];
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
  // set price values, taking into account the quantity and unit quantity
  // NB: we NEVER add, we always push into an array for the backend to handle
  times(model.quantity, () => {
    price.push(term?.price_discounted || term?.price || 0);
  });

  return new Promise((resolve, reject) => {
    if (errors.length)
      reject({
        term: pick(term, "billing_cycle_months"),
        price,
        error: { ...error, term: errors },
      });
    else {
      resolve({ term: pick(term, "billing_cycle_months"), price });
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
  const price = [];
  const errors = {};
  // ---
  // safety check, resolve if we have no attributes to check
  if (!lookups?.[type]?.length) {
    debugger;
    return Promise.resolve({
      subproducts,
      price,
    });
  }

  subproducts = reduce(
    lookups[type],
    (result, subproduct) => {
      // try get any selected values for this subproduct,
      console.log("checkSubproducts", { ...subproducts });
      let selected = get(model, `${type}.${subproduct.id}`, {});

      // if we have selected values, ensure they are valid and fully formed
      if (!isEmpty(selected)) {
        // only include valid values, stripping out any invalid ones, if we have any
        // selected = pickBy(selected, (_value, id) =>
        //   some(subproduct.values, ["id", id])
        // );

        // then parse each selected value, and ensure it has all its required attributes
        // and that it has valid values for each of those attributes
        selected = mapValues(selected, (value, id) => {
          // ensure we have an object
          if (!isObject(value)) value = { product_id: id };
          const product = find(subproduct.values, ["id", value.product_id]);

          // NB: If a sub product has prices, we need to ensure we have the correct price
          //     Sub products cant have a mix or billing cycles and one off, it will be one or the other
          //     One off prices have a billing cycle of 0, so we can use that to determine the price
          // based on either:
          // 1. If its One off, just use the first (and only) price
          // 2. IF we have billing cycle(s) : then match the term billing cycle

          // ONE OFF
          let activePrice = find(product?.prices, ["billing_cycle_months", 0]);

          // BILLING CYCLE(S)
          if (!activePrice) {
            activePrice = find(product?.prices, [
              "billing_cycle_months",
              model?.term?.billing_cycle_months,
            ]);
          }

          // ensure we have a valid unit_quantity
          value.unit_quantity = useQuantityParser(
            value?.unit_quantity || 1,
            product
          );

          value.billing_cycle_months = activePrice?.billing_cycle_months;
          // set price values, taking into account the quantity and unit quantity
          // NB: we NEVER add, we always push into an array for the backend to handle
          times(value.unit_quantity * model.quantity, () => {
            price.push(
              activePrice?.price_discounted || activePrice?.price || 0
            );
          });

          return value;
        });
      }

      // check if we are missing required subproduct
      if (subproduct?.required && isEmpty(selected)) {
        errors[subproduct.id] ??= [];
        errors[subproduct.id].push(`${subproduct.name} is required`);
      }

      // check if we values too many values for this subproduct
      if (!subproduct?.multiple && keys(selected)?.length > 1) {
        errors[subproduct.id] ??= [];
        errors[subproduct.id].push(
          `${subproduct.name} does not allow multiple choice`
        );
      }
      // ---
      set(result, subproduct.id, selected);
      return result;
    },
    {}
  );

  return new Promise((resolve, reject) => {
    if (!isEmpty(errors)) {
      reject({
        [type]: subproducts,
        price,
        error: { ...error, [type]: errors },
      });
    } else resolve({ [type]: subproducts, price });
  });
}

async function checkProvisioning(
  { error, lookups, model }: ProductConfigContext,
  _event: any
) {
  // bail if we dont actually have any provision fields to check
  if (isEmpty(lookups.provision_fields?.properties))
    return Promise.resolve({ provision_fields: {} });

  // ---

  model.provision_fields ??= {};
  const { validate } = useValidation();
  const errors = validate(model.provision_fields, lookups.provision_fields);
  return new Promise((resolve, reject) => {
    if (errors.length) {
      reject({
        provision_fields: model.provision_fields,
        error: { ...error, provision_fields: errors },
      });
    } else {
      resolve({ provision_fields: model.provision_fields });
    }
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

// We have a valid AUTH session when we are logged in as a client (TODO: admin + actor)
// this will fire every time we transition to a new state
const calculateSummary = (
  { currency_id, prices, model, lookups }: ProductConfigContext,
  controller: AbortController
) => {
  debugger;
  const { post, useUrl } = useApi();

  // remove the term price if we have any price overrides
  const hasPriceOverride = useHasPriceOverride(model.options, lookups.options);
  // ---
  return post({
    url: useUrl("cart/calculate", {}),
    init: { signal: controller?.signal },
    withAccessToken: true,
    data: {
      currency_id,
      prices: compact(
        concat(
          hasPriceOverride ? [] : prices?.term,
          prices?.attributes,
          prices?.options
        )
      ),
    },
  }).then(({ data }) => pick(data, ["total", "total_formatted"]));
};

// --------------------------------------------------------
// Subscriptions - these are used by the other machines to listen for changes/messages from this machine

export function calculateSubscription(callback, onReceive) {
  // firstly, send service's current state upon subscription
  let controller: AbortController | null;

  onReceive(event => {
    if (event.type === "CALCULATE") {
      // Firstly, we need to check if we have a controller already doing calculation requests.
      // If we do, we need to abort the current request and start a new one.
      if (controller?.signal && !controller.signal?.aborted) {
        controller?.abort("New request received");
      }

      // create a new controller to allow us to abort the request if needed
      controller = new AbortController();

      calculateSummary(event.data, controller)
        .then(summary => {
          // send the summary back to the machine
          callback({ type: "CALCULATED", data: summary });
        })
        .catch(error => {
          // still notify the machine, but with an no value, so we can move out of the state
          callback({ type: "CALCULATED", data: null });
        });
    }
  });

  return () => {
    // The subscriber has unsubscribed from this service
    // typically when the transitioning out of the state node
    //  so cancel any pending requests
    if (controller?.signal && !controller.signal?.aborted)
      controller?.abort("New request received");
  };
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
};
