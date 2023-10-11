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
  const client = ref();
  const guest = ref();
  service.onTransition(newState => {
    if (newState.children?.client) {
      newState.children.client.onTransition(
        clientState => (client.value = clientState)
      );
    } else {
      client.value = null;
    }

    if (newState.children?.guest) {
      newState.children.guest.onTransition(
        guestState => (guest.value = guestState)
      );
    } else {
      guest.value = null;
    }
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
      type: "CREATE",
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

  // --------------------------------------------------------

  return {
    send,
    state: computed(() => state.value.value),
    values: computed(() => state.value.context),
    // ---
    isLoading: computed(() => ["starting"].some(state.value.matches)),
    isProcessing: computed(
      () =>
        ![
          "unauthenticated.idle",
          "unauthenticated.login.idle",
          "unauthenticated.login.challenging",
          "unauthenticated.register.idle",
          "unauthenticated.register.challenging"
        ].some(client.value.matches)
    ),
    // --- Guest
    // --- Client
    client,
    isAuthenticated: computed(() => ["idle.client"].some(state.value.matches)),
    isClient: computed(() =>
      ["idle.client", "starting.client"].some(state.value.matches)
    ),
    showLoginForm: computed(
      () => client.value?.matches("unauthenticated.login")
    ),
    show2fa: computed(
      () => client.value?.matches("unauthenticated.login.challenging")
    ),
    // ---
    showRegisterForm: computed(
      () => client.value?.matches("unauthenticated.register")
    ),
    showReCaptcha: computed(
      () => client.value?.matches("unauthenticated.register.challenging")
    ),

    // ---
    hasError: computed(() =>
      ["starting.status.error"].some(state.value.matches)
    ),
    // ---
    showLogin,
    showRegister,
    login,
    verify2fa,
    register,
    verifyReCaptcha,
    logout,
    cancel
  };
};
