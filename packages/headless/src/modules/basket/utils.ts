// --- external
import { spawn } from "xstate";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import { useSystem } from "../system";
import productMachine from "../product/product.machine";
import paymentDetailsMachine from "../paymentDetails/paymentDetails.machine";
import customFieldsMachine from "./fields/fields.machine";
import promotionsMachine from "./promotions/promotions.machine";
import currencyMachine from "./currency/currency.machine";
import billingDetailsMachine from "./billing/details.machine";

// --- utils
import {
  useValidationParser,
  useTranslateName,
  useTranslateField,
} from "../../utils";

import {
  compact,
  find,
  forEach,
  get,
  has,
  includes,
  isEmpty,
  isNil,
  isObject,
  isString,
  map,
  mapValues,
  merge,
  omit,
  omitBy,
  orderBy,
  pick,
  reduce,
  set,
  some,
  toNumber,
  uniq,
  uniqueId,
  values,
} from "lodash-es";

// --- types
import { TaxTagTypes } from "./types";
// @ts-ignore
import type { IBasket, BasketProduct, BasketProductDetail } from "./types";

// --------------------------------------------------------
// SPAWN ACTORS
export function spawnProductConfiguration(
  data: any,
  basket: IBasket,
  errorExternal?: any
) {
  const id = data?.id || uniqueId("product-");
  const isBasketProduct = data?.id ? true : false;

  // lets merge the promotions from the basket and the product
  const basketPromotions = map(basket?.promotions, "promocode");
  const productPromotions = data?.promotions || [];
  const promotions = uniq(compact([...basketPromotions, ...productPromotions]));

  const item = spawn(
    productMachine.withContext({
      id,
      basket_id: basket?.id,
      [isBasketProduct ? "basket_product" : "model"]: data,
      currency_id: basket?.currency_id,
      promotions,
      errorExternal,
    }),
    {
      name: id,
      sync: true,
    }
  );

  return item;
}

export function spawnBillingDetails(basket: IBasket) {
  return spawn(
    billingDetailsMachine.withContext({
      basket_id: basket?.id,
      client_id: basket?.client_id,
      model: {
        address_id: basket?.address_id,
        company_id: basket?.company_id,
      },
    }),
    { name: "billingDetails", sync: true }
  );
}

export function spawnCurrency(basket: IBasket) {
  return spawn(
    currencyMachine.withContext({
      basket_id: basket?.id,
      model: basket?.currency,
    }),
    { name: "currency", sync: true }
  );
}

export function spawnCustomFields(basket: IBasket) {
  return spawn(
    customFieldsMachine.withContext({
      basket_id: basket?.id,
      model: parseBasketFieldsModel(basket),
    }),
    { name: "customFields", sync: true }
  );
}

export function spawnPaymentDetails(basket: IBasket) {
  return spawn(
    // @ts-ignore
    paymentDetailsMachine.withContext({
      basket_id: basket?.id,
      currency: basket?.currency,
      model: {
        amount: basket?.unpaid_amount_converted || 0.0,
      },
    }),
    { name: "paymentDetails", sync: true }
  );
}

export function spawnPromotions(basket: IBasket) {
  return spawn(
    promotionsMachine.withContext({
      basket_id: basket?.id,
      promotions: basket?.promotions,
    }),
    { name: "promotions", sync: true }
  );
}

// --------------------------------------------------------
// --- PARSERS

export const parseBasket = (data: any) => {
  const basket = get(data, "basket", data);

  // TODO:...map properly...

  return basket;
};

export const parseBasketProduct = (data: any, errors?: any) => {
  const product: BasketProduct = {
    id: data?.id,
    name: data?.product_name,
    serviceIdentifier: data?.service_identifier,
    // ---
    description: data?.description,
    shortDescription: data?.product_short_description,
    // ---
    productId: data?.product_id,
    quantity: data?.quantity,
    // ---
    // Current Price is any discounted price (if available) otherwise the full price
    // Usual price is always the full price

    hasDiscount:
      data?.configuration_net_amount_discounted_converted !=
      data?.configuration_net_amount_converted,
    currentPrice: data?.configuration_net_amount_discounted_converted,
    currentPriceFormatted: data?.configuration_net_amount_discounted_formatted,
    regularPrice: data?.configuration_net_amount_converted,
    regularPriceFormatted: data?.configuration_net_amount_formatted,
    // ---
    details: [],

    // ---
    // todo  add non quantifiable otions here
    // products: [
    // id: product?.id,
    // name: product?.product_name,
    // service_identifier: product?.service_identifier,
    // quantity: product?.quantity,
    // discount: product?.configuration_total_discount_amount_converted
    //   ? product?.configuration_total_discount_amount_formatted
    //   : null,
    // subtotal: product?.configuration_net_amount_formatted,
    // total: product?.configuration_net_amount_discounted_formatted,
    // ],
  };

  // --- Now build up our details
  const term = parseTerm(
    data.billing_cycle_months,
    data.quantity,
    data?.product?.prices
  );
  if (term) product.details.push(term);

  forEach(data?.options, option => {
    const subproduct = parseSubproduct("option", option);
    if (subproduct) product.details.push(subproduct);
  });

  forEach(data?.attributes, attribute => {
    const subproduct = parseSubproduct("attribute", attribute);
    if (subproduct) product.details.push(subproduct);
  });

  forEach(data?.provision_fields, (value, key) => {
    const hasError =
      some(errors, `provision_field_values.${key}`) ||
      some(errors?.provision_fields?.data, ["schemaPath", key]);
    const field = parseProvisionField(key, value, hasError);
    if (field) product.details.push(field);
  });

  // ---

  //

  return product;
};

