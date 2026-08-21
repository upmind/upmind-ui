export enum RegexMatch {
  INTEGER = "\\d+",
  NEW = "new",
  SLUG = "[\\w-_]+", // eg "foo" | "foo-bar" | "foo_bar"
  UUID = "[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}"
}

/**
 * Enumeration representing predefined application routes and navigational paths.
 * These routes are used consistently throughout the Labs playground for navigation,
 * deep linking, and managing application state transitions.
 * */
export enum ROUTE {
  // --- SHOP ROUTES -----------------------------------------------------------
  /**
   * This is a MAGIC route used to indicate a redirect within funnels.
   * It is not a real route, but a placeholder to signal that a redirect should occur to a given target.
   */
  REDIRECT = "#calculating",

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

  /**
   * The auth OVERLAY — the modal a guarded route opens over itself to collect a
   * session in place, injected onto every eligible parent as `<parent>--auth`.
   */
  OVERLAY_AUTH = "overlay-auth",

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
