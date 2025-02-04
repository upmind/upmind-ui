// --- external
import type { AnyEventObject } from "xstate";
import { createMachine, assign } from "xstate";

// --- internal
import services from "./services";
import type { SessionContext } from "./types";
import clientMachine from "./client/client.machine";
import guestMachine from "./guest/guest.machine";

// --- utils
import { useTime } from "../../utils";
// --------------------------------------------------------

export default createMachine(
  {
    // tsTypes: {} as import("./session.machine.typegen").Typegen0,
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

      // ---
      guest: {
        id: "guest",
        invoke: {
          id: "guestMachine",
          src: guestMachine,
          autoForward: true,
          onDone: { target: "#client" },
          onError: { target: "error", actions: "setError" },
        },
      },

      client: {
        id: "client",
        invoke: {
          id: "clientMachine",
          src: clientMachine,
          autoForward: true,
          onDone: { target: "#guest" },
          onError: { target: "error", actions: "setError" },
        },
      },

      expired: {},

      error: {},

      // ---

      // Handle completion, stop the machine and prevent further requests
      complete: {
        type: "final",
      },
    },
    on: {
      EXPIRED: {
        target: "expired",
      },
    },
  },
  {
    actions: {
      setError: assign({
        error: (_context: SessionContext, { data }: AnyEventObject) => data,
      }),
    },

    guards: {
      isClientToken: (_context: SessionContext, { data }: AnyEventObject) =>
        data?.actor_type === "client",
    },

    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT,
    },
    // @ts-ignore
    services,
  }
);
