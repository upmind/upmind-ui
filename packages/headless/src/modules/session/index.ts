// --- external
import { interpret } from "xstate";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import sessionMachine from "./session.machine";
import { useFeedback } from "../feedback";

// --- utils
import { getTokenFromStorage } from "./utils";
import { get, isEmpty } from "lodash-es";

// ---types
import type { ActorRef } from "xstate";
export type { User } from "./types";
// -----------------------------------------------------------------------------

// create a global instance of the session machine
// and a global object to store state
// NB dont automatically start the machine as in order for the inspector to work
// it needs to be started after the inspect service is created, so we only start it when we need it

const service = interpret(sessionMachine, { devTools: true });

// -----------------------------------------------------------------------------

export const useSession = () => {
  // only create the service once

  async function isReady() {
    return waitFor(
      service,
      state => {
        const currentmachine: ActorRef<any> | undefined =
          service.getSnapshot()?.children?.clientMachine ??
          service.getSnapshot()?.children?.guestMachine;

        const valid =
          currentmachine?.getSnapshot()?.matches("available") ||
          state.matches("error");

        return valid;
      },
      {
        timeout: Infinity, // infinity = no timeout
      }
    ).then(state => {
      if (state.matches("error")) {
        return Promise.reject(state.context.error);
      }
    });
  }

  // ---  // methods

  async function getUser() {
    const clientMachine: any = service.getSnapshot()?.children?.clientMachine;
    return waitFor(clientMachine, state => !state.matches("loading"), {
      timeout: 60_000,
    }).then(state => {
      const user = get(state, "context.user");
      if (!user) return Promise.reject({ title: "Unauthorized", code: 401 });
      return user;
    });
  }

  async function getUserId() {
    const user = await getUser();
    return user?.id;
  }

  // ---
  function showLogin(): Promise<any> {
    service.send({
      type: "LOGIN",
    });
    const guestMachine = get(service.getSnapshot(), "children.guestMachine");
    return waitFor(
      guestMachine,
      state => ["available.login"].some(state.matches),
      { timeout: 60_000 }
    );
  }

  function showRegister(): Promise<any> {
    service.send({
      type: "REGISTER",
    });
    const guestMachine = get(service.getSnapshot(), "children.guestMachine");
    return waitFor(
      guestMachine,
      state => ["available.register"].some(state.matches),
      { timeout: 60_000 }
    );
  }

  // ---
  function login(model: any): Promise<any> {
    service.send({
      type: "AUTHENTICATE",
      data: get(model, "value", model), // ensure we dont have any reactive refs
    });
    const guestMachine = get(service.getSnapshot(), "children.guestMachine");
    return waitFor(guestMachine, state => ["complete"].some(state.matches), {
      timeout: 60_000,
    });
  }

  function verify2fa({ token }: { token: string }): Promise<any> {
    const guestMachine = get(service.getSnapshot(), "children.guestMachine");
    if (!guestMachine) return Promise.resolve(); // were already logged in

    service.send({
      type: "VERIFY",
      data: get(token, "value", token), // ensure we dont have any reactive refs
    });
    return waitFor(guestMachine, state => ["complete"].some(state.matches), {
      timeout: 60_000,
    });
  }

  function register(model: any): Promise<any> {
    const guestMachine = get(service.getSnapshot(), "children.guestMachine");
    if (!guestMachine) return Promise.resolve(); // were already logged in

    service.send({
      type: "REGISTER",
      data: get(model, "value", model), // ensure we dont have any reactive refs
    });
    return waitFor(guestMachine, state => ["complete"].some(state.matches), {
      timeout: 60_000,
    });
  }

  function logout(): Promise<any> {
    const clientMachine = get(service.getSnapshot(), "children.clientMachine");
    if (!clientMachine) return Promise.resolve(); // were already logged out

    service.send({
      type: "LOGOUT",
    });
    return waitFor(clientMachine, state => ["complete"].some(state.matches), {
      timeout: 60_000,
    });
  }

  async function transfer() {
    const state = service.getSnapshot();
    const clientMachine = state?.children?.clientMachine;

    if (!clientMachine) {
      const { addError } = useFeedback();
      addError({ title: "Transfer not available" });
      return Promise.reject("Transfer not available");
    }

    service.send({
      type: "TRANSFER",
    });

    return waitFor(
      clientMachine,
      newState => newState.matches("transferring.available"),
      { timeout: 60_000 }
    ).then(newState => newState.context.transfer);
  }

  // ---------------------------------------------------------------------------
  return {
    service: service.start(), // allow for interpreting the machine + inspecting it

    isReady,
    // ---
    getSnapshot: () => service.getSnapshot(),
    getToken: () => getTokenFromStorage()?.access_token,
    getHistory: () => service.getSnapshot()?.context?.history,
    getUser,
    getUserId,
    isAuthenticated: async () => {
      return isReady().then(() => {
        const clientMachine: any =
          service.getSnapshot()?.children?.clientMachine;

        if (!clientMachine)
          return Promise.reject({ title: "Unauthorized", code: 401 });

        return waitFor(clientMachine, state => state.matches("available"), {
          timeout: 60_000,
        })
          .then(() => clientMachine.state.context.user)
          .catch(() => Promise.reject({ title: "Unauthorized", code: 401 }));
      });
    },

    /**
     *This indicaes that there is no active session
     * @returns {boolean} true if the session has expired/ended
     */
    hasExpired: (): boolean => {
      const state = service.getSnapshot();
      return state.matches("expired") || isEmpty(state.children);
    },
    // ---
    showLogin,
    showRegister,
    login,
    register,
    verify2fa,
    logout,
    transfer,
    reauth: () => service.send({ type: "EXPIRED" }),
  };
};
