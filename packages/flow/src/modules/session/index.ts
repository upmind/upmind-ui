// --- external
import { interpret } from "xstate";

// --- internal
import sessionMachine from "./session.machine";
import { useClient } from "./client";
import { useGuest } from "./guest";
// --- utils
// import { set, get } from "lodash-es";

// --------------------------------------------------------
// create a global instance of the session machine
// and a global object to store state
// NB dont automatically start the machine as in order for the inspector to work
// it needs to be started after the inspect service is created, so we only start it when we need it

let state = null;

const service = interpret(sessionMachine, { devTools: true }).onTransition(
  newState => (state = newState)
);

// --------------------------------------------------------

export const useSession = () => {
  // let { subscription } = useClient();

  // --------------------------------------------------------
  // methods

  const doAuthCallback = callback => {
    if (authState.matches("authenticated")) {
      callback({ type: "VALID" });
    } else if (authState.matches("unauthenticated")) {
      callback({ type: "INVAID" });
    }
  };

  const checkAuth = (_context, _event) => async (callback, onReceive) => {
    // firstly, send service's current state upon subscription

    doAuthCallback(callback);

    // then listen for any changes to the auth service
    // if we get a change to either authenticated or unauthenticated
    // then we need to send the callback to the subscriber
    service.onTransition(newState => {
      authState = newState;
      doAuthCallback(callback);
    });

    return () => {
      // The subscriber has unsubscribed from this service
      // typically when the transitioning out of the state node
      // we dont need to do anything here as we are consuming a global service
      // console.info('authStore', 'checkAuth', 'unsubscribed');
    };
  };

  // --------------------------------------------------------

  return {
    service: service.start(), // allow for interpreting the machine + inspecting it
    state,
    // ---
    // useClient: subscription,
    // --- syntax sugar
    token: state?.context?.token?.access_token
  };
};
