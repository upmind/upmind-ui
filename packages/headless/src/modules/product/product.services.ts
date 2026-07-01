/** @internal */
import {
  BrandConfigKeys,
  type IBlueprintField,
  type IProduct,
  type IProductAttribute,
  type IProductOption
} from "@upmind-automation/types";
import { useBasketCurrency } from "../basket";
import { useI18n } from "../system-localisation";
import { useQuery } from "../query";
import { useSystem } from "../system";
import { parseBasketSubproductConfig } from "../basket-product/basket-product.utils";
import { useBrand } from "../brand";
import { useProductConfigSchema } from "./product.schemas";
import {
  parseTerm,
  parseSubproducts,
  parseSubproductDetails,
  parseProductDetails,
  parseProductProps,
  parseTermDetails,
  hasNonOrderableSubproducts
} from "./product.utils";
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
  cloneDeep,
  compact,
  concat,
  get,
  isEmpty,
  isEqual,
  map,
  set
} from "lodash-es";
import type {
  ProductModel,
  ProductConfigContext,
  ProductProps
} from "./product.types";
import type { ErrorObject } from "ajv";
import type { AnyEventObject } from "xstate";

// -----------------------------------------------------------------------------

/**
 * Synchronous wrapper around the canonical `useProductConfigSchema +
 * useModelParser` pipeline. Hydrates `baseModel` with any defaults the
 * schema declares for `term` / `options` / `attributes` based on the raw
 * `IProduct` — same machinery the configurator's `parse` service uses
 * (`product/services.ts:289-290`), but without the async
 * `loadProvisioningFields` step. For typical TLD-style products with no
 * required option/attribute categories this is effectively a clone of
 * `baseModel`; the value is in keeping all basket-add paths consistent
 * so a brand configuring a required category doesn't 422 the add.
 *
 * Throws if `parseProductDetails` / `parseTermDetails` /
 * `parseSubproductDetails` fail on a malformed `raw` — callers in
 * synchronous (`pure`) XState actions should wrap accordingly.
 */
export function applyConfigDefaults(
  baseModel: ProductProps,
  raw?: IProduct
): ProductProps {
  // `parseProductProps`-style subproduct fallback — the API sometimes
  // echoes `products_options` / `products_attributes` back as plain
  // `options` / `attributes` (the `/availability` endpoint returns under
  // the un-prefixed keys when fetched with
  // `with: "prices,options,options.prices,attributes"`). Use `isEmpty`
  // rather than `??` so a defined-but-empty `products_options: []`
  // falls through to the populated echo instead of silently winning.
  const rawWithEcho = raw as
    | (IProduct & {
        options?: IProductOption[];
        attributes?: IProductAttribute[];
      })
    | undefined;
  const rawOptions = !isEmpty(rawWithEcho?.products_options)
    ? rawWithEcho?.products_options
    : rawWithEcho?.options;
  const rawAttributes = !isEmpty(rawWithEcho?.products_attributes)
    ? rawWithEcho?.products_attributes
    : rawWithEcho?.attributes;

  // Pass the parent's billing cycle through so each subproduct's price can
  // be resolved against it. Without this, `parseSubproductDetails`'s price
  // match collapses to `cycle: 0` only, and any required-default option
  // whose `prices` lacks a cycle-0 row falls back to the option's own
  // `billing_cycle_months` — a *storage default* (often `1`), not a real
  // price key. That stale default then rides into `schema.default` →
  // baseline model → basket POST as `billing_cycle_months: 1`.
  // The cycle order: explicit `baseModel.term` (user choice / configurator
  // selection) wins; otherwise fall back to the product's
  // `default_payment_period`.
  const parentCycle = baseModel?.term ?? raw?.default_payment_period;

  const schema = useProductConfigSchema({
    baseModel,
    rawProduct: raw,
    lookups: {
      product: raw ? parseProductDetails(raw) : undefined,
      terms: raw ? parseTermDetails(raw) : undefined,
      options: parseSubproductDetails(rawOptions, parentCycle),
      attributes: parseSubproductDetails(rawAttributes, parentCycle)
    }
  } as ProductConfigContext);

  // Defence-in-depth clone: `useModelParser`'s current call shape
  // (`defaultsDeep(values, {})`) doesn't actually mutate the caller's
  // `baseModel`, but the parser builds new objects from `values` and we
  // don't want any future refactor that starts writing into `values` to
  // silently corrupt callers that hold a `baseModel` reference.
  return useModelParser<ProductProps>(schema, cloneDeep(baseModel), {});
}

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
  const { ensureCountries, ensureBillingCycles } = useSystem();
  const { currency: basketCurrency, isReady: isCurrencyReady } =
    useBasketCurrency();

  // Fallback to basket's persisted currency when no explicit currency is set
  const [currency] = await Promise.all([
    !currencyCode && !currencyId
      ? isCurrencyReady().then(() => basketCurrency?.value)
      : validateCurrency(
          currencyCode ? { code: currencyCode } : { id: currencyId }
        ),
    ensureConfig(BrandConfigKeys.SHOW_PROMOTION_AS),
    ensureCountries(),
    ensureBillingCycles()
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
      "products_attributes.icon",
      "products_options",
      "products_options.icon",
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
  // Enforce the resolved term back onto the model: parseTerm falls an invalid /
  // out-of-range cycle (e.g. a bad `?bcm=` param) back to the default, so the
  // model can't keep a cycle the product doesn't offer (FE-2676).
  values.term = term.term;
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

// -----------------------------------------------------------------------------

export default {
  load,
  refresh: load, // alias
  // ---
  parse,
  validate
};
