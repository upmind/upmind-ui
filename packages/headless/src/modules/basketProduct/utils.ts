// --- external

// --- internal
import { useBrand } from "../brand";
import { useSystem } from "../system";

// --- utils
import { useTranslateName, DetailedError, responseCodes } from "../../utils";
import {
  parseProduct,
  useUischemaTitle,
  useProductName,
} from "../product/utils";

import {
  find,
  forEach,
  get,
  isNil,
  isObject,
  map,
  mapValues,
  omitBy,
  reduce,
  set,
  first,
  values,
  isEmpty,
} from "lodash-es";

// --- types
import type {
  IBasket,
  IBasketProduct,
  IBasketPromotion,
  IProduct,
} from "@upmind-automation/types";
import { TaxTagTypes, ProductOrderTypes } from "@upmind-automation/types";

import type {
  BasketProduct,
  BasketProductSummaryDetail,
  BasketProductSummaryPrice,
  IBasketProductData,
  BasketProductDetails,
  SubProductChoices,
  IBasketProductModel,
  IBasketSubProductModel,
} from "./types";

import type {
  ProductDetails,
  ProductModel,
  SubproductModel,
  SubproductOption,
  TermDetails,
} from "../product/types";
import { DataLayerEcommerceItem } from "../system/analytics/types";

// -----------------------------------------------------------------------------

export const parseBasketProduct = (
  raw: IBasketProduct,
  provisioningErrors?: any
): BasketProduct => {
  // Get price object matching `display_price_billing_cycle_months`
  const basketProduct: BasketProduct = {
    id: raw?.id,

    // --- model
    quantity: raw.quantity,
    productId: raw.product_id,
    term: raw.billing_cycle_months,
    options: parseSubproductChoices(raw.options),
    attributes: parseSubproductChoices(raw.attributes),
    provisionFields: raw.provision_fields,
    serviceIdentifier: raw?.service_identifier ?? undefined,

    // --- product details
    product: parseProduct(raw.product),

    // --- summary details
    summary: {
      pricing: [parsPriceSummary(raw)],
      details: [],
    },
    // --- errors
    error: get(provisioningErrors, [raw?.id]),
  };

  // --- because we are a full basket product, we may have a service identifier
  //     so we should regenerate the product title
  basketProduct.product.title = useUischemaTitle(raw.product, {
    basketProduct: raw,
    valueKey: "meta.uischema.title",
    fallback: useProductName(raw.product, raw),
  });

  // --- Now build up our details
  const term = parseTermSummary(raw);
  if (term) {
    basketProduct.summary.details.push(term);
  }
  // ---
  forEach(raw?.options, option => {
    const subproduct = parsPriceSummary(option);
    if (subproduct) {
      if (option.product.order_type === ProductOrderTypes.SINGLE_OPTION)
        basketProduct.summary.pricing.push(subproduct);
      subproduct.key = "option";
      basketProduct.summary.details.push(
        subproduct as BasketProductSummaryDetail
      );
    }
  });

  // ---
  forEach(raw?.attributes, attribute => {
    const subproduct = parseProductSummary(attribute);
    if (subproduct) {
      subproduct.key = "attribute";
      basketProduct.summary.details.push(
        subproduct as BasketProductSummaryDetail
      );
    }
  });

  // ---
  forEach(raw?.provision_fields, (value, key) => {
    const hasError = get(provisioningErrors, [raw?.id, key]);
    const field = parseProvisionFieldSummary(key.toString(), value, hasError);
    if (field) basketProduct.summary.details.push(field);
  });

  // ---

  return basketProduct;
};

const parseSubproductChoices = (rawSubproducts: IBasketProduct[]) => {
  return reduce(
    rawSubproducts,
    (result, value) => {
      set(
        result,
        [value.product.category_id, value.product_id],
        parseProduct(value.product)
      );

      return result;
    },
    {}
  );
};

/**
 * Parse the product summary from the basket product, this is the main pricing summary based on the term/cycle
 * @param raw - The raw basket product
 * @returns
 */
export function parseTermSummary(
  raw: IBasketProduct
): BasketProductSummaryDetail {
  const { checkIncludesTax } = useBrand();

  const summary = parseProductSummary(raw) as BasketProductSummaryDetail;

  summary.meta = {
    oneoff: raw.billing_cycle_months > 0,
    discounted: raw?.net_global_discount_amount > 0,
    free: isEmpty(raw.net_unit_selling_price_formatted),
    includesTax: checkIncludesTax(),
  };
  // ---
  summary.regularAmount = checkIncludesTax()
    ? raw.selling_price_converted
    : raw.net_selling_price;
  summary.regularPrice = checkIncludesTax()
    ? raw.selling_price_formatted
    : raw.net_selling_price_formatted;
  // ---
  summary.currentAmount = checkIncludesTax()
    ? raw.net_amount
    : raw.configuration_net_amount_discounted_converted;
  summary.currentPrice = checkIncludesTax()
    ? raw.net_unit_selling_price_formatted
    : raw.configuration_net_amount_discounted_formatted;
  // ---
  summary.savingAmount = checkIncludesTax()
    ? raw.configuration_selling_price_discount_converted
    : raw.configuration_net_selling_price_discount_converted;
  summary.savingPrice = checkIncludesTax()
    ? raw.configuration_selling_price_discount_formatted
    : raw.configuration_net_selling_price_discount_formatted;
  summary.savingPercent = summary.meta.discounted
    ? `${Math.round((summary.savingAmount / summary.regularAmount) * 100)}%`
    : "";

  return summary;
}

