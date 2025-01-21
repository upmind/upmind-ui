// --- external
import { computed, unref, watch, toRaw } from "vue";
import { useActor } from "@xstate/vue";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import { useSession as useUpmindSession } from "@upmind-automation/headless";

// --- utils
import { isFunction } from "lodash-es";

import type { IUseSession, IUseSessionMeta } from "./types";

/**
 * Composable function to manage session-related logic using Vue.
 * It provides state, context and helpers for session, login and registration processes.
 *
 * @param {Function} [inspector] - Optional function that can inspect the session's state and context changes.
 */
export const useSession = (inspector?: Function): IUseSession => {
  const {
    service,
    showRegister,
    showLogin,
    login,
    register,
    verify2fa,
    verifyReCaptcha,
    logout,
    transfer,
  } = useUpmindSession();
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
  const meta = computed(
    (): IUseSessionMeta => ({
      isLoading:
        state.value.matches("checking") ||
        (guest.value?.matches &&
          ["loading", "login.loading", "register.loading"].some(
            guest.value.matches
          )) ||
        client.value?.matches("loading") ||
        false,

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
    })
  );

  const user = computed(() => client.value?.context?.user);

  // ---
  const model = computed(() => guest.value?.context?.model);
  const schema = computed(() => guest.value?.context?.schema);
  const uischema = computed(() => guest.value?.context?.uischema);
  const errors = computed(() => guest.value?.context?.error);

  // --------------------------------------------------------

  // ---

  function resolve(model: any): Promise<any> {
    if (meta.value.showLoginForm && !meta.value.show2fa) return login(model);
    if (meta.value.show2fa) return verify2fa(model);
    if (meta.value.showRegisterForm) return register(model);

    return Promise.reject();
  }

  function reject(): Promise<any> {
    send({
      type: "CANCEL",
    });
    const guestMachine = state.value?.children?.guestMachine;
    return waitFor(guestMachine, state => ["available"].some(state.matches));
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
