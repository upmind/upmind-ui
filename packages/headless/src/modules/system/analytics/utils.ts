import type { IBasketProduct } from "@upmind-automation/types";
import type { BasketProduct } from "../../basketProduct";
import type { Product, ProductSummary } from "../../product";
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
      discount: product.configuration_selling_price_discount_converted, //product.configuration_net_amount_discount_converted,
      item_brand: product.product?.brand?.name, // For reporting purposes we intentionally pass untranslated brand name
      item_category: product.product.category.name, // For reporting purposes we intentionally pass untranslated category name
      item_category2: product.product.category?.top_category?.name, // For reporting purposes we intentionally pass untranslated category name
      item_category3:
        product.product.category?.top_category?.top_category?.name, // For reporting purposes we intentionally pass untranslated category name
      price: product.net_selling_price, //  product.configuration_total_amount_converted, //TODO: check the correct value is used
      gross_price: product.selling_price_converted, //product.configuration_net_amount_converted, //TODO: check the correct value is used
      quantity: product.quantity,
      duration: product.billing_cycle_months,
    },
    isNil
  );
  debugger;
  return item;
}

export function mapBasketProduct(
  product: BasketProduct,
  index: number
): Partial<DataLayerEcommerceItem> {
  const item = omitBy<DataLayerEcommerceItem>(
    {
      item_id: product.product.id,
      item_name: product.product.title,
      discount: product.summary.configuration?.discount,
      index,
      item_brand: product.product?.brand,
      item_category: product.product.categories?.[0],
      item_category2: product.product.categories?.[1],
      item_category3: product.product.categories?.[3],
      price:
        product.summary?.unit?.subtotal ?? product.summary.currentAmount ?? 0,
      // TODO:
      // gross_price:
      //   product.summary?.unit?.total ?? product.summary.currentAmount ?? 0,
      quantity: product.quantity,
      duration: product.term,
    },
    isNil
  );
  debugger;
  return item;
}

export function mapProduct(
  product: ProductSummary,
  index: number
): Partial<DataLayerEcommerceItem> {
  const item = omitBy<DataLayerEcommerceItem>(
    {
      item_id: product.id,
      item_name: product.title,
      discount: product.summary.configuration?.discount,
      index,
      item_brand: product?.brand,
      item_category: product.categories?.[0],
      item_category2: product.categories?.[1],
      item_category3: product.categories?.[3],
      price:
        product.summary?.unit?.subtotal ?? product.summary.currentAmount ?? 0,
      // TODO:
      // gross_price:
      //   product.summary?.unit?.total ?? product.summary.currentAmount ?? 0,
      quantity: product.quantity,
      duration: product.cycle,
    },
    isNil
  );
  debugger;
  return item;
}
