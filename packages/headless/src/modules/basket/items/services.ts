// --- external

// --- internal
import { useApi } from "../../..";
// --- utils
import { parseBasketProductConfig } from "./utils";

import {
  compact,
  concat,
  filter,
  forEach,
  get,
  isEmpty,
  map,
  reduce,
  set,
} from "lodash-es";

// --- types

// --------------------------------------------------------

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data

// --------------------------------------------------------
async function loadProvisioningValues({ basketId, model }: any) {
  const { get, useUrl } = useApi();
  const { productId } = model;

  // bail if we have no basket, or if we have a basket with products
  if (!productId || !basketId) return Promise.resolve(null);

  // this will get all our provisioning fields for each product that has them,
  // and update the baskets relevant products with the values

  const subProducts = compact(
    map(concat(model.options, model.attributes), ({ productId }) => ({
      product_id: productId,
    }))
  );

  // we dont cache provisioning fields, as they can change with diferent options/attributes being selected
  return get({
    url: useUrl(
      `orders/${basketId}/products/${productId}/provision_fields/values`,
      { sub_product_ids: subProducts }
    ),
    useCache: false,
    withAccessToken: true,
  }).then(({ data }: any) => {
    // update the product with the provisioning fields
    set(model, "provisionFields", data);
    return model;
  });
}

async function update({ basketId, id }: any, { data }: any) {
  const { put, post, useUrl } = useApi();
  if (!basketId) return Promise.reject("No basket provided/available");
  if (isEmpty(data)) return Promise.reject(`No product data provided : ${id}`);

  const product = parseBasketProductConfig(data);

  // ---
  const isNew = !id;
  const action = isNew ? post : put;
  const suffix = isNew ? "" : `/${id}`;
  // ---
  return action({
    url: useUrl(`/orders/${basketId}/products${suffix}`),
    data: product,
    withAccessToken: true,
  }).then(({ data }: any) => data);
}

async function remove({ basketId, id }: any) {
  const { del, useUrl } = useApi();
  if (!basketId) return Promise.reject("No basket provided/available");
  if (!id) return Promise.resolve(); // we dont need to make a request as there is no id, must be a new product
  // ---
  return del({
    url: useUrl(`/orders/${basketId}/products/${id}`),
    withAccessToken: true,
  }).then(({ data }: any) => data);
}

async function sync(
  { basketId, basketProducts, promotions }: any,
  { data }: any
) {
  if (!basketId) return Promise.reject("No basket provided/available");

  // When updating the basket we need to provide :
  //   * ALL products that are valid and ready to be saved
  //   * ALL other existing products already in the basket
  // otherwise the existing products will be removed from the basket

  const validItems = filter(data, item =>
    item.state?.matches("available.configured")
  );

  // --- then build the basket config for the validItems products
  const products = map(validItems, item => {
    const id = get(item, "state.context.basketProduct.id");
    // inform the item that it is being processed
    item.send({ type: "PROCESSING" });
    // ---
    const model = get(item, "state.context.model");
    if (!model) return Promise.reject("No model found");
    // ---
    const product = parseBasketProductConfig(model, promotions);
    // Add a flag to the product to indicate that the field values should NOT be validated.
    //  we want to ge these products in without deep validation
    set(product, "provision_field_values_validate", false);

    if (id) set(product, "order_product_id", id);

    return product;
  });

  // --- then build the minimal basket config for the existing products
  // the existing products dont need to have their full config, just the id
  const existingProducts = reduce(
    basketProducts,
    (result: any[], item: any) => {
      const id = get(item, "id");

      if (id) {
        const product = parseBasketProductConfig(item, promotions);
        // Add a flag to the product to indicate that the field values should NOT be validated.
        //  we want to ge these products in without deep validation
        set(product, "provision_field_values_validate", false);
        set(product, "order_product_id", id);
        result.push(product);
      }

      return result;
    },
    []
  );

  // ---
  const { put, useUrl } = useApi();
  return put({
    url: useUrl(`/orders/${basketId}`),
    data: { products: concat(existingProducts, products) },
    withAccessToken: true,
  })
    .then(({ data }: any) => {
      forEach(validItems, item => item.send({ type: "UPDATED" }));
      return data;
    })
    .catch(error => {
      forEach(validItems, item => item.send({ type: "CANCEL" }));
      return Promise.reject(error);
    });
}
// --------------------------------------------------------
// EXPORTS

export default {
  loadProvisioningValues,
  update,
  remove,
  sync,
};
