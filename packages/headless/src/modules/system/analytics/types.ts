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
  value: number;
}

export interface DataLayerEcommerceItem {
  // net_price: string;
  discount?: number;
  duration?: number; // billing cycle months
  index: number;
  item_brand?: string;
  item_category2?: string;
  item_category3?: string;
  item_category?: string;
  item_id: string;
  item_name: string;
  price: number;
  quantity: number;
}
