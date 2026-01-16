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
   * This is a MAGIC route used to indicate a redirect within funnels.
   * It is not a real route, but a placeholder to signal that a redirect should occur to a given target.
   */
  REDIRECT = "#calculating",

  /**
   * The main storefront route, typically the landing page for users.
   * This may be an internal OR external route depending on the application setup.
   */
  STOREFRONT = "storefront",

  // --- HOME ROUTE ------------------------------------------------------------
  HOME = "home",

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

  // --- ACCOUNT ROUTES ---------------------------------------------------------

  /**
   * The route for client account-
   */
  ACCOUNT = "account",
  // --- account profile routes
  /**
   * The route for client account-
   */
  ACCOUNT_PROFILE = "account-profile",
  // --- account profile edit routes
  /**
   * The route for client account-
   */
  ACCOUNT_PROFILE_EDIT = "account-profile-edit",
  // --- account child accounts routes
  /**
   * The route for client account child accounts.
   */
  ACCOUNT_CHILD_ACCOUNTS = "account-child-accounts",
  // --- account delegates routes
  /**
   * The route for client account delegates.
   */
  ACCOUNT_DELEGATES = "account-delegates",
  // --- account delegate route
  /**
   * The route for client account delegate.
   */
  ACCOUNT_DELEGATES_DELEGATE = "account-delegates-delegate",
  // --- account notifications route
  /**
   * The route for client account notifications.
   */
  ACCOUNT_NOTIFICATIONS = "account-notifications",
  // --- account email history route
  /**
   * The route for client account email history.
   */
  ACCOUNT_EMAIL_HISTORY = "account-email-history",
  // --- account email history view route
  /**
   * The route for client account email history view.
   */
  ACCOUNT_EMAIL_HISTORY_VIEW = "account-email-history-view",
  // --- account security route
  /**
   * The route for the account security.
   */
  ACCOUNT_SECURITY = "account-security",
  /**
   * The route for the affiliate section of the client account-
   */
  ACCOUNT_AFFILIATE = "account-affiliate",
  /**
   * The route for the notes section of the client account-
   */
  ACCOUNT_NOTES = "account-notes",

  // --- BILLING ROUTES --------------------------------------------------------

  /**
   * The route for client billing.
   */
  BILLING = "billing",
  /**
   * The route for client billing details.
   */
  BILLING_DETAILS = "billing-details",

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
  UNAVAILABLE = "unavailable"
}
