/**
 * Route Name Constants
 *
 * Mirrors the ROUTE enum from apps/cart/src/router/types.ts
 * These are used throughout the Nuxt app for consistent navigation.
 */
export enum ROUTE {
  // --- SHOP ROUTES -----------------------------------------------------------
  STOREFRONT = "storefront",
  CHECKOUT_FLOW = "checkout-flow",
  CATALOGUE = "catalogue",

  // --- PRODUCT ROUTES --------------------------------------------------------
  PRODUCT = "product",
  PRODUCT_CONFIGURE = "product-configure",
  PRODUCT_NOT_FOUND = "product-not-found",
  PRODUCT_RECOMMENDATIONS = "product-recommendations",

  // --- SESSION/AUTH ROUTES ---------------------------------------------------
  SESSION = "session",
  SESSION_LOGIN = "session-login",
  SESSION_REGISTER = "session-register",
  SESSION_RECOVER_PASSWORD = "session-recover",
  SESSION_END = "session-end",
  SESSION_TRANSFER = "session-transfer",

  // --- BASKET ROUTES ---------------------------------------------------------
  DOMAINS = "domains",
  DOMAINS_WITH_PRODUCT = "domains-product",
  DOMAINS_WITH_PRODUCT_PROCESSING = "domains-product-processing",
  RECOMMENDATIONS = "recommendations",
  BASKET = "basket",
  BASKET_EMPTY = "basket-empty",
  BASKET_PRODUCT_EDIT = "basket-product-edit",
  BASKET_PRODUCT_REQUIRES_ACTION = "basket-product-requires-action",
  CHECKOUT = "checkout",
  ORDER = "order",

  // --- SYSTEM ROUTES ---------------------------------------------------------
  NOT_FOUND = "not-found",
  LOADING = "loading",
  ERROR = "error",
  UNAVAILABLE = "unavailable"
}
