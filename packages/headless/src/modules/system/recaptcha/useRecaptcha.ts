// --- external
import { computed } from "vue";
import { useActor } from "@xstate/vue";
import { interpret, InterpreterStatus } from "xstate";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import recaptchaMachine from "./recaptcha.machine";

// --- utils
import {
  DetailedError,
  responseCodes,
  stopService,
  useContext,
  stateMatches,
  contextMatches
} from "../../../utils";

// --- types
import type { InterpreterFrom } from "xstate";
import { QueryResponseError } from "../../query";
import { RecaptchaContext } from "./types";

// -----------------------------------------------------------------------------

// create a global instance of the recaptcha machine
// NB dont automatically start the machine as in order for the inspector to work
// it needs to be started after the inspect service is created, so we only start it when we need it

let service = interpret(recaptchaMachine, { devTools: false });

// -----------------------------------------------------------------------------

export const useRecaptcha = () => {
  // --- state
  const { state } = useActor(service);

  async function init(siteKey: string) {
    if (service.status === InterpreterStatus.NotStarted) {
      service.start();
    }

    service.send({ type: "SET_SITE_KEY", siteKey });
  }

  async function isReady(): Promise<boolean> {
    return waitFor(service, state => state.matches("available"), {
      timeout: 60_000
    })
      .then(() => true)
      .catch(() => false);
  }

  const meta = computed(() => ({
    isInitialised: !stateMatches(state, "subscribing"),
    isLoading: stateMatches(state, ["subscribing", "loading"]),
    isAvailable: stateMatches(state, "available"),
    isProcessing: stateMatches(state, "available.processing"),
    hasErrors: stateMatches(state, "available.error"),
    hasToken:
      stateMatches(state, "available.processed") &&
      contextMatches(state, "token")
  }));

  // --- context

  const context = useContext<RecaptchaContext>(state);

  const token = useContext<string | undefined>(state, "token");

  const created = useContext<string | undefined>(state, "created");

  const errors = useContext<QueryResponseError>(state, "error");

  // --- methods

  async function generate(action?: string) {
    return waitFor(service, state => ["available"].some(state.matches))
      .then(() => {
        service.send({ type: "GENERATE_TOKEN", data: { action } });
        return waitFor(service, state =>
          state.matches("available.processed")
        ).then(() => {
          if (!token) {
            return Promise.reject(
              new DetailedError(
                "Recaptcha token not set",
                responseCodes.Not_Found,
                errors.value
              )
            );
          }
          return token.value;
        });
      })
      .catch(() => {
        return Promise.reject(
          new DetailedError(
            "Recaptcha not available",
            responseCodes.Service_Unavailable,
            errors.value
          )
        );
      });
  }

  function clear() {
    service.send({ type: "CLEAR" });
  }

  // ---------------------------------------------------------------------------

  return {
    // --- state

    /**
     * Initializes the recaptcha service with the provided site key.
     * @param {string} siteKey - The recaptcha site key.
     * @returns {Promise<void>} Resolves when the service is started and site key is set.
     */
    init,

    /**
     * Checks if the recaptcha service is ready.
     * @returns {Promise<boolean>} Resolves true if the service is available, throws otherwise.
     */
    isReady,

    /**
     * Meta information about the recaptcha state.
     * @typedef {Object} RecaptchaMeta
     * @property {boolean} isInitialised - Indicates if recaptcha is initialised.
     * @property {boolean} isLoading - Indicates if recaptcha is loading.
     * @property {boolean} isAvailable - Indicates if recaptcha is available.
     * @property {boolean} isProcessing - Indicates if recaptcha is processing.
     * @property {boolean} hasErrors - Indicates if there are errors in recaptcha.
     * @property {boolean} hasToken - Indicates if a recaptcha token is present.
     */
    meta,

    //  --- context
    /**
     * Computed property to the recaptcha's state machine context, containing fetched data.
     */
    context,

    /**
     * The current recaptcha token.
     */
    token,

    /**
     * The creation date of the current recaptcha token.
     */
    created,

    /**
     * Any errors from the recaptcha state machine.
     */
    errors,

    // --- methods
    /**
     * Generates a recaptcha token for the given action.
     * @param {string} [action] - Optional action for recaptcha.
     * @returns {Promise<string>} Resolves with the recaptcha token.
     */
    generate,

    /**
     * Clears the recaptcha state.
     */
    clear,

    /**
     * Stops the recaptcha service.
     */
    stop: () => stopService(service as InterpreterFrom<any>)
  };
};

/**
 * The return type of useSystem composable.
 */
export type useRecaptcha = ReturnType<typeof useRecaptcha>;
