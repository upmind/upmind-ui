// --- external

// --- internal
import { ServerResponse } from "http";
import { useApi } from "../../..";
// --- utils
import { get, has, set, map, concat, compact, isEmpty } from "lodash-es";

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

async function update({ basket_id }, { data }) {
  debugger;
  if (!basket_id) return Promise.reject("No basket provided/available");
  debugger;

  // We have been provided a subMachine, so we need to get its latest data
  const item = data.getSnapshot();
  if (isEmpty(item)) return Promise.reject(`No such item : ${data}`);

  const isNew = get(item, "context.isNew");
  const config = get(item, "context.config");

  const { put, post, useUrl } = useApi();
  const action = isNew ? post : put;
  const suffix = isNew ? "" : `/${item.id}`;
  debugger;
  return action({
    url: useUrl(`/orders/${basket_id}/products${suffix}`),
    data: config,
    withAccessToken: true,
  }).then(({ data }) => data);
}

// async function updateProvisioningFields({ basket_id, product, values }) {
//   const { put, useUrl } = useApi();

//   // bail if we have no basket, or if we dont have a product
//   if (!basket_id) return Promise.reject("No basket provided/available");
//   if (!product) return Promise.reject("No product provided/available");

//   debugger;
//   const hasProvisioning = !!get(product, "provision_blueprint_id");

//   // if the product has no provisioning fields, we dont need to make a request
//   if (!hasProvisioning) return Promise.resolve(product);

//   return put({
//     url: useUrl(
//       `/orders/${basket_id}/products/${product.id}/provision_fields/values`
//     ),
//     data: { values },
//     withAccessToken: true,
//   }).then(({ data }) => {
//     // update the product with the provisioning fields, before returning the basket
//     set(product, ["provision_fields"], data);
//     return product;
//   });
// }

async function remove({ basket_id }, { data }) {
  debugger;
  if (!basket_id) return Promise.reject("No basket provided/available");

  // We have been provided a subMachine, so we need to get its latest data
  const item = data.getSnapshot();
  if (isEmpty(item)) return Promise.reject(`No such item : ${data}`);

  const isNew = get(item, "context.isNew");

  if (isNew) return Promise.resolve(); // we dont need to make a request

  const { del, useUrl } = useApi();
  return del({
    url: useUrl(`/orders/${basket_id}/products/${item.id}`),
    withAccessToken: true,
  }).then(({ data }) => data);
}

// --------------------------------------------------------
// EXPORTS

export default {
  loadProvisioningValues,
  update,
  remove,
};
