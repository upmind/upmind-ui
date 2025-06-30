// --- external
import { createMachine, assign, spawn, InterpreterStatus } from "xstate";

// --- internal
import messageMachine from "./message.machine";
import type { MessagesContext } from "./types";

// --- utils
import { generateHash, useMessageParser } from "./utils";
import { find, isEmpty, remove, set, some } from "lodash-es";

// --- types
import type { ActorRef, AnyEventObject } from "xstate";

// -----------------------------------------------------------------------------
export default createMachine(
  {
    //tsTypes: {} as import("./feedback.machine.typegen").Typegen0,
    id: "feedbackManager",
    predictableActionArguments: true,
    initial: "empty",
    context: {} as MessagesContext,
    states: {
      // our initial state depends on if the machine has any message
      // If we have context > message, we can skip to processing
      // otherwise we will await a message
      // individual message events are defined to allow for more granular control
      empty: {
        always: [{ target: "processing", cond: "hasMessages" }]
      },
      processing: {
        always: [{ target: "empty", cond: "hasNoMessages" }],
        on: {
          DISMISS: {
            actions: ["dismiss"]
          }
        }
      },
      complete: {
        type: "final"
      }
    },
    on: {
      ADD: {
        actions: ["add"]
      },
      REMOVE: {
        actions: ["remove"]
      },
      STOP: {
        target: "complete"
      }
    }
  },
  {
    actions: {
      add: assign({
        messages: ({ messages }: MessagesContext, { data }: AnyEventObject) => {
          messages = messages ?? [];

          const id = data?.id || generateHash(data);
          set(data, "hash", id);

          const exists = some(messages, ["id", id]);

          // if we dont then spawn an actor for the new message
          if (!exists) {
            const machine: ActorRef<any> = spawn(
              messageMachine.withContext(useMessageParser(data)),
              { name: id, sync: true }
            );
            messages.push(machine);
          }

          return messages as ActorRef<any>[];
        }
      }),

      remove: assign({
        messages: (
          { messages }: MessagesContext,
          { data: { id } }: AnyEventObject
        ) => {
          messages = messages ?? [];
          // try find any messages with the same id
          const actor = find(messages, ["id", id]);

          // if it exists, stop the referenced machine
          // and remove it from our list of actor
          if (actor?.getSnapshot().status == InterpreterStatus.Running)
            actor?.stop && actor.stop();

          remove(messages, ["id", id]);
          return messages;
        }
      }),

      dismiss: assign({
        messages: (
          { messages }: MessagesContext,
          { data: { id } }: AnyEventObject
        ) => {
          messages = messages ?? [];

          // try find any messages with the same id
          const message = find(messages, ["id", id]);

          // if it exists, stop the referenced machine
          // and remove it from our list of message
          if (message?.send && !message?.getSnapshot()?.done) {
            message.send({ type: "DISMISS" });
          } else {
            remove(messages, ["id", id]);
          }

          return messages;
        }
      })
    },

    guards: {
      hasMessages: ({ messages }) => {
        return !isEmpty(messages);
      },
      hasNoMessages: ({ messages }) => {
        return isEmpty(messages);
      }
    }
  }
);
