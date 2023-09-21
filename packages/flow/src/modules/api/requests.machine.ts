import { createMachine, assign, sendTo, spawn } from "xstate";
// ---
import requestMachine from "./request.machine";
import type { RequestsContext, RequestsEvents } from "./types";

import services from "./services";
import { addMeta, getMaxAge, generateHash } from "./utils";
// ---
import { isEmpty } from "lodash-es";
import { set, get, unset, upperCase } from "lodash-es";

// --------------------------------------------------------

export default createMachine(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5QCcwEcCucAusCyAhgHYEzIDEAggCLUDaADALqKgAOA9rAJbbcdFWIAB6IA7GIB0AZjEAWaXIBM0hmICcS9XICsAGhABPRAEYlAX3MHUmHPmKkwySQQDGfAG5hyAYUoA5HwBRABlGFiQQTh4+ASFRBAA2HUl1aR0dXQkdeTlE9QNjBDl1E0lEk3UxRIYGHRNExWlLa3QsWFxCEjIXd24vcgAlIIAVQYBNcKFo3n5BSITk1PTMnLEcuTyCo0RpdUSZXQYlOuTEgA5pRRaQG3bOhx63T29hvAB5ADUgqciZ2PmoEWKQyeXOYhM6yuDEhhV2MMkamO5xMaiq0iUcksVhARA4EDgQjudi6jmQ0y4sziC0QAFoTHCENpJEp5GI9nJzjp1DoGGkbsSOvZuk5JNwIAAbMAUmJzeKIc5ySRmHSJZRaMRqNViRmYpSSHTnJEZaSQk6GgVtEmPUXPfrSv6UgHyhDVSTnc41HJqpSJE4oxncsrnbQlHmyQ31S22IWknquDgAWzYUuwDvYTrlNOKOp2CBMKINVWSnIYeSUmKx2KAA */
    tsTypes: {} as import("./requests.machine.typegen").Typegen0,
    id: "requestsManager",
    predictableActionArguments: true,
    initial: "idle",
    context: {
      requests: {},
      cache: {}
    },
    states: {
      // our initial state depends on if the machine has any requests
      // If we have context > requests, we can skip to active
      // otherwise we will await a request
      // individual request events are defined to allow for more granular control

      idle: {
        always: [{ target: "active", cond: "hasRequests" }]
      },
      active: {
        on: {
          STASH: {
            actions: ["stash"]
          },
          DUMP: {
            actions: ["dumpStale"] // 'dump'
          },
          RETRY: {
            actions: ["forward"]
          },
          CANCEL: {
            actions: ["forward"],
            target: "idle"
          },
          REMOVE: {
            target: "idle",
            actions: ["remove"]
          }
        }
      },
      complete: {
        type: "final"
      }
    },
    on: {
      ADD: {
        actions: ["dumpStale", "add"]
      },
      STOP: {
        target: "complete"
      }
    }
  },
  {
    actions: {
      // ------------------------------------
      // PARENT REQUESTS MANAGER ACTIONS

      add: assign({
        requests: (
          { requests }: RequestsContext,
          { data: { url, init, useCache } }: RequestsEvents
        ) => {
          const hash = generateHash(url, init);

          // spawn an actor for the new request
          const machine = spawn(requestMachine, {
            name: hash,
            sync: true
          });

          // todo check if the request is already in progress or cached
          // if so, we can skip the request and either:
          // 1. return the cached request's data
          // 2. return the request in progress

          // for now well just add the new machine to our list
          set(requests, hash, machine);

          // and then forward the request to the new machine to process
          sendTo(hash, {
            type: upperCase(init.method),
            data: { url, init, useCache }
          });

          return requests;
        }
      }),

      remove: assign({
        requests: (
          { requests }: RequestsContext,
          { data: { hash } }: RequestsEvents
        ) => {
          // try find any requests with the same hash
          const request = get(requests, hash);

          // if it exists, stop the referenced machine
          // and remove it from our list of requests
          if (request) {
            request.stop();
            unset(requests, hash);
          }

          return requests;
        }
      }),

      forward: (
        { requests }: RequestsContext,
        { type, data: { hash } }: RequestsEvents
      ) => {
        debugger;
        sendTo(hash, { type });
      },

      stash: assign({
        cache: (
          { cache }: RequestsContext,
          { data: { hash, data } }: RequestsEvents
        ) => {
          addMeta(data, "maxAge", getMaxAge());
          set(cache, hash, data);
          return cache;
        }
      }),

      dumpStale: assign({
        cache: (
          { cache }: RequestsContext,
          { data: { hash } }: RequestsEvents
        ) => {
          debugger;
          const cached = get(cache, hash);

          // Dump if NOT within Max Age
          if (cached?._maxAge < new Date()) unset(cache, hash);

          return cache;
        }
      })

      // do we need a force dump? This will dump regardless of maxAge
      // dump: assign({
      //   cache: (
      //     { cache }: RequestsContext,
      //     { data: { hash } }: RequestsEvents
      //   ) => {
      //     debugger;
      //     unset(cache, hash);
      //     return cache;
      //   }
      // })
    },

    services,
    guards: {
      hasRequests: ({ requests }) => {
        return !isEmpty(requests);
      }
    }
  }
);
