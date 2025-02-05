// --- external
import { spawn } from "xstate";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import { useBrand } from "../brand";
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
import { TaxTagTypes, ProductOrderTypes } from "./types";
// @ts-ignore
import type {
  Basket,
  BasketProduct,
  BasketProductSummaryDetail,
  BasketProductSummaryPrice,
} from "./types";

// --------------------------------------------------------
// SPAWN ACTORS
export function spawnProductConfiguration(
  data: any,
  basket?: Basket,
  errorExternal?: any
) {
  const id = data?.id || uniqueId("product-");
  const isBasketProduct = data?.id ? true : false;

  // lets merge the promotions from the basket and the product
  const promotions = map(basket?.promotions, "promotion.code");
  const coupons = data?.coupons || [];

  const model = defaults(data, {
    quantity: 1,
    productId: null,
    term: null,
    options: [],
    attributes: [],
    provisionFields: {},
  });

  const item = spawn(
    productMachine.withContext({
      id,
      basketId: basket?.id,
      [isBasketProduct ? "basketProduct" : "model"]: model,
      currencyId: basket?.currency_id,
      promotions,
      coupons,
      errorExternal,
    }),
    {
      name: id,
      sync: true,
    }
  );

  return item;
}

export function spawnBillingDetails(basket?: Basket) {
  return spawn(
    billingDetailsMachine.withContext({
      basketId: basket?.id,
      clientId: basket?.client_id,
      model: {
        addressId: basket?.address_id,
        companyId: basket?.company_id,
      },
    }),
    { name: "billingDetails", sync: true }
  );
}

export function spawnCurrency(basket?: Basket) {
  return spawn(
    currencyMachine.withContext({
      basketId: basket?.id,
      model: basket?.currency,
    }),
    { name: "currency", sync: true }
  );
}

export function spawnCustomFields(basket?: Basket) {
  return spawn(
    customFieldsMachine.withContext({
      basketId: basket?.id,
      model: parseBasketFieldsModel(basket),
    }),
    { name: "customFields", sync: true }
  );
}

export function spawnPaymentDetails(basket?: Basket) {
  return spawn(
    // @ts-ignore
    paymentDetailsMachine.withContext({
      basketId: basket?.id,
      currency: basket?.currency,
      model: {
        amount: basket?.unpaid_amount_converted || 0.0,
      },
      address: basket?.address,
    }),
    { name: "paymentDetails", sync: true }
  );
}

