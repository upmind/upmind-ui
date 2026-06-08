// --- external
import { computed } from "vue";
import { interpret, InterpreterStatus } from "xstate";
import { waitFor } from "xstate/lib/waitFor";
import { useActor } from "@xstate/vue";

// --- internal
import { useI18n } from "../system";
import sessionMachine from "./session.machine";
import { useFeedback } from "../feedback";
import { useBrand } from "../brand";
export * from "./useTransfer";

// --- utils
import { get, isEmpty } from "lodash-es";
import { BrandConfigKeys } from "@upmind-automation/types";
import { getTokenFromStorage } from "./utils";
import {
  DetailedError,
  responseCodes,
  contextValue,
  stateMatches,
  useContext,
  useChildActor,
  ErrorOrigin,
  type ResponseError
} from "../../utils";

// ---types
import type {
  IAuthTransfer,
  SessionContext,
  SessionTransfer,
  VerificationProps,
  Client
} from "./types";
import type { ErrorObject } from "ajv";
import type { ClientContext } from "./client/types";
import { ClientFormType } from "./client/types";
export type { Client, SessionTransfer, IAuthTransfer } from "./types";
// -----------------------------------------------------------------------------

// create a global instance of the session machine
// and a global object to store state
// NB dont automatically start the machine as in order for the inspector to work
// it needs to be started after the inspect service is created, so we only start it when we need it

const service = interpret(sessionMachine, { devTools: true });

// -----------------------------------------------------------------------------

/**
 * Composable function to manage session-related logic using Vue.
 * It provides state, context and helpers for session, login and registration processes.
 *
 * @returns Session management API (see below for details)
 */
