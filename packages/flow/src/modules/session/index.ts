// --- external
import { interpret } from "xstate";
// import { waitFor } from "xstate/lib/waitFor";

// --- internal
import sessionMachine from "./session.machine";

// --- utils
// import { set, get } from "lodash-es";

// --------------------------------------------------------
// create a global instance of the session machine
// and a global object to store currentState
// NB dont automatically start the machine as in order for the inspector to work
// it needs to be started after the inspect service is created, so we only start it when we need it

let currentState = null;

const service = interpret(sessionMachine, { devTools: true }).onTransition(
  state => {
    currentState = state;
  }
);
// --------------------------------------------------------

export const useSession = () => {
  // --------------------------------------------------------
  // methods

  // --------------------------------------------------------

  return {
    service: service.start() // allow for interpreting the machine + inspecting it
    // ---
  };
};
