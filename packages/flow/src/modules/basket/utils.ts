// --- external
import { spawn } from "xstate";

// --- internal
import configurationMachine from "../product/product.machine";
import paymentDetailsMachine from "../paymentDetails/paymentDetails.machine";
import customFieldsMachine from "./fields/fields.machine";
import promotionsMachine from "./promotions/promotions.machine";
import currencyMachine from "./currency/currency.machine";
import billingDetailsMachine from "./billing/details.machine";

// --- utils
import { first, get, isArray, map, reduce, set } from "lodash-es";

// --- types
import type { IBasket } from "./types.d";
// --------------------------------------------------------

// utility function to spawn machines based on the given items
export function spawnConfiguration(
  id: string,
  values: any,
  currency_id: IBasket["currency_id"],
  promotions: IBasket["promotions"]
) {
  try {
    return spawn(configurationMachine(values, currency_id, promotions), {
      name: id,
      sync: true,
    });
  } catch (err) {
    console.error("Basket", "spawnConfiguration", {
      values,
      currency_id,
      promotions,
    });
  }
}

export function spawnBillingDetails(basket: IBasket) {
  return spawn(
    billingDetailsMachine.withContext({
      basket_id: basket?.id,
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
      model: { id: basket?.currency_id },
    }),
    { name: "currency", sync: true }
  );
}

export function spawnCustomFields(basket: IBasket) {
  return spawn(
    customFieldsMachine.withContext({
      basket_id: basket?.id,
      model: useBasketFieldsModelParser(basket),
    }),
    { name: "customFields", sync: true }
  );
}

export function spawnPaymentDetails(basket: IBasket) {
  return spawn(
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

export const useBasketParser = (data: any) => {
  data = get(data, "data", data); // handle the reponse types from the api
  data = isArray(data) ? first(data) : data; // usually from the claims endpoint

  // TODO:...map properly...

  return data;
};

// ---

export const useSummaryParser = (data?: any) => {
  const summary = {
    products: map(get(data, "products"), product => ({
      id: product?.id,
      name: product?.product_name,
      quantity: product?.quantity,
      total: product?.configuration_total_amount_formatted,

      // total: data?.selling_price_formatted,
      // total: data?.configuration_total_amount_formatted,
      // total: data?.configuration_total_discounted_amount_formatted,
    })),
    discount: data?.net_discount_amount_formatted, // total_discount_amount
    subtotal: data?.net_amount_formatted || "", // total_amount
    taxes: data?.tax_amount_formatted, // tax_amount
    total: data?.unpaid_amount_formatted || "", // unpaid_amount
  };
  return summary;
};

// --------------------------------------------------------
// Fields

export const useBasketFieldsModelParser = (basket: any, data = {}) => {
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
