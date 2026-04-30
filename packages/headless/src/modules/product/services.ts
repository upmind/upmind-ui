// --- external

// --- internal
import { useBrand } from "../brand";
import { useBasketCurrency, useI18n, useQuery } from "../..";

// --- utils
import {
  useTime,
  ErrorOrigin,
  responseCodes,
  DetailedError,
  useModelParser,
  useValidation,
  useValidationErrorsTranslator
} from "../../utils";

import {
  parseTerm,
  parseSubproducts,
  checkPriceOverride,
  parseSubproductDetails,
  parseProductProps,
  hasNonOrderableSubproducts
} from "./utils";

import { useProductConfigSchema } from "./schemas";

import {
  compact,
  concat,
  defaultsDeep,
  filter,
  get,
  isEmpty,
  isEqual,
  isNil,
  isNumber,
  map,
  reject,
  set,
  sum
} from "lodash-es";

// --- types
import {
  BrandConfigKeys,
  type IBlueprintField,
  type IProduct
} from "@upmind-automation/types";

import type {
  Price,
  PriceCalculations,
  PriceEntry,
  ProductModel,
  ProductConfigContext,
  ProductProps
} from "./types";

import { type AnyEventObject } from "xstate";
import { type ErrorObject } from "ajv";
import { parseBasketSubproductConfig } from "../basketProduct/utils";

// -----------------------------------------------------------------------------

async function load(
  {
    model,
    subproducts,
    currencyId,
    currencyCode,
    coupons,
    promotions: basketPromotions,
    basketId,
    rawBasketProduct
  }: ProductConfigContext,
  _event: AnyEventObject
) {
  const { t } = useI18n();
  const productId = get(model, "productId");
  if (!productId)
    return Promise.reject(
      new DetailedError(
        t("error.product_not_available"),
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless
      )
    );

  if (hasNonOrderableSubproducts(rawBasketProduct))
    throw new DetailedError(
      t("error.basket_product_readonly"),
      responseCodes.Forbidden,
      ErrorOrigin.Headless
    );

  // lets ensure we have a valid currency > fallback to default
  // as well as ensuring our promo display type is available
  const { validateCurrency, ensureConfig } = useBrand();
  const { currency: basketCurrency, isReady: isCurrencyReady } =
    useBasketCurrency();

  // Fallback to basket's persisted currency when no explicit currency is set
  const [currency] = await Promise.all([
    !currencyCode && !currencyId
      ? isCurrencyReady().then(() => basketCurrency?.value)
      : validateCurrency(
          currencyCode ? { code: currencyCode } : { id: currencyId }
        ),
    ensureConfig(BrandConfigKeys.SHOW_PROMOTION_AS)
  ]);

  // lets ensure we parse our promotions correctly
  const promotions = coupons?.join();
  // ---
  const { get: getRequest, useUrl } = useQuery();

  const params = {
    currency_id: currency?.id,
    promotions,
    with: [
      "image",
      "images",
      "prices",
      "products_attributes",
      "products_options",
      "products_options.prices",
      `category${".top_category".repeat(4)}`,
      "provision_blueprint.category"
    ].join()
  };
  // conditionally add the basket_id / basket_product_id if we have them,
  // this is important to get the correct prices once added to the basket
  if (basketId) set(params, "basket_id", basketId);
  if (rawBasketProduct?.id)
    set(params, "basket_product_id", rawBasketProduct.id);

  const url = rawBasketProduct?.id
    ? `basket/${basketId}/products/${rawBasketProduct.id}`
    : `basket/products/${productId}`;

  const productPromise = getRequest<IProduct>({
    url: useUrl(url, params),
    queryKey: [
      "product",
      productId,
      {
        basketId,
        currency_id: currency?.id,
        promotions,
        basketPromotions: map(basketPromotions, "promotion_id")
      }
    ],
    staleTime: useTime()?.DAY, // product data is not updated often, so we can cache for a day
    withAccessToken: true,
    withCurrency: true
  });

  // lets get our provisioning fields early, so we can make them lookups
  const provisioningPromise = loadProvisioningFields(
    { model } as ProductConfigContext,
    _event
  );

  return Promise.all([productPromise, provisioningPromise]).then(
    ([product, rawProvisionFields]) => {
      return {
        model: parseProductProps(
          { ...model, subproducts } as ProductProps,
          product
        ),
        product,
        rawProvisionFields,
        currency
      };
    }
  );
}

async function loadProvisioningFields(
  { model }: ProductConfigContext,
  _event: AnyEventObject
) {
  const { t } = useI18n();
  const { get: getRequest, useUrl } = useQuery();

  const productId = get(model, "productId");
  if (!productId)
    return Promise.reject(
      new DetailedError(
        t("error.product_not_available"),
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless
      )
    );

  const attributes = parseBasketSubproductConfig(model?.attributes);
  const options = parseBasketSubproductConfig(model?.options);
  const subProducts = compact(map(concat(options, attributes), "product_id"));

  // we don't cache provisioning fields, as they can change with different options/attributes being selected
  return getRequest<IBlueprintField[]>({
    url: useUrl(`basket/products/${productId}/provision_fields`, {
      sub_product_ids: subProducts
    }),
    queryKey: ["product", productId, { subProducts }, "provision-fields"],
    withAccessToken: true
  });
}

