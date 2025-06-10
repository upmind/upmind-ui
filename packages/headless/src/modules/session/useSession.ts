// --- external
import { computed } from "vue";
import { interpret, InterpreterStatus } from "xstate";
import { waitFor } from "xstate/lib/waitFor";
import { useActor } from "@xstate/vue";

// --- internal
import sessionMachine from "./session.machine";
import { useFeedback } from "../feedback";
export * from "./useTransfer";

// --- utils
import { get, isEmpty, values } from "lodash-es";
import { getTokenFromStorage } from "./utils";
import {
  useChildService,
  DetailedError,
  responseCodes,
  contextValue,
} from "../../utils";
import {
  useContext,
  useChildActor,
  stateMatches,
  contextMatches,
} from "../../utils";

// ---types
import type {
  IAuthTransfer,
  SessionContext,
  SessionTransfer,
  User,
} from "./types";
import { GuestContext } from "./guest/types";
import { ClientContext } from "./client/types";
export type { User, SessionTransfer, IAuthTransfer } from "./types";
// -----------------------------------------------------------------------------

// create a global instance of the session machine
// and a global object to store state
// NB dont automatically start the machine as in order for the inspector to work
// it needs to be started after the inspect service is created, so we only start it when we need it

const service = interpret(sessionMachine, { devTools: false });

// -----------------------------------------------------------------------------

/**
 * Composable function to manage session-related logic using Vue.
 * It provides state, context and helpers for session, login and registration processes.
 *
 * @returns {object} Session management API (see below for details)
 */
