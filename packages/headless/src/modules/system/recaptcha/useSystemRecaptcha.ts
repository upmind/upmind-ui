// --- external
import { computed } from "vue";
import { useActor } from "@xstate/vue";
import { interpret, InterpreterStatus } from "xstate";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import recaptchaMachine from "./recaptcha.machine";

// --- utils
import { isEmpty } from "lodash-es";
import { DetailedError, responseCodes, stopService } from "../../../utils";

// --- types
import type { InterpreterFrom } from "xstate";
import { useSystemI18n } from "../i18n/useSystemI18n";

// -----------------------------------------------------------------------------

// --- state
let service = interpret(recaptchaMachine, { devTools: false });

// -----------------------------------------------------------------------------

export const useSystemRecaptcha = () => {
  // --- state
  const { state: actorState } = useActor(service);

  async function init(siteKey: string): Promise<void> {
    if (service.status === InterpreterStatus.NotStarted) {
      service.start();
    }
    service.send({ type: "SET_SITE_KEY", siteKey });
  }

  async function isReady(): Promise<boolean> {
    try {
      await waitFor(service, state => state.matches("available"), {
        timeout: 60_000,
      });
      return true;
    } catch (err) {
      throw new DetailedError(
        "Recaptcha service not ready",
        responseCodes.Timeout,
        err
      );
    }
  }

  const meta = computed(() => ({
    isInitialised: !actorState.value.matches("subscribing"),
    isLoading: ["subscribing", "loading"].some(actorState.value.matches),
    isAvailable: actorState.value.matches("available"),
    isProcessing: ["available.processing"].some(actorState.value.matches),
    hasErrors: actorState.value.matches("available.error"),
    hasToken:
      actorState.value.matches("available.processed") &&
      !isEmpty(actorState.value.context?.token),
    /**
     * True if the recaptcha service is available (async check).
     * @returns {Promise<boolean>}
     */
    isReady: isReady,
  }));

  // --- context
  const state = computed(() => actorState.value.value);

  const token = computed(() => actorState.value.context.token);

  const created = computed(() =>
    actorState.value.context?.created
      ? new Date(`${actorState.value.context.created} Z`)
      : null
  );

  const errors = computed(() => actorState.value.context?.error);

  // --- methods
  async function clear(): Promise<void> {
    service.send({ type: "CLEAR" });
  }

  async function generate(action?: string): Promise<string> {
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
      .catch(err => {
        throw new DetailedError(
          "Recaptcha not available",
          responseCodes.Not_Found,
          err
        );
      });
  }

  async function stop(): Promise<void> {
    stopService(service as InterpreterFrom<any>);
  }

  // -----------------------------------------------------------------------------

  return {
    // --- state
    /**
     * The creation date of the current recaptcha token.
     */
    created,

    /** Any errors from the recaptcha state machine. */
    errors,

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
     * Computed meta information about the recaptcha state (errors, loading, etc).
     * @property {boolean} isReady - True if the recaptcha service is available.
     */
    meta,

    /** The current recaptcha state value. */
    state,

    /** The current recaptcha token. */
    token,

    // --- methods
    /** Clears the recaptcha state. */
    clear,

    /**
     * Generates a recaptcha token for the given action.
     * @param {string} [action] - Optional action for recaptcha.
     * @returns {Promise<string>} Resolves with the recaptcha token.
     */
    generate,

    /** Stops the recaptcha service. */
    stop,
  };
};

/**
 * The return type of useSystem composable.
 */
export type UseSystemRecaptchaReturn = ReturnType<typeof useSystemRecaptcha>;
