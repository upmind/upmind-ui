// --- external

// --- internal
import { useQuery } from "../..";
import { useBrand } from "../brand";

// --- utils
import { useTime, useValidation } from "../../utils";
import { parseQuantity, checkPriceOverride } from "./utils";

import {
  concat,
  find,
  first,
  forEach,
  get,
  isEmpty,
  isNil,
  isNumber,
  isObject,
  keys,
  map,
  maxBy,
  minBy,
  pick,
  reduce,
  reject,
  set,
  some,
  times,
} from "lodash-es";

// --- types
import {
  BrandConfigKeys,
  PromotionDisplayTypes,
  DefaultPaymentPeriod,
} from "@upmind-automation/types";
import type { ProductConfigContext } from "./types";

// -----------------------------------------------------------------------------

async function load(
  {
    model,
    currencyId,
    promotions,
    basketId,
    basketProduct,
  }: ProductConfigContext,
  _event: any
) {
  const productId = get(model, "productId");
  if (!productId) return Promise.reject("No Product ID provided");

  // lets ensure we have a valid currency > fallback to default
  const currency = await useBrand().validateCurrency({ id: currencyId });

  // lets ensure we parse our promotions correctly
  const promocodes = map(promotions, "promotion.code").join();
  // ---
  const { get: getRequest, useUrl } = useQuery();

  const params = {
    currency_id: currency?.id,
    promotions: promocodes,
    with_staged_imports: true,
    with: [
      "image",
      "prices",
      "products_attributes",
      "products_options",
      "products_options.prices",
      "category.top_category.top_category.top_category.top_category",
    ].join(),
  };
  // conditionally add the basket_id / basket_product_id if we have them,
  // this is important to get the correct prices once added to the basket
  if (basketId) set(params, "basket_id", basketId);
  if (basketProduct?.id) set(params, "basket_product_id", basketProduct.id);

  const productPromise = getRequest({
    url: useUrl(`basket/products/${productId}`, params),
    queryKey: [
      "product",
      productId,
      {
        currency_id: currency?.id,
        promotions: promocodes,
      },
    ],
    staleTime: useTime()?.DAY, // product data is not updated often, so we can cache for a day
    withAccessToken: true,
  }).then(({ data }: any) => data);

  // lets get our provisioning fields early, so we can make them lookups
  const provisioningPromise = loadProvisioningFields(productId);
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
    ([product, provisioning, promotionDisplayType]) => {
      return { product, provisioning, promotionDisplayType, currency };
    }
  );
}

async function loadProvisioningFields(productId: any) {
  const { get, useUrl } = useQuery();
  if (!productId) return Promise.reject("No Product ID provided");
  // we dont cache provisioning fields, as they can change with diferent options/attributes being selected
  return get({
    url: useUrl(`basket/products/${productId}/provision_fields`),
    queryKey: ["product", productId, "provision-fields"],
    withAccessToken: true,
  }).then(({ data }: any) => data);
}

async function checkQuantity(
  { lookups, model }: ProductConfigContext,
  { data }: any
) {
  const product = get(lookups, "product");
  const value = data?.quantity || model?.quantity;
  const quantity = parseQuantity(value, product);
  // ---

  return new Promise((resolve, reject) => {
    if (isNumber(quantity)) resolve({ quantity });
    else reject("Invalid Quantity Selected");
  });
}

async function checkTerm(
  { error, lookups, model }: ProductConfigContext,
  _event: any
) {
  let term: any = null;
  const price: any[] = [];
  const errors: any[] = [];
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
  term = find(lookups.terms, ["cycle", model?.term]);
  if (!term) {
    if (lookups.terms.length === 1) {
      term = first(lookups.terms);
    } else {
      term = await calculateBillingTerm(
        lookups.product?.defaultPaymentPeriod,
        lookups.terms
      );
    }
  }

  if (isNil(term)) errors.push("Valid Term is required");

  // ---
  // set price values, taking into account the quantity and unit quantity
  // NB: we NEVER add, we always push into an array for the backend to handle
  times(model?.quantity ?? 0, () => {
    price.push(term?.currentAmount);
  });

  return new Promise((resolve, reject) => {
    if (errors.length)
      reject({
        term: get(term, "cycle"),
        price,
        error: { ...error, term: errors },
      });
    else {
      resolve({ term: pick(term, "cycle"), price });
    }
  });
}

async function checkAttributes(
  { error, lookups, model }: ProductConfigContext,
  _event: any
) {
  const value = model?.attributes;
  return checkSubproducts(
    { error, lookups, model },
    { data: value, type: "attributes", subproductIds: model?.subproducts }
  );
}

async function checkOptions(
  { error, lookups, model }: ProductConfigContext,
  _event: any
) {
  const value = model?.options;
  return checkSubproducts(
    { error, lookups, model },
    { data: value, type: "options", subproductIds: model?.subproducts }
  );
}

