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
import {
  useValidationParser,
  useRegisterSchemaParser,
  useRegisterUischemaParser,
  useRegisterModelParser,
  useLoginSchemaParser,
  useLoginUischemaParser,
  useLoginModelParser,
  use2faSchemaParser,
  use2faUischemaParser,
  use2faModelParser,
} from "./utils";

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
        actor_type: null,
      },
      customFields: [],
      model: {},
      schema: {},
      uischema: {},
      // ---
      refresh: false,
      // ---
      error: null,
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
          onError: { target: "#unauthenticated", actions: ["clearToken"] },
        },
      },

      // in this state, we are unauthenticated, and we can either login or register, possibly with a challenge like 2fa or recaptcha
      unauthenticated: {
        id: "unauthenticated",

        initial: "idle",
        states: {
          idle: {},

          // --- Start the login flow
          // in essence show a login form and await an event to authenticate
          login: {
            id: "login",
            initial: "loading",
            states: {
              loading: {
                always: {
                  target: "idle",
                  actions: ["clearError", "setLoginSchemas"],
                },
                // after: {
                //   wait: {
                //     target: "idle",
                //     actions: ["clearError", "setLoginSchemas"]
                //   }
                // }
              },
              // loading: {} // loading state not required?
              idle: {
                on: {
                  AUTHENTICATE: {
                    target: "authenticating",
                    actions: ["setModel"],
                  },
                },
              },
              authenticating: {
                invoke: {
                  src: "authenticate",
                  onDone: [
                    {
                      target: "challenging",
                      actions: ["set2faToken", "set2faSchemas"],
                      cond: "requires2fa",
                    },
                    { target: "#authenticated", actions: ["setToken"] },
                  ],
                  onError: {
                    target: "error",
                    actions: ["setError", "escalateError"],
                  },
                },
              },
              challenging: {
                on: {
                  VERIFY: { target: "verifying" },
                  CANCEL: { target: "idle" },
                },
              },
              verifying: {
                invoke: {
                  src: "verify2fa",
                  onDone: {
                    target: "#authenticated",
                    actions: ["setChallengeToken"],
                  },
                  onError: {
                    target: "challenging",
                    actions: ["setError", "escalateError"],
                  },
                },
              },
              error: {
                after: { error: "idle" }, // automatically move to stale after max age
              },
            },
          },

          // --- Start the create flow
          // in essence show a register form, possibly with custom fields, and await an event to register
          register: {
            id: "register",
            initial: "loading",
            states: {
              loading: {
                invoke: {
                  src: "getCustomFields",
                  onDone: {
                    target: "idle",
                    actions: ["setCustomFields", "setRegisterSchemas"],
                  },
                  onError: {
                    target: "error",
                    actions: ["setError", "escalateError"],
                  },
                },
              },
              idle: {
                on: {
                  REGISTER: { target: "checking", actions: ["setModel"] },
                },
              },
              checking: {
                invoke: {
                  src: "checkForReCaptcha",
                  onDone: [
                    { target: "challenging", cond: "requiresReCaptcha" },
                    { target: "registering" },
                  ],
                  onError: {
                    target: "error",
                    actions: ["setError", "escalateError"],
                  },
                },
              },
              challenging: {
                on: {
                  VERIFY: { target: "verifying" },
                },
              },
              verifying: {
                invoke: {
                  src: "verifyReCaptcha",
                  onDone: {
                    target: "registering",
                    actions: ["setChallengeToken"],
                  },
                  onError: {
                    target: "challenging",
                    actions: ["setError", "escalateError"],
                  },
                },
              },
              registering: {
                invoke: {
                  src: "register",
                  onDone: { target: "authenticating", actions: ["setToken"] },
                  onError: {
                    target: "error",
                    actions: ["setError", "escalateError"],
                  },
                },
              },
              authenticating: {
                invoke: {
                  src: "authenticate",
                  onDone: { target: "#authenticated", actions: ["setToken"] },
                  onError: {
                    target: "error",
                    actions: ["setError", "escalateError"],
                  },
                },
              },
              error: {
                after: { error: "idle" }, // automatically move to stale after max age
              },
            },
          },

          // --- potential alternate/future form flows
          // social: {}, // when we require user to login with a social provider
          // ---
          // confirm: {}, // when we require user to confirm their email
          // recover: {},  // when we require user to recover their password
          // reset: {}, // when we user is in the process of reset their password
        },
        on: {
          LOGIN: { target: "#login" },
          REGISTER: { target: "#register" },
        },
      },

      // in this state, we are authenticated, and we can either refresh or kill the token
      authenticated: {
        id: "authenticated",

        initial: "idle",
        states: {
          idle: {
            always: [
              { target: "refreshing", cond: "isRefreshing" },
              { target: "persisting" },
            ],
          },
          // in this state, we are attempting to refresh our token
          // if we are unauthorized (refresh token has expired),
          // we will clear the token and go back to our unauthenticated state
          // which will generate a new token
          // TODO: If the refresh token is expired, we should prompt the user to login again
          refreshing: {
            invoke: {
              src: "refreshToken",
              onDone: { target: "persisting", actions: ["setToken"] },
              onError: [
                {
                  target: "clearing",
                  cond: "isUnauthorized",
                  actions: ["setError", "escalateError"],
                },
                { target: "#error", actions: ["setError", "escalateError"] },
              ],
            },
          },

          // in this state, we are removing our token to localStorage,
          // and then we start over
          clearing: {
            invoke: {
              src: "dumpToken",
              onDone: [
                { target: "#unauthenticated.login", cond: "isRefreshing" },
                { target: "#complete" },
              ],
            },
            exit: "clearToken",
          },

          // in this state, we are persisting our token to localStorage,
          // and then we are done
          persisting: {
            invoke: {
              src: "persistToken",
              onDone: {
                target: "#complete",
              },
            },

            // ---
            // potential future states
            // ---
            // onboarding: {},
            // updating: {},
          },
        },
      },

      // Handle errors
      error: {
        id: "error",
      },

      // Handle completion, stop the machine and prevent further requests
      complete: {
        id: "complete",
        type: "final",
        data: (context, _event) => context.token,
      },
    },
  },
  {
    actions: {
      setCustomFields: assign({
        customFields: (_context, { data }) => data,
      }),

      setRegisterSchemas: assign({
        schema: ({ customFields }) => useRegisterSchemaParser(customFields),
        uischema: ({ customFields }) => useRegisterUischemaParser(customFields),
        model: ({ customFields }) => useRegisterModelParser(customFields),
      }),

      setLoginSchemas: assign({
        schema: _context => useLoginSchemaParser(),
        uischema: _context => useLoginUischemaParser(),
        model: _context => useLoginModelParser(),
      }),

      set2faSchemas: assign({
        schema: _context => use2faSchemaParser(),
        uischema: _context => use2faUischemaParser(),
        model: _context => use2faModelParser(),
      }),

      setModel: assign({
        model: (_context, { data }) => data,
      }),

      // ---
      set2faToken: assign({
        token: (_context, { data }) => data,
      }),
      setToken: assign({
        token: (_context, { data }) => useTokenParser(data),
      }),
      clearToken: assign({
        token: {},
      }),
      // ---
      setError: assign({
        error: (_context, event, state) => {
          console.error("session", "client", "error", { event, state });

          const data = event?.data;

          if (data?.error?.code == responseCodes.Unauthorized) {
            // Usually because the refresh token has expired.
            return {
              code: responseCodes.Unauthorized,
              message: data.error.message || "Unauthorized",
            };
          }

          if (data?.error?.code == responseCodes.Unprocessable_Entity) {
            // lets parse/override our error message and data
            // this is to generate valid json schema validation errors
            return useValidationParser(data?.error);
          }

          return data?.error || data || event?.error || event || null;
        },
      }),
      escalateError: escalate(({ error }) => error),

      clearError: assign({ error: null }),
    },
    guards: {
      requires2fa: (_context, { data }) =>
        data.actor_type == "twofa" && !!data?.second_factor_required,
      requiresReCaptcha: (_context, { data }) => !!data?.recaptcha_required,
      isRefreshing: context => !!context.refresh,
      isUnauthorized: (_context, { data }) =>
        data?.status === responseCodes.Unauthorized,
    },

    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT,
    },
    services,
  }
);
