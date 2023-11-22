// --- external
import { createMachine, assign, actions } from "xstate";
const { escalate } = actions;

// --- internal
import services from "./services";
import type { ClientContext } from "./types.d";
import { responseCodes } from "../../api/types.d";

// --- utils
import { useTime } from "../../../utils";
import { useTokenParser } from "../utils";
import { useValidationParser } from "./utils";
// --------------------------------------------------------

export default createMachine(
  {
    tsTypes: {} as import("./client.machine.typegen").Typegen0,
    id: "client",
    predictableActionArguments: true,
    initial: "loading",
    context: {
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
      model: {},
      schema: {},
      uischema: {},
      // ---
      refresh: false,
      // ---
      error: null
    } as ClientContext,
    states: {
      // our initial state will check 'self' and see if we have a token
      // if we do, we move to the authenticated state and attempt to refresh if needed
      // if we don't, we move to the unauthenticated state and await a login or register event
      // TODO: add checks for if a client needs to confirm their email, or is in a recovery flow
      // and then we move to the appropriate state
      loading: {
        id: "loading",
        entry: "clearError",
        invoke: {
          src: "check",
          onDone: { target: "#authenticated", actions: ["setToken"] },
          onError: { target: "#unauthenticated", actions: ["clearToken"] }
        }
      },

      // in this state, we are unauthenticated, and we can either login or register, possibly with a challenge like 2fa or recaptcha
      unauthenticated: {
        id: "unauthenticated",

        initial: "idle",
        states: {
          idle: {
            on: {
              LOGIN: { target: "login" },
              REGISTER: { target: "register" }
            }
          },

          // --- Start the login flow
          // in essence show a login form and await an event to authenticate
          login: {
            initial: "idle",
            states: {
              // loading: {} // loading state not required?
              idle: {
                on: {
                  AUTHENTICATE: {
                    target: "authenticating",
                    actions: ["setModel"]
                  }
                }
              },
              authenticating: {
                invoke: {
                  src: "authenticate",
                  onDone: [
                    {
                      target: "challenging",
                      actions: ["set2faToken"],
                      cond: "requires2fa"
                    },
                    { target: "#authenticated", actions: ["setToken"] }
                  ],
                  onError: { target: "error", actions: ["setError"] }
                }
              },
              challenging: {
                on: {
                  VERIFY: { target: "verifying" },
                  CANCEL: { target: "idle" }
                }
              },
              verifying: {
                invoke: {
                  src: "verify2fa",
                  onDone: {
                    target: "#authenticated",
                    actions: ["setChallengeToken"]
                  },
                  onError: { target: "challenging", actions: ["setError"] }
                }
              },
              error: {
                entry: escalate(({ error }, _event) => error),
                after: { error: "idle" } // automatically move to stale after max age
              }
            }
          },

          // --- Start the create flow
          // in essence show a register form, possibly with custom fields, and await an event to register
          register: {
            initial: "loading",
            states: {
              loading: {
                invoke: {
                  src: "getSchemas",
                  onDone: { target: "idle", actions: ["setSchemas"] },
                  onError: { target: "error", actions: ["setError"] }
                }
              },
              idle: {
                on: {
                  REGISTER: { target: "checking", actions: ["setModel"] }
                }
              },
              checking: {
                invoke: {
                  src: "checkForReCaptcha",
                  onDone: [
                    { target: "challenging", cond: "requiresReCaptcha" },
                    { target: "registering" }
                  ],
                  onError: { target: "error", actions: ["setError"] }
                }
              },
              challenging: {
                on: {
                  VERIFY: { target: "verifying" }
                }
              },
              verifying: {
                invoke: {
                  src: "verifyReCaptcha",
                  onDone: {
                    target: "registering",
                    actions: ["setChallengeToken"]
                  },
                  onError: { target: "challenging", actions: ["setError"] }
                }
              },
              registering: {
                invoke: {
                  src: "register",
                  onDone: { target: "authenticating", actions: ["setToken"] },
                  onError: { target: "error", actions: ["setError"] }
                }
              },
              authenticating: {
                invoke: {
                  src: "authenticate",
                  onDone: { target: "#authenticated", actions: ["setToken"] },
                  onError: { target: "error", actions: ["setError"] }
                }
              },
              error: {
                entry: escalate(({ error }, _event) => error),
                after: { error: "idle" } // automatically move to stale after max age
              }
            }
          }

          // --- potential alternate/future form flows
          // social: {}, // when we require user to login with a social provider
          // ---
          // confirm: {}, // when we require user to confirm their email
          // recover: {},  // when we require user to recover their password
          // reset: {}, // when we user is in the process of reset their password
        }
      },

      // in this state, we are authenticated, and we can either refresh or kill the token
      authenticated: {
        id: "authenticated",

        initial: "idle",
        states: {
          idle: {
            always: [
              { target: "refreshing", cond: "isRefreshing" },
              { target: "persisting" }
            ]
          },
          // in this state, we are attempting to refresh our token
          // if we are unauthorized (refresh token has expired),
          // we will clear the token and go back to our unauthenticated state
          // which will generate a new token
          refreshing: {
            invoke: {
              src: "refreshToken",
              onDone: { target: "persisting", actions: ["setToken"] },
              onError: [
                {
                  target: "clearing",
                  cond: "isUnauthorized",
                  actions: ["setError"]
                },
                { target: "#error", actions: ["setError"] }
              ]
            }
          },

          // in this state, we are removing our token to localStorage,
          // and then we start over
          clearing: {
            invoke: {
              src: "dumpToken",
              onDone: [
                { target: "#loading", cond: "isRefreshing" },
                { target: "#complete" }
              ]
            },
            exit: "clearToken"
          },

          // in this state, we are persisting our token to localStorage,
          // and then we are done
          persisting: {
            invoke: {
              src: "persistToken",
              onDone: {
                target: "#complete"
              }
            }

            // ---
            // potential future states
            // ---
            // onboarding: {},
            // updating: {},
          }
        }
      },

      // Handle errors
      error: {
        entry: escalate(({ error }, _event) => error),
        id: "error"
      },

      // Handle completion, stop the machine and prevent further requests
      complete: {
        id: "complete",
        type: "final",
        data: (context, event) => context.token
      }
    }
  },
  {
    actions: {
      setSchemas: assign({
        schema: (context, { data }) => data.schema,
        uischema: (context, { data }) => data.uischema
      }),

      setModel: assign({
        model: (context, { data }) => data
      }),

      // ---
      set2faToken: assign({
        token: (context, { data }) => data
      }),
      setToken: assign({
        token: (context, { data }) => useTokenParser(data)
      }),
      clearToken: assign({
        token: {}
      }),
      // ---
      setError: assign({
        error: (context, { data: { error } }) => {
          if ((error.code = 422)) {
            // lets parse/override our error message and data
            // this is to generate valid json schema validation errors
            return useValidationParser(error);
          }

          return error || "Unknown error";
        }
      }),

      clearError: assign({ error: null })
    },
    guards: {
      requires2fa: (_context, { data }) =>
        data.actor_type == "twofa" && !!data?.second_factor_required,
      requiresReCaptcha: (_context, { data }) => !!data?.recaptcha_required,
      isRefreshing: context => !!context.refresh,
      isUnauthorized: context =>
        context?.error?.status === responseCodes.Unauthorized
    },

    delays: {
      error: () => useTime().SECOND * 3 // this allows us to read the error before continuing
    },
    services
  }
);
