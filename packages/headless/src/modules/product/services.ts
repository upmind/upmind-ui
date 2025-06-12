// --- external

// --- internal
import { useQuery, useSystem } from "../..";
import { useBrand } from "../brand";

// --- utils
import { useTime } from "../../utils";

import {
  parseQuantity,
  parseTerm,
  parseSubproducts,
  checkPriceOverride,
  checkQuantity,
  checkTerm,
  checkSubproducts,
  checkProvisioning,
} from "./utils";

import {
  concat,
  defaultsDeep,
  get,
  isEmpty,
  isNil,
  map,
  omitBy,
  set,
  sum,
} from "lodash-es";

// --- types
import { BrandConfigKeys } from "@upmind-automation/types";

import type {
  ProductConfigContext,
  Price,
  PriceCalculations,
  ProductModel,
} from "./types";

import { AnyEventObject } from "xstate";

// -----------------------------------------------------------------------------

async function load(
  {
    model,
    currencyId,
    promotions,
    basketId,
    rawBasketProduct,
  }: ProductConfigContext,
  _event: AnyEventObject
) {
  const productId = get(model, "productId");
  if (!productId) return Promise.reject(new Error("No Product ID provided"));

  // lets ensure we have a valid currency > fallback to default
  // as well as ensuring our promo display type is available
  const { validateCurrency, ensureConfig } = useBrand();
  const { fetchCountries } = useSystem();

  const [currency] = await Promise.all([
    validateCurrency({ id: currencyId }),
    ensureConfig(BrandConfigKeys.SHOW_PROMOTION_AS),
  ]);

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
      `category${".top_category".repeat(4)}`,
    ].join(),
  };
  // conditionally agd the basket_id / basket_product_id if we have them,
  // this is important to get the correct prices once added to the basket
  if (basketId) set(params, "basket_id", basketId);
  if (rawBasketProduct?.id)
    set(params, "basket_product_id", rawBasketProduct.id);

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
  });

  // lets get our provisioning fields early, so we can make them lookups
  const provisioningPromise = loadProvisioningFields(productId);

  const countriesPromise = fetchCountries();

  return Promise.all([
    productPromise,
    provisioningPromise,
    countriesPromise,
  ]).then(([product, provisioning]) => {
    return { product, provisioning, currency };
  });
}

async function loadProvisioningFields(productId: string) {
  const { get, useUrl } = useQuery();
  if (!productId) return Promise.reject(new Error("No Product ID provided"));
  // we dont cache provisioning fields, as they can change with different options/attributes being selected
  return get({
    url: useUrl(`basket/products/${productId}/provision_fields`),
    queryKey: ["product", productId, "provision-fields"],
    withAccessToken: true,
  });
}

// ---

async function parse(context: ProductConfigContext, { data }: AnyEventObject) {
  const baseModel = defaultsDeep(context.model, {
    productId: undefined,
    quantity: 1,
    term: 0,
    options: {},
    attributes: {},
    provisionFields: {},
  });

  let values: ProductModel = defaultsDeep(
    {
      productId: data?.productId,
      quantity: data?.quantity,
      term: data?.term,
      options: data?.options,
      attributes: data?.attributes,
      provisionFields: data?.provisionFields,
    },

    baseModel
  );

  // safety check, ensure we have a valid product
  if (!values?.productId) {
    return Promise.reject(new Error("No Product ID provided"));
  }

  let prices: PriceCalculations = context.lookups?.prices || {};

  values.quantity = parseQuantity(values.quantity, context?.lookups?.product);

  const term = parseTerm(context, values?.term, values.quantity);
  values.term = term.term;
  prices.term = term.price;

  const options = parseSubproducts(
    "options",
    context,
    values?.options,
    values.quantity
  );
  values.options = options.subproducts;
  prices.options = options.price;

  const attributes = parseSubproducts(
    "attributes",
    context,
    values?.attributes,
    values.quantity
  );
  values.attributes = attributes.subproducts;

  // ---
  return new Promise(resolve => {
    resolve({ model: values, prices });
  });
}