// ---

async function parse(context: ProductConfigContext, { data }: AnyEventObject) {
  const { t } = useI18n();

  const lookups = context.lookups ?? {};
  lookups.prices = context.lookups?.prices || {};

  // build our values based on our prev context ( if any )
  // NB: schema defaults are applied by AJV (useDefaults: true) during validation
  let values: ProductModel = {
    productId: data?.productId ?? context?.model?.productId,
    quantity: data?.quantity ?? context?.model?.quantity,
    term: data?.term ?? context?.model?.term,
    options: data?.options ?? context?.model?.options,
    attributes: data?.attributes ?? context?.model?.attributes,
    provisionFields: data?.provisionFields ?? context?.model?.provisionFields,
    startTrial: data?.startTrial ?? context?.model?.startTrial
  };

  // safety check, ensure we have a valid product
  if (!values?.productId) {
    return Promise.reject(
      new DetailedError(
        t("error.product_not_available"),
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless
      )
    );
  }

  const term = parseTerm(context, values?.term, values.quantity);
  lookups.prices.term = term.price;

  // NB:if terms have changed.....
  // reset the lookup options based on the term selected
  // as this may impact what price and options are available
  if (!isEqual(context?.model?.term, values?.term)) {
    lookups.options = parseSubproductDetails(
      context.rawProduct?.products_options,
      values.term
    );
  }

  const options = parseSubproducts(
    "options",
    {
      lookups: context.lookups,
      model: values,
      subproducts: context.subproducts
    },
    values?.options,
    values.quantity
  );
  values.options = options.subproducts;
  lookups.prices.options = options.price;

  const attributes = parseSubproducts(
    "attributes",
    {
      lookups: context.lookups,
      model: values,
      subproducts: context.subproducts
    },
    values?.attributes,
    values.quantity
  );
  values.attributes = attributes.subproducts;

  // update the provisioning fields : we need to do this when attributes/options change
  const rawProvisionFields = await loadProvisioningFields(
    { model: values } as ProductConfigContext,
    {} as AnyEventObject
  );

  // Store raw provision fields in lookups — schema generation handles parsing
  lookups.provisionFields = rawProvisionFields;

  // Apply schema defaults to the entire model
  const schema = useProductConfigSchema({ ...context, lookups, model: values });
  values = useModelParser(schema, values, {});

  // ---
  return Promise.resolve({ model: values, lookups, rawProvisionFields });
}

async function validate(context: ProductConfigContext, _event: AnyEventObject) {
  const { t } = useI18n();

  // We may opt to skip validation to allow the backend to do the validation
  //  especially usefully when adding bulk products, recommendations etc.
  if (context.silent) return Promise.resolve(context.model);

  const { schema, model } = context;
  let errors: ErrorObject[] = [];

  if (schema && model) {
    const { validate: ajvValidate } = useValidation();
    const rawErrors = ajvValidate(schema, model);
    if (!isEmpty(rawErrors)) {
      errors = useValidationErrorsTranslator(rawErrors, schema);
    }
  }

  return new Promise((resolve, reject) => {
    if (!isEmpty(errors)) {
      reject(
        new DetailedError(
          t("error.product_validation_failed"),
          responseCodes.Unprocessable_Entity,
          ErrorOrigin.Headless,
          errors
        )
      );
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
function calculate(
  prices: PriceCalculations,
  overrides: boolean
): PriceEntry[] {
  const values = concat(
    overrides ? [] : prices?.term,
    prices?.attributes,
    prices?.options
  );

  return filter(values, value => !isNil(value)) as PriceEntry[];
}

async function formatCalculation(
  currencyId: string,
  values: PriceEntry[]
): Promise<Price> {
  const { post, useUrl } = useQuery();

  const prices = reject(values, isNil);
  if (isEmpty(prices)) return Promise.reject();

  return post({
    mutationKey: ["cart", "calculate"],
    url: useUrl("cart/calculate", {}),
    withAccessToken: true,
    data: {
      currency_id: currencyId,
      prices
    }
  }).then(data => {
    return {
      total: get(data, "total", 0),
      totalFormatted: get(data, "total_formatted", "")
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

  let price: Price | undefined;
  const { cancel } = useQuery();

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
      // Compute a numeric total for cache comparison (handles both number and {price, quantity} entries)
      const total = sum(
        map(values, v => (isNumber(v) ? v : (v.price ?? 0) * (v.quantity ?? 1)))
      );
      if (price?.total == total || !values?.length) {
        // no need to recalculate, just return the current price
        callback({ type: "CALCULATED", data: price });
        return;
      }

      callback({ type: "CALCULATING" });

      formatCalculation(currencyId, values)
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
      cancel(["cart", "calculate"]);
    }
  });

  return () => {
    // The subscriber has unsubscribed from this service
    // typically when the transitioning out of the state node
    //  so cancel any pending requests
    cancel(["cart", "calculate"]);
  };
}

// -----------------------------------------------------------------------------

export default {
  load,
  refresh: load, // alias
  // ---
  parse,
  validate
};
