// --- external
import { createMachine, sendParent } from "xstate";

// --- internal
import { useMessageParser } from "./utils";
import { useTime } from "../../utils";

// --utils

// ---
// as this is a sub machine, we need to be initialised with a message
// instead of using an event
export default createMachine(
  {
    //tsTypes: {} as import("./message.machine.typegen").Typegen0,
    id: "message",
    predictableActionArguments: true,
    initial: "pending",
    context: useMessageParser(),
    states: {
      // our initial state depends on how the machine was invoked
      // If we have context > message, we can skip to active
      // otherwise we will await a message
      // individual message events are defined to allow for more granular control
      pending: {
        after: [
          {
            delay: "delay",
            target: "active",
          },
        ],
      },

      active: {
        after: [
          {
            delay: "maxAge",
            target: "#complete",
            cond: "hasMaxAge",
          },
        ],
        on: {
          DISMISS: { target: "complete" },
        },
      },

      // Handle completion, stop the machine and prevent further messages
      // also send a message to the parent machine to remove the message
      complete: {
        id: "complete",
        entry: ["sendClearMessage"],
        type: "final",
      },
    },
  },
  {
    actions: {
      sendClearMessage: sendParent(({ hash }) => {
        return {
          type: "REMOVE",
          data: { id: hash },
        };
      }),
    },
    guards: {
      isActive: ({ scheduled }) => {
        const current = Date.now();
        const isFuture = scheduled > current;
        return !isFuture;
      },
      hasMaxAge: ({ maxAge }) => maxAge,
    },
    delays: {
      delay: ({ delay }) => delay, // this allows us to override the max age in the context
      maxAge: ({ maxAge }) => maxAge, // this allows us to override the max age in the context
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT,
    },
  }
);
