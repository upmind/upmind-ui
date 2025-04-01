// --- external
import { interpret, InterpreterStatus } from "xstate";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import recaptchaMachine from "./recaptcha.machine";
import { generateToken } from "./services";

// --- utils

// --- types

// -----------------------------------------------------------------------------

// create a global instance of the recaptcha machine
// NB dont automatically start the machine as in order for the inspector to work
// it needs to be started after the inspect service is created, so we only start it when we need it

const service = interpret(recaptchaMachine, { devTools: false });

async function generate(action?: string) {
  return waitFor(service, state => ["available"].some(state.matches))
    .then(() => {
      const grecaptcha = service.getSnapshot().context.grecaptcha;
      return generateToken(grecaptcha, action);
    })
    .catch(() => {
      return Promise.reject("Recaptcha not available");
    });
}

function clear() {
  service.send({ type: "CLEAR" });
}
// -----------------------------------------------------------------------------

export const useSystemRecaptcha = () => {
  return {
    service: service.start(), // allow for interpreting the machine + inspecting it
    isReady: async () => waitFor(service, state => state.matches("available")),
    // ---
    getSnapshot: service.getSnapshot,
    generate,
    clear,
    stop: () => service.status == InterpreterStatus.Running && service.stop(),
  };
};
