// --- external

// --- internal
import { useBrand } from "../brand";

// --- utils
import { useTranslateName, DetailedError, responseCodes } from "../../utils";
import {
  useUischemaTitle,
  useProductName,
  parseProductDetails,
} from "../product/utils";

import {
  find,
  forEach,
  get,
  isEmpty,
  isNil,
  isObject,
  map,
  mapValues,
  omitBy,
  reduce,
  set,
  values,
} from "lodash-es";

// --- types
import type {
  IBasket,
  IBasketProduct,
  IBasketPromotion,
} from "@upmind-automation/types";
import {
  ProductOrderTypes,
  PromotionDisplayTypes,
  BrandConfigKeys,
} from "@upmind-automation/types";

import type {
  BasketProduct,
  IBasketProductModel,
  IBasketSubproductModel,
} from "./types";

import type {
  PromotionDetails,
  ProductModel,
  SubproductModel,
  ProductSummaryDetailWithPrice,
  ProductSummaryDetail,
  PriceDetail,
} from "../product/types";
import { DataLayerEcommerceItem } from "../system/analytics/types";

// -----------------------------------------------------------------------------

export const parseBasketProduct = (
  raw: IBasketProduct,
  errors?: any
): BasketProduct => {
  // Get price object matching `display_price_billing_cycle_months`
  const pricing = parsSummaryWithPrice(raw);

  const basketProduct: BasketProduct = {
    id: raw.id,
    serviceIdentifier: raw?.service_identifier ?? undefined,

    // --- model/configuration
    configuration: {
      quantity: raw.quantity,
      productId: raw.product_id,
      term: raw.billing_cycle_months,
      options: parseSubproductChoices(raw.options),
      attributes: parseSubproductChoices(raw.attributes),
      provisionFields: raw.provision_fields,
    },

    // --- product details
    productDetails: parseProductDetails(raw.product),

    // --- meta details
    meta: pricing.meta,
    // --- summary details
    price: pricing.price,
    pricing: [pricing], // may be added to below
    details: [], // will be built up below

    // --- errors
    // TODO: check the errors provided and map correctly
    errors: omitBy(
      {
        term: get(errors, [raw?.id, "term"]),
        attributes: get(errors, [raw?.id, "attributes"]),
        options: get(errors, [raw?.id, "options"]),
        provisionFields: get(errors, [raw?.id, "provision_fields"]),
      },
      isEmpty
    ),
  };

  // --- because we are a full basket product, we may have a service identifier
  //     so we should regenerate the product title
  basketProduct.productDetails.title = useUischemaTitle(raw.product, {
    basketProduct: raw,
    valueKey: "meta.uischema.title",
    fallback: useProductName(raw.product, raw),
  });

  // --- Now build up our details
  const term = parseTermSummary(raw);
  if (term) {
    basketProduct.details.push(term);
  }
  // ---
  forEach(raw?.options, option => {
    const subproduct = parsSummaryWithPrice(option);
    if (subproduct) {
      // Add our non-quantifiable pricing
      if (option.product.order_type === ProductOrderTypes.SINGLE_OPTION)
        basketProduct.pricing.push(subproduct);

      subproduct.name = "option";
      basketProduct.details.push(subproduct as ProductSummaryDetailWithPrice);
    }
  });

  // ---
  forEach(raw?.attributes, attribute => {
    const subproduct = parseSummary(attribute);
    if (subproduct) {
      subproduct.name = "attribute";
      basketProduct.details.push(subproduct as ProductSummaryDetail);
    }
  });

  // ---
  forEach(raw?.provision_fields, (value, key) => {
    const hasError = get(errors, [raw?.id, key]);
    const field = parseProvisionFieldSummary(key.toString(), value, hasError);
    if (field) basketProduct.details.push(field);
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
        parseProductDetails(value.product)
      );

      return result;
    },
    {}
  );
};

export function parseSummary(subproduct: IBasketProduct): ProductSummaryDetail {
  return {
    name: subproduct.product.name,
    title: useUischemaTitle(subproduct.product, {
      basketProduct: subproduct,
      valueKey: "meta.uischema.title",
      fallback: useProductName(subproduct.product, subproduct),
    }),
    category: useTranslateName(subproduct.product.category),
    cycle: subproduct.billing_cycle_months,
    quantity: subproduct.quantity,
    meta: {},
  };
}

