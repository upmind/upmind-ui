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
    context: {} as SessionContext,
    states: {
      checking: {
        id: "checking",
        entry: "clearError",
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

      transferring: {
        initial: "processing",
        states: {
          processing: {
            invoke: {
              src: "transferFrom",
              onDone: {
                target: "processed",
                actions: "setTransferToken",
              },
              onError: {
                target: "processed",
                actions: "setTransferToken",
              },
            },
          },

          processed: {
            on: {
              TRANSFERRED: {
                target: "#checking",
                actions: "clearTransfer",
              },
            },
          },
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
        target: "checking",
      },
      TRANSFER_FROM: {
        target: "transferring",
        actions: "setTransfer",
      },
    },
  },
  {
    actions: {
      setTransfer: assign({
        transfer: (_context: SessionContext, { data }: AnyEventObject) => {
          return {
            redirect: data?.redirect,
            code: data?.code,
          } as SessionContext["transfer"];
        },
      }),

      setTransferToken: assign({
        transfer: ({ transfer }: SessionContext, { data }: AnyEventObject) => {
          const token = data;
          return {
            token,
            redirect: transfer?.redirect,
            code: transfer?.code,
          } as SessionContext["transfer"];
        },
      }),

      clearTransfer: assign({ transfer: undefined }),

      setError: assign({
        error: (_context: SessionContext, { data }: AnyEventObject) => data,
      }),

      clearError: assign({
        error: (_context: SessionContext) => undefined,
      }),

      clear: () => {
        const actor = getCookie("upm_actor", value => JSON.parse(atob(value)));

        // if there is an actor, we need to clear the user data and update the data layer
        if (actor) {
          removeCookie("upm_actor");
          dataLayer().withUser().push(false);
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
      expired: () => useTime().MINUTE * 5,
    },
    services,
  }
);