function parseTerm(
  billing_cycle_months: number,
  quantity: number,
  prices: any
): BasketProductDetail | null {
  const { getBillingCycle } = useSystem();
  const cycle = getBillingCycle(billing_cycle_months);
  const name = cycle ? useTranslateName(cycle) : null;
  const term = find(prices, ["billing_cycle_months", billing_cycle_months]);

  if (term) {
    // NB: only show term pricing if recurring!
    return {
      key: "term",
      category: "Billing Cycle",
      name,
      cycle: term.billing_cycle_months,
      quantity,
      // ---
      currentPrice: term.price_discounted,
      currentPriceFormatted: term.price_discounted_formatted,
      regularPrice: term?.price,
      regularPriceFormatted: term.price_formatted,
      hasDiscount: term?.price_discounted > 0,
    };
  }

  return null;
}

function parseSubproduct(
  key: string,
  subproduct: any
): BasketProductDetail | null {
  // NB: only show term pricing if recurring!
  return {
    key,
    category: useTranslateName(subproduct.product.category),
    name: subproduct?.product_name,
    cycle: subproduct.billing_cycle_months,
    quantity: subproduct.quantity,
    // ---
    currentPrice: subproduct.configuration_net_amount_discounted_converted,
    currentPriceFormatted:
      subproduct.configuration_net_amount_discounted_formatted,
    regularPrice: subproduct.configuration_net_amount_converted,
    regularPriceFormatted: subproduct.configuration_net_amount_formatted,
    hasDiscount: subproduct.configuration_total_discount_amount_converted > 0,
  };
}

function parseProvisionField(
  key: string,
  data: any,
  hasError?: any
): BasketProductDetail | null {
  const name = get(data, key);

  return {
    key: `provision_field.${key}`,
    category: key,
    name,
    invalid: hasError,
  };
}

// --------------------------------------------------------
// --- SUMMARY

export const parseSummary = (data?: any, errors?: any) => {
  const summary = {
    products: map(get(data, "products"), product =>
      parseBasketProduct(product, errors)
    ),
    discount: data?.total_discount_amount
      ? data.net_discount_amount_formatted
      : null, // only include the discount if there is one
    subtotal: data?.net_amount_formatted || "",
    taxes: parseTaxes(data?.taxes),
    total: data?.total_amount_formatted || "",
  };
  return summary;
};

// --------------------------------------------------------
//--- TAXES

export const parseTaxes = (taxes: any) => {
  // we may have multiple taxes, and each tax may have multiple tags
  //  we want to return a unique list of tags and their values
  return reduce(
    taxes,
    (result, tax) => {
      // and we may have multiple tags for a single tax
      //  so parse them all and return a unique list
      // -- The old codebase just used the first tag, but lets see if we can do better
      const name = uniq(map(tax.tax_tag_data, parseTaxTagName)).join(", ");
      set(result, name, tax.amount_formatted);

      return result;
    },
    {}
  );
};

// HACK: This is ported directly from the old codebase!
//       This is a bit of wizardry that takes a tax tag and
//       returns a human readable string and is used in the basket summary.
//       ---
//       This is slightly coonfusing because is takes what are essentially
//       plain text field which is the tag title and assumes it may contain a tax % value.
//       This strips any % values from the tag name and then calculates the actual
//       tax value based on the tag type and if it is a standard rate or the company rate.
//       eg: `Tax 20%` becomes `Tax (20%)` for the standard rate and `Tax (0%)` for the company rate.
export const parseTaxTagName = (tag: any) => {
  return compact([
    // Tag name
    tag?.tax_tag_name?.replace(/\d*%$/, ""),
    // Append percentage (if SECONDARY % rate)
    tag?.for_company
      ? tag.tax_tag_company_type === TaxTagTypes.PERCENT &&
        `(${tag.tax_tag_company_amount}%)`
      : // Append percentage (if DEFAULT % rate)
        tag?.tax_tag_type === TaxTagTypes.PERCENT && `(${tag.tax_tag_amount}%)`,
  ]).join(" ");
};

// --------------------------------------------------------
// Fields

export const parseBasketFieldsModel = (basket: any, data = {}) => {
  const notes = get(basket, "notes", get(data, "notes"));
  const custom_fields = reduce(
    get(basket, "custom_fields"),
    (result, { field, value }) => {
      set(result, field.code, value);
      return result;
    },
    get(data, "custom_fields", {})
  );

  return {
    notes,
    custom_fields,
  };
};

export const parseBasketProvisioningErrors = (error: any, index: any) => {
  // now pass any provisioning errors to the item
  if (error) {
    const errors = get(
      error,
      `data.products.${index}.provision_field_values`,
      []
    );

    let parsedError = undefined;

    if (!isEmpty(errors)) {
      parsedError = {
        provision_fields: useValidationParser({
          data: errors,
        }),
      };
    }

    return parsedError;
  }
};

export const forwardBasketProvisioningErrors = (
  error: any,
  item: any,
  index: any
) => {
  // now pass any provisioning errors to the item
  const parsedError = parseBasketProvisioningErrors(error, index);
  if (parsedError && !isEmpty(parsedError)) {
    waitFor(item, state => state.matches("available")).then(() => {
      item.send({ type: "ERROR", data: { error: parsedError } });
    });
  }
};
