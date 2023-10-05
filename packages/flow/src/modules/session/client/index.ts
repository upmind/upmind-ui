// --- external
import { interpret } from "xstate";

// --- internal
import clientMachine from "./client.machine";

// --- utils
// import { set, get } from "lodash-es";

// --------------------------------------------------------
// create a global instance of the client machine
// and a global object to store state
// NB dont automatically start the machine as in order for the inspector to work
// it needs to be started after the inspect service is created, so we only start it when we need it

let state = null;

const service = interpret(clientMachine, { devTools: false }).onTransition(
  newState => (state = newState)
);

// --------------------------------------------------------

export const useClient = () => {
  // --------------------------------------------------------
  // methods

  // const doCallback = callback => {
  //   if (state.matches("authenticated")) {
  //     callback({ type: "VALID" });
  //   } else if (state.matches("unauthenticated")) {
  //     callback({ type: "INVAID" });
  //   }
  // };

  // const subscription = (_context, _event) => async (callback, onReceive) => {
  //   // firstly, send service's current state upon subscription

  //   doCallback(callback);

  //   // then listen for any changes to the client service
  //   // if we get a change to either authenticated or unauthenticated
  //   // then we need to send the callback to the subscriber
  //   service.onTransition(newState => {
  //     // state = newState; // do we need this as we already have a state that we are updating? maybe there will be a race condition?
  //     doCallback(callback);
  //   });

  //   return () => {
  //     // The subscriber has unsubscribed from this service
  //     // typically when the transitioning out of the state node
  //     // we dont need to do anything here as we are consuming a global service
  //     // console.info('clientStore', 'checkClient', 'unsubscribed');
  //   };
  // };

  // --------------------------------------------------------

  return {
    service: service.start(), // allow for interpreting the machine + inspecting it
    state
    // ---
    // subscription
  };
};
