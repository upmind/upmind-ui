// --- external

// --- internal
import { useApi } from "../api";
import { useBrand, BrandConfigKeys } from "../brand";
const { getConfig } = useBrand();

import type { BasketContext, ProductConfigContext } from "./types.d";

// --- utils
import { first, find, some, maxBy, minBy, get } from "lodash-es";

// --------------------------------------------------------
// ENUMS

export enum DefaultPaymentPeriod {
  INHERIT_FROM_BRAND = 0,
  LOWEST_PRICE = 1,
  LOWEST_MONTHLY_PRICE = 2,
  HIGHEST_PRICE = 3
}
// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data
// this will process the request and return a promise

// --------------------------------------------------------
//  Syntax sugar to manage Products (likely to move to a separate product machine, like requests)

// utility function to spawn machines based on the given items

async function update(context: BasketContext, _event: any) {}

async function remove(context: BasketContext, _event: any) {}

async function clear(context: BasketContext, _event: any) {}

// ---
// Get the product that has been prepared for the basket, with all the required data
async function getProduct({ product }: ProductConfigContext, _event: any) {
  product = product?.id || product;
  const { get, useUrl } = useApi();
  return get({
    url: useUrl(`basket/products/${product}`, {
      // basket_id: basketId, // we dont necessarily have one yet....
      // currency_id: "e47d7382-4850-7931-56c8-1e642d59e063", // comes from brand/basket
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

// ---

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

/**
 * This Checks if the Product has any/multiple Term/Billing Cycle
 * If there is no/one option, it will automatically select it
 * We will also check that any selected option is valid
 * @param context
 * @param _event
 * @returns {Promise<void>}
 * We Reject any invalid or empty selections
 * We Resolve the valid Selected option
 */
async function checkTerm(
  { product, available, selected }: ProductConfigContext,
  _event: any
) {
  let term = null;
  if (!available?.terms?.length) {
    return Promise.reject("No Terms Available");
  } else if (available.terms.length === 1) {
    term = first(available.terms);
  } else if (!selected?.term) {
    term = await calculateBillingTerm(
      product.default_payment_period,
      available.terms
    );
  } else if (selected?.term) {
    const valid = some(available.terms, ["id", selected.term.id]);
    if (valid) term = selected.term;
  }

  return new Promise((resolve, reject) => {
    if (term) resolve(term);
    else reject("Invalid Term Selected");
  });
}

// --------------------------------------------------------
// EXPORTS

export default <Object>{
  update,
  remove,
  clear,
  // ---
  getProduct,
  // ---
  checkTerm
};