export const useSession = () => {
  const { t } = useI18n();
  if (service.status == InterpreterStatus.NotStarted) service.start();

  const { state, send } = useActor(service);

  // --- state

  async function isReady(): Promise<boolean> {
    return waitFor(service, state => !state.matches("checking"), {
      timeout: 60_000
    })
      .then(state => {
        if (stateMatches(state, "error")) throw state.context.error;
        return true; // Session is ready
      })
      .catch(error => {
        throw new DetailedError(
          error?.message ?? t("error.session_not_available"),
          error?.responseCode ?? responseCodes.No_Content,
          error?.origin ?? ErrorOrigin.Headless
        );
      });
  }

  async function isAuthenticated(): Promise<Client> {
    return isReady()
      .then(async () => {
        if (!clientActor.value)
          throw new DetailedError(
            t("auth.login_to_continue"),
            responseCodes.Unauthorized,
            ErrorOrigin.Headless
          );

        return waitFor(
          clientActor.value.service,
          state => stateMatches(state, ["available", "done"]),
          {
            timeout: 60_000
          }
        ).then(() => {
          const client = contextValue<Client>(clientActor, "client");
          if (!client) {
            throw new DetailedError(
              t("auth.login_to_continue"),
              responseCodes.Unauthorized,
              ErrorOrigin.Headless
            );
          }
          return client;
        });
      })
      .catch(() =>
        Promise.reject(
          new DetailedError(
            t("error.401_title_md"),
            responseCodes.Unauthorized,
            ErrorOrigin.Headless
          )
        )
      );
  }

  // Guest checkout is available when the brand allows it AND the user isn't
  // already authenticated as a guest customer. Basket-composition checks (e.g.
  // recurring products) live on `useBasket().meta` to keep session decoupled.
  const { getConfigValue } = useBrand();

  const meta = computed(() => ({
    isLoading:
      stateMatches(state, "checking") ||
      stateMatches(guestActor, [
        "loading",
        "available.login.loading",
        "available.register.loading",
        "available.recover.loading",
        "available.asGuest.registering"
      ]) ||
      stateMatches(clientActor, [
        "loading",
        // The upgrade form's schema fetch (getCustomFields) — no form yet, so
        // show the skeleton. The submit itself is `isProcessing`, not loading
        // (the form stays mounted with a processing indicator).
        "available.unregistered.loading"
      ]) ||
      false,
    isAvailable: !stateMatches(state, ["error", "checking"]),
    isProcessing:
      stateMatches(guestActor, [
        "available.login.authenticating",
        "available.login.verifying",
        "available.register.registering",
        "available.register.authenticating",
        "available.register.verifying",
        "available.recover.recovering",
        "available.asGuest.registering"
      ]) ||
      stateMatches(clientActor, [
        "available.unregistered.registering",
        "available.unregistered.updating",
        "available.unverified.verifying"
      ]),
    isAuthenticated: stateMatches(state, "client"),
    isUnverified: stateMatches(clientActor, "available.unverified"),
    isCompletingRegistration: stateMatches(
      clientActor,
      "available.unregistered.registering"
    ),
    isRegisteringAsGuest: stateMatches(
      guestActor,
      "available.asGuest.registering"
    ),
    isGuestClient: stateMatches(state, "client") && !!client.value?.isGuest,
    canRegisterAsGuest:
      !(stateMatches(state, "client") && !!client.value?.isGuest) &&
      !!getConfigValue<boolean>(BrandConfigKeys.GUEST_CHECKOUT_ENABLED),
    isTransferring: stateMatches(clientActor, "transferring"),
    hasExpired: stateMatches(state, "expired") || isEmpty(state.value.children),
    hasErrors:
      stateMatches(state, "error") ||
      stateMatches(guestActor, [
        "available.login.error",
        "available.register.error",
        "available.recover.error",
        "available.asGuest.error"
      ]) ||
      stateMatches(clientActor, "available.unregistered.error"),
    showLoginForm: stateMatches(guestActor, "available.login"),
    show2fa: stateMatches(guestActor, [
      "available.login.challenging",
      "available.login.verifying",
      "available.register.challenging",
      "available.register.verifying"
    ]),
    canShowForms:
      stateMatches(guestActor, "available") ||
      stateMatches(clientActor, "available.unregistered"),
    showAsGuestForm: stateMatches(guestActor, "available.asGuest"),
    showRegisterForm: stateMatches(guestActor, "available.register"),
    showRecoverPasswordForm: stateMatches(guestActor, "available.recover"),
    // Guest-client forms share one node; `formType` says which is active.
    showGuestUpgradeForm:
      stateMatches(clientActor, "available.unregistered") &&
      formType.value === ClientFormType.REGISTER,
    showGuestEmailForm:
      stateMatches(clientActor, "available.unregistered") &&
      formType.value === ClientFormType.EMAIL
  }));

  // --- context

  /**
   * Information about the authenticated client, if available. Represents the logged-in client.
   */
  const clientActor = useChildActor(state, "clientMachine");

  /**
   * Information about the guest client, if available. Used to handle non-authenticated client interactions.
   */
  const guestActor = useChildActor(state, "guestMachine");

  /**
   * Context object containing session-specific information such as current client,
   * authentication status, and other dynamic data.
   */
  const context = useContext<SessionContext>(state);

  /**
   * Client-specific information for the currently authenticated client, including profile and account data.
   */
  const client = useContext<ClientContext["client"]>(clientActor, "client");

  /**
   * Which guest-client form (`register` upgrade or `email`) is active in the
   * shared `unregistered.available` node — distinguishes the two for the UI.
   */
  const formType = useContext<ClientFormType>(clientActor, "formType");

  // Form data (model/schema/uischema/errors) lives on the GUEST machine for
  // login/register/recover/2fa, but a guest *client* is in the CLIENT machine
  // (the guest actor is gone), so its upgrade + email forms read from there.
  // Pick the active form actor once; every form value reads off it and stays
  // reactive because `useContext` unwraps the actor inside its own computed.
  const formActor = computed(() =>
    meta.value.isGuestClient ? clientActor.value : guestActor.value
  );

  /**
   * The underlying data model used in session-related forms such as login or registration.
   */
  const model = useContext<ClientContext["model"]>(formActor, "model");

  /**
   * JSON Schema used to define the structure of session-related forms, like login and registration.
   */
  const schema = useContext<ClientContext["schema"]>(formActor, "schema");

  /**
   * UI Schema used to configure the presentation and layout of session-related forms.
   */
  const uischema = useContext<ClientContext["uischema"]>(formActor, "uischema");

  /**
   * Any errors encountered during session management operations, such as login or registration failures.
   */
  const errors = useContext<ResponseError["message"]>(
    formActor,
    "error.message"
  );
  const validationErrors = useContext<ErrorObject[]>(formActor, "error.data");

  // --- methods

  // ---  methods

  async function getClient(): Promise<Client> {
    if (!clientActor.value) {
      throw new DetailedError(
        t("error.client_not_available"),
        responseCodes.Unauthorized,
        ErrorOrigin.Headless
      );
    }

    return waitFor(
      clientActor.value.service,
      state => !stateMatches(state, ["loading"]),
      {
        timeout: 60_000
      }
    )
      .then(state => {
        const client = get(state, "client");
        if (!client)
          throw new DetailedError(
            t("error.client_not_available"),
            responseCodes.Unauthorized,
            ErrorOrigin.Headless
          );
        return client;
      })
      .catch(() => {
        throw new DetailedError(
          t("error.client_load_failed"),
          responseCodes.Timeout,
          ErrorOrigin.Headless
        );
      });
  }

  async function getClientId(): Promise<Client["id"] | undefined> {
    return getClient()
      .then(client => client?.id)
      .catch(() => undefined);
  }

  // ---

  async function showLogin(): Promise<boolean> {
    if (!guestActor.value) return true; // already logged in

    service.send({
      type: "LOGIN"
    });

    return await waitFor(
      guestActor.value.service,
      state => stateMatches(state, ["available.login", "done"]),
      { timeout: 60000 }
    )
      .then(() => true)
      .catch(() => false);
  }

  async function showRegister(): Promise<boolean> {
    // Guest client → drive the CLIENT machine's upgrade form (the guest actor
    // is gone once a guest client exists).
    if (meta.value.isGuestClient && clientActor.value) {
      service.send({ type: "REGISTER" });

      return await waitFor(
        clientActor.value.service,
        state =>
          stateMatches(state, ["available.unregistered.available", "done"]),
        { timeout: 60000 }
      )
        .then(() => true)
        .catch(() => false);
    }

    if (!guestActor.value) return true; // already logged in

    service.send({
      type: "REGISTER"
    });

    return await waitFor(
      guestActor.value.service,
      state => stateMatches(state, ["available.register", "done"]),
      { timeout: 60000 }
    )
      .then(() => true)
      .catch(() => false);
  }

  async function showGuestEmail(): Promise<boolean> {
    if (!clientActor.value) return false;

    service.send({ type: "EMAIL" });

    return await waitFor(
      clientActor.value.service,
      state =>
        stateMatches(state, ["available.unregistered.available", "done"]),
      { timeout: 60000 }
    )
      .then(() => true)
      .catch(() => false);
  }

  async function showRecoverPassword(): Promise<boolean> {
    if (!guestActor.value) return true; // already logged in

    service.send({
      type: "RECOVER"
    });

    return await waitFor(
      guestActor.value.service,
      state => stateMatches(state, ["available.recover", "done"]),
      { timeout: 60000 }
    )
      .then(() => true)
      .catch(() => false);
  }

  // ---

  async function login(model: any): Promise<boolean> {
    if (!guestActor.value) return true; // already logged in

    service.send({
      type: "AUTHENTICATE",
      data: get(model, "value", model) // ensure we dont have any reactive refs
    });

    return await waitFor(
      guestActor.value.service,
      state =>
        stateMatches(state, ["complete", "available.login.error", "done"]),
      {
        timeout: 60000
      }
    )
      .then(state => !stateMatches(state, "available.login.error"))
      .catch(() => false);
  }

  async function verify2fa(model: { token: string }): Promise<any> {
    if (!guestActor.value) return true; // already logged in

    service.send({
      type: "VERIFY",
      data: model
    });

    return await waitFor(
      guestActor.value.service,
      state =>
        stateMatches(state, ["complete", "available.login.error", "done"]),
      {
        timeout: 60000
      }
    )
      .then(state => !stateMatches(state, "available.login.error"))
      .catch(() => false);
  }

  function challengeEmail(): void {
    service.send({ type: "CONFIRM" });
  }

  async function verifyEmail(payload: VerificationProps): Promise<boolean> {
    if (!clientActor.value) return false;

    service.send({ type: "VERIFY", data: payload });

    return await waitFor(
      clientActor.value.service,
      state =>
        stateMatches(state, [
          "available.verified",
          "available.unverified.challenging.invalid"
        ]),
      { timeout: 60000 }
    )
      .then(state => stateMatches(state, "available.verified"))
      .catch(() => false);
  }

  async function register(model: any): Promise<boolean> {
    if (!guestActor.value) return true; // already logged in

    service.send({
      type: "REGISTER",
      data: get(model, "value", model) // ensure we dont have any reactive refs
    });

    return await waitFor(
      guestActor.value.service,
      state =>
        stateMatches(state, ["complete", "available.register.error", "done"]),
      {
        timeout: 60000
      }
    )
      .then(state => !stateMatches(state, "available.register.error"))
      .catch(() => false);
  }

  async function recover(model: any): Promise<boolean> {
    if (!guestActor.value) return true; // we're already logged in

    service.send({
      type: "RECOVER",
      data: get(model, "value", model) // ensure we don't have any reactive refs
    });

    return await waitFor(
      guestActor.value.service,
      state =>
        stateMatches(state, [
          "available.recover.complete",
          "available.recover.error",
          "done"
        ]),
      { timeout: 60_000 }
    )
      .then(state => !stateMatches(state, "available.recover.error"))
      .catch(() => false);
  }

  async function logout(): Promise<boolean> {
    service.send({
      type: "LOGOUT"
    });

    if (!clientActor.value?.service) return true; // were already logged out

    return await waitFor(
      clientActor.value.service,
      state => stateMatches(state, ["complete", "done"]),
      {
        timeout: 60000
      }
    )
      .then(() => true)
      .catch(() => false);
  }

  async function showAsGuest(): Promise<boolean> {
    if (!guestActor.value) return true;

    service.send({ type: "GUEST" });

    return await waitFor(
      guestActor.value.service,
      state => stateMatches(state, ["available.asGuest", "done"]),
      { timeout: 60_000 }
    )
      .then(() => true)
      .catch(() => false);
  }

  async function registerAsGuest(): Promise<boolean> {
    if (!guestActor.value) return true;

    service.send({ type: "GUEST" });

    return await waitFor(
      guestActor.value.service,
      state =>
        stateMatches(state, ["complete", "available.asGuest.error", "done"]),
      { timeout: 60_000 }
    )
      .then(state => !stateMatches(state, "available.asGuest.error"))
      .catch(() => false);
  }

  async function completeRegistration(model: any): Promise<boolean> {
    if (!clientActor.value) return false;

    service.send({
      type: "COMPLETE_REGISTRATION",
      data: get(model, "value", model)
    });

    return await waitFor(
      clientActor.value.service,
      state =>
        stateMatches(state, [
          "available.verified",
          "available.unregistered.error",
          "complete",
          "done"
        ]),
      { timeout: 60_000 }
    )
      .then(state => !stateMatches(state, "available.unregistered.error"))
      .catch(() => false);
  }

  async function updateGuestEmail(email: string): Promise<boolean> {
    if (!clientActor.value) return false;

    service.send({
      type: "UPDATE_GUEST_EMAIL",
      data: { email }
    });

    return await waitFor(
      clientActor.value.service,
      state => stateMatches(state, ["available", "done"]),
      { timeout: 60_000 }
    )
      .then(() => !contextValue(clientActor, "error"))
      .catch(() => false);
  }

  async function transferTo(): Promise<IAuthTransfer> {
    if (!clientActor.value) {
      useFeedback().addError({
        title: t("error.session_transfer_not_available")
      });
      return Promise.reject(
        new DetailedError(
          t("error.session_transfer_not_available"),
          responseCodes.No_Content,
          ErrorOrigin.Headless
        )
      );
    }

    service.send({
      type: "TRANSFER_TO"
    });

    return waitFor(
      clientActor.value.service,
      newState => stateMatches(newState, ["transferring.available", "done"]),
      { timeout: 60_000 }
    )
      .then(newState => {
        const transfer = newState.context.transfer;
        if (!transfer) {
          throw new DetailedError(
            t("error.session_transfer_not_available"),
            responseCodes.No_Content,
            ErrorOrigin.Headless
          );
        }
        return transfer;
      })
      .catch(() => {
        useFeedback().addError({
          title: t("error.session_transfer_not_available")
        });
        return Promise.reject(
          new DetailedError(
            t("error.session_transfer_not_available"),
            responseCodes.No_Content,
            ErrorOrigin.Headless
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
        redirect
      }
    });

    return waitFor(
      service,
      newState => stateMatches(newState, ["transferring.processed", "done"]),
      { timeout: 60_000 }
    )
      .then(newState => {
        const transfer = newState.context.transfer;
        const error = get(transfer, "token.error");
        if (!transfer || error) {
          return Promise.reject(
            new DetailedError(
              t("error.session_transfer_not_available"),
              responseCodes.Conflict,
              ErrorOrigin.Headless,
              error
            )
          );
        }
        return transfer;
      })
      .catch(() => {
        throw new DetailedError(
          t("error.session_transfer_failed"),
          responseCodes.Timeout,
          ErrorOrigin.Headless
        );
      });
  }

  function transferred() {
    service.send({ type: "TRANSFERRED" });
  }

  function verifyFromLink(payload: VerificationProps): void {
    service.send({ type: "VERIFY_EMAIL", data: payload });
  }

  /**
   * Function to resolve an ongoing authentication or registration request.
   * @param {any} model
   * @returns {Promise<any>}
   */
  async function resolve(model: any): Promise<any> {
    if (meta.value.isGuestClient) return completeRegistration(model);
    if (meta.value.showLoginForm && !meta.value.show2fa) return login(model);
    if (meta.value.show2fa) return verify2fa(model);
    if (meta.value.showRegisterForm) return register(model);
    if (meta.value.showRecoverPasswordForm) return recover(model);
    if (meta.value.showAsGuestForm) return registerAsGuest();
    return Promise.reject(
      new DetailedError(
        t("error.session_form_not_available"),
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless
      )
    );
  }

  /**
   * Function to reject an ongoing authentication or registration request.
   * @returns {Promise<any>}
   */
  function reject(): Promise<any> {
    send({
      type: "CANCEL"
    });
    const guest = state.value?.children?.guest;
    if (!guest) return Promise.resolve(true);
    return waitFor(guest, state => stateMatches(state, ["available", "done"]), {
      timeout: 60_000
    });
  }

  /**
   * Refreshes the session by sending a REFRESH event to the session machine.
   * It waits for the client actor to be available and then returns true.
   * If the client actor is not available, it returns true (assuming the client is already logged out).
   * If the wait times out, it returns false.
   * @returns {Promise<boolean>} A promise that resolves to true if the session was refreshed successfully, false otherwise.
   */
  async function refresh(): Promise<boolean> {
    service.send({
      type: "REFRESH"
    });

    if (!clientActor.value?.service) return true; // were already logged out

    return await waitFor(
      clientActor.value.service,
      state => stateMatches(state, ["available", "done"]),
      {
        timeout: 60000
      }
    )
      .then(() => true)
      .catch(() => false);
  }

  // ---------------------------------------------------------------------------
  return {
    // --- state
    /**
     * Subscribes to basket state changes.
     * @see https://xstate.js.org/docs/guides/communication.html#service-subscribe
     */
    subscribe: service.subscribe.bind(service),
    /**
     * Promise that resolves when the session is ready to be used.
     * Typically used to wait for initialization and loading of session data.
     */
    isReady,

    /**
     * Promise that resolves when the session is fully initialized and authenticated.
     * Typically used to wait for guarding routes or other authenticated-dependent operations.
     * @returns {Promise<Client>} A promise that resolves with the current client when the session is ready.
     */
    isAuthenticated,

    /**
     * Computed metadata related to the session's state, including loading, ready, and error flags.
     * @type {Object} meta
     * @property {boolean} isLoading - Indicates whether any part of the session is currently in a loading state.
     * @property {boolean} isAvailable - Indicates whether the session is ready to be used.
     * @property {boolean} isProcessing - Indicates whether the session is currently processing an action.
     * @property {boolean} isAuthenticated - Indicates whether the client is authenticated within the session.
     * @property {boolean} isUnverified - Indicates whether the authenticated client must verify their email before proceeding.
     * @property {boolean} isCompletingRegistration - Indicates whether the client is completing guest registration.
     * @property {boolean} isGuestClient - Indicates whether the client is a guest (checked out without full registration).
     * @property {boolean} isTransferring - Indicates whether the session is currently transferring data.
     * @property {boolean} hasExpired - Indicates whether the session has expired.
     * @property {boolean} showLoginForm - Indicates whether the login form should be displayed.
     * @property {boolean} show2fa - Indicates whether the two-factor authentication (2FA) challenge is required and should be shown (login or register).
     * @property {boolean} showAsGuestForm - Indicates whether the guest checkout form is active.
     * @property {boolean} showRegisterForm - Indicates whether the registration form should be displayed.
     * @property {boolean} showRecoverPasswordForm - Indicates whether the Send reset form should be displayed.
     * @property {boolean} canShowForms - Indicates whether any forms (login or register) can be shown to the client.
     * @property {boolean} hasErrors - Indicates whether any errors have occurred during session management operations.
     */
    meta,

    // --- context

    /**
     * Context object containing session-specific information such as current client,
     * authentication status, and other dynamic data.
     */
    context,

    /**
     * Any errors message(s) encountered during session management operations, such as login or registration failures.
     */
    errors,

    /**
     * Validation errors encountered during session management operations, such as login or registration failures.
     * Typically contains an array of error objects with details about the validation issues.
     * @type {ErrorObject[]}
     * @see https://ajv.js.org/guide/validation-errors.html#validation-error-object
     */
    validationErrors,

    // /**
    //  * Information about the guest client, if available. Used to handle non-authenticated client interactions.
    //  */
    // guest,

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
     * Client-specific information for the currently authenticated client, including profile and account data.
     */
    client,

    clientId: computed((): Client["id"] | undefined => {
      return client.value?.id;
    }),

    actorKey: computed(
      () => `${client.value?.id ?? "anonymous"}:${meta.value.isGuestClient}`
    ),

    // --- methods

    // /**
    //  * Retrieves the client object of the currently authenticated client.
    //  * @returns {Promise<Client>} A promise that resolves with the client object if available, or throws an error if not authenticated.
    //  */
    // getClient,

    // /**
    //  * Retrieves the client ID of the currently authenticated client.
    //  * @returns {Promise<Client["id"] | undefined>} A promise that resolves with the client ID if available, or undefined if not authenticated.
    //  */
    // getClientId,

    /**
     * Function to reject an ongoing authentication or registration request.
     */
    reject,

    /**
     * Function to resolve an ongoing authentication or registration request.
     */
    resolve,

    /**
     * Refreshes the session, typically used to renew an expired session.
     */
    refresh,

    /**
     * Initiates the login process for a client, typically used in conjunction with a form and model data.
     * @returns {Promise<void>} A promise that resolves when the login operation is completed.
     */
    login,

    /**
     * Logs out the currently authenticated client.
     * @returns {Promise<void>} A promise that resolves when the logout operation is completed.
     */
    logout,

    /**
     * Recovers the password for a client, typically used with form and model data.
     * @returns {Promise<void>} A promise that resolves when the password recovery operation is completed.
     */
    recover,

    /**
     * Registers a new client, typically used with a form and model data.
     * @returns {Promise<any>} A promise that resolves when the registration operation is completed.
     */
    register,

    /**
     * Verifies the 2-factor authentication (2FA) code provided by the client.
     * @param {string} code The 2FA code entered by the client.
     * @returns {Promise<void>} A promise that resolves when the verification is successful.
     */
    verify2fa,

    /**
     * Opens the email-verification challenge for an unverified client — moves
     * `unverified.idle` → `challenging` so the code form is shown. Fired when
     * the verify-email overlay/modal mounts (e.g. gated at checkout).
     */
    challengeEmail,

    /**
     * Submits the email verification code entered by an unverified client.
     * @param {Object} payload The verification payload.
     * @param {string} payload.code The verification code entered by the client.
     * @returns {Promise<boolean>} Resolves `true` if verification succeeded and the client transitioned to `available`, `false` otherwise.
     */
    verifyEmail,

    /**
     * Verifies an email from a session-agnostic link (works logged out).
     * Fire-and-forget: dispatches `VERIFY_EMAIL`; the session machine performs
     * the verification, fires the success/failure toast, and re-checks.
     * @param {Object} payload The verification payload.
     * @param {string} payload.clientId The client whose email is being verified.
     * @param {string} payload.emailId The email record being verified.
     * @param {string} payload.hash The registration hash from the emailed link.
     */
    verifyFromLink,

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
     * Completes guest → full client registration.
     */
    completeRegistration,

    /**
     * Registers current session as guest client for checkout.
     */
    registerAsGuest,

    /**
     * Displays the guest checkout state.
     */
    showAsGuest,

    /**
     * Displays the login form for client authentication.
     */
    showLogin,

    /**
     * Displays the registration form for client sign-up.
     */
    showRegister,

    /**
     * Drives the client machine's guest-email form (checkout email capture).
     */
    showGuestEmail,

    /**
     * Displays the Send reset form for password recovery.
     */
    showRecoverPassword,

    /**
     * Updates the guest client's email for receipt.
     */
    updateGuestEmail,

    /**
     * Sets the model for the session, typically used to update or initialize the data model
     */
    setModel: (data: any) => {
      send({
        type: "SET",
        data
      });
    },

    getToken: () => getTokenFromStorage()?.access_token,

    getHistory: () => state.value?.context?.history,

    // ---

    reauth: () => service.send({ type: "EXPIRED" })
  };
};

/**
 * The return type of useSession composable.
 */
export type UseSession = ReturnType<typeof useSession>;