export function parsSummaryWithPrice(
  raw: IBasketProduct
): ProductSummaryDetailWithPrice {
  const { checkIncludesTax } = useBrand();

  const summary = parseSummary(raw) as Partial<ProductSummaryDetailWithPrice>;

  summary.meta = {
    oneoff: raw.billing_cycle_months > 0,
    discounted: raw.configuration_net_amount_discount_converted > 0,
    free: raw.configuration_net_amount_discounted_converted == 0,
    overrides: raw?.product?.category?.price_override,
    mixed: raw?.product?.mixed_promotions, //TODO: check if this is correct
    includesTax: checkIncludesTax(),
  };

  summary.promotions = parsePromotionDetails(raw);
  summary.price = parsPrice(raw);

  return summary as ProductSummaryDetailWithPrice;
}

export function parsPrice(raw: IBasketProduct): PriceDetail {
  const { checkIncludesTax } = useBrand();

  const includesTax = checkIncludesTax();
  const discounted = raw.configuration_net_amount_discount_converted > 0;

  const regularAmount = includesTax
    ? raw.configuration_total_amount_converted
    : raw.configuration_net_amount_converted;
  const regularPrice = includesTax
    ? raw.configuration_total_amount_formatted
    : raw.configuration_net_amount_formatted;
  //  ---
  const currentAmount = includesTax
    ? raw.configuration_total_discounted_amount_converted
    : raw.configuration_net_amount_discounted_converted;
  const currentPrice = includesTax
    ? raw.configuration_total_discounted_amount_formatted
    : raw.configuration_net_amount_discounted_formatted;
  // ---
  const savingAmount = includesTax
    ? raw.configuration_total_discount_amount_converted
    : raw.configuration_net_amount_discount_converted; //TODO: MISSING net price discount
  const savingPrice = includesTax
    ? raw.configuration_total_discount_amount_formatted
    : raw.configuration_net_amount_discount_formatted;

  const savingPercent = discounted
    ? `${Math.round((savingAmount / regularAmount) * 100)}%`
    : "";

  return {
    regularAmount,
    regularPrice,
    currentAmount,
    currentPrice,
    savingAmount,
    savingPrice,
    savingPercent,
  } as PriceDetail;
}

export const parsePromotionDetails = (
  raw: IBasketProduct
): PromotionDetails[] => {
  //  Basket Product Promotions can only be displayed in one of 2 ways:
  //  - As a generic summary label with no values when mixed, eg "SAVE"
  //  - As a summary percentage, eg "Save 20%"
  // NB: we always supply the amounts so we can show meta data if needed, eg a tooltip

  const price = parsPrice(raw);

  if (!price.savingAmount) return [];

  return [
    {
      code: "save",
      name: "save", // untranslated name for reporting purposes  category?: string;
      title: "Save",
      meta: {
        display: PromotionDisplayTypes.PERCENTAGE,
        mixed: raw.product.mixed_promotions,
        discounted: !!price.savingAmount || raw.product.mixed_promotions,
      },
      price: {
        savingAmount: price.savingAmount,
        savingPrice: price.savingPrice,
        savingPercent: price.savingPercent,
      },
    } as PromotionDetails,
  ];
};

export function parseTermSummary(
  raw: IBasketProduct
): ProductSummaryDetailWithPrice {
  const summary = parsSummaryWithPrice(raw) as ProductSummaryDetailWithPrice;

  summary.name = "term";

  //  Allow for "price-overrrides"
  set(summary, "meta.free", raw.net_amount == 0);
  set(summary, "meta.overriden", raw.net_amount == 0);

  // if we have no price then we are being overridden, so we need to force the currentPricing to 0
  if (raw.net_amount == 0) {
    set(summary, "price.currentAmount", raw.net_amount);
    set(summary, "price.currentPrice", "");
  }

  return summary;
}

export function parseProvisionFieldSummary(
  key: string,
  data: any,
  hasError?: any
): ProductSummaryDetail {
  const title = get(data, key, data); // just in case its an object > unti lwe have types

  return {
    name: `provision_field.${key}`,
    category: key,
    title,
    meta: {
      invalid: hasError,
    },
  };
}

export function parseBasketProductData(
  model: ProductModel,
  promotions?: IBasketPromotion[] | string[]
): IBasketProductModel {
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
  } as IBasketProductModel;
}

function parseBasketSubproductConfig(
  subproducts?: SubproductModel
): IBasketSubproductModel[] {
  return reduce(
    subproducts ?? {},
    (result: IBasketSubproductModel[], subproduct) => {
      if (subproduct) {
        const selected = values(
          mapValues(subproduct, choice => {
            return {
              product_id: choice.productId,
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
