declare global {
  interface Window {
    /**
     * The global dataLayer array used for Google Tag Manager (GTM) and other analytics integrations.
     */
    dataLayer: any[];
    /**
     * The global array for Microsoft Advertising (formerly Microsoft Ads) Universal Event Tracking (UET) queue.
     */
    uetq: any[];
  }
}

/**
 * Interface representing user-specific data to be pushed to the data layer.
 * This can include anonymised user IDs, login status, or other user attributes for analytics.
 */
export interface DataLayerUser {}

/**
 * Interface representing page-specific data to be pushed to the data layer.
 * This helps track navigation, page views, and contextual information about the current page.
 */
export interface DataLayerPage {
  /**
   * The type of the current page (e.g. "product_detail", "category", "checkout").
   */
  page_type?: string;
  /**
   * The environment in which the page is loaded (e.g. "production", "development", "staging").
   */
  environment?: string;
  /**
   * The version of the application or page template.
   */
  version?: string;
  /**
   * The language of the page content (e.g. "en-GB", "es").
   */
  language?: string;
  /**
   * The full URL of the current page.
   */
  current_url?: string;
  /**
   * The full URL of the previous page, if known.
   */
  previous_url?: string;
}

/**
 * Interface representing e-commerce purchase or transaction data to be pushed to the data layer.
 * This typically follows the Google Analytics Enhanced E-commerce schema for purchase events.
 */
export interface DataLayerEcommerce {
  /**
   * The coupon code applied to the entire purchase, if any.
   */
  coupon?: string;
  /**
   * The ISO 4217 currency code of the transaction (e.g. "GBP", "USD").
   */
  currency: string;
  /**
   * An array of {@link DataLayerEcommerceItem} objects included in the purchase.
   */
  items: DataLayerEcommerceItem[];
  /**
   * The type of purchase (e.g. "new_customer", "repeat_customer", "subscription").
   */
  purchase_type?: string;
  /**
   * The total tax amount for the transaction.
   */
  tax?: number;
  /**
   * The unique transaction identifier (e.g. order ID).
   */
  transaction_id?: string;
  /**
   * The total net value of the transaction (always net value).
   */
  value: number;
  /**
   * The total gross value of the transaction (including taxes).
   */
  gross_value?: number;
}

/**
 * Interface representing a collection of e-commerce items, often used for add_to_cart, remove_from_cart,
 * or view_item_list events, which require currency and total value information.
 */
export interface DataLayerEcommerceItems {
  /**
   * The ISO 4217 currency code for the items (e.g. "GBP", "USD").
   */
  currency: string;
  /**
   * An array of {@link DataLayerEcommerceItem} objects.
   */
  items: DataLayerEcommerceItem[];
  /**
   * The total net value of the items (always net value).
   */
  value: number;
  /**
   * The total gross value of the items (including taxes).
   */
  gross_value?: number;
}

/**
 * Interface representing a single e-commerce item within the data layer.
 *
 * @description
 * This should always represent the unit/base price of the item and not the total price.
 * The `price` should always be nett, with a custom `gross_price` field added for the gross price.
 */
export interface DataLayerEcommerceItem {
  /**
   * The discount applied to this specific item.
   */
  discount?: number;
  /**
   * The billing cycle duration in months for subscription products.
   */
  duration?: number;
  /**
   * The zero-based index of the item within a list.
   */
  index: number;
  /**
   * The brand associated with the item.
   */
  item_brand?: string;
  /**
   * The second level category of the item.
   */
  item_category2?: string;
  /**
   * The third level category of the item.
   */
  item_category3?: string;
  /**
   * The fourth level category of the item.
   */
  item_category4?: string;
  /**
   * The fifth level category of the item.
   */
  item_category5?: string;
  /**
   * The primary category of the item.
   */
  item_category?: string;
  /**
   * The unique identifier of the item (e.g. product ID, SKU).
   */
  item_id: string;
  /**
   * The name of the item.
   */
  item_name: string;
  /**
   * The net unit price of the item (price should always be nett).
   */
  price: number;
  /**
   * The gross unit price of the item (including taxes).
   */
  gross_price?: number;
  /**
   * The quantity of the item.
   */
  quantity: number;
}