export const useSession = () => {
  if (service.status == InterpreterStatus.NotStarted) service.start();

  const { state, send } = useActor(service);

  // --- state

  async function isReady(): Promise<boolean> {
    return waitFor(
      service,
      state => {
        const spawned = state?.children;
        if (stateMatches(state, "error")) return false;
        return values(spawned).some(machine => {
          return waitFor(machine, state => stateMatches(state, "available"))
            .then(() => true)
            .catch(() => false);
        });
      },
      {
        timeout: 60_000,
      }
    )
      .then(state => {
        if (stateMatches(state, "error")) {
          return Promise.reject(state.context.error);
        }
        return true;
      })
      .catch(() => false);
  }

  async function isAuthenticated(): Promise<User> {
    return isReady()
      .then(() => {
        if (!clientMachine.value) throw new Error("Not authenticated");

        return waitFor(
          clientMachine.value,
          state => stateMatches(state, "available"),
          {
            timeout: 60_000,
          }
        ).then(() => {
          const user = contextValue<User>(clientMachine, "user");
          if (!user) {
            throw new DetailedError(
              "[headless] isAuthenticated on useSession failed",
              responseCodes.Unauthorized
            );
          }
          return user;
        });
      })
      .catch(() =>
        Promise.reject(
          new DetailedError("Unauthorized", responseCodes.Unauthorized)
        )
      );
  }

  const meta = computed(() => ({
    isLoading:
      stateMatches(state, "checking") ||
      stateMatches(guestMachine, [
        "loading",
        "available.login.loading",
        "available.register.loading",
        "available.recover.loading",
      ]) ||
      stateMatches(clientMachine, "loading") ||
      false,
    isAvailable: !stateMatches(state, ["error", "checking"]),
    isProcessing:
      stateMatches(guestMachine, [
        "available.login.authenticating",
        "available.login.verifying",
        "available.register.checking",
        "available.register.verifying",
        "available.register.registering",
        "available.register.authenticating",
        "available.recover.recovering",
      ]) || stateMatches(clientMachine, "processing"),
    isAuthenticated: stateMatches(state, "client"),
    isTransferring: stateMatches(clientMachine, "transferring"),
    hasExpired: stateMatches(state, "expired") || isEmpty(state.value.children),
    hasErrors:
      stateMatches(state, "error") ||
      stateMatches(guestMachine, [
        "available.login.error",
        "available.register.error",
        "available.recover.error",
      ]) ||
      stateMatches(clientMachine, "error"),
    showReCaptcha: stateMatches(guestMachine, "available.register.challenging"),
    showLoginForm: stateMatches(guestMachine, "available.login"),
    show2fa: stateMatches(guestMachine, [
      "available.login.challenging",
      "available.login.verifying",
    ]),
    canShowForms: stateMatches(guestMachine, "available.idle"),
    showRegisterForm: stateMatches(guestMachine, "available.register"),
    showRecoverPasswordForm: stateMatches(guestMachine, "available.recover"),
  }));

  // --- context

  /**
   * Information about the authenticated client, if available. Represents the logged-in user.
   */
  const client = useChildActor(state, "clientMachine");
  const clientMachine = useChildService(state, "clientMachine");

  /**
   * Information about the guest user, if available. Used to handle non-authenticated user interactions.
   */
  const guest = useChildActor(state, "guestMachine");
  const guestMachine = useChildService(state, "guestMachine");

  /**
   * Context object containing session-specific information such as current user,
   * authentication status, and other dynamic data.
   */
  const context = useContext<SessionContext>(state);

  /**
   * User-specific information for the currently authenticated user, including profile and account data.
   */
  const user = useContext<ClientContext["user"]>(clientMachine, "user");

  /**
   * The underlying data model used in session-related forms such as login or registration.
   */
  const model = useContext<GuestContext["model"]>(guestMachine, "model");

  /**
   * JSON Schema used to define the structure of session-related forms, like login and registration.
   */
  const schema = useContext<GuestContext["schema"]>(guestMachine, "schema");

  /**
   * UI Schema used to configure the presentation and layout of session-related forms.
   */
  const uischema = useContext<GuestContext["uischema"]>(
    guestMachine,
    "uischema"
  );

  /**
   * Any errors encountered during session management operations, such as login or registration failures.
   */
  const errors = useContext<GuestContext["error"]>(guestMachine, "error");

  // --- methdos

  // ---  methods

  async function getUser(): Promise<User> {
    if (!clientMachine.value) {
      throw new DetailedError(
        "[headless] getUser on useSession failed",
        responseCodes.Unauthorized
      );
    }

    return waitFor(
      clientMachine.value,
      state => !stateMatches(state, "loading"),
      {
        timeout: 60_000,
      }
    )
      .then(state => {
        const user = get(state, "user");
        if (!user)
          throw new DetailedError(
            "[headless] getUser on useSession failed",
            responseCodes.Unauthorized
          );
        return user;
      })
      .catch(() => {
        throw new DetailedError(
          "[headless] getUser on useSession failed",
          responseCodes.Timeout
        );
      });
  }

  async function getUserId(): Promise<User["id"] | undefined> {
    return getUser()
      .then(user => user?.id)
      .catch(() => undefined);
  }

  // ---

  async function showLogin(): Promise<boolean> {
    if (!guestMachine.value) return true; // already logged in

    service.send({
      type: "LOGIN",
    });

    return await waitFor(
      guestMachine.value,
      state => stateMatches(state, "available.login"),
      { timeout: 60000 }
    )
      .then(() => true)
      .catch(() => false);
  }

  async function showRegister(): Promise<boolean> {
    if (!guestMachine.value) return true; // already logged in

    service.send({
      type: "REGISTER",
    });

    return await waitFor(
      guestMachine.value,
      state => stateMatches(state, "available.register"),
      { timeout: 60000 }
    )
      .then(() => true)
      .catch(() => false);
  }

  async function showRecoverPassword(): Promise<boolean> {
    if (!guestMachine.value) return true; // already logged in

    service.send({
      type: "RECOVER",
    });

    return await waitFor(
      guestMachine.value,
      state => stateMatches(state, "available.recover"),
      { timeout: 60000 }
    )
      .then(() => true)
      .catch(() => false);
  }

  // ---

  async function login(model: any): Promise<boolean> {
    if (!guestMachine.value) return true; // already logged in

    service.send({
      type: "AUTHENTICATE",
      data: get(model, "value", model), // ensure we dont have any reactive refs
    });

    return await waitFor(
      guestMachine.value,
      state => stateMatches(state, ["complete", "available.login.error"]),
      {
        timeout: 60000,
      }
    )
      .then(state => {
        if (stateMatches(state, "available.login.error")) {
          return false;
        }
        return true;
      })
      .catch(() => false);
  }

  async function verify2fa({ token }: { token: string }): Promise<any> {
    if (!guestMachine.value) return true; // already logged in

    service.send({
      type: "VERIFY",
      data: get(token, "value", token), // ensure we dont have any reactive refs
    });

    return await waitFor(
      guestMachine.value,
      state => stateMatches(state, ["complete", "available.login.error"]),
      {
        timeout: 60000,
      }
    )
      .then(state => {
        if (stateMatches(state, "available.login.error")) {
          return false;
        }
        return true;
      })
      .catch(() => false);
  }

  async function register(model: any): Promise<boolean> {
    if (!guestMachine.value) return true; // already logged in

    service.send({
      type: "REGISTER",
      data: get(model, "value", model), // ensure we dont have any reactive refs
    });

    return await waitFor(
      guestMachine.value,
      state => stateMatches(state, ["complete", "available.register.error"]),
      {
        timeout: 60000,
      }
    )
      .then(state => {
        if (stateMatches(state, "available.register.error")) {
          return false;
        }
        return true;
      })
      .catch(() => false);
  }

  async function recover(model: any): Promise<boolean> {
    if (!guestMachine.value) return true; // we're already logged in

    service.send({
      type: "RECOVER",
      data: get(model, "value", model), // ensure we don't have any reactive refs
    });

    return await waitFor(
      guestMachine.value,
      state =>
        stateMatches(state, [
          "available.recover.complete",
          "available.recover.error",
        ]),
      { timeout: 60_000 }
    )
      .then(state => {
        if (stateMatches(state, "available.recover.error")) {
          return false;
        }
        return true;
      })
      .catch(() => false);
  }

  async function logout(): Promise<boolean> {
    if (!clientMachine.value) return true; // were already logged out

    service.send({
      type: "LOGOUT",
    });

    return await waitFor(
      clientMachine.value,
      state => stateMatches(state, "complete"),
      {
        timeout: 60000,
      }
    )
      .then(() => true)
      .catch(() => false);
  }

  async function transferTo(): Promise<IAuthTransfer> {
    if (!clientMachine.value) {
      const { addError } = useFeedback();
      addError({ title: "Transfer not available" });
      return Promise.reject(new Error("Transfer not available"));
    }

    service.send({
      type: "TRANSFER_TO",
    });

    return waitFor(
      clientMachine.value,
      newState => stateMatches(newState, "transferring.available"),
      { timeout: 60_000 }
    )
      .then(newState => {
        const transfer = newState.context.transfer;
        if (!transfer) {
          throw new Error("Transfer not available");
        }
        return transfer;
      })
      .catch(() => {
        const { addError } = useFeedback();
        addError({ title: "Transfer not available" });
        return Promise.reject(
          new DetailedError(
            "[headless] TransferTo on useSession not available",
            responseCodes.No_Content
          )
        );
      });
  }

  async function transferFrom(
    code: string,
    redirect?: string
  ): Promise<SessionTransfer> {
    service.send({
      type: "TRANSFER_FROM",
      data: {
        code,
        redirect,
      },
    });

    return waitFor(
      service,
      newState => stateMatches(newState, "transferring.processed"),
      { timeout: 60_000 }
    )
      .then(newState => {
        const transfer = newState.context.transfer;
        const error = get(transfer, "token.error");
        if (!transfer || error) {
          return Promise.reject(
            new DetailedError(
              "Transfer not available",
              responseCodes.Conflict,
              error
            )
          );
        }
        return transfer;
      })
      .catch(() => {
        throw new DetailedError(
          "[headless] TransferFrom on useSession failed",
          responseCodes.Timeout
        );
      });
  }

  function transferred() {
    service.send({ type: "TRANSFERRED" });
  }

  /**
   * Function to resolve an ongoing authentication or registration request.
   * @param {any} model
   * @returns {Promise<any>}
   */
  async function resolve(model: any): Promise<any> {
    if (meta.value.showLoginForm && !meta.value.show2fa) return login(model);
    if (meta.value.show2fa) return verify2fa(model);
    if (meta.value.showRegisterForm) return register(model);
    if (meta.value.showRecoverPasswordForm) return recover(model);
    return Promise.reject(
      new Error(
        `[headless-vue] useSession: resolve() called but no form is available`
      )
    );
  }

  /**
   * Function to reject an ongoing authentication or registration request.
   * @returns {Promise<any>}
   */
  function reject(): Promise<any> {
    send({
      type: "CANCEL",
    });
    const guestMachine = state.value?.children?.guestMachine;
    return waitFor(guestMachine, state => stateMatches(state, "available"), {
      timeout: 60_000,
    });
  }

  // ---------------------------------------------------------------------------
  return {
    // --- state

    subscribe: service.subscribe,

    /**
     * Promise that resolves when the session is ready to be used.
     * Typically used to wait for initialization and loading of session data.
     */
    isReady,

    /**
     * Promise that resolves when the session is fully initialized and authenticated.
     * Typically used to wait for guarding routes or other authenticated-dependent operations.
     * @returns {Promise<User>} A promise that resolves with the current user when the session is ready.
     */
    isAuthenticated,

    /**
     * Computed metadata related to the session's state, including loading, ready, and error flags.
     * @typedef {Object} meta
     * @property {boolean} isLoading - Indicates whether any part of the session is currently in a loading state.
     * @property {boolean} isAvailable - Indicates whether the session is ready to be used.
     * @property {boolean} isProcessing - Indicates whether the session is currently processing an action.
     * @property {boolean} isAuthenticated - Indicates whether the user is authenticated within the session.
     * @property {boolean} isTransferring - Indicates whether the session is currently transferring data.
     * @property {boolean} hasExpired - Indicates whether the session has expired.
     * @property {boolean} showReCaptcha - Indicates whether the ReCaptcha challenge should be displayed.
     * @property {boolean} showLoginForm - Indicates whether the login form should be displayed.
     * @property {boolean} show2fa - Indicates whether the two-factor authentication (2FA) challenge is required and should be shown.
     * @property {boolean} showRegisterForm - Indicates whether the registration form should be displayed.
     * @property {boolean} showRecoverPasswordForm - Indicates whether the Send reset form should be displayed.
     * @property {boolean} canShowForms - Indicates whether any forms (login or register) can be shown to the user.
     * @property {boolean} hasErrors - Indicates whether any errors have occurred during session management operations.
     */
    meta,

    // --- context

    /**
     * Context object containing session-specific information such as current user,
     * authentication status, and other dynamic data.
     */
    context,

    /**
     * Any errors encountered during session management operations, such as login or registration failures.
     */
    errors,

    /**
     * Information about the guest user, if available. Used to handle non-authenticated user interactions.
     */
    guest,

    /**
     * Information about the authenticated client, if available. Represents the logged-in user.
     */
    client,

    /**
     * The underlying data model used in session-related forms such as login or registration.
     */
    model,

    /**
     * JSON Schema used to define the structure of session-related forms, like login and registration.
     */
    schema,

    /**
     * UI Schema used to configure the presentation and layout of session-related forms.
     */
    uischema,

    /**
     * User-specific information for the currently authenticated user, including profile and account data.
     */
    user,

    // --- methods

    /**
     * Retrieves the user object of the currently authenticated user.
     * @returns {Promise<User>} A promise that resolves with the user object if available, or throws an error if not authenticated.
     */
    getUser,

    /**
     * Retrieves the user ID of the currently authenticated user.
     * @returns {Promise<User["id"] | undefined>} A promise that resolves with the user ID if available, or undefined if not authenticated.
     */
    getUserId,

    /**
     * Function to reject an ongoing authentication or registration request.
     */
    reject,

    /**
     * Function to resolve an ongoing authentication or registration request.
     */
    resolve,

    /**
     * Initiates the login process for a user, typically used in conjunction with a form and model data.
     * @returns {Promise<void>} A promise that resolves when the login operation is completed.
     */
    login,

    /**
     * Logs out the currently authenticated user.
     * @returns {Promise<void>} A promise that resolves when the logout operation is completed.
     */
    logout,

    /**
     * Recovers the password for a user, typically used with form and model data.
     * @returns {Promise<void>} A promise that resolves when the password recovery operation is completed.
     */
    recover,

    /**
     * Registers a new user, typically used with a form and model data.
     * @returns {Promise<any>} A promise that resolves when the registration operation is completed.
     */
    register,

    /**
     * Verifies the 2-factor authentication (2FA) code provided by the user.
     * @param {string} code The 2FA code entered by the user.
     * @returns {Promise<void>} A promise that resolves when the verification is successful.
     */
    verify2fa,

    /**
     * Transfer session data between different parts of the application, such as from guest to client.
     */
    transferTo,

    /**
     * Transfer session data from another part of the application.
     * @param {string} code The transfer code used to identify the session.
     * @param {string} redirect The URL to redirect to after the transfer is complete.
     * @returns {Promise<IAuthTransfer>} A promise that resolves with the transfer details.
     * @throws {Error} If the transfer fails or the code is invalid.
     */
    transferFrom,

    /**
     * Retrieves the transfer details, such as the transfer code and redirect URL.
     * @returns {Promise<IAuthTransfer>} A promise that resolves with the transfer details.
     */
    getTransferDetails: () => {
      return state.value.context?.transfer;
    },

    /**
     * Indicates whether the session has been transferred successfully.
     * @returns {boolean} True if the session has been transferred, false otherwise.
     */
    transferred,

    /**
     * Displays the login form for user authentication.
     */
    showLogin,

    /**
     * Displays the registration form for user sign-up.
     */
    showRegister,

    /**
     * Displays the Send reset form for password recovery.
     */
    showRecoverPassword,

    /**
     * Sets the model for the session, typically used to update or initialize the data model
     */
    setModel: (data: any) => {
      send({
        type: "SET",
        data,
      });
    },

    getToken: () => getTokenFromStorage()?.access_token,

    getHistory: () => state.value?.context?.history,

    // ---

    reauth: () => service.send({ type: "EXPIRED" }),
  };
};

/**
 * The return type of useSession composable.
 */
export type UseSession = ReturnType<typeof useSession>;
