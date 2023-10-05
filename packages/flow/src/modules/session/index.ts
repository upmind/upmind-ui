// --- external
import { interpret } from "xstate";

// --- internal
import sessionMachine from "./session.machine";

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

  // We have a valid AUTH session when we are logged in as a client (todo: admin + actor)
  // this will fire every time we transition to a new state
  const authCallback = callback => {
    console.log("authCallback", "TRANSITIONED", state.value);

    callback({ type: "TRANSITIONED", data: state.value });

    if (["idle.client"].some(state.matches)) {
      callback({ type: "VALID" });
    } else {
      callback({ type: "INVAID" });
    }
  };

  // --------------------------------------------------------
  // Subscriptions - these are used by the other machines to listen for changes/messages from this machine

  const authSubscription =
    (_context, _event) => async (callback, onReceive) => {
      // firstly, send service's current state upon subscription

      authCallback(callback);

      // then listen for any changes to the client service
      // if we get a change to either authenticated or unauthenticated
      // then we need to send the callback to the subscriber
      service.onTransition(newState => {
        // state = newState; // do we need this as we already have a state that we are updating? maybe there will be a race condition?
        authCallback(callback);
      });

      return () => {
        // The subscriber has unsubscribed from this service
        // typically when the transitioning out of the state node
        // we dont need to do anything here as we are consuming a global service
        // console.info('clientStore', 'checkClient', 'unsubscribed');
      };
    };

  // --------------------------------------------------------

  return {
    service: service.start(), // allow for interpreting the machine + inspecting it
    state,
    authSubscription,
    // ---
    // useClient: subscription,
    // --- syntax sugar
    token: state?.context?.token?.access_token
  };
};
