// --- external

// --- internal
import { useApi } from "../../..";
// --- utils
import { has, set, map, concat, compact, isEmpty } from "lodash-es";

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
  })
    .then(({ data }) => data)
    .then(basket => {
      // if (isNew) {
      //   const newProducts = differenceBy(
      //     basket.products,
      //     basket_products,
      //     "id"
      //   );
      //   if (newProducts?.length > 1) {
      //     // there should not really ever be more than one new product
      //     console.warn(
      //       "BasketHelper",
      //       "update",
      //       "returned multiple new products",
      //       newProducts
      //     );
      //   }
      //   // update our product id with the new product id, which should be the first new product
      //   id = get(newProducts, "[0].id");
      // }
      //  new Products will add the provisioning fields, so we dont need to make a request
      if (isNew) return basket;
      // ---
      const hasProvisioning = has(data, "provision_field_values");
      // if the product has no provisioning fields, we dont need to make a request
      if (!hasProvisioning) return basket;
      return updateProvisioningFields(
        { basket_id, product_id: id },
        { data: data.provision_field_values }
      );
    });
}

async function updateProvisioningFields(
  { basket_id, product_id },
  { data: provision_field_values }
) {
  const { put, useUrl } = useApi();
  // bail if we have no basket, or if we dont have a product
  if (!basket_id) return Promise.reject("No basket provided/available");
  if (!product_id) return Promise.reject("No product provided/available");
  return put({
    url: useUrl(
      `/orders/${basket_id}/products/${product_id}/provision_fields/values`
    ),
    data: { provision_field_values },
    withAccessToken: true,
  }).then(({ data }) => {
    return data;
  });
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

// --------------------------------------------------------
// EXPORTS

export default {
  loadProvisioningValues,
  update,
  remove,
};
