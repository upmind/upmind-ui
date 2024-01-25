// --- external
import { interpret } from "xstate";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import sessionMachine from "./session.machine";

// --- utils
import { set, get, isEmpty } from "lodash-es";

// --------------------------------------------------------
// create a global instance of the session machine
// and a global object to store state
// NB dont automatically start the machine as in order for the inspector to work
// it needs to be started after the inspect service is created, so we only start it when we need it

let state = null;

const service = interpret(sessionMachine, { devTools: false }).onTransition(
  newState => (state = newState)
);

// --------------------------------------------------------

export const useSession = () => {
  // let { subscription } = useClient();

  // --------------------------------------------------------
  // methods

  // We have a valid AUTH session when we are logged in as a client (TODO: admin + actor)
  // this will fire every time we transition to a new state
  const authCallback = callback => {
    // callback({ type: "TRANSITIONED", data: state.value });

    // Valid session
    if (["client", "guest"].some(state.matches)) {
      callback({ type: "SESSION" });
    }

    // Authenticated if client ( eventually +admin +actor)
    if (["client"].some(state.matches)) {
      callback({ type: "AUTHENTICATED" });
    }

    // Unauthenticated if guest
    else if (["guest"].some(state.matches)) {
      callback({ type: "UNAUTHENTICATED" });
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
    // ---
    getSnapshot: () => state,
    getToken: () => state?.context?.token?.access_token,
    getHistory: () => state?.context?.history,
    getUser: async () => {
      if (state.matches("client.processing")) {
        await waitFor(service, state =>
          ["client.idle", "guest.idle"].some(state.matches)
        );
        // .then(() => {
        //   debugger;
        //   console.log("getUser", state.context.user);
        //   return state.context.user;
        // });
      }
      console.log("getUser", state.context.user);
      return state.context.user;
    },
    authSubscription,
    isAuthenticated: () => {
      return new Promise((resolve, reject) => {
        const authenticated = ["client"].some(state.matches);
        if (authenticated) {
          resolve(true);
        } else {
          reject(false);
        }
      });
    }
  };
};
