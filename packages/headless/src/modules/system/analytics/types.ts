declare global {
  interface Window {
    dataLayer: any[];
    uetq: any[];
  }
}

export interface DataLayerUser {}

export interface DataLayerPage {
  page_type?: string;
  environment?: string;
  version?: string;
  language?: string;
  current_url?: string;
  previous_url?: string;
}

export interface DataLayerEcommerce {
  coupon?: string;
  currency: string;
  items: DataLayerEcommerceItem[];
  purchase_type?: string;
  tax?: number;
  transaction_id?: string;
  value: number; // always net value
  gross_value?: number;
}

export interface DataLayerEcommerceItems {
  currency: string;
  items: DataLayerEcommerceItem[];
  value: number; // always net value
  gross_value?: number;
}

/**
 * DataLayerEcommerceItem
 * @description
 * This should always be the unit/base price of the item and not the total price.
 * Proces should always be nett, we have added a custom field for gross price
 *
 */
export interface DataLayerEcommerceItem {
  discount?: number;
  duration?: number; // billing cycle months
  index: number;
  item_brand?: string;
  item_category2?: string;
  item_category3?: string;
  item_category?: string;
  item_id: string;
  item_name: string;
  price: number; // price should always be nett
  gross_price?: number;
  quantity: number;
}
