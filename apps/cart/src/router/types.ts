export enum RegexMatch {
  INTEGER = "\\d+",
  NEW = "new",
  SLUG = "[\\w-_]+", // eg "foo" | "foo-bar" | "foo_bar"
  UUID = "[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}"
}

/**
 * Enumeration representing predefined application routes and navigational paths.
 * These routes are used consistently throughout the Upmind Cart for navigation,
 * deep linking, and managing application state transitions.
 * */
export enum ROUTE {
  // --- SHOP ROUTES -----------------------------------------------------------

  /**
   * The configuration key used to determine the checkout flow for the brand.
   * This key helps in selecting between different checkout funnel implementations.
   *
   */
  CHECKOUT_FLOW = "checkout-flow",

  /**
   * The route for the main product catalogue or shop page.
   */
  CATALOGUE = "catalogue",

  // --- PRODUCT ROUTES --------------------------------------------------------

  /**
   * The parent route for all product-related pages.
   * This also can act as a loading route for product configuration.
   */
  PRODUCT = "product",

  /**
   * The route for adding a new product-
   */
  PRODUCT_CONFIGURE = "product-configure",

  /**
   * The route displayed when a requested product cannot be found.
   */
  PRODUCT_NOT_FOUND = "product-not-found",

  /**
   * The route for displaying product recommendations.
   */
  PRODUCT_RECOMMENDATIONS = "product-recommendations",

  // --- SESSION/AUTH ROUTES ---------------------------------------------------

  /**
   * The base route for session and authentication related pages.
   */
  SESSION = "session",

  /**
   * The route for the user login page.
   */
  SESSION_LOGIN = "session-login",

  /**
   * The route for the user registration page.
   */
  SESSION_REGISTER = "session-register",

  /**
   * The route for the password recovery/reset page.
   */
  SESSION_RECOVER_PASSWORD = "session-recover",

  /**
   * The route indicating the end of a session, typically after logout.
   */
  SESSION_END = "session-end",

  /**
   * The route for handling session transfer operations between contexts.
   */
  SESSION_TRANSFER = "session-transfer",

  // --- BASKET ROUTES ---------------------------------------------------------

  /**
   * The route for domains where users can select and purchase domains.
   */
  DOMAINS = "domains",

  /**
   * The route for domains with an associated product configuration.
   */
  DOMAINS_WITH_PRODUCT = "domains-product",

  /**
   * The route for domains with an associated product configuration that requires processing.
   * This will update the product after domain processing and set any provision fields marked as `semantic_type: domain_name`
   */
  DOMAINS_WITH_PRODUCT_PROCESSING = "domains-product-processing",

  /**
   * The route for Basket recommendations. This will show recommended products based on ALL items in the basket.
   */
  RECOMMENDATIONS = "recommendations",

  /**
   * The route for viewing the shopping basket contents.
   */
  BASKET = "basket",

  /**
   * The route for an empty shopping basket.
   */
  BASKET_EMPTY = "basket-empty",

  /**
   * The route for editing an existing product-
   */
  BASKET_PRODUCT_EDIT = "basket-product-edit",

  /**
   * The route for product setup - fixing invalid/deferred product configuration.
   */
  BASKET_PRODUCT_SETUP = "basket-product-setup",

  BASKET_PRODUCTS_SETUP = "basket-products-setup",

  /**
   * The route displayed when a basket is unavailable or invalid.
   */
  BASKET_UNAVAILABLE = "basket-unavailable",

  /**
   * The route for the checkout process.
   */
  CHECKOUT = "checkout",

  /**
   * The route for managing billing details on a standalone page.
   */
  BILLING = "billing",

  /**
   * The route for reviewing domain registrant details before checkout.
   */
  DOMAIN_REGISTRANT = "domain-registrant",

  /**
   * The route for editing domain registrant details.
   */
  DOMAIN_REGISTRANT_EDIT = "domain-registrant-edit",

  /**
   * The route for viewing a completed order.
   */
  ORDER = "order",

  // --- SYSTEM ROUTES ---------------------------------------------------------

  /**
   * The route for handling not found pages.
   */
  NOT_FOUND = "not-found",

  /**
   * Represents a loading state, typically displayed while data is being fetched.
   */
  LOADING = "loading",

  /**
   * Represents an error state, displayed when an unrecoverable error occurs.
   */
  ERROR = "error",

  /**
   * Represents an unavailable state, indicating a resource or feature is not currently accessible.
   */
  UNAVAILABLE = "unavailable",

  /**
   * This is a MAGIC route used to indicate a redirect within funnels.
   * It is not a real route, but a placeholder to signal that a redirect should occur to a given target.
   */
  REDIRECT = "#calculating"
}
