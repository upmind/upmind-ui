// --- external
import { computed, unref, watch, toRaw } from "vue";
import { useActor } from "@xstate/vue";

// --- internal
import { useSession as useUpmindSession } from "@upmind/headless";

// --- utils
import { isFunction } from "lodash-es";

/**
 * Composable function to manage session-related logic using Vue.
 * It provides state, context and helpers for session, login and registration processes.
 *
 * @param {Function} [inspector] - Optional function that can inspect the session's state and context changes.
 * @returns {Object} Returns an object containing:
 * - `state`: The current state of the session (e.g., `idle`, `login`, `register`, etc.).
 * - `context`: The session context holding additional information like form data.
 * - `errors`: Errors, if any, during the session.
 * - `meta`: Metadata with various session flags like `isLoading` and `isAuthenticated`.
 * - `guest`: The state of the guest (unauthenticated user) machine.
 * - `client`: The state of the client (authenticated user) machine.
 * - `model`: Current model context in guest state.
 * - `schema`: Current schema context in guest state.
 * - `uischema`: Current UI schema context in guest state.
 * - `user`: User data in client context.
 * - `reject`: Cancels the current session flow.
 * - `resolve`: Handles form submission and action resolution based on the current form state (login, register, 2FA).
 * - `login`: Initiates login action with a model.
 * - `logout`: Logs out the current user.
 * - `register`: Initiates the registration process with a model.
 * - `showLogin`: Shows the login form.
 * - `showRegister`: Verifies 2FA with the provided token
 * - `verify2fa(token)`: Verifies 2FA token.
 * - `verifyReCaptcha(token)`: Verifies ReCaptcha token.
 * - `transfer`: Transfers the session.
 */
export const useSession = (inspector?: Function): any => {
  const { service, transfer } = useUpmindSession();
  const { state, send } = useActor(service);

  // We can create reactive refs to the child machines,
  // so that when they are invoked we can listen to their state changes
  const client = computed(() => {
    const clientMachine = state.value?.children?.clientMachine;
    if (!clientMachine) return null;
    const { state: clientState } = useActor(clientMachine);
    return clientState.value;
  });

  const guest = computed(() => {
    const guestMachine = state.value?.children?.guestMachine;
    if (!guestMachine) return null;
    const { state: guestState } = useActor(guestMachine);
    return guestState.value;
  });

  // --------------------------------------------------------

  const context = computed(() => state.value.context);
  //const messages= computed(() => state.value.context?.messages);
  // ---
  const meta = computed(() => ({
    isLoading:
      state.value.matches("checking") ||
      (guest.value?.matches && guest.value.matches("loading")) ||
      (client.value?.matches && client.value.matches("loading")),

    isProcessing:
      (guest.value?.matches &&
        [
          "login.authenticating",
          "login.verifying",
          "register.checking",
          "register.verifying",
          "register.registering",
          "register.authenticating",
        ].some(guest.value.matches)) ||
      client.value?.matches("processing"),

    // ---
    isAuthenticated: state.value.matches("client"),
    isTransferring: client.value?.matches("transferring"),
    hasExpired: state.value.matches("expired"),

    // ---
    showReCaptcha: guest.value?.matches("register.challenging"),
    showLoginForm: guest.value?.matches("login"),
    show2fa:
      guest.value?.matches &&
      ["login.challenging", "login.verifying"].some(guest.value.matches),

    showRegisterForm: guest.value?.matches("register"),
    canShowForms: guest.value?.matches("idle"),
  }));

  const user = computed(() => client.value?.context?.user);

  // ---
  const model = computed(() => guest.value?.context?.model);
  const schema = computed(() => guest.value?.context?.schema);
  const uischema = computed(() => guest.value?.context?.uischema);
  const errors = computed(() => guest.value.context?.error);

  // --------------------------------------------------------
  function showLogin() {
    send({
      type: "LOGIN",
    });
  }

  function showRegister() {
    send({
      type: "REGISTER",
    });
  }

  // ---
  function login(model: any) {
    send({
      type: "AUTHENTICATE",
      data: unref(model),
    });
  }

  function verify2fa({ token }: any) {
    send({
      type: "VERIFY",
      data: unref(token),
    });
  }

  function register(model: any) {
    send({
      type: "REGISTER",
      data: unref(model),
    });
  }

  function verifyReCaptcha(token: any) {
    send({
      type: "VERIFY",
      data: unref(token),
    });
  }

  function logout() {
    send({
      type: "LOGOUT",
    });
  }

  // ---

  function resolve(model: any) {
    if (meta.value.showLoginForm && !meta.value.show2fa) login(model);
    if (meta.value.show2fa) verify2fa(model);
    if (meta.value.showRegisterForm) register(model);
  }

  function reject() {
    send({
      type: "CANCEL",
    });
  }
  // --------------------------------------------------------

  if (isFunction(inspector)) {
    // send a message to indicate we are
    inspector({
      key: "_upm-inspector",
      message: "inspecting session",
      flow: "session",
    });

    // whenever our state changes, post a message to our parent window

    watch([state, client, guest], () =>
      inspector({
        key: "_upm-inspector",
        flow: "session",
        snapshot: {
          errors: toRaw(unref(errors)),
          state: {
            session: state?.value?.value,
            guest: guest?.value?.value,
            client: client?.value?.value,
          },
          context: toRaw(unref(context)),
          meta: toRaw(unref(meta)),
        },
      })
    );
  }
  // --------------------------------------------------------

  return {
    state: computed(() => state.value.value),
    context,
    errors,
    //messages,
    // ---
    meta,
    // --- Guest
    guest,
    // --- Client
    client,
    model,
    schema,
    uischema,
    // ---
    user,
    // ---
    reject,
    resolve,
    login,
    logout,
    register,
    showLogin,
    showRegister,
    verify2fa,
    verifyReCaptcha,
    transfer,
  };
};
