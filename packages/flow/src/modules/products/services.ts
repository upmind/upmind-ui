// --- external

// --- internal
import { useApi } from "../api";
import { useBrand, BrandConfigKeys } from "../brand";
const { getConfig } = useBrand();

import type { IProductConfig, ProductConfigContext } from "./types";

// --- utils
import { useTime } from "../../utils";
import { useQuantityParser } from "./utils";

import {
  defaultsDeep,
  find,
  first,
  get,
  isEmpty,
  isNil,
  isNumber,
  isObject,
  keys,
  mapValues,
  maxBy,
  minBy,
  pickBy,
  reduce,
  set,
  some,
  unset
} from "lodash-es";

// --------------------------------------------------------
// ENUMS

export enum DefaultPaymentPeriod {
  INHERIT_FROM_BRAND = 0,
  LOWEST_PRICE = 1,
  LOWEST_MONTHLY_PRICE = 2,
  HIGHEST_PRICE = 3
}

// --------------------------------------------------------
// HELPERS

async function calculateBillingTerm(
  period: DefaultPaymentPeriod,
  availableTerms: any
) {
  // because we have multiple options, we need to select one base don the following strategy:

  let term;

  const brandPaymentPeriod: DefaultPaymentPeriod | any = await getConfig(
    BrandConfigKeys.PRICE_TAX_PRICE_DEFAULT_PAYMENT_PERIOD
  ).then(response =>
    get(response, BrandConfigKeys.PRICE_TAX_PRICE_DEFAULT_PAYMENT_PERIOD)
  );

  switch (period) {
    case DefaultPaymentPeriod.HIGHEST_PRICE:
      term = maxBy(availableTerms, "price");
      break;
    case DefaultPaymentPeriod.LOWEST_PRICE:
      term = minBy(availableTerms, "price");
      break;
    case DefaultPaymentPeriod.LOWEST_MONTHLY_PRICE:
      term = minBy(availableTerms, "monthly_price_from");
      break;
    case DefaultPaymentPeriod.INHERIT_FROM_BRAND:
      term = await calculateBillingTerm(brandPaymentPeriod, availableTerms);
      break;

    default:
      term = first(availableTerms);
      break;
  }
  return term;
}

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data
// this will process the request and return a promise

async function getProduct({ values }: ProductConfigContext, _event: any) {
  const { productId } = values;

  if (!productId) return Promise.reject("No Product ID provided");

  const { get, useUrl } = useApi();
  const productPromise = get({
    url: useUrl(`basket/products/${productId}`, {
      // promotions: "": TODO:,
      with_staged_imports: true,
      with: [
        "image",
        "images",
        "prices",
        "products_attributes",
        "products_options",
        "products_options.prices"
        // "provision_blueprint"
        // "allowed_migrations",
        // "allowed_migrations.migration_product",
        // "category.top_category.top_category.top_category.top_category",
        // "import.credentials",
        // "import.source",
        // "set_products"
        // "sets",
        // "trial_migration_rule",
        // "trial_migration_rule.new_product",
        // "trial_migration_rule.new_product.prices"
      ].join()
    }),
    useCache: true,
    maxAge: useTime()?.DAY, // product data is not updated often, so we can cache for a day
    withAccessToken: true
  }).then(({ data }) => data);

  // lets get our provision_fields fields early, so we can make them available
  const provisioningPromise = getProvisioningFields({ values }, _event);

  return Promise.all([productPromise, provisioningPromise]).then(
    ([product, provision_fields]) => {
      set(product, "products_provisioning", provision_fields);
      return product;
    }
  );
}

// ---

async function getProvisioningFields(
  { values }: ProductConfigContext,
  _event: any
) {
  const { get, useUrl } = useApi();
  const { productId } = values;

  // we dont cache provision_fields fields, as they can change with diferent options/attributes being selected
  return get({
    url: useUrl(`basket/products/${productId}/provision_fields`),
    useCache: false,
    withAccessToken: true
  }).then(({ data }) => data);
}

async function checkProvisioning(
  { available, values }: ProductConfigContext,
  _event: any
) {
  // safety check, resolve if we have no attributes to check
  if (!available?.provision_fields?.length) {
    return Promise.resolve([]);
  }

  const errors = [];

  const provision_fields = reduce(
    available.provision_fields,
    (result, field, index) => {
      // try get any selected values for this provision_fields,
      let selected = get(values, `provision_fields.${field.name}`, null);

      // todo: validation

      // if we have selected values, ensure they are valid and fully formed
      // if (!isEmpty(selected)) {
      //   // only include valid values, stripping out any invalid ones, if we have any
      //   selected = pickBy(selected, (_value, id) =>
      //     some(field.values, ["id", id])
      //   );

      //   // then parse each selected value, and ensure it has all its required attributes
      //   // and that it has valid values for each of those attributes
      //   selected = mapValues(selected, (value, id) => {
      //     // ensure we have an object
      //     if (!isObject(value)) value = { product_id: id };
      //     const product = find(field.values, ["id", value.product_id]);

      //     //  ensure we have the required attributes
      //     value = defaultsDeep(value, {
      //       billing_cycle_months: values?.term,
      //       unit_quantity: 1
      //     });

      //     // ensure we have a valid unit_quantity
      //     value.unit_quantity = useQuantityParser(
      //       value?.unit_quantity,
      //       product
      //     );

      //     return value;
      //   });
      // }

      // check if we are missing required field
      if (field?.required && isEmpty(selected))
        errors.push({ message: "Is required", field });

      // ---
      set(result, field.name, selected);
      // if (selected) set(result, field.name, selected);
      // else unset(result, field.name);
      return result;
    },
    {}
  );

  return new Promise((resolve, reject) => {
    if (errors?.length) reject({ provision_fields, errors });
    else resolve(provision_fields);
  });
}

