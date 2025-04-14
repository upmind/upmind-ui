import type { IBasketProduct } from "@upmind-automation/types";
import type { BasketProduct } from "../../basketProduct";
import type { Product } from "../../product";
import type { DataLayerEcommerceItem } from "./types";
import { includes, isNil, omitBy } from "lodash-es";

// -----------------------------------------------------------------------------

export function mapIBasketProduct(
  product: IBasketProduct,
  index: number
): Partial<DataLayerEcommerceItem> {
  const item = omitBy<DataLayerEcommerceItem>(
    {
      index,
      item_id: product.product.id,
      item_name: product.product.name, // For reporting purposes we intentionally pass untranslated product name
      item_brand: product.product?.brand?.name, // For reporting purposes we intentionally pass untranslated brand name
      item_category: product.product.category.name, // For reporting purposes we intentionally pass untranslated category name
      item_category2: product.product.category?.top_category?.name, // For reporting purposes we intentionally pass untranslated category name
      item_category3:
        product.product.category?.top_category?.top_category?.name, // For reporting purposes we intentionally pass untranslated category name
      item_category4:
        product.product.category?.top_category?.top_category?.top_category
          ?.name, // For reporting purposes we intentionally pass untranslated category name
      item_category5:
        product.product.category?.top_category?.top_category?.top_category
          ?.top_category?.name, // For reporting purposes we intentionally pass untranslated category name
      // ---config
      quantity: product.quantity,
      duration: product.billing_cycle_months,
      // --- pricing
      discount: product.configuration_selling_price_discount_converted, //product.configuration_net_amount_discount_converted,
      price: product.net_selling_price, //  product.configuration_total_amount_converted, //TODO: check the correct value is used
      gross_price: product.selling_price_converted, //product.configuration_net_amount_converted, //TODO: check the correct value is used
    },
    isNil
  );
  debugger;
  return item;
}

export function mapBasketProduct(
  product: BasketProduct | Product,
  index: number
): Partial<DataLayerEcommerceItem> {
  const item = omitBy<DataLayerEcommerceItem>(
    {
      index,
      item_id: product.productDetails.id,
      item_name: product.productDetails.name,
      item_brand: product.productDetails?.brand,
      item_category: product.productDetails.categories?.[0],
      item_category2: product.productDetails.categories?.[1],
      item_category3: product.productDetails.categories?.[2],
      item_category4: product.productDetails.categories?.[3],
      item_category5: product.productDetails.categories?.[4],
      // --- config
      quantity: product.configuration.quantity,
      duration: product.configuration.term,
      // --- pricing
      discount: product.price.configuration?.discount,
      price: product.price?.unit?.subtotal ?? product.price.currentAmount ?? 0,
      gross_price: product.price?.unit?.total ?? undefined, // TODO: currently will always return undefined
    },
    isNil
  );
  debugger;
  return item;
}
