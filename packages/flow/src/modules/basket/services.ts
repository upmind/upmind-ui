// --- external
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import { useApi } from "../api";
import { useSession } from "../session";
import { type BasketContext } from "./types.d";

// --- utils
import { get } from "lodash-es";

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
    withAccessToken: true
  });
}

async function refreshToken(context: BasketContext, _event: any) {
  let { service, token } = useSession();

  service.send("REFRESH");

  return new Promise((resolve, reject) => {
    waitFor(service, state => ["processed", "error"].some(state.matches))
      .then(state => {
        if (state.matches("processed")) {
          // if the service was processed, we return the response
          const token = get(state, "context.token");
          debugger;
          resolve();
        } else if (state.matches("error")) {
          const error = get(state, "context.error");
          reject(error);
        }
      })
      .catch(error => {
        console.error("Error refreshing token", error);
        reject(error);
      });
  });
}
// --------------------------------------------------------
// EXPORTS

export default <Object>{
  check
};
