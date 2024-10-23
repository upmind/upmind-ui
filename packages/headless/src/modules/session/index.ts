// --- external
import { interpret } from "xstate";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import sessionMachine from "./session.machine";
import { useFeedback } from "../feedback";

// --- utils
import { getTokenfromStorage } from "./utils";
// --------------------------------------------------------
// create a global instance of the session machine
// and a global object to store state
// NB dont automatically start the machine as in order for the inspector to work
// it needs to be started after the inspect service is created, so we only start it when we need it

let hasSession = false;

// @ts-ignore
const service = interpret(sessionMachine, { devTools: false });

// --------------------------------------------------------

// We have a valid AUTH session when we are logged in as a client (TODO: admin + actor)
// this will fire every time we transition to a new state
const authCallback = (callback: any) => {
  const state = service.getSnapshot();

  // callback({ type: "TRANSITIONED", data: state.value });

  // Valid session
  const clientMachine: any = state?.children?.clientMachine;
  const guestMachine: any = state?.children?.guestMachine;

  if (
    (state.matches("guest") &&
      guestMachine?.state?.matches &&
      guestMachine?.state?.matches("idle")) ||
    (state.matches("client") &&
      clientMachine?.state?.matches &&
      clientMachine?.state?.matches("idle"))
  ) {
    hasSession = true;
    callback({ type: "SESSION" });
  }

  // Authenticated if client ( eventually +admin +actor)
  if (
    hasSession &&
    state.matches("client") &&
    clientMachine?.state?.matches &&
    clientMachine?.state?.matches("idle")
  ) {
    callback({ type: "AUTHENTICATED" });
  }

  // Unauthenticated if guest
  else if (
    hasSession &&
    state.matches("guest") &&
    guestMachine?.state?.matches &&
    guestMachine?.state?.matches("loading")
  ) {
    hasSession = false;
    callback({ type: "UNAUTHENTICATED" });
  }

  return () => {
    // Any code inside here will be called when
    // you leave this state, or the machine is stopped
  };
};

// --------------------------------------------------------
// Subscriptions - these are used by the other machines to listen for changes/messages from this machine

export const authSubscription = async (callback: any, onReceive: any) => {
  // firstly, send service's current state upon subscription

  authCallback(callback);

  onReceive(() => {
    // do nothing for now
    // console.debug("authSubscription", "receivedEvent", { event });
  });

  // then listen for any changes to the client service
  // if we get a change to either authenticated or unauthenticated
  // then we need to send the callback to the subscriber
  service.onTransition(state => {
    const currentMachine =
      state?.children?.clientMachine || state?.children?.guestMachine;

    // watch for our child machines to transition to a non-loading state
    // and then send the callback to the subscriber
    // @ts-ignore
    currentMachine?.onTransition(() => {
      authCallback(callback);
    });

    // state = newState; // do we need this as we already have a state that we are updating? maybe there will be a race condition?
    authCallback(callback);
  });

  return () => {
    // The subscriber has unsubscribed from this service
    // typically when the transitioning out of the state node
    // we dont need to do anything here as we are consuming a global service
    // console.debug('clientStore', 'checkClient', 'unsubscribed');
  };
};

export const useSession = () => {
  // only create the service once

  // --------------------------------------------------------
  // methods

  async function getUser() {
    const clientMachine: any = service.getSnapshot()?.children?.clientMachine;
    await waitFor(clientMachine, state => !state.matches("loading"));
    return clientMachine.state.context.user;
  }

  async function getUserId() {
    const user = await getUser();
    return user?.id;
  }

  // --------------------------------------------------------

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

    return waitFor(clientMachine, newState =>
      newState.matches("transferring.available")
    ).then(newState => newState.context.transfer);
  }
  // --------------------------------------------------------

  return {
    service: service.start(), // allow for interpreting the machine + inspecting it
    // ---
    getSnapshot: () => service.getSnapshot(),
    getToken: () => getTokenfromStorage()?.access_token,
    // @ts-ignore
    getHistory: () => service.getSnapshot()?.context?.history,
    getUser,
    getUserId,
    authSubscription: (_context: any, _event: any) => authSubscription,
    isAuthenticated: async () => {
      const clientMachine: any = service.getSnapshot()?.children?.clientMachine;
      if (!clientMachine)
        return Promise.reject({ title: "Unauthorized", code: 401 });

      return waitFor(clientMachine, state => state.matches("idle"))
        .then(() => clientMachine.state.context.user)
        .catch(() => Promise.reject({ title: "Unauthorized", code: 401 }));
    },
    transfer,
    reauth: () => service.send({ type: "EXPIRED" }),
  };
};
