// --- external
import { createMachine, assign, spawn } from "xstate";

// --- internal
import messageMachine from "./message.machine";
import type { MessagesContext, MessagesEvents } from "./types.d";

// --- utils
import { generateHash } from "./utils";
import { isEmpty, set, get, unset } from "lodash-es";

// --------------------------------------------------------

export default createMachine(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5QCcwEcCucAusCyAhgHYEzIDEAggCLUDaADALqKgAOA9rAJbbcdFWIAB6IA7GIB0AZjEAWaXIBM0hmICcS9XICsAGhABPRAEYlAX3MHUmHPmKkwySQQDGfAG5hyAYUoA5HwBRABlGFiQQTh4+ASFRBAA2HUl1aR0dXQkdeTlE9QNjBDl1E0lEk3UxRIYGHRNExWlLa3QsWFxCEjIXd24vcgAlIIAVQYBNcKFo3n5BSITk1PTMnLEcuTyCo0RpdUSZXQYlOuTEgA5pRRaQG3bOhx63T29hvAB5ADUgqciZ2PmoEWKQyeXOYhM6yuDEhhV2MMkamO5xMaiq0iUcksVhARA4EDgQjudi6jmQ0y4sziC0QAFoTHCENpJEp5GI9nJzjp1DoGGkbsSOvZuk5JNwIAAbMAUmJzeKIc5ySRmHSJZRaMRqNViRmYpSSHTnJEZaSQk6GgVtEmPUXPfrSv6UgHyhDVSTnc41HJqpSJE4oxncsrnbQlHmyQ31S22IWknquDgAWzYUuwDvYTrlNOKOp2CBMKINVWSnIYeSUmKx2KAA */
    tsTypes: {} as import("./feedback.machine.typegen").Typegen0,
    id: "feedbackManager",
    predictableActionArguments: true,
    initial: "empty",
    context: {
      messages: {}
    },
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
        messages: (
          { messages }: MessagesContext,
          {
            data: {
              id,
              display,
              type,
              title,
              subtitle,
              copy,
              icon,
              delay,
              maxAge
            }
          }: MessagesEvents
        ) => {
          id ??= generateHash({
            display,
            type,
            title,
            subtitle,
            copy,
            icon,
            delay,
            maxAge
          });

          // check if we already have a feedback with the same id
          const exists = get(messages, id);

          // if we dont then spawn a new messages machine
          // and send the messages to it
          if (!exists) {
            // spawn an actor for the new messages
            const machine = spawn(
              messageMachine({
                hash: id,
                title,
                subtitle,
                copy,
                icon,
                display,
                type,
                delay,
                maxAge
              }),
              {
                name: id,
                sync: true
              }
            );

            // for now well just add the new machine to our list
            set(messages, id, machine);
          }

          return messages;
        }
      }),

      remove: assign({
        messages: (
          { messages }: MessagesContext,
          { data: { id } }: MessagesEvents
        ) => {
          // try find any messages with the same id
          const message = get(messages, id);

          // if it exists, stop the referenced machine
          // and remove it from our list of message
          if (message && !message?.state?.done) message.stop();

          unset(messages, id);
          return messages;
        }
      }),

      dismiss: assign({
        messages: (
          { messages }: MessagesContext,
          { data: { id } }: MessagesEvents
        ) => {
          // try find any messages with the same id
          const message = get(messages, id);

          // if it exists, stop the referenced machine
          // and remove it from our list of message
          if (message && !message?.state?.done) {
            message.send("DISMISS");
          } else {
            unset(messages, id);
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
