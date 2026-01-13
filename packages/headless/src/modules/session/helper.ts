// --- external

// --- internal
import { useSession } from "./";

// --- utils
import { isEmpty } from "lodash-es";

// --- types
import type { State } from "xstate";
import { getTokenFromStorage } from "./utils";
import { stateMatches } from "../../utils";
// -----------------------------------------------------------------------------
// We have a valid AUTH session when we are logged in as a client (TODO: admin + actor)
// this will fire every time we transition to a new state
const authCallback = (
  state: State<any, any, any, any, any>,
  hasSession: boolean,
  callback: any
) => {
  // Valid session
  const clientMachine = state?.children?.clientMachine;
  const guestMachine = state?.children?.guestMachine;
  const currentMachine =
    state?.children?.clientMachine || state?.children?.guestMachine;

  // If session expired, unauthenticate immediately
  if (stateMatches(state, ["expired"])) {
    callback({ type: "UNAUTHENTICATED" });
    return false;
  }

  // If we have an error and we have a session, unauthenticate
  if (stateMatches(state, ["checking", "error"])) {
    if (hasSession) {
      callback({ type: "UNAUTHENTICATED" });
    }
    return false;
  }

  // If  we were logged in, ie a client, but now complete or done, unauthenticate
  if (
    state.matches("client") &&
    stateMatches(currentMachine, ["complete", "done"])
  ) {
    if (hasSession) {
      callback({ type: "UNAUTHENTICATED" });
    }
    return false;
  }

  // We have a session IF we have an access token regardless of being in guest or client mode
  if (stateMatches(currentMachine, ["available"]) && !hasSession) {
    hasSession = !isEmpty(getTokenFromStorage());
    if (hasSession) callback({ type: "SESSION" });
  } else {
    return false;
  }

  // Authenticated if client is available
  // > indicates we are logged in and have a valid access token
  if (
    hasSession &&
    state.matches("client") &&
    stateMatches(clientMachine, "available")
  ) {
    callback({ type: "AUTHENTICATED" });
  }

  // Unauthenticated if guest loading
  // > indicates we are not logged in and are generating a guest token
  else if (
    hasSession &&
    state.matches("guest") &&
    stateMatches(guestMachine, "loading")
  ) {
    hasSession = false;
    callback({ type: "UNAUTHENTICATED" });
  }

  return hasSession;
};

export const authSubscription = async (callback: any, onReceive: any) => {
  const { subscribe } = useSession();
  // firstly, send service's current state upon subscription
  let hasSession = false;

  // authCallback(callback);

  onReceive((event: any) => {
    // do nothing for now
    // console.debug("authSubscription", "receivedEvent", { event });
  });

  // then listen for any changes to the client service
  // if we get a change to either authenticated or unauthenticated
  // then we need to send the callback to the subscriber
  const subcscription = subscribe(state => {
    if (state.done) return; // service has stopped so exit

    const currentMachine =
      state?.children?.clientMachine || state?.children?.guestMachine;

    // watch for our child machines to transition to a non-loading state
    // and then send the callback to the subscriber
    if (currentMachine) {
      // @ts-ignore -- this definitely works, despite typescriptm oanind onTrannsition doesnt exist
      currentMachine?.onTransition(() => {
        hasSession = authCallback(state, hasSession, callback);
      });
    }

    // state = newState; // do we need this as we already have a state that we are updating? maybe there will be a race condition?
    hasSession = authCallback(state, hasSession, callback);
  });

  return () => {
    // The subscriber has unsubscribed from this service
    // typically when the transitioning out of the state node
    subcscription.unsubscribe();
  };
};
