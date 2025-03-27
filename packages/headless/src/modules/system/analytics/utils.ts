import { IBasketProduct } from "@upmind-automation/types";
import { DataLayerEcommerceItem } from "./types";

// -----------------------------------------------------------------------------

export function parseEcommerceItem(
  product: IBasketProduct,
  index: number
): DataLayerEcommerceItem {
  return {
    item_id: product.product.id,
    item_name: product.product.name, // For reporting purposes we intentionally pass untranslated product name
    discount: product.configuration_net_amount_discount_converted,
    index,
    item_brand: product.product?.brand?.name, // For reporting purposes we intentionally pass untranslated brand name
    item_category: product.product.category.name, // For reporting purposes we intentionally pass untranslated category name
    // @ts-ignore: TODO see why this is warni g when it is in fact valid
    item_category2: product.product.category?.top_category?.name, // For reporting purposes we intentionally pass untranslated category name
    // @ts-ignore: TODO see why this is warni g when it is in fact valid
    item_category3: product.product.category?.top_category?.top_category?.name, // For reporting purposes we intentionally pass untranslated category name
    price: product.configuration_total_amount_converted, //TODO: check the correct value is used
    // net_price: product.configuration_net_amount_converted, //TODO: check the correct value is used
    quantity: product.quantity,
    duration: product.billing_cycle_months,
  } as DataLayerEcommerceItem;
}