async function checkSubproducts(
  { error, lookups, model }: any,
  { type, data, subproductIds }: any
) {
  let subproducts: any = null;
  const price: any[] = [];
  const errors: any = {};
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
      let selected = get(data, subproduct.id, {});

      // try set anymatching pre-selected values for this subproduct ( subproductIds ),
      // NB: ONLY when data is being set for the first time
      if (isEmpty(data)) {
        forEach(subproductIds, pid => {
          if (some(subproduct.values, ["id", pid])) {
            set(selected, pid, { productId: pid });
          }
        });
      }

      // check if we are missing required subproduct, if we are (and its not multiple) then automaticaly select the first one

      if (isEmpty(selected)) {
        const defaultSubproduct = find(subproduct.values, "default");
        if (defaultSubproduct) {
          set(selected, defaultSubproduct.id, {
            productId: defaultSubproduct.id,
          });
        } else if (subproduct?.required && !subproduct.multiple) {
          const pid = get(first(subproduct.values), "id");
          if (pid) set(selected, pid, { productId: pid });
        }
      }

      // if we have selected values, ensure they are valid and fully formed
      if (!isEmpty(selected)) {
        // only include valid values, stripping out any invalid ones, if we have any
        // selected = pickBy(selected, (_value, id) =>
        //   some(subproduct.values, ["id", id])
        // );

        // then parse each selected value, and ensure it has all its required and VALID values
        selected = reduce(
          selected,
          (result, value, id) => {
            // ensure we have an object
            if (!isObject(value)) value = { productId: id };
            const product = find(subproduct.values, ["id", value.productId]);
            // safety check, ensure we have a valid product otherwise bail
            if (isEmpty(product)) return result;

            // ensure we have a valid unit_quantity
            value.quantity = parseQuantity(value?.step, product);
            value.cycle = product.cycle;
            set(result, id, value);

            // if we have a price, set price values, taking into account the quantity and unit quantity
            // NB: we NEVER add, we always push into an array for the backend to handle
            if (!isEmpty(product?.price)) {
              times(value.quantity * model.quantity, () => {
                price.push(product.price.currentAmount);
              });
            }

            // ---
            return result;
          },
          {}
        );
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

async function checkProvisioning({ error, lookups, model }: any, _event: any) {
  // bail if we dont actually have any provision fields to check
  if (isEmpty(lookups.provisionFields?.properties))
    return Promise.resolve({ Fovision_fields: {} });

  // ---

  const value = model?.provisionFields || {};
  const { validate } = useValidation();
  const errors = validate(lookups.provisionFields, value);

  return new Promise(resolve => {
    if (errors.length) {
      // TODO: reject with the errors , but need to allow skipping validation for sync
      // for now we will resolve with errors
      resolve({
        provisionFields: value,
        error: { ...error, provisionFields: errors },
      });
    } else {
      resolve({ provisionFields: value });
    }
  });
}

// -----------------------------------------------------------------------------
// This is a relatively expensive operation,
// in effect we are calculating the price of the item based on its configuration
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
  { currencyId, prices, model, lookups }: ProductConfigContext,
  controller: AbortController
) => {
  const { post, useUrl } = useQuery();

  // clean the prices object, removing any nil values. we dont use compact because that also removes 0 values
  // NB: remove the term price if we have any price overrides
  const values = reject(
    concat(
      checkPriceOverride(model?.options, lookups?.options)
        ? []
        : prices?.term || [],
      prices?.attributes,
      prices?.options
    ),
    isNil
  );
  // ---

  if (!currencyId || !values?.length) {
    return Promise.reject({});
  }

  return post({
    url: useUrl("cart/calculate", {}),
    init: { signal: controller?.signal },
    withAccessToken: true,
    data: {
      currency_id: currencyId,
      prices: values,
    },
  }).then(({ data }: any) => pick(data, ["total", "total_formatted"]));
};

const calculateBillingTerm = async (
  period: DefaultPaymentPeriod | undefined,
  availableTerms: any
): Promise<any> => {
  // because we have multiple options, we need to select one base don the following strategy:

  const { getConfig } = useBrand();

  let term;

  switch (period) {
    case DefaultPaymentPeriod.HIGHEST_PRICE:
      term = maxBy(availableTerms, "currentAmount");
      break;
    case DefaultPaymentPeriod.LOWEST_PRICE:
      term = minBy(availableTerms, "currentAmount");
      break;
    case DefaultPaymentPeriod.LOWEST_MONTHLY_PRICE:
      term = minBy(availableTerms, "monthlyFromCurrentAmount");
      break;
    case DefaultPaymentPeriod.INHERIT_FROM_BRAND:
      term = await getConfig(BrandConfigKeys.DEFAULT_PAYMENT_PERIOD).then(
        async config => {
          const period =
            get(config, BrandConfigKeys.DEFAULT_PAYMENT_PERIOD) || 0;
          return await calculateBillingTerm(period, availableTerms);
        }
      );

      break;

    default:
      term = first(availableTerms);
      break;
  }

  return term;
};

// ---  SUBSCRIPTIONS
// These are used by the other machines to listen for changes/messages from this machine

export function calculateSubscription(callback: Function, onReceive: Function) {
  // firstly, send service's current state upon subscription
  let controller: AbortController | null;

  onReceive((event: any) => {
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
        .catch(() => {
          // still notify the machine, but with an no value, so we can move out of the state
          callback({ type: "CALCULATE_CANCELLED", data: null });
        });
    }

    if (event.type === "CANCEL") {
      // Firstly, we need to check if we have a controller already doing calculation requests.
      // If we do, we need to abort the current request and start a new one.
      if (controller?.signal && !controller.signal?.aborted) {
        controller?.abort("Request cancelled");
      }
    }
  });

  return () => {
    // The subscriber has unsubscribed from this service
    // typically when the transitioning out of the state node
    //  so cancel any pending requests
    if (controller?.signal && !controller.signal?.aborted) {
      controller?.abort("Subscripton terminated");
    }
  };
}

// -----------------------------------------------------------------------------

export default {
  load,
  refresh: load, // alias
  // ---
  checkQuantity,
  checkTerm,
  checkAttributes,
  checkOptions,
  checkProvisioning,
};
