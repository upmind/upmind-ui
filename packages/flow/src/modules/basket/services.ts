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

  // get returns a promise so we can pass it directly back to the machine
  return await get({
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

async function create(context: BasketContext, _event: any) {
  const { post, useUrl } = useApi();

  return post({
    url: useUrl("/orders"),
    data: {
      category_slug: "new_contract"
      // currency_code: "GBP",
      // pricelist_id: "9320e435-795e-78d1-84ce-1643202d9860",
      // products: [
      //   {
      //     product_id: "d7382485-0793-157e-622c-91e642d59e06",
      //     quantity: 1,
      //     billing_cycle_months: 1,
      //     total: 15,
      //     options: [
      //       {
      //         billing_cycle_months: 1,
      //         order_type: 1,
      //         product_id: "4038696e-5472-1d26-09ec-e18d9305e7d2",
      //         total: 10,
      //         unit_quantity: 1,
      //         unit_total: 10
      //       }
      //     ],
      //     attributes: [],
      //     start_trial: false
      //   }
      // ],
      // promotions: []
    },
    withAccessToken: true,
    useCache: false
  });
}

async function createWithProduct(context: BasketContext, _event: any) {}

// ---

async function add(context: BasketContext, _event: any) {}

async function update(context: BasketContext, _event: any) {}

async function clear(context: BasketContext, _event: any) {}

async function remove(context: BasketContext, _event: any) {}

// --------------------------------------------------------
// EXPORTS

export default <Object>{
  check,
  create
};
