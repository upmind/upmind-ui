// --- external

// --- internal
import { or } from "ajv/dist/compile/codegen";
import { useApi } from "../../..";
// --- utils
import {
  compact,
  concat,
  filter,
  forEach,
  get,
  has,
  isEmpty,
  map,
  reduce,
  set,
  some,
} from "lodash-es";

// --- types

// --------------------------------------------------------

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data

// --------------------------------------------------------
async function loadProvisioningValues({ basket_id, model }) {
  const { get, useUrl } = useApi();
  const { product_id } = model;

  // bail if we have no basket, or if we have a basket with products
  if (!product_id || !basket_id) return Promise.resolve(null);

  // this will get all our provisioning fields for each product that has them,
  // and update the baskets relevant products with the values

  const sub_product_ids = compact(
    map(concat(model.options, model.attributes), "product_id")
  );

  // we dont cache provisioning fields, as they can change with diferent options/attributes being selected
  return get({
    url: useUrl(
      `orders/${basket_id}/products/${product_id}/provision_fields/values`,
      { sub_product_ids }
    ),
    useCache: false,
    withAccessToken: true,
  }).then(({ data }) => {
    // update the product with the provisioning fields
    set(model, "provision_fields", data);
    return model;
  });
}

async function update({ basket_id, basket_products, id }, { data }) {
  const { put, post, useUrl } = useApi();
  if (!basket_id) return Promise.reject("No basket provided/available");
  if (isEmpty(data)) return Promise.reject(`No product data provided : ${id}`);
  // ---
  const isNew = !id;
  const action = isNew ? post : put;
  const suffix = isNew ? "" : `/${id}`;
  // ---
  return action({
    url: useUrl(`/orders/${basket_id}/products${suffix}`),
    data,
    withAccessToken: true,
  }).then(({ data }) => data);
}

async function remove({ basket_id, id }) {
  const { del, useUrl } = useApi();
  if (!basket_id) return Promise.reject("No basket provided/available");
  if (!id) return Promise.resolve(); // we dont need to make a request as there is no id, must be a new product
  // ---
  return del({
    url: useUrl(`/orders/${basket_id}/products/${id}`),
    withAccessToken: true,
  }).then(({ data }) => data);
}

async function sync({ basket_id, basket_products }, { data }) {
  if (!basket_id) return Promise.reject("No basket provided/available");

  // When updating the basket we need to provide all products that are being updated
  // AND any other existing products already added
  // otherwise the existing products will be removed from the basket
  const dirty = filter(
    data,
    item =>
      !isEmpty(item?.state?.context?.basket_product) ||
      ["available.configured"].some(item.state?.matches)
  );

  // --- then build the basket config for the dirty products
  const products = map(dirty, item => {
    const id = get(item, "state.context.basket_product.id");
    // inform the item that it is being processed
    item.send({ type: "PROCESSING" });
    // ---
    const model = get(item, "state.context.model");
    if (!model) return Promise.reject("No model found");
    // ---
    const basketItemBuilder = get(item, "state.context.basketItemBuilder");
    if (!basketItemBuilder)
      return Promise.reject("No basketItemBuilder provided");
    // ---
    const product = basketItemBuilder(model);
    // Add a flag to the product to indicate that the field values should NOT be validated.
    //  we want to ge these products in without deep validation
    set(product, "provision_field_values_validate", false);
    if (id) set(product, "order_product_id", id);

    return product;
  });

  // --- then build the minimal basket config for the existing products
  // the existing products dont need to have their full config, just the id

  const existingProducts = reduce(
    basket_products,
    (result, item) => {
      if (get(item, "state.context.basket_product.id")) {
        result.push({
          product_id: item.state.context.basket_product.product_id,
          order_product_id: item.state.context.basket_product.id,
        });
      }

      return result;
    },
    []
  );

  // ---
  const { put, useUrl } = useApi();
  return put({
    url: useUrl(`/orders/${basket_id}`),
    data: { products: concat(existingProducts, products) },
    withAccessToken: true,
  })
    .then(({ data }) => {
      forEach(dirty, item => item.send({ type: "UPDATED" }));
      return data;
    })
    .catch(error => {
      debugger;
      forEach(dirty, item => item.send({ type: "ERROR" }));
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