async function validate(context: ProductConfigContext, _event: AnyEventObject) {
  // ---

  // We may opt to skip validation to allow the backend to do the validation
  //  especially usefull when adding bulk products, recommendations etc.
  if (context.silent) return Promise.resolve(context.model);

  // TODO: validate the model as per normal using the schema
  // const { validate } = useValidation();
  //  const errors = validate(schema, model);

  // Till then we will validate individually
  const errors = omitBy(
    {
      quantity: checkQuantity(context, context?.model?.quantity),
      term: checkTerm(context, context?.model?.term),
      options: checkSubproducts("options", context, context.model?.options),
      attributes: checkSubproducts(
        "attributes",
        context,
        context.model?.attributes
      ),
      provisionFields: checkProvisioning(
        context,
        context.model?.provisionFields
      ),
    },
    isEmpty
  );

  return new Promise((resolve, reject) => {
    if (!isEmpty(errors)) {
      reject({ error: { data: errors } });
    } else {
      resolve(context.model);
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
function calculate(prices: PriceCalculations, overrides: boolean): number[] {
  const values = concat(
    overrides ? [] : prices?.term,
    prices?.attributes,
    prices?.options
  );

  return values.filter(value => !isNil(value));
}

async function formatCalculation(
  currencyId: string,
  values: number[],
  controller: AbortController
): Promise<Price> {
  const { post, useUrl } = useQuery();

  return post({
    url: useUrl("cart/calculate", {}),
    init: { signal: controller?.signal },
    withAccessToken: true,
    data: {
      currency_id: currencyId,
      prices: values,
    },
  }).then(data => {
    return {
      total: get(data, "total", 0),
      totalFormatted: get(data, "total_formatted", ""),
      // TODO: get the API to return these values
      // subtotal: get(data, "subtotal", 0),
      // subtotalFormatted: get(data, "subtotal_formatted", ""),
      // discount: get(data, "discount", 0),
      // discountFormatted: get(data, "discount_formatted", ""),
    } as Price;
  });
}

// ---  SUBSCRIPTIONS

export function calculateSubscription(callback: Function, onReceive: Function) {
  // firstly, send service's current state upon subscription
  let controller: AbortController | null;

  let price: Price | undefined;

  onReceive((event: any) => {
    if (event.type === "CALCULATE") {
      // safety check, ensure we have a valid event
      if (
        !event.data?.currencyId ||
        !event.data?.lookups ||
        !event.data?.model
      ) {
        callback({ type: "CALCULATE_CANCELLED" });
        return;
      }

      const { currencyId, lookups, model } = event.data;
      const overrides =
        !!model?.options &&
        !!lookups?.options &&
        checkPriceOverride(model.options, lookups.options);

      const values = calculate(lookups.prices, overrides);
      // Check if we actually need to calculate the price
      if (price?.total == sum(values) || !values?.length) {
        // no need to recalculate, just return the current price
        callback({ type: "CALCULATED", data: price });
        return;
      }

      callback({ type: "CALCULATING" });

      // if we do...we need to check if we have a controller already doing calculation requests.
      // if we do, we need to abort the current request and start a new one.
      if (controller?.signal && !controller.signal?.aborted) {
        controller?.abort();
      }

      // create a new controller to allow us to abort the request if needed
      controller = new AbortController();
      formatCalculation(currencyId, values, controller)
        .then((result: Price) => {
          // send the price back to the machine
          price = result;
          callback({ type: "CALCULATED", data: price });
        })
        // this catch will also trigger when a request is aborted, but it wont have any error message
        .catch(error => {
          // notify the machine if we have an anctual error, so we can move out of the calculating state
          if (!isEmpty(error)) callback({ type: "CALCULATE_CANCELLED" });
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
  parse,
  validate,
};
