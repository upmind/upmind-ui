// --- external

// --- internal
import { useApi } from "../../..";
// --- utils
import { set, map, concat, compact, isEmpty } from "lodash-es";

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

async function update({ basket_id, id }, { data }) {
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

// async function updateProvisioningFields({ basket_id, product, values }) {
//   const { put, useUrl } = useApi();

//   // bail if we have no basket, or if we dont have a product
//   if (!basket_id) return Promise.reject("No basket provided/available");
//   if (!product) return Promise.reject("No product provided/available");

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

// --------------------------------------------------------
// EXPORTS

export default {
  loadProvisioningValues,
  update,
  remove,
};
