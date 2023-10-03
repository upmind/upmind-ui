// --- external

// --- internal
import { useApi } from "../api";
import { type BasketContext } from "./types.d";

// --- utils

// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data
// this will process the request and return a promise

async function check(context: BasketContext, _event: any) {
  const { get, useUrl } = useApi();

  // ensure we have a token and watch for changes
  // service.onTransition(state => {
  //   token = get(state, "token.access_token", "");
  // });

  // get returns a promise so we can pass it directly back to the machine
  return get({
    url: useUrl("/orders/current", {
      with: [
        "account.brand.image",
        "account.pricelist",
        "brand.image",
        "client.image",
        "contract",
        "currency",
        "custom_fields.field",
        "payments",
        "products.product.image",
        "products.product.images",
        "products.product.prices",
        "products.product.products_attributes",
        "products.product.products_attributes.category",
        "products.product.products_options",
        "products.product.products_options.category",
        "products.product.products_options.prices",
        "products.tags",
        "promotions",
        "status",
        "taxes",
        "taxes.tax_tag_data",
        `products.product.category${".top_category".repeat(4)}`
      ].join()
    }),
    withAccessToken: true,
    useCache: false
  });
}

// --------------------------------------------------------
// EXPORTS

export default <Object>{
  check
};
