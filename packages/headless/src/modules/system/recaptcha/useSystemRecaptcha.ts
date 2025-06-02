// --- external
import { interpret, InterpreterStatus } from "xstate";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import recaptchaMachine from "./recaptcha.machine";

// --- utils
import { DetailedError, responseCodes, stopService } from "../../../utils";

// --- types
import type { InterpreterFrom } from "xstate";

// -----------------------------------------------------------------------------

// create a global instance of the recaptcha machine
// NB dont automatically start the machine as in order for the inspector to work
// it needs to be started after the inspect service is created, so we only start it when we need it

let service = interpret(recaptchaMachine, { devTools: false });

async function init(siteKey: string) {
  if (service.status === InterpreterStatus.NotStarted) {
    service.start();
  }

  service.send({ type: "SET_SITE_KEY", siteKey });
}
async function generate(action?: string) {
  return waitFor(service, state => ["available"].some(state.matches))
    .then(() => {
      service.send({ type: "GENERATE_TOKEN", data: { action } });
      return waitFor(service, state =>
        state.matches("available.processed")
      ).then(() => {
        const token = service.getSnapshot().context?.token;
        const error = service.getSnapshot().context?.error;
        if (!token) {
          return Promise.reject(
            new DetailedError(
              "Recaptcha token not set",
              responseCodes.Not_Found,
              error
            )
          );
        }
        return token;
      });
    })
    .catch(() => {
      return Promise.reject(new Error("Recaptcha not available"));
    });
}

function clear() {
  service.send({ type: "CLEAR" });
}
// -----------------------------------------------------------------------------

export const useSystemRecaptcha = () => {
  return {
    service, // allow for interpreting the machine + inspecting it
    init,
    isReady: async () =>
      waitFor(service, state => state.matches("available"), {
        timeout: 60_000,
      }),
    // ---
    getSnapshot: service.getSnapshot,
    generate,
    clear,
    stop: () => stopService(service as InterpreterFrom<any>),
  };
};
