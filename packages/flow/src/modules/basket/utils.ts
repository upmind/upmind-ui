// --- external
import { spawn } from "xstate";

// --- internal
import configurationMachine from "../product/product.machine";

// --- utils
import { first, get, isArray, reduce, set } from "lodash-es";

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
      sync: true
    });
  } catch (err) {
    console.error("Basket", "spawnConfiguration", {
      values,
      currency_id,
      promotions
    });
  }
}

export const useBasketParser = (data: any) => {
  data = get(data, "data", data); // handle the reponse types from the api
  data = isArray(data) ? first(data) : data; // usually from the claims endpoint

  // TODO:...map properly...

  return data;
};

// ---

export const useSummaryParser = (data?: any) => {
  // console.log("useBasketSummaryParser", { basket: data });
  const summary = {
    discount: data?.net_discount_amount_formatted, // total_discount_amount
    subtotal: data?.net_amount_formatted || "", // total_amount
    taxes: data?.tax_amount_formatted, // tax_amount
    total: data?.unpaid_amount_formatted || "" // unpaid_amount
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
    custom_fields
  };
};
