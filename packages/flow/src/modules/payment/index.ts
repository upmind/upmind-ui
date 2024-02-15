// --- external
import { interpret } from "xstate";

// --- internal
import paymentMachine from "./payment.machine";

// --- utils

// --------------------------------------------------------
// create a global instance of the payment machine
// and a global object to store state
// NB dont automatically start the machine as in order for the inspector to work
// it needs to be started after the inspect service is created, so we only start it when we need it

let state = null;

const service = interpret(paymentMachine, { devTools: true }).onTransition(
  newState => (state = newState)
);

// --------------------------------------------------------

export const useBasket = () => {
  // --------------------------------------------------------
  // methods

  // --------------------------------------------------------

  return {
    service: service.start(),
    // ---
    getSnapshot: () => state
  };
};