export function parseProductSummary(
  subproduct: IBasketProduct
): Partial<BasketProductSummaryDetail> {
  // NB: only show term pricing if recurring!
  return {
    title: useUischemaTitle(subproduct.product, {
      basketProduct: subproduct,
      valueKey: "meta.uischema.title",
      fallback: useProductName(subproduct.product, subproduct),
    }),
    category: useTranslateName(subproduct.product.category),
    cycle: subproduct.billing_cycle_months,
    quantity: subproduct.quantity,
  };
}

export function parsPriceSummary(raw: IBasketProduct) {
  const { checkIncludesTax } = useBrand();

  const summary = parseProductSummary(raw);

  summary.meta = {
    oneoff: raw.billing_cycle_months > 0,
    discounted: raw.configuration_net_amount_discount_converted > 0,
    free: raw.configuration_net_amount_discounted_converted == 0,
    overrides: raw?.product?.category?.price_override,
    mixed: raw?.product?.mixed_promotions, //TODO: check if this is correct
    includesTax: checkIncludesTax(),
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
    summary.savingAmount = summary.meta.discounted
      ? ((summary.regularAmount - summary.currentAmount) /
          summary.regularAmount) *
        100
      : 0;

    summary.savingPercent = summary.meta.discounted
      ? `${Math.round(summary.savingAmount)}%`
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
      summary.selling.savingAmount = summary.meta.discounted
        ? ((summary.selling.regularAmount - summary.selling.currentAmount) /
            summary.selling.regularAmount) *
          100
        : 0;

      summary.selling.saving = summary.meta.discounted
        ? `${Math.round(summary.selling.savingAmount)}%`
        : "";
    }
  }

  return summary;
}

export function parseProvisionFieldSummary(
  key: string,
  data: any,
  hasError?: any
): Partial<BasketProductSummaryDetail> {
  const title = get(data, key, data); // just in case its an object > unti lwe have types

  return {
    key: `provision_field.${key}`,
    category: key,
    title,
    meta: {
      invalid: hasError,
    },
  };
}

export function parseBasketProductData(
  model: BasketProduct | ProductModel,
  promotions?: IBasketPromotion[] | string[]
): IBasketProductData {
  return {
    product_id: model.productId,
    quantity: model.quantity,
    billing_cycle_months: model.term ?? 0,
    // ---
    attributes: parseBasketSubproductConfig(model?.attributes),
    options: parseBasketSubproductConfig(model?.options),
    // ---
    provision_field_values: model.provisionFields || {},
    // ---
    promotions: map(promotions, basketPromotion => {
      const promocode =
        isObject(basketPromotion) && "promotion" in basketPromotion
          ? basketPromotion.promotion.code
          : basketPromotion;

      return { promocode };
    }),
  } as IBasketProductData;
}

function parseBasketSubproductConfig(
  subproducts?: SubProductChoices | SubproductModel
): IBasketSubProductModel[] {
  return reduce(
    subproducts ?? {},
    (result: IBasketSubProductModel[], subproduct) => {
      if (subproduct) {
        const selected = values(
          mapValues(subproduct, choice => {
            return {
              product_id: "productId" in choice ? choice.productId : choice.id,
              unit_quantity: choice.quantity,
              billing_cycle_months: choice.cycle,
            };
          })
        );
        if (!isEmpty(selected)) {
          result.push(...selected);
        }
      }
      return result;
    },
    []
  );
}

export function getBasketProduct(id: string, basket: IBasket) {
  const value = find(basket?.products, { id });
  if (!value) {
    throw new DetailedError(
      "Product not found in basket",
      responseCodes.Not_Found
    );
  }

  return value;
}

export function parsePendingDataLayerEcommerceItem(
  model: ProductModel,
  product: ProductDetails,
  term: TermDetails
): DataLayerEcommerceItem {
  const payload = {
    // net_price: string;
    discount: term?.savingAmount,
    duration: model.term,
    index: 0,
    item_brand: product?.brand,
    item_category: product?.categories?.[0],
    item_category2: product?.categories?.[1],
    item_category3: product?.categories?.[2],
    item_id: product.id,
    item_name: product.title,
    price: term.currentAmount,
    quantity: model.quantity,
  } as DataLayerEcommerceItem;

  return omitBy(payload, isNil) as DataLayerEcommerceItem;
}

export function parseDataLayerEcommerceItem(
  basketProduct: BasketProduct
): DataLayerEcommerceItem {
  const term = first(
    basketProduct.summary.pricing
  ) as BasketProductSummaryPrice;

  const payload = {
    // net_price: string;
    discount: term?.savingAmount,
    duration: basketProduct.term,
    index: 0,
    item_brand: basketProduct.product?.brand,
    item_category: basketProduct.product?.categories?.[0],
    item_category2: basketProduct.product?.categories?.[1],
    item_category3: basketProduct.product?.categories?.[2],
    item_id: basketProduct.product.id,
    item_name: basketProduct.product.title,
    price: term?.currentAmount,
    quantity: basketProduct.quantity,
  } as DataLayerEcommerceItem;

  return omitBy(payload, isNil) as DataLayerEcommerceItem;
}
