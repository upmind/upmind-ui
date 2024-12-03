// --- external

// --- internal
import { useApi } from "../api";
import { useBrand, BrandConfigKeys } from "../brand";

// --- utils
import { useTime } from "../../utils";
import { set } from "lodash-es";

// --- types

// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data
// this will process the request and return a promise
// ---

async function fetch(
  _context: any,
  {
    data: { productId, basketId, currencyId, promotions },
  }: {
    data: {
      productId: string;
      basketId?: string;
      currencyId?: string;
      promotions?: string[];
    };
  }
) {
  if (!productId) return Promise.reject("No Product ID provided");

  // lets ensure we have a valid currency > fallback to default
  const currency = await useBrand().validateCurrency({ id: currencyId });
  // ---
  const { get: getRequest, useUrl } = useApi();

  const params = {
    currency_id: currency.id,
    promotions: (promotions ?? []).join(","), // ensure we pass any applied promotions to get the correct prices
    limit: 4, //TODO: make this a parameter
    offset: 0, //TODO: make this a parameter
    omit_basket_products: true,
    "filter[active]": true,
    order: "order",
    with: [
      "image",
      "prices",
      "products_attributes",
      "products_options",
      "products_options.prices",
    ].join(),
  };
  // conditionally add the basket_id / basket_product_id if we have them,
  // this is important to get the correct prices once added to the basket
  if (basketId) set(params, "basket_id", basketId);

  return getRequest({
    url: useUrl(`basket/products/${productId}`, params),
    useCache: true,
    maxAge: useTime()?.DAY, // product data is not updated often, so we can cache for a day
    withAccessToken: true,
  }).then(({ data }: any) => data);
}

// --------------------------------------------------------
// EXPORTS

export default {
  fetch,
} as any;
