/** @internal */
import { createMachine, sendParent } from "xstate";
import services from "./feedback.services";
import { type Message, messageTypes } from "./feedback.types";
import { useTime } from "../../utils";
import { some } from "lodash-es";

// --types

// -----------------------------------------------------------------------------

export default createMachine(
  {
    //tsTypes: {} as import("./message.machine.typegen").Typegen0,
    id: "message",
    predictableActionArguments: true,
    initial: "pending",
    context: {} as Message,
    states: {
      // our initial state depends on how the machine was invoked
      // If we have "context" > "message", we can skip to active
      // otherwise we will await a message
      // individual message events are defined to allow for more granular control
      pending: {
        after: [{ delay: "delay", target: "active" }]
      },

      active: {
        after: [
          {
            cond: "hasMaxAge",
            delay: "maxAge",
            target: "#complete"
          }
        ],
        on: {
          ACTION: { cond: "hasAction", target: "processing" },
          DISMISS: { target: "#complete" }
        }
      },

      processing: {
        invoke: {
          src: "processAction",
          onDone: {
            target: "#complete"
          },
          onError: {
            target: "#complete"
          }
        }
      },

      // Handle completion, stop the machine and prevent further messages
      // also send a message to the parent machine to remove the message
      complete: {
        id: "complete",
        type: "final",
        entry: ["sendClearMessage"]
      }
    }
  },
  {
    actions: {
      sendClearMessage: sendParent(({ hash }) => ({
        type: "REMOVE",
        data: { id: hash }
      }))
    },
    guards: {
      isActive: ({ scheduled }) => {
        const current = Date.now();
        const isFuture = scheduled && scheduled > current;
        return !isFuture;
      },
      hasAction: ({ actions }, { data }) => some(actions, ["value", data]),
      isWarning: ({ type }) => type === messageTypes.WARNING,
      hasMaxAge: ({ maxAge }) => !!maxAge
    },
    delays: {
      delay: ({ delay }) => delay ?? 0, // this allows us to override the max age in the context
      maxAge: ({ maxAge }) => maxAge ?? 0, // this allows us to override the max age in the context
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT
    },

    services
  }
);
