// --- external
import { createMachine, assign, actions } from "xstate";
const { escalate, sendParent } = actions;

// --- internal
import services from "./services";
import type { ClientContext } from "./types.d";
import { responseCodes } from "../../api/types.d";

// --- utils
import { useTokenParser } from "../utils";

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
        entry: sendParent({ type: "MESSAGE", data: null }),
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
                  AUTHENTICATE: { target: "checking" }
                }
              },
              checking: {
                invoke: {
                  src: "checkForChallenge",
                  onDone: [
                    { target: "challenging", cond: "requiresReCaptcha" },
                    { target: "authenticating" }
                  ],
                  onError: { target: "#error", actions: ["setError"] }
                }
              },
              challenging: {
                entry: sendParent({
                  type: "MESSAGE",
                  data: "Awaiting Verification"
                }),
                on: {
                  VERIFY: { target: "verifying" },
                  CANCEL: { target: "idle" }
                }
              },
              verifying: {
                entry: sendParent({
                  type: "MESSAGE",
                  data: "Verifying 2FA"
                }),
                invoke: {
                  src: "verify2fa",
                  onDone: {
                    target: "#authenticated",
                    actions: ["setChallengeToken"]
                  },
                  onError: { target: "challenging", actions: ["setError"] }
                }
              },
              authenticating: {
                entry: sendParent({ type: "MESSAGE", data: "Authenticating" }),
                invoke: {
                  src: "authenticate",
                  onDone: [
                    {
                      target: "challenging",
                      actions: ["setToken"],
                      cond: "requires2fa"
                    },
                    { target: "#authenticated", actions: ["setToken"] }
                  ],
                  onError: { target: "#error", actions: ["setError"] }
                }
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
                  src: "getCustomFields",
                  onDone: { target: "idle", actions: ["setCustomFields"] },
                  onError: { target: "#error", actions: ["setError"] }
                }
              },
              idle: {
                on: {
                  REGISTER: { target: "checking" }
                }
              },
              checking: {
                invoke: {
                  src: "checkForChallenge",
                  onDone: [
                    { target: "challenging", cond: "requiresReCaptcha" },
                    { target: "registering" }
                  ],
                  onError: { target: "#error", actions: ["setError"] }
                }
              },
              challenging: {
                on: {
                  VERIFY: { target: "verifying" }
                }
              },
              verifying: {
                entry: sendParent({
                  type: "MESSAGE",
                  data: "Verifying reCaptcha"
                }),
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
                entry: sendParent({
                  type: "MESSAGE",
                  data: "Registering"
                }),
                invoke: {
                  src: "register",
                  onDone: { target: "#authenticated", actions: ["setToken"] },
                  onError: { target: "#error", actions: ["setError"] }
                }
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
        entry: sendParent({ type: "MESSAGE", data: null }),
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
            entry: sendParent({ type: "MESSAGE", data: "Refreshing Token" }),
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
            entry: sendParent({ type: "MESSAGE", data: "Clearing Token" }),
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
            entry: sendParent({ type: "MESSAGE", data: "Persisting Token" }),
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
        entry: sendParent({ type: "MESSAGE", data: null }),
        id: "complete",
        type: "final",
        data: (context, event) => context.token
      }
    }
  },
  {
    actions: {
      // ---
      setToken: assign({
        token: (context, { data }) => useTokenParser(data)
      }),
      clearToken: assign({
        token: {}
      }),
      // ---
      setError: assign({
        error: (context, { data }) => data || "Unknown error"
      }),

      clearError: assign({ error: null })
    },
    guards: {
      requires2fa: context => !!context.token.second_factor_required,
      requiresReCaptcha: context => !!context.token.recaptcha_required,
      isRefreshing: context => !!context.refresh,
      isUnauthorized: context =>
        context?.error?.status === responseCodes.Unauthorized
    },

    delays: {},
    services
  }
);
