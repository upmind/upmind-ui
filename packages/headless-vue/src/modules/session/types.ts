import type { ComputedRef } from "vue";

/**
 * Represents the metadata for the session state, providing flags that reflect
 * the current status of the session and its components such as forms, authentication,
 * and processing states.
 */
export interface IUseSessionMeta {
  /**
   * Indicates whether any part of the session (e.g., login, registration, etc.) is currently in a loading state.
   */
  isLoading: boolean;

  /**
   * Indicates whether the session is ready to be used, typically after initialization and loading.
   */
  isAvailable: boolean;

  /**
   * Indicates whether the session is currently processing an action, such as authentication or registration.
   */
  isProcessing: boolean;

  /**
   * Indicates whether the user is authenticated within the session.
   */
  isAuthenticated: boolean;

  /**
   * Indicates whether the session is currently transferring data, such as during a guest-to-client transition.
   */
  isTransferring: boolean;

  /**
   * Indicates whether the session has expired.
   */
  hasExpired: boolean;

  /**
   * Indicates whether the ReCaptcha challenge should be displayed, typically during registration.
   */
  showReCaptcha: boolean;

  /**
   * Indicates whether the login form should be displayed.
   */
  showLoginForm: boolean;

  /**
   * Indicates whether the two-factor authentication (2FA) challenge is required and should be shown.
   */
  show2fa: boolean;

  /**
   * Indicates whether the registration form should be displayed.
   */
  showRegisterForm: boolean;

  /**
   * Indicates whether any forms (login or register) can be shown to the user.
   */
  canShowForms: boolean;
}

/**
 * Represents the session management composable interface in the application.
 * Provides functionality for managing user sessions, including authentication,
 * registration, 2FA, and ReCaptcha verification.
 */
export interface IUseSession {
  /**
   * Current state of the session machine.
   * Can include authentication, registration, and other session-related states.
   */
  state: any;

  /**
   * Context object containing session-specific information such as current user,
   * authentication status, and other dynamic data.
   */
  context: any;

  /**
   * Any errors encountered during session management operations, such as login or registration failures.
   */
  errors: any;

  /**
   * Computed metadata related to the session's state, including loading, ready, and error flags.
   */
  meta: ComputedRef<IUseSessionMeta>;

  /**
   * Information about the guest user, if available. Used to handle non-authenticated user interactions.
   */
  guest: any;

  /**
   * Information about the authenticated client, if available. Represents the logged-in user.
   */
  client: any;

  /**
   * The underlying data model used in session-related forms such as login or registration.
   */
  model: any;

  /**
   * JSON Schema used to define the structure of session-related forms, like login and registration.
   */
  schema: any;

  /**
   * UI Schema used to configure the presentation and layout of session-related forms.
   */
  uischema: any;

  /**
   * User-specific information for the currently authenticated user, including profile and account data.
   */
  user: any;

  /**
   * Function to reject an ongoing authentication or registration request.
   */
  reject: () => Promise<any>;

  /**
   * Function to resolve an ongoing authentication or registration request.
   */
  resolve: (model: any) => Promise<any>;

  /**
   * Initiates the login process for a user, typically used in conjunction with a form and model data.
   * @returns {Promise<void>} A promise that resolves when the login operation is completed.
   */
  login: (model: any) => Promise<any>;

  /**
   * Logs out the currently authenticated user.
   * @returns {Promise<void>} A promise that resolves when the logout operation is completed.
   */
  logout: () => Promise<any>;

  /**
   * Registers a new user, typically used with a form and model data.
   * @returns {Promise<Promise<any>>} A promise that resolves when the registration operation is completed.
   */
  register: (model: any) => Promise<any>;

  /**
   * Displays the login form for user authentication.
   */
  showLogin: () => Promise<any>;

  /**
   * Displays the registration form for user sign-up.
   */
  showRegister: () => Promise<any>;

  /**
   * Verifies the 2-factor authentication (2FA) code provided by the user.
   * @param {string} code The 2FA code entered by the user.
   * @returns {Promise<void>} A promise that resolves when the verification is successful.
   */
  verify2fa: ({ token }: { token: string }) => Promise<any>;

  /**
   * Verifies the ReCaptcha challenge response from the user.
   * @param {string} response The ReCaptcha response token from the user.
   * @returns {Promise<void>} A promise that resolves when the verification is successful.
   */
  verifyReCaptcha: (response: string) => Promise<any>;

  /**
   * Transfer session data between different parts of the application, such as from guest to client.
   */
  transfer: () => Promise<any>;
}
