// --- external
import { createMachine, assign, spawn } from "xstate";

// --- internal
import requestMachine from "./request.machine";
import services from "./services";
import { generateHash } from "./utils";
// --- utils
import { isEmpty, set, get, unset, keys } from "lodash-es";

// ---types
import type { ActorRef, AnyEventObject } from "xstate";
import type { RequestsContext } from "./types";

// --------------------------------------------------------

export default createMachine(
  {
    tsTypes: {} as import("./requests.machine.typegen").Typegen0,
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
          }: AnyEventObject
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
          { data: { hash } }: AnyEventObject
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
          { data: { hash } }: AnyEventObject
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
    services,
  }
);
