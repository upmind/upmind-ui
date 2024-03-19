// --- external
import { computed, unref, watch, toRaw } from "vue";
import { useActor } from "@xstate/vue";

// --- internal
import { useSession as useUpmindSession } from "@upmind/flow";

// --- utils
import { isEmpty, isFunction } from "lodash-es";
// --------------------------------------------------------
// a composable that provides a simple interface to the api requests machine
//  with some state helpers

export const useSession = (inspector?: Function) => {
  const { service } = useUpmindSession();
  const { state, send } = useActor(service);

  // We can create reactive refs to the child machines,
  // so that when they are invoked we can listen to their state changes
  const client = computed(() => {
    if (!state.value?.children?.client) return null;
    const { state: clientState } = useActor(state.value.children.client);
    return clientState.value;
  });

  const guest = computed(() => {
    if (!state.value?.children?.guest) return null;
    const { state: guestState } = useActor(state.value.children.guest);
    return guestState.value;
  });

  // --------------------------------------------------------

  const context = computed(() => state.value.context);
  const errors = computed(() => state.value.context?.error);
  //const messages= computed(() => state.value.context?.messages);
  // ---
  const meta = computed(() => ({
    isLoading: state.value.matches("starting"),
    isProcessing:
      client.value?.matches &&
      ![
        "unauthenticated.idle",
        "unauthenticated.login.idle",
        "unauthenticated.login.challenging",
        "unauthenticated.register.idle",
        "unauthenticated.register.challenging",
      ].some(client.value.matches),

    hasErrors: !isEmpty(state.value?.context?.error),
    // ---
    isGuest: ["guest", "starting.guest"].some(state.value.matches),
    isClient: ["client", "starting.client"].some(state.value.matches),
    isAuthenticated: state.value.matches("client.idle"),
    // ---
    showReCaptcha: client.value?.matches(
      "unauthenticated.register.challenging"
    ),
    canShowForms:
      state.value?.matches("guest.idle") &&
      !client.value?.matches("unauthenticated.login") &&
      !client.value?.matches("unauthenticated.register"),

    showLoginForm: client.value?.matches("unauthenticated.login"),
    // show2fa: client.value?.matches("unauthenticated.login.challenging"),

    show2fa:
      client.value?.matches &&
      [
        "unauthenticated.login.challenging",
        "unauthenticated.login.verifying",
      ].some(client.value.matches),
    showRegisterForm: client.value?.matches("unauthenticated.register"),
    isFormLoading:
      client.value?.matches &&
      [
        "unauthenticated.login.loading",
        "unauthenticated.register.loading",
      ].some(client.value.matches),
  }));

  const user = computed(() => state.value?.context?.user);

  // --- Client
  const model = computed(() => client.value?.context?.model);
  const schema = computed(() => client.value?.context?.schema);
  const uischema = computed(() => client.value?.context?.uischema);
  // --------------------------------------------------------

  function clearErrors() {
    send({
      type: "CLEAR.ERRORS",
    });
  }

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
  function login(model) {
    send({
      type: "AUTHENTICATE",
      data: unref(model),
    });
  }

  function verify2fa({ token }) {
    send({
      type: "VERIFY",
      data: unref(token),
    });
  }

  function register(model) {
    send({
      type: "REGISTER",
      data: unref(model),
    });
  }

  function verifyReCaptcha(token) {
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

  function resolve(model) {
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
    clearErrors,
    login,
    logout,
    register,
    showLogin,
    showRegister,
    verify2fa,
    verifyReCaptcha,
  };
};
