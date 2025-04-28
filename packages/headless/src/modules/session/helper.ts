// --- external
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import { useSession } from "./";

// --- types
import type { State } from "xstate";
// -----------------------------------------------------------------------------
// We have a valid AUTH session when we are logged in as a client (TODO: admin + actor)
// this will fire every time we transition to a new state
const authCallback = (
  state: State<any, any, any, any, any>,
  hasSession: boolean,
  callback: any
) => {
  // callback({ type: "TRANSITIONED", data: get(service.getSnapshot(), 'state.value }')');

  // Valid session
  const clientMachine = state?.children?.clientMachine;
  const guestMachine = state?.children?.guestMachine;

  if (["checking", "error"].some(state.matches)) {
    if (hasSession) callback({ type: "UNAUTHENTICATED" });
    // DEPRECATED:
    // we dont need to tell any machines what our error is...
    // just that we are no longer authenticated
    // callback({ type: "ERROR", data: state.context.error });
    return false;
  }

  if (
    (state.matches("guest") &&
      guestMachine?.getSnapshot()?.matches &&
      guestMachine?.getSnapshot()?.matches("available")) ||
    (state.matches("client") &&
      clientMachine?.getSnapshot()?.matches &&
      clientMachine?.getSnapshot()?.matches("available"))
  ) {
    hasSession = true;
    callback({ type: "SESSION" });
  } else {
    return false;
  }

  // Authenticated if client ( eventually +admin +actor)
  if (
    hasSession &&
    state.matches("client") &&
    clientMachine?.getSnapshot()?.matches &&
    clientMachine?.getSnapshot()?.matches("available")
  ) {
    callback({ type: "AUTHENTICATED" });
  }

  // Unauthenticated if guest
  else if (
    hasSession &&
    state.matches("guest") &&
    guestMachine?.getSnapshot()?.matches &&
    guestMachine?.getSnapshot()?.matches("loading")
  ) {
    hasSession = false;
    callback({ type: "UNAUTHENTICATED" });
  }

  return hasSession;
};

export const authSubscription = async (callback: any, onReceive: any) => {
  const { service } = useSession();
  // firstly, send service's current state upon subscription
  let hasSession = false;

  // authCallback(callback);

  onReceive(() => {
    // do nothing for now
    // console.debug("authSubscription", "receivedEvent", { event });
  });

  // then listen for any changes to the client service
  // if we get a change to either authenticated or unauthenticated
  // then we need to send the callback to the subscriber
  const subcscription = service.subscribe(state => {
    const currentMachine =
      state?.children?.clientMachine || state?.children?.guestMachine;

    // watch for our child machines to transition to a non-loading state
    // and then send the callback to the subscriber
    if (currentMachine) {
      // @ts-ignore -- this definitely works, despite typescriptm oanind onTrannsition doesnt exist
      currentMachine?.onTransition(() => {
        hasSession = authCallback(service.getSnapshot(), hasSession, callback);
      });
    }

    // state = newState; // do we need this as we already have a state that we are updating? maybe there will be a race condition?
    hasSession = authCallback(service.getSnapshot(), hasSession, callback);
  });

  return () => {
    // The subscriber has unsubscribed from this service
    // typically when the transitioning out of the state node
    subcscription.unsubscribe();
  };
};
