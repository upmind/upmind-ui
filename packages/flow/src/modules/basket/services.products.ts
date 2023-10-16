// --- external

// --- internal
import { useApi } from "../api";
import type { BasketContext, BasketItemContext } from "./types.d";

// --- utils

// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data
// this will process the request and return a promise

// --------------------------------------------------------
//  Syntax sugar to manage Products (likely to move to a separate product machine, like requests)

// utility function to spawn machines based on the given items

async function add({ basket_id, product }, _event: any) {
  const { post, useUrl } = useApi();
  return post({
    url: useUrl(`/orders/${basket_id}/products`),
    data: product,
    withAccessToken: true
  });
}

async function update(context: BasketContext, _event: any) {}

async function remove(context: BasketContext, _event: any) {}

async function clear(context: BasketContext, _event: any) {}

// ---
// Get the product that has been prepared for the basket, with all the required data
async function getProduct(
  { product, basketId }: BasketItemContext,
  _event: any
) {
  const { get, useUrl } = useApi();

  return get({
    url: useUrl(`basket/products/${product}`, {
      basket_id: basketId,
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
  });
}

// --------------------------------------------------------
// EXPORTS

export default <Object>{
  add,
  update,
  remove,
  clear,
  // ---
  getProduct
};
