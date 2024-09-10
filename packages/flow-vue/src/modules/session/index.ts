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