export function spawnPromotions(basket?: Basket) {
  return spawn(
    promotionsMachine.withContext({
      basketId: basket?.id,
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

export const parseBasketProduct = (raw: any, provisioningErrors?: any) => {
  // Get price object matching `display_price_billing_cycle_months`
  const product: BasketProduct = {
    id: raw?.id,

    // --- model
    quantity: raw.quantity,
    productId: raw.product_id,
    term: raw.billing_cycle_months,
    options: parseSubproductChoices(raw.options),
    attributes: parseSubproductChoices(raw.attributes),
    provisionFields: raw.provision_fields,

    // --- product details
    product: {
      name: useTranslateName(raw?.product),
      serviceIdentifier: raw?.service_identifier,
      category: useTranslateName(raw?.product?.category),
      description: useTranslateField(raw, "product.description"),
      excerpt: useTranslateField(raw, "product.short_description"),
      id: raw?.product_id,
      imgUrl: raw?.product?.image?.full_url,
      // meta: raw?.product?.meta,// TODO get/use product meta from API
      // ---
      quantifiable:
        raw?.product?.order_type == ProductOrderTypes.QUANTITY_BASED, //!!raw?.can_change_quantity,
      step: raw?.unit_quantity || 1,
      min: raw?.min_order_quantity | raw?.unit_quantity,
      max: raw?.max_order_quantity > 0 ? raw?.max_order_quantity : Infinity,
    },

    // --- summary details
    summary: {
      pricing: [parsPriceSummary(raw)],
      details: [],
    },
    // --- errors
    error: get(provisioningErrors, [raw?.id]),
  };

  // --- Now build up our details
  const term = parseTerm(raw);
  if (term) {
    product.summary.details.push(term);
  }
  // ---
  forEach(raw?.options, option => {
    const subproduct = parsPriceSummary(option);
    if (subproduct) {
      if (option.product.order_type === ProductOrderTypes.SINGLE_OPTION)
        product.summary.pricing.push(subproduct);
      subproduct.key = "option";
      product.summary.details.push(subproduct as BasketProductSummaryDetail);
    }
  });

  // ---
  forEach(raw?.attributes, attribute => {
    const subproduct = parseSubproduct(attribute);
    if (subproduct) {
      subproduct.key = "attribute";
      product.summary.details.push(subproduct as BasketProductSummaryDetail);
    }
  });

  // ---
  forEach(raw?.provision_fields, (value, key) => {
    const hasError = get(provisioningErrors, [raw?.id, key]);
    const field = parseProvisionField(key, value, hasError);
    if (field) product.summary.details.push(field);
  });

  // ---

  return product;
};

const parseSubproductChoices = (values: any) => {
  return reduce(
    values,
    (result, value) => {
      set(result, [value.product.category_id, value.product_id], {
        productId: value.product_id,
        quantity: parseQuantity(value.unit_quantity, value.product),
        cycle: value.billing_cycle_months,
      });
      return result;
    },
    {}
  );
};

const parseQuantity = (quantity: number, raw: any) => {
  quantity = toNumber(quantity) || 1; // ensure we have a number;
  // Check the raw is available
  // Check the quantity is valid,
  //  - min Quantity matches the raw min
  //  - max Quantity matches the raw max
  //  - quantity is a multiple of the raw step
  // ensure the quantity is at least the min, or 1
  if (quantity < Math.max(raw?.min_order_quantity, 1)) {
    quantity = Math.max(raw?.min_order_quantity, 1);
  }

  // ensure the quantity is at most the max (if set)
  if (raw?.max_order_quantity && quantity > raw?.max_order_quantity) {
    quantity = raw?.max_order_quantity;
  }

  // ensure the quantity is a multiple of the step (if set)
  if (raw?.unit_quantity && quantity % raw?.unit_quantity !== 0) {
    quantity = Math.ceil(quantity / raw.unit_quantity) * raw.unit_quantity;
  }

  return quantity;
};

export function parseTerm(raw: any): BasketProductSummaryDetail | null {
  const summary: BasketProductSummaryPrice = parseSubproduct(
    raw
  ) as BasketProductSummaryPrice;

  summary.key = "term";

  summary.meta = {
    oneoff: raw.billing_cycle_months > 0,
    discounted: raw?.net_global_discount_amount > 0,
    free: raw.net_unit_selling_price_formatted == 0,
  };

  summary.regularAmount = raw.selling_price_converted;
  summary.regularPrice = raw.selling_price_formatted;
  summary.currentAmount = raw.net_amount; // TBC //term.price_discounted ?? term.price;
  summary.currentPrice = raw.net_unit_selling_price_formatted; //term.price_discounted_formatted ?? term.price_formatted;

  // add any saving information (if available)
  if (
    summary.meta.discounted &&
    !isNil(summary?.regularAmount) &&
    !isNil(summary?.currentAmount)
  ) {
    summary.currentSavingAmount = summary.meta.discounted
      ? ((summary.regularAmount - summary.currentAmount) /
          summary.regularAmount) *
        100
      : 0;

    summary.currentSaving = summary.meta.discounted
      ? `${Math.round(summary.currentSavingAmount)}%`
      : "";
  }

  // retained in case we wan tto show the term name as opposed to the actual product name/category
  // const { getBillingCycle } = useSystem();
  // const cycle = getBillingCycle(raw.billing_cycle_months);
  // const name = cycle ? useTranslateName(cycle) : null;
  // term.category = "Billing Cycle";
  // term.name = name;
  return summary;
}

export function parseSubproduct(
  subproduct: any
): Partial<BasketProductSummaryDetail> | null {
  // NB: only show term pricing if recurring!
  return {
    name: useTranslateName(subproduct.product),
    category: useTranslateName(subproduct.product.category),
    serviceIdentifier: subproduct.service_identifier,
    cycle: subproduct.billing_cycle_months,
    quantity: subproduct.quantity,
  };
}

export function parsPriceSummary(raw: any) {
  const { checkIncludesTax } = useBrand();

  const summary: BasketProductSummaryPrice = parseSubproduct(
    raw
  ) as BasketProductSummaryPrice;

  summary.meta = {
    oneoff: raw.billing_cycle_months > 0,
    discounted: raw.configuration_net_amount_discount_converted > 0,
    free: raw.configuration_net_amount_discounted_converted == 0,
    overrides: raw?.product?.category?.price_override,
  };

  summary.regularAmount = checkIncludesTax()
    ? raw.configuration_total_amount_converted
    : raw.configuration_net_amount_converted;
  summary.regularPrice = checkIncludesTax()
    ? raw.configuration_total_amount_formatted
    : raw.configuration_net_amount_formatted;
  summary.currentAmount = checkIncludesTax()
    ? raw.configuration_total_discounted_amount_converted
    : raw.configuration_net_amount_discounted_converted;
  summary.currentPrice = checkIncludesTax()
    ? raw.configuration_total_discounted_amount_formatted
    : raw.configuration_net_amount_discounted_formatted;

  // add any saving information (if available)
  if (
    summary.meta.discounted &&
    !isNil(summary?.regularAmount) &&
    !isNil(summary?.currentAmount)
  ) {
    summary.currentSavingAmount = summary.meta.discounted
      ? ((summary.regularAmount - summary.currentAmount) /
          summary.regularAmount) *
        100
      : 0;

    summary.currentSaving = summary.meta.discounted
      ? `${Math.round(summary.currentSavingAmount)}%`
      : "";
  }

  // if we have a quantity greater than 1, lets include the pricing for a single unit
  if (raw.quantity > 1) {
    summary.selling = {
      regularAmount: raw.selling_amount_converted,
      regularPrice: raw.selling_amount_formatted,
      currentAmount: raw.selling_amount_discounted_converted,
      currentPrice: raw.selling_amount_discounted_formatted,
    };

    // add any saving information (if available)
    if (
      summary.meta.discounted &&
      summary?.selling?.regularAmount &&
      summary?.selling?.currentAmount
    ) {
      summary.selling.currentSavingAmount = summary.meta.discounted
        ? ((summary.selling.regularAmount - summary.selling.currentAmount) /
            summary.selling.regularAmount) *
          100
        : 0;

      summary.selling.currentSaving = summary.meta.discounted
        ? `${Math.round(summary.selling.currentSavingAmount)}%`
        : "";
    }
  }

  return summary;
}

export function parseProvisionField(
  key: string,
  data: any,
  hasError?: any
): BasketProductSummaryDetail | null {
  const name = get(data, key, data); // just in case its an object > unti lwe have types

  return {
    key: `provision_field.${key}`,
    category: key,
    name,
    meta: {
      invalid: hasError,
    },
  };
}

// --------------------------------------------------------
// --- SUMMARY

export const parseSummary = (data?: any, provisioningErrors?: any) => {
  const summary = {
    products: map(get(data, "products"), product =>
      parseBasketProduct(product, provisioningErrors)
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
