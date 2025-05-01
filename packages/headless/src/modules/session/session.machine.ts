// --- external
import type { AnyEventObject } from "xstate";
import { createMachine, assign } from "xstate";

// --- internal
import services from "./services";
import type { SessionContext } from "./types";
import clientMachine from "./client/client.machine";
import guestMachine from "./guest/guest.machine";

// --- utils
import { useTime, useCookies } from "../../utils";
const { removeTopLevel: removeCookie, get: getCookie } = useCookies();

import { useDataLayer } from "../system";
const { dataLayer } = useDataLayer();

// -----------------------------------------------------------------------------
export default createMachine(
  {
    //tsTypes: {} as import("./session.machine.typegen").Typegen0,
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
              target: "client",
              cond: "isClientToken",
            },
            // {
            //   target: "guest",
            //   cond: "isGuestToken",
            // },
            {
              // if we have  no token, we need to clear any possible  user data
              target: "guest",
              actions: "clear",
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

      error: {},

      // ---

      // Handle completion, stop the machine and prevent further requests
      complete: {
        type: "final",
      },
    },
    on: {
      EXPIRED: {
        target: "checking",
      },
    },
  },
  {
    actions: {
      setError: assign({
        error: (_context: SessionContext, { data }: AnyEventObject) => data,
      }),

      clear: () => {
        const actor = getCookie("upm_actor", value => JSON.parse(atob(value)));

        // if there is an actor, we need to clear the user data and update the data layer
        if (actor) {
          removeCookie("upm_actor");
          dataLayer().withPage().withUser().push(false);
        }
      },
    },

    guards: {
      isClientToken: (_context: SessionContext, { data }: AnyEventObject) =>
        data?.actor_type === "client",

      isGuestToken: (_context: SessionContext, { data }: AnyEventObject) =>
        data?.actor_type === "guest",
    },

    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT,
    },
    services,
  }
);
