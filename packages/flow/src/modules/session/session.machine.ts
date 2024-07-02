// --- external
import { createMachine, assign } from "xstate";

// --- internal
import services from "./services";
import type { SessionContext } from "./types.d";
import clientMachine from "./client/client.machine";
import guestMachine from "./guest/guest.machine";

// --- utils
import { dumpTokensFromStorage } from "./utils";
import { useTime } from "../../utils";
// --------------------------------------------------------

export default createMachine(
  {
    tsTypes: {} as import("./session.machine.typegen").Typegen0,
    id: "sessionManager",
    predictableActionArguments: true,
    initial: "checking",
    context: {
      history: [],
      error: null,
    } as SessionContext,
    states: {
      checking: {
        invoke: {
          src: "check",
          onDone: [
            {
              target: "#client",
              cond: "isClientToken",
            },
            {
              target: "#guest",
            },
          ],
          onError: { target: "#guest" },
        },
      },

      // in this state, we are attempting to refresh our token which has expired),
      // we will clear the token and go back to our unauthenticated state
      // which will generate a new token
      // refreshing: {
      //   id: "refreshing",
      //   invoke: {
      //     src: "refreshToken",
      //     onDone: [
      //       { target: "#client", cond: "isClientToken" },
      //       { target: "#guest" },
      //     ],
      //     onError: {
      //       target: "#guest",
      //       actions: "clear",
      //     },
      //   },
      // },

      // ---
      guest: {
        id: "guest",
        invoke: {
          id: "guestMachine",
          src: guestMachine,
          autoForward: true,
          onDone: { target: "#client" },
        },
      },

      client: {
        id: "client",
        invoke: {
          id: "clientMachine",
          src: clientMachine,
          autoForward: true,
          onDone: { target: "#guest" },
        },
      },

      unavailable: {},

      // ---

      // Handle completion, stop the machine and prevent further requests
      complete: {
        entry: "clear",
        type: "final",
      },
    },
    on: {
      "CLEAR.ERRORS": { actions: "clearError" },
    },
  },
  {
    actions: {
      clear: assign((_context, _event) => {
        dumpTokensFromStorage();
        return null;
      }),
      // ---

      setError: assign({
        error: (context, { data }) => data,
      }),
      clearError: assign({ error: null }),
    },

    guards: {
      isClientToken: (_context, { data }) => data?.actor_type === "client",
    },

    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT,
    },
    services,
  }
);
