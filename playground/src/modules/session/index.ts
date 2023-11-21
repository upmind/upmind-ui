// --- external
import { computed, ref, unref } from "vue";
import { useActor } from "@xstate/vue";

// --- internal
import { useSession as useUpmindSession } from "@upmind/flow";

// --- utils

// --------------------------------------------------------
// a composable that provides a simple interface to the api requests machine
//  with some state helpers

export const useSession = () => {
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

  function cancel() {
    send({
      type: "CANCEL"
    });
  }

  function showLogin() {
    send({
      type: "LOGIN"
    });
  }

  function showRegister() {
    send({
      type: "REGISTER"
    });
  }

  function login(model) {
    send({
      type: "AUTHENTICATE",
      data: unref(model)
    });
  }

  function verify2fa(token) {
    send({
      type: "VERIFY",
      data: unref(token)
    });
  }

  function register(model) {
    send({
      type: "REGISTER",
      data: unref(model)
    });
  }

  function verifyReCaptcha(token) {
    send({
      type: "VERIFY",
      data: unref(token)
    });
  }

  function logout() {
    send({
      type: "LOGOUT"
    });
  }

  function getUser() {
    send({
      type: "SELF"
    });
  }
  // --------------------------------------------------------

  return {
    send,
    state: computed(() => state.value.value),
    context: computed(() => state.value.context),
    errors: computed(() => state.value.context?.error),
    //messages: computed(() => state.value.context?.messages),
    // ---
    meta: computed(() => ({
      isLoading: ["starting"].some(state.value.matches),
      isProcessing:
        client.value?.matches &&
        ![
          "unauthenticated.idle",
          "unauthenticated.login.idle",
          "unauthenticated.login.challenging",
          "unauthenticated.register.idle",
          "unauthenticated.register.challenging"
        ].some(client.value.matches),

      hasErrors: ["starting.status.error"].some(state.value.matches),
      // ---
      isGuest: ["guest", "starting.guest"].some(state.value.matches),
      isClient: ["client", "starting.client"].some(state.value.matches),
      isAuthenticated: ["client"].some(state.value.matches),
      // ---
      showReCaptcha: client.value?.matches(
        "unauthenticated.register.challenging"
      ),
      showLoginForm: client.value?.matches("unauthenticated.login"),
      // show2fa: client.value?.matches("unauthenticated.login.challenging"),

      show2fa:
        client.value?.matches &&
        [
          "unauthenticated.login.challenging",
          "unauthenticated.login.verifying"
        ].some(client.value.matches),
      showRegisterForm: client.value?.matches("unauthenticated.register"),
      isLoadingRegisterForm: client.value?.matches(
        "unauthenticated.register.loading"
      )
    })),
    // --- Guest
    guest,
    // --- Client
    client,
    registerFormCustomFields: computed(
      () => client.value?.context?.customFields
    ),
    // ---
    showLogin,
    showRegister,
    login,
    verify2fa,
    register,
    verifyReCaptcha,
    logout,
    cancel,
    getUser
  };
};
