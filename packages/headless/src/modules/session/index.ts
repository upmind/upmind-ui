// --- external
import { interpret } from "xstate";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import sessionMachine from "./session.machine";
import { useFeedback } from "../feedback";
export * from "./useTransfer";

// --- utils
import { get, isEmpty, has } from "lodash-es";
import { getTokenFromStorage } from "./utils";
import { DetailedError, responseCodes } from "../../utils";

// ---types
import type { ActorRef } from "xstate";
import type { IAuthTransfer, SessionTransfer, User } from "./types";
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

  async function getUser(): Promise<User> {
    const clientMachine: any = service.getSnapshot()?.children?.clientMachine;
    return waitFor(clientMachine, state => !state.matches("loading"), {
      timeout: 60_000,
    })
      .then(state => {
        const user = get(state, "context.user");
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

  async function getUserId(): Promise<string | undefined> {
    const user = await getUser();
    return user?.id;
  }

  // ---
  async function showLogin(): Promise<boolean> {
    service.send({
      type: "LOGIN",
    });
    const guestMachine = get(service.getSnapshot(), "children.guestMachine");

    return await waitFor(
      guestMachine,
      state => ["available.login"].some(state.matches),
      { timeout: 60000 }
    )
      .then(() => true)
      .catch(() => false);
  }

  async function showRegister(): Promise<boolean> {
    service.send({
      type: "REGISTER",
    });
    const guestMachine = get(service.getSnapshot(), "children.guestMachine");

    return await waitFor(
      guestMachine,
      state => ["available.register"].some(state.matches),
      { timeout: 60000 }
    )
      .then(() => true)
      .catch(() => false);
  }

  async function showRecoverPassword(): Promise<boolean> {
    service.send({
      type: "RECOVER",
    });
    const guestMachine = get(service.getSnapshot(), "children.guestMachine");

    return await waitFor(
      guestMachine,
      state => ["available.recover"].some(state.matches),
      { timeout: 60000 }
    )
      .then(() => true)
      .catch(() => false);
  }

  // ---
  async function login(model: any): Promise<boolean> {
    service.send({
      type: "AUTHENTICATE",
      data: get(model, "value", model), // ensure we dont have any reactive refs
    });
    const guestMachine = get(service.getSnapshot(), "children.guestMachine");

    return await waitFor(
      guestMachine,
      state => ["complete", "available.login.error"].some(state.matches),
      {
        timeout: 60000,
      }
    )
      .then(state => {
        if (state.matches("available.login.error")) {
          return false;
        }
        return true;
      })
      .catch(() => false);
  }

  async function verify2fa({ token }: { token: string }): Promise<any> {
    const guestMachine = get(service.getSnapshot(), "children.guestMachine");
    if (!guestMachine) return true; // already logged in

    service.send({
      type: "VERIFY",
      data: get(token, "value", token), // ensure we dont have any reactive refs
    });

    return await waitFor(
      guestMachine,
      state => ["complete", "available.login.error"].some(state.matches),
      {
        timeout: 60000,
      }
    )
      .then(state => {
        if (state.matches("available.login.error")) {
          return false;
        }
        return true;
      })
      .catch(() => false);
  }

  async function register(model: any): Promise<boolean> {
    const guestMachine = get(service.getSnapshot(), "children.guestMachine");
    if (!guestMachine) return true; // already logged in

    service.send({
      type: "REGISTER",
      data: get(model, "value", model), // ensure we dont have any reactive refs
    });

    return await waitFor(
      guestMachine,
      state => ["complete", "available.register.error"].some(state.matches),
      {
        timeout: 60000,
      }
    )
      .then(state => {
        if (state.matches("available.register.error")) {
          return false;
        }
        return true;
      })
      .catch(() => false);
  }

  async function recover(model: any): Promise<boolean> {
    const guestMachine = get(service.getSnapshot(), "children.guestMachine");
    if (!guestMachine) return true; // we're already logged in

    service.send({
      type: "RECOVER",
      data: get(model, "value", model), // ensure we don't have any reactive refs
    });

    return await waitFor(
      guestMachine,
      state =>
        ["available.recover.complete", "available.recover.error"].some(
          state.matches
        ),
      { timeout: 60_000 }
    )
      .then(state => {
        if (state.matches("available.recover.error")) {
          return false;
        }
        return true;
      })
      .catch(() => false);
  }

  async function logout(): Promise<boolean> {
    const clientMachine = get(service.getSnapshot(), "children.clientMachine");
    if (!clientMachine) return true; // were already logged out

    service.send({
      type: "LOGOUT",
    });

    return await waitFor(
      clientMachine,
      state => ["complete"].some(state.matches),
      {
        timeout: 60000,
      }
    )
      .then(() => true)
      .catch(() => false);
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
    isAuthenticated: async (): Promise<User> =>
      isReady()
        .then(() => {
          const clientMachine: any =
            service.getSnapshot()?.children?.clientMachine;

          if (!clientMachine) throw new Error("Not authenticated");

          return waitFor(clientMachine, state => state.matches("available"), {
            timeout: 60_000,
          }).then(() => clientMachine.state.context.user);
        })
        .catch(() =>
          Promise.reject(
            new DetailedError("Unauthorized", responseCodes.Unauthorized)
          )
        ),
    /**
     *This indicates that there is no active session
     * @returns {boolean} true if the session has expired/ended
     */
    hasExpired: (): boolean => {
      const state = service.getSnapshot();
      return state.matches("expired") || isEmpty(state.children);
    },
    // ---
    showLogin,
    showRegister,
    showRecoverPassword,
    login,
    recover,
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
