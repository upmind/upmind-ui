// --- external
import { createMachine, assign, spawn, Actor } from "xstate";

// --- internal
import requestMachine from "./request.machine";
import services from "./services";
import { generateHash } from "./utils";
// --- utils
import { isEmpty, set, get, unset, keys } from "lodash-es";

// ---types
import type { ActorRef } from "xstate";
import type { RequestsContext, RequestsEvents } from "./types";
// --------------------------------------------------------

export default createMachine(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5QCcwEcCucAusCyAhgHYEzIDEAggCLUDaADALqKgAOA9rAJbbcdFWIAB6IA7GIB0AZjEAWaXIBM0hmICcS9XICsAGhABPRAEYlAX3MHUmHPmKkwySQQDGfAG5hyAYUoA5HwBRABlGFiQQTh4+ASFRBAA2HUl1aR0dXQkdeTlE9QNjBDl1E0lEk3UxRIYGHRNExWlLa3QsWFxCEjIXd24vcgAlIIAVQYBNcKFo3n5BSITk1PTMnLEcuTyCo0RpdUSZXQYlOuTEgA5pRRaQG3bOhx63T29hvAB5ADUgqciZ2PmoEWKQyeXOYhM6yuDEhhV2MMkamO5xMaiq0iUcksVhARA4EDgQjudi6jmQ0y4sziC0QAFoTHCENpJEp5GI9nJzjp1DoGGkbsSOvZuk5JNwIAAbMAUmJzeKIc5ySRmHSJZRaMRqNViRmYpSSHTnJEZaSQk6GgVtEmPUXPfrSv6UgHyhDVSTnc41HJqpSJE4oxncsrnbQlHmyQ31S22IWknquDgAWzYUuwDvYTrlNOKOp2CBMKINVWSnIYeSUmKx2KAA */
    // tsTypes: {} as import("./requests.machine.typegen").Typegen0,
    id: "requestsManager",
    predictableActionArguments: true,
    initial: "empty",
    context: {
      requests: {},
    },
    states: {
      // our initial state depends on if the machine has any requests
      // If we have context > requests, we can skip to processing
      // otherwise we will await a request
      // individual request events are defined to allow for more granular control
      empty: {
        always: [{ target: "processing", cond: "hasRequests" }],
      },
      processing: {
        always: [{ target: "empty", cond: "hasNoRequests" }],
        on: {
          CANCEL: {
            actions: ["cancel"],
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
      add: assign({
        requests: (
          { requests }: RequestsContext,
          {
            data: { hash, url, init, useCache, maxAge, refresh },
          }: RequestsEvents
        ) => {
          hash ??= generateHash(url, init, useCache, keys(requests));
          // check if we already have a request with the same hash
          const request = useCache && get(requests, hash);

          // if we dont then spawn a new request machine
          // and send the request to it
          if (!request) {
            // spawn an actor for the new request
            const machine = spawn(
              requestMachine({ hash, url, init, useCache, maxAge }),
              {
                name: hash,
                sync: true,
              }
            );

            // for now well just add the new machine to our list
            set(requests, hash, machine);
          }

          // if we already have a request with the same hash
          // we can check if its stale and needs to be refreshed
          else if (request.state.matches("processed.stale") || refresh) {
            request.send({
              type: "REFRESH",
            });
          }

          // if we already have a request with the same hash
          // we can check if its errored and needs to be retried
          else if (request.state.matches("error")) {
            request.send({
              type: "RETRY",
            });
          }

          return requests;
        },
      }),

      remove: assign({
        requests: (
          { requests }: RequestsContext,
          { data: { hash } }: RequestsEvents
        ) => {
          // try find any requests with the same hash
          const request = get(requests, hash) as ActorRef<any, any>;

          // if it exists, stop the referenced machine
          // and remove it from our list of requests
          if (request) {
            const state = request.getSnapshot();
            if (state.matches("processing")) {
              request.send({ type: "CANCELLED" });
            }
            if (state?.done && request?.stop) {
              request.stop();
            }
          }

          unset(requests, hash);
          return requests;
        },
      }),

      cancel: assign({
        requests: (
          { requests }: RequestsContext,
          { data: { hash } }: RequestsEvents
        ) => {
          // try find any requests with the same hash
          const request = get(requests, hash);

          // if it exists, stop the referenced machine
          // and remove it from our list of requests
          if (request && !request?.getSnapshot()?.done) {
            request.send({ type: "CANCEL" });
          } else {
            unset(requests, hash);
          }

          return requests;
        },
      }),
    },

    guards: {
      hasRequests: ({ requests }) => {
        return !isEmpty(requests);
      },
      hasNoRequests: ({ requests }) => {
        return isEmpty(requests);
      },
    },
    // @ts-ignore
    services,
  }
);
