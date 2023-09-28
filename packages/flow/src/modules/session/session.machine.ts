// --- external
import { createMachine, assign } from "xstate";

// --- internal
import services from "./services";
import type { SessionContext, SessionEvents } from "./types.d";
// --- utils
import { useTime } from "../../utils";
import { toNumber, isBoolean, toString } from "lodash-es";

// --------------------------------------------------------
const tokenParser = (data: any) => ({
  access_token: toString(data?.access_token),
  created_at: toNumber(data?.created_at) || Date.now(),
  expires_in: toNumber(data?.expires_in),
  refresh_expires_in: toNumber(data?.refresh_expires_in),
  refresh_token: toString(data?.refresh_token),
  second_factor_required: isBoolean(data?.isBoolean)
    ? data?.isBoolean
    : data?.isBoolean === "true",
  token_type: toString(data?.token_type)
});

export default createMachine(
  {
    tsTypes: {} as import("./session.machine.typegen").Typegen0,
    id: "sessionManager",
    predictableActionArguments: true,
    initial: "loading",
    context: {
      debug: false,
      context: "guest", // role
      // ---
      token: {
        access_token: null,
        created_at: null,
        expires_in: null,
        refresh_expires_in: null,
        refresh_token: null,
        second_factor_required: null,
        token_type: null,
        // ---
        redirect: null,
        actor_id: null,
        actor_type: null
      },
      // ---
      error: null
    } as SessionContext,
    states: {
      // our initial state will check 'self' and see if we have a token
      // if we do, we can skip generating a token
      // TODO: add necessary cheand and states when we add user accounts with auth
      loading: {
        id: "loading",
        invoke: {
          src: "check",
          onDone: { target: "#processed", actions: ["setToken"] },
          onError: { target: "#generating" }
        }
      },

      // otherwise we will generate a "guest" token

      processing: {
        id: "processing",
        initial: "generating",
        states: {
          generating: {
            id: "generating",
            invoke: {
              src: "generateToken",
              onDone: { target: "#persisting" },
              onError: { target: "#error" }
            }
          },
          refreshing: {
            id: "refreshing",
            invoke: {
              src: "refreshToken",
              onDone: { target: "#persisting" },
              onError: { target: "#error" }
            }
          }
        }

        // TODO invoke a sub states/service to do something
      },

      persisting: {
        id: "persisting",
        entry: "setToken",
        invoke: {
          src: "persistToken",
          onDone: {
            target: "#processed"
          }
        }
      },

      // Use a state to indicate a successful process
      // We automatically move into a stale state  based on the token/local storage refresh time
      processed: {
        id: "processed",
        initial: "available",
        states: {
          available: {
            after: { expires: { target: "stale", cond: "hasExpiry" } }
          },
          stale: {
            on: {
              REFRESH: { target: "#processing.refreshing" },
              CANCEL: { target: "#complete" }
            }
          }
        }
      },

      // Handle errors
      error: {
        entry: "setError",
        id: "error",
        after: {
          wait: "#complete" // automatically move to complete after  max age
        },
        on: {
          RETRY: { target: "#processing", actions: ["clearError"] },
          CANCEL: { target: "#complete" }
        }
      },

      // Handle completion, stop the machine and prevent further requests
      complete: {
        id: "complete",
        entry: ["resetToken"],
        type: "final"
      }
    }
  },
  {
    actions: {
      setToken: assign({
        token: (context, { data }) => {
          const token = tokenParser(data);
          return token;
        }
      }),

      resetToken: assign({
        token: {
          access_token: null,
          actor_id: null,
          actor_type: null,
          created_at: null,
          expires_in: null,
          redirect: null,
          refresh_expires_in: null,
          refresh_token: null,
          second_factor_required: null,
          token_type: null
        }
      }),

      // ---
      setError: assign({
        error: (context, { data }) => data || "Unknown error"
      }),
      clearError: assign({ error: null })
    },
    guards: {
      hasExpiry: (context: SessionContext) =>
        toNumber(context.token.expires_in) > 0
    },

    delays: {
      expires: (context: SessionContext) =>
        context.debug
          ? useTime().SECOND * 10
          : toNumber(context.token.expires_in) * 1000 || useTime().HOUR, // use the refresh time if we have it, but its in seconds so we need to convert to ms
      wait: () => useTime().MINUTE // this allows us to wait for a reasonable amount of time before continuing
    },
    services
  }
);
