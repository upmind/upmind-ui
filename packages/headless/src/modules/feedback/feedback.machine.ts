// --- external
import { createMachine, assign, spawn, AnyEventObject } from "xstate";

// --- internal
import messageMachine from "./message.machine";
import type { MessagesContext } from "./types";

// --- utils
import { generateHash, useMessageParser } from "./utils";
import { find, isEmpty, remove, set, some } from "lodash-es";

// --- types
import type { ActorRef } from "xstate";
// --------------------------------------------------------

export default createMachine(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5QCcwEcCucAusCyAhgHYEzIDEAggCLUDaADALqKgAOA9rAJbbcdFWIAB6IA7GIB0AZjEAWaXIBM0hmICcS9XICsAGhABPRAEYlAX3MHUmHPmKkwySQQDGfAG5hyAYUoA5HwBRABlGFiQQTh4+ASFRBAA2HUl1aR0dXQkdeTlE9QNjBDl1E0lEk3UxRIYGHRNExWlLa3QsWFxCEjIXd24vcgAlIIAVQYBNcKFo3n5BSITk1PTMnLEcuTyCo0RpdUSZXQYlOuTEgA5pRRaQG3bOhx63T29hvAB5ADUgqciZ2PmoEWKQyeXOYhM6yuDEhhV2MMkamO5xMaiq0iUcksVhARA4EDgQjudi6jmQ0y4sziC0QAFoTHCENpJEp5GI9nJzjp1DoGGkbsSOvZuk5JNwIAAbMAUmJzeKIc5ySRmHSJZRaMRqNViRmYpSSHTnJEZaSQk6GgVtEmPUXPfrSv6UgHyhDVSTnc41HJqpSJE4oxncsrnbQlHmyQ31S22IWknquDgAWzYUuwDvYTrlNOKOp2CBMKINVWSnIYeSUmKx2KAA */
    // tsTypes: {} as import("./feedback.machine.typegen").Typegen0,
    id: "feedbackManager",
    predictableActionArguments: true,
    initial: "empty",
    context: {
      messages: [],
    },
    states: {
      // our initial state depends on if the machine has any message
      // If we have context > message, we can skip to processing
      // otherwise we will await a message
      // individual message events are defined to allow for more granular control
      empty: {
        always: [{ target: "processing", cond: "hasMessages" }],
      },
      processing: {
        always: [{ target: "empty", cond: "hasNoMessages" }],
        on: {
          DISMISS: {
            actions: ["dismiss"],
          },
        },
      },
      complete: {
        type: "final",
      },
    },
    on: {
      ADD: {
        actions: ["add"],
      },
      REMOVE: {
        actions: ["remove"],
      },
      STOP: {
        target: "complete",
      },
    },
  },
  {
    actions: {
      // @ts-ignore
      add: assign({
        messages: ({ messages }: MessagesContext, { data }: AnyEventObject) => {
          messages = messages ?? [];

          const id = data?.id || generateHash(data);
          set(data, "hash", id);

          const exists = some(messages, ["id", id]);

          // if we dont then spawn an actor for the new message
          if (!exists) {
            const machine: ActorRef<any, any> = spawn(
              messageMachine.withContext(useMessageParser(data)),
              { name: id, sync: true }
            );
            messages.push(machine);
          }

          return messages;
        },
      }),

      // @ts-ignore
      remove: assign({
        messages: (
          { messages }: MessagesContext,
          { data: { id } }: AnyEventObject
        ) => {
          messages = messages ?? [];
          // try find any messages with the same id
          const message = find(messages, ["id", id]);

          // if it exists, stop the referenced machine
          // and remove it from our list of message
          if (message?.stop && !message?.getSnapshot()?.done) message.stop();

          remove(messages, ["id", id]);
          return messages;
        },
      }),

      // @ts-ignore
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
        },
      }),
    },

    guards: {
      hasMessages: ({ messages }) => {
        return !isEmpty(messages);
      },
      hasNoMessages: ({ messages }) => {
        return isEmpty(messages);
      },
    },
  }
);
