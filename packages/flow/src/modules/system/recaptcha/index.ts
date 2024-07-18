// --- external
import { interpret } from "xstate";

// --- internal
import recaptchaMachine from "./recaptcha.machine";

// --- utils

// --- types

// --------------------------------------------------------
// create a global instance of the recaptcha machine
// NB dont automatically start the machine as in order for the inspector to work
// it needs to be started after the inspect service is created, so we only start it when we need it

const service = interpret(recaptchaMachine, { devTools: true });

export const useSystemRecaptcha = () => {
  return {
    service: service.start(), // allow for interpreting the machine + inspecting it
    // ---
    getSnapshot: service.getSnapshot,
    destroy: () => service.stop(),
  };
};
