// --- external
import { spawn } from "xstate";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import paymentDetailsMachine from "../paymentDetails/paymentDetail.machine";
import customFieldsMachine from "./fields/fields.machine";
import promotionsMachine from "./promotions/promotions.machine";
import currencyMachine from "./currency/currency.machine";
import billingMachine from "./billing/billing.machine";

// --- utils
import {
  parseNestedErrors,
  unflattenErrors,
  type ResponseError
} from "../../utils";
import { parsePromotionDetails } from "./promotions/utils";
import {
  parseBasketProduct,
  parseBasketProductError
} from "../basketProduct/utils";

import {
  compact,
  defaultsDeep,
  find,
  get,
  map,
  reduce,
  set,
  uniq
} from "lodash-es";

// --- types
import type { IBasket } from "@upmind-automation/types";
import { InvoiceStatus, TaxTagTypes } from "@upmind-automation/types";

import { type PaymentDetailsContext } from "../paymentDetails";
import { type BasketContext } from "./types";

// -----------------------------------------------------------------------------

// --- SPAWN ACTORS

export function spawnBilling(basket?: IBasket) {
  return spawn(
    billingMachine.withContext({
      basketId: basket?.id,
      clientId: basket?.client_id,
      model: {
        addressId: basket?.address_id || undefined,
        companyId: basket?.company_id || undefined,
        phoneId: basket?.phone_id || undefined
      }
    }),
    { name: "billing", sync: true }
  );
}

export function spawnCurrency(basket?: IBasket) {
  return spawn(
    currencyMachine.withContext({
      basketId: basket?.id,
      model: basket?.currency
    }),
    { name: "currency", sync: true }
  );
}

export function spawnCustomFields(basket?: IBasket, error?: ResponseError) {
  return spawn(
    customFieldsMachine.withContext({
      basketId: basket?.id,
      model: parseBasketFieldsModel(basket),
      error: !error
        ? undefined
        : {
            ...error,
            data: error?.data?.fieldErrors ?? []
          }
    }),
    { name: "customFields", sync: true }
  );
}

export function spawnPaymentDetail(basket?: IBasket) {
  return spawn(
    paymentDetailsMachine.withContext({
      orderId: basket?.id,
      orderStatus: basket?.status?.code || InvoiceStatus.DRAFT,
      currency: basket?.currency,
      address: basket?.address,
      client: basket?.client,
      amount: basket?.unpaid_amount_converted || 0.0,
      model: {}
    } as PaymentDetailsContext),
    { name: "paymentDetail", sync: true }
  );
}

export function spawnPromotions(basket?: IBasket) {
  return spawn(
    promotionsMachine.withContext({
      basketId: basket?.id,
      promotions: parsePromotionDetails(basket?.promotions ?? [])
    }),
    { name: "promotions", sync: true }
  );
}

// --- PARSERS

export const parseBasket = (
  data: IBasket | { basket: IBasket },
  basket?: IBasket
) => {
  const newBasket = get(data, "basket", data) as IBasket;

  // If no old basket, just return the new one
  if (!basket) return newBasket;

  // Smart merge arrays by ID - new items take priority, old data fills in missing properties
  // Removed items (not in new array) are correctly dropped
  const mergeArrayById = (
    newArray: any[] | undefined,
    oldArray: any[] | undefined
  ) => {
    if (!newArray) return undefined;
    if (!oldArray) return newArray;

    return map(newArray, (newItem: any) => {
      const oldItem = find(oldArray, ["id", newItem.id]);
      return oldItem ? defaultsDeep({}, newItem, oldItem) : newItem;
    });
  };

  // Start with defaultsDeep for scalar properties
  // const merged = newBasket || [];

  // Override arrays with smart ID-based merge (not index-based)
  if (newBasket?.products !== undefined) {
    newBasket.products = (mergeArrayById(newBasket.products, basket.products) ??
      []) as IBasket["products"];
  }
  if (newBasket?.promotions !== undefined) {
    newBasket.promotions = (mergeArrayById(
      newBasket.promotions,
      basket.promotions
    ) ?? []) as IBasket["promotions"];
  }

  return newBasket;
};

// --- SUMMARY

export const parseSummary = (
  data?: IBasket,
  errors?: any
): BasketContext["summary"] => {
  const summary = {
    products: map(get(data, "products"), product =>
      parseBasketProduct(product, errors)
    ),
    discount: data?.total_discount_amount
      ? data.net_discount_amount_formatted
      : null, // only include the discount if there is one
    subtotal: data?.net_amount_formatted || "",
    taxes: parseTaxes(data?.taxes ?? []),
    total: data?.total_amount_formatted || ""
    // ---
  };
  return summary;
};

// --- TAXES

export const parseTaxes = (taxes: IBasket["taxes"]) => {
  // we may have multiple taxes, and each tax may have multiple tags
  //  we want to return a unique list of tags and their values
  return reduce(
    taxes,
    (result: { title: string; amount: string }[], tax) => {
      // and we may have multiple tags for a single tax
      //  so parse them all and return a unique list
      // -- The old codebase just used the first tag, but lets see if we can do better
      const name = uniq(map(tax.tax_tag_data, parseTaxTagName)).join(", ");
      result.push({
        title: name,
        amount: tax.amount_formatted
      });

      return result;
    },
    [] as { title: string; amount: string }[]
  );
};

// --- HACK: This is ported directly from the old codebase!
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
        tag?.tax_tag_type === TaxTagTypes.PERCENT && `(${tag.tax_tag_amount}%)`
  ]).join(" ");
};

// --- FIELDS

export const parseBasketFieldsModel = (basket: any, data = {}) => {
  const notes = get(basket, "notes", get(data, "notes"));
  const customFields = reduce(
    get(basket, "custom_fields"),
    (result, { field, value }) => {
      set(result, field.code, value);
      return result;
    },
    get(data, "custom_fields", {})
  );
  return {
    notes: notes || null,
    customFields
  };
};

/**
 * Parses API error responses into structured field and product errors.
 * Always extracts both custom_fields and products errors from the unflattened data.
 */
export function parseBasketErrors(
  error: ResponseError,
  products: IBasket["products"]
) {
  const unflattened = unflattenErrors(error?.data);

  return {
    fieldErrors: parseNestedErrors(
      unflattened,
      "custom_fields",
      "customFields"
    ),
    productErrors: reduce(
      get(unflattened, "products"),
      (result, value, key: number) => {
        const bpid = products[key]?.id;
        if (!bpid) return result;
        return set(result, bpid, parseBasketProductError(value));
      },
      {}
    )
  };
}
