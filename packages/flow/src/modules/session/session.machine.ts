// --- external
import { createMachine, assign } from "xstate";

// --- internal
import services from "./services";
import type { SessionContext } from "./types.d";
import clientMachine from "./client/client.machine";
import guestMachine from "./guest/guest.machine";
// --- utils
import { useTokenParser } from "./utils";
import { useTime } from "../../utils";

// --------------------------------------------------------

export default createMachine(
  {
    tsTypes: {} as import("./session.machine.typegen").Typegen0,
    id: "sessionManager",
    predictableActionArguments: true,
    initial: "loading",
    context: {
      token: {},
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
          onDone: [
            // { target: "valid.admin", cond: "isAdminToken", actions: ["setToken"]  },
            // { target: "valid.actor", cond: "isActorToken", actions: ["setToken"] },
            {
              target: "client",
              cond: "isClientToken",
              actions: ["setToken"]
            },
            {
              target: "guest",
              actions: ["setToken"]
            }
          ],
          onError: { target: "guest" }
        }
      },

      guest: {
        invoke: {
          id: "guest",
          src: guestMachine,
          onDone: { target: "#loading", actions: ["clearToken"] }
        },
        on: {
          AUTHENTICATED: { actions: ["setToken"] }
          // login/logout/refresh
          // pass through to the appropriate machine
        }
      },

      client: {
        invoke: {
          id: "client",
          src: clientMachine,
          onDone: { target: "#loading", actions: ["clearToken"] }
        },
        on: {
          AUTHENTICATED: { actions: ["setToken"] }
          // login/logout/refresh
          // pass through to the appropriate machine
        }
      },

      // admin: {
      // invoke the admin machine
      // },
      // actor: {
      // invoke the actor machine
      // },

      // Handle errors
      error: {
        entry: "setError",
        id: "error",
        after: {
          wait: "#complete" // automatically move to complete after  max age
        },
        on: { KILL: { target: "#complete" } }
      },

      // Handle completion, stop the machine and prevent further requests
      complete: {
        id: "complete",
        entry: ["clearToken"],
        type: "final"
      }
    }
  },
  {
    actions: {
      setToken: assign({
        token: (context, { data }) => useTokenParser(data)
      }),
      clearToken: assign({
        token: {}
      }),
      // ---
      setError: assign({
        error: (context, { data }) => data || "Unknown error"
      })
    },
    guards: {
      isClientToken: (_context, { data }) => {
        return data?.type === "client";
      }

      // isAdminToken: (_context, { data }) => {
      //   debugger;
      //   return data?.type === "admin";
      // },
      // isActorToken: (_context, { data }) => {
      //   debugger;
      //   return data?.actor_type === "actor";
      // }
    },

    delays: {
      wait: () => useTime().MINUTE // this allows us to wait for a reasonable amount of time before continuing
    },
    services
  }
);
