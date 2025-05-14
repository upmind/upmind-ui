// --- external
import { interpret } from "xstate";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import sessionMachine from "./session.machine";
import { useFeedback } from "../feedback";

// --- utils
import { get, isEmpty } from "lodash-es";
import { getTokenFromStorage } from "./utils";
import { DetailedError, responseCodes } from "../../utils";

// ---types
import type { ActorRef } from "xstate";
import type { IAuthTransfer, SessionTransfer } from "./types";
export type { User, SessionTransfer, IAuthTransfer } from "./types";

// -----------------------------------------------------------------------------

// create a global instance of the session machine
// and a global object to store state
// NB dont automatically start the machine as in order for the inspector to work
// it needs to be started after the inspect service is created, so we only start it when we need it

const service = interpret(sessionMachine, { devTools: false });

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
    })
      .then(state => {
        const user = get(state, "context.user");
        if (!user) return Promise.reject({ title: "Unauthorized", code: 401 });
        return user;
      })
      .catch(() => {
        throw new DetailedError(
          "[headless] getUser on useSession timed out",
          responseCodes.Timeout
        );
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
    ).catch(() => {
      throw new DetailedError(
        "[headless] showLogin on useSession timed out",
        responseCodes.Timeout
      );
    });
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
    ).catch(() => {
      throw new DetailedError(
        "[headless] showRegister on useSession timed out",
        responseCodes.Timeout
      );
    });
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
    }).catch(() => {
      throw new DetailedError(
        "[headless] login on useSession timed out",
        responseCodes.Timeout
      );
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
    }).catch(() => {
      throw new DetailedError(
        "[headless] verify2fa on useSession timed out",
        responseCodes.Timeout
      );
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
    }).catch(() => {
      throw new DetailedError(
        "[headless] register on useSession timed out",
        responseCodes.Timeout
      );
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
    }).catch(() => {
      throw new DetailedError(
        "[headless] logout on useSession timed out",
        responseCodes.Timeout
      );
    });
  }

  async function transferTo(): Promise<IAuthTransfer> {
    const state = service.getSnapshot();
    const clientMachine = state?.children?.clientMachine;

    if (!clientMachine) {
      const { addError } = useFeedback();
      addError({ title: "Transfer not available" });
      return Promise.reject(new Error("Transfer not available"));
    }

    service.send({
      type: "TRANSFER_TO",
    });

    return waitFor(
      clientMachine,
      newState => newState.matches("transferring.available"),
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
      newState => newState.matches("transferring.processed"),
      { timeout: 60_000 }
    )
      .then(newState => {
        const transfer = newState.context.transfer;
        if (!transfer) {
          return Promise.reject(
            new DetailedError(
              "Transfer not available",
              responseCodes.No_Content
            )
          );
        }
        return transfer;
      })
      .catch(() => {
        throw new DetailedError(
          "[headless] TransferFrom on useSession timed out",
          responseCodes.Timeout
        );
      });
  }

  function transferred() {
    service.send({ type: "TRANSFERRED" });
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
    transferTo,
    transferFrom,
    transferred,
    getTransferDetails: () => {
      const state = service.getSnapshot();
      return state.context?.transfer;
    },
    reauth: () => service.send({ type: "EXPIRED" }),
  };
};
