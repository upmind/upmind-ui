// --- external
import { spawn } from "xstate";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import paymentDetailsMachine from "../paymentDetails/paymentDetails.machine";
import customFieldsMachine from "./fields/fields.machine";
import promotionsMachine from "./promotions/promotions.machine";
import currencyMachine from "./currency/currency.machine";
import billingDetailsMachine from "./billing/details.machine";

// --- utils
import { useValidationParser } from "../../utils";
import { parseBasketProduct } from "../basketProduct/utils";

import {
  compact,
  defaults,
  forEach,
  get,
  isEmpty,
  map,
  pick,
  reduce,
  set,
  toNumber,
  uniq,
  uniqueId,
  isNil,
} from "lodash-es";

// --- types
import type { IBasket } from "@upmind-automation/types";
import { TaxTagTypes } from "@upmind-automation/types";

import { PaymentDetailsContext } from "../paymentDetails";

// -----------------------------------------------------------------------------

// --- SPAWN ACTORS

export function spawnBillingDetails(basket?: IBasket) {
  return spawn(
    billingDetailsMachine.withContext({
      basketId: basket?.id,
      clientId: basket?.client_id,
      model: {
        addressId: basket?.address_id || undefined,
        companyId: basket?.company_id || undefined,
      },
    }),
    { name: "billingDetails", sync: true }
  );
}

export function spawnCurrency(basket?: IBasket) {
  return spawn(
    currencyMachine.withContext({
      basketId: basket?.id,
      model: basket?.currency,
    }),
    { name: "currency", sync: true }
  );
}

export function spawnCustomFields(basket?: IBasket) {
  return spawn(
    customFieldsMachine.withContext({
      basketId: basket?.id,
      model: parseBasketFieldsModel(basket),
    }),
    { name: "customFields", sync: true }
  );
}

export function spawnPaymentDetails(basket?: IBasket) {
  return spawn(
    paymentDetailsMachine.withContext({
      orderId: basket?.id,
      currency: basket?.currency,
      // @ts-ignore address is available with relationship
      address: basket?.address,
      clientId: basket?.client_id,
      amount: basket?.unpaid_amount_converted || 0.0,
      model: {
        amount: basket?.unpaid_amount_converted || 0.0,
      },
    } as PaymentDetailsContext),
    { name: "paymentDetails", sync: true }
  );
}

export function spawnPromotions(basket?: IBasket) {
  return spawn(
    promotionsMachine.withContext({
      basketId: basket?.id,
      promotions: basket?.promotions,
    }),
    { name: "promotions", sync: true }
  );
}

// --- PARSERS

export const parseBasket = (data: any) => {
  const basket = get(data, "basket", data);

  // TODO:...map properly...

  return basket;
};

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
    // ---
  };
  return summary;
};

// --- TAXES

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
        tag?.tax_tag_type === TaxTagTypes.PERCENT && `(${tag.tax_tag_amount}%)`,
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
    notes,
    customFields,
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
        provisionFields: useValidationParser({
          data: errors,
        }),
      };
    }

    return parsedError;
  }

  return undefined;
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