// ---

async function checkQuantity(
  { available, values }: ProductConfigContext,
  _event: any
) {
  const { product } = available;
  let { quantity } = values;
  // ---
  quantity = useQuantityParser(quantity, product);

  return new Promise((resolve, reject) => {
    if (isNumber(quantity)) resolve(quantity);
    else reject("Invalid Quantity Selected");
  });
}

/**
 * This Checks if the Product has any/multiple Term/Billing Cycle
 * If there is no/one option, it will automatically select it
 * We will also check that any values option is valid
 * @param context
 * @param _event
 * @returns {Promise<void>}
 * We Reject any invalid or empty selections
 * We Resolve the valid Selected option
 */
async function checkTerm(
  { available, values }: ProductConfigContext,
  _event: any
) {
  let term;

  if (!available?.terms?.length) {
    return Promise.reject("No Terms available");
  }

  // ---
  // try ge the full term object from the available terms
  term = find(available.terms, ["billing_cycle_months", values.term]);

  if (!term) {
    if (available.terms.length === 1) {
      term = first(available.terms);
    } else {
      term = await calculateBillingTerm(
        available.product.default_payment_period,
        available.terms
      );
    }
  }

  // now just return the billing_cycle_months, if we have one
  term = get(term, "billing_cycle_months", null);

  return new Promise((resolve, reject) => {
    if (!isNil(term)) resolve(term);
    else reject("Invalid Term Selected");
  });
}

async function checkAttributes(
  { available, values }: ProductConfigContext,
  _event: any
) {
  // safety check, resolve if we have no attributes to check
  if (!available?.attributes?.length) {
    return Promise.resolve([]);
  }

  const errors = [];

  // ---
  // for attributes we have to check a few things:
  // do we have any attributes that are:
  // required?
  // single vs multiple?
  // invalid : ie values but not actually available values
  // able to be auto values?

  // make sure we have a values object with only valid attribute values
  // let attributes = filter(values?.attributes, ({ product_id }) =>
  //   some(available.attributes, ({ values }) => includes(values, product_id))
  // );

  const attributes = reduce(
    available.attributes,
    (result, attribute, index) => {
      let selected = get(values, `attributes.${attribute.id}`, {});

      // only include valid values, if we have any
      if (!isEmpty(selected)) {
        selected = pickBy(selected, (_value, id) =>
          some(attribute.values, ["id", id])
        );

        // then parse each selected value, and ensure it has all its required attributes
        // and that it has valid values for each of those attributes
        selected = mapValues(selected, (value, id) => {
          // ensure we have an object
          if (!isObject(value)) value = { product_id: id };
          const product = find(attribute.values, ["id", value.product_id]);

          //  ensure we have the required attributes
          value = defaultsDeep(value, {
            billing_cycle_months: values?.term,
            unit_quantity: 1
          });

          // ensure we have a valid unit_quantity
          value.unit_quantity = useQuantityParser(
            value?.unit_quantity,
            product
          );

          return value;
        });
      }

      // check if we are missing required attribute
      if (attribute?.required && isEmpty(selected))
        errors.push({ message: "Is required", attribute });

      // check if we values too many values for this attribute
      if (!attribute?.multiple && keys(selected)?.length > 1) {
        errors.push({ message: "Multiple choice not allowed", attribute });
      }
      // ---
      set(result, attribute.id, selected);
      return result;
    },
    {}
  );

  return new Promise((resolve, reject) => {
    if (errors?.length) reject({ attributes, errors });
    else resolve(attributes);
  });
}

async function checkOptions(
  { available, values }: ProductConfigContext,
  _event: any
) {
  // safety check, resolve if we have no attributes to check
  if (!available?.options?.length) {
    return Promise.resolve([]);
  }

  const errors = [];

  const options = reduce(
    available.options,
    (result, option, index) => {
      // try get any selected values for this option,

      let selected = get(values, `options.${option.id}`, {});

      // if we have selected values, ensure they are valid and fully formed
      if (!isEmpty(selected)) {
        // only include valid values, stripping out any invalid ones, if we have any
        selected = pickBy(selected, (_value, id) =>
          some(option.values, ["id", id])
        );

        // then parse each selected value, and ensure it has all its required attributes
        // and that it has valid values for each of those attributes
        selected = mapValues(selected, (value, id) => {
          // ensure we have an object
          if (!isObject(value)) value = { product_id: id };
          const product = find(option.values, ["id", value.product_id]);

          //  ensure we have the required attributes
          value = defaultsDeep(value, {
            billing_cycle_months: values?.term,
            unit_quantity: 1
          });

          // ensure we have a valid unit_quantity
          value.unit_quantity = useQuantityParser(
            value?.unit_quantity,
            product
          );

          return value;
        });
      }

      // check if we are missing required option
      if (option?.required && isEmpty(selected))
        errors.push({ message: "Is required", option });

      // check if we values too many values for this option
      if (!option?.multiple && keys(selected)?.length > 1) {
        errors.push({ message: "Multiple choice not allowed", option });
      }
      // ---
      set(result, option.id, selected);
      return result;
    },
    {}
  );

  return new Promise((resolve, reject) => {
    if (errors?.length) reject({ options, errors });
    else resolve(options);
  });
}

// --------------------------------------------------------
// EXPORTS

export default <Object>{
  getProduct,
  // ---
  checkQuantity,
  checkTerm,
  checkAttributes,
  checkOptions,
  checkProvisioning
};
