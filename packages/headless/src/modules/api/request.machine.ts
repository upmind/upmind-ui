// --- external
import { createMachine, assign, actions } from "xstate";
const { sendParent, forwardTo } = actions;

// --- internal
import machineServices, { FetchMethods } from "./services";
import { useTime } from "../../utils";

// --utils
import { toNumber, set, includes, isEmpty } from "lodash-es";
import { getTokenfromStorage } from "../session/utils";
// TODO: import { stateValuesEqual } from "xstate/lib/State";

// ---types
import { responseCodes } from "./types";
import type { RequestContext, RequestParams } from "./types";
// --------------------------------------------------------

// as this is a sub machine, we need to be initialised with a request
// instead of using an event
export default (request: RequestParams) =>
  createMachine(
    {
      // tsTypes: {} as import("./request.machine.typegen").Typegen0,
      id: "request",
      predictableActionArguments: true,
      initial: "available",
      context: {
        url: request?.url,
        init: request?.init,
        useCache: request?.useCache,
        hash: request?.hash,
        maxAge: request?.maxAge || useTime().MINUTE, // 1 minute
        // ---
        created: undefined,
        completed: undefined,
        response: undefined,
        error: undefined,
        // ---
        attempts: 0,
      },
      states: {
        // our initial state depends on how the machine was invoked
        // If we have context > url + init, we can skip to generating
        // If we have context > request, we can skip to processing
        // otherwise we will await a request
        // individual request events are defined to allow for more granular control
        available: {
          always: [
            {
              target: "processing",
              cond: "hasRequest",
            },
          ],
        },

        // Process auth refresh tokens before processing the request
        authorizing: {
          entry: ["clearError"],
          invoke: {
            src: "refreshToken",
            onDone: { actions: ["setAuthHeader"], target: "#processing" },
            onError: {
              target: "#error",
              actions: ["setError"],
            },
          },
        },

        // Process the request through our service
        processing: {
          entry: ["clearError", "clearResponse", "incrementAttempts"],
          id: "processing",
          invoke: {
            id: "process",
            src: "doFetch",
            onDone: {
              target: "processed",
              actions: ["setResponse"],
            },
            onError: [
              { target: "authorizing", cond: "canAuthorize" },
              { target: "error", actions: ["setError"] }, // TODO throw an auth feedback message
            ],
          },
          on: {
            CANCEL: { actions: [forwardTo("process")] },
            CANCELLED: { target: "processed.cancelled" },
          },
        },

        // Use have an Available state to indicate a successful process
        // We could also move into a Cached state if we have a request that is cachable
        // We could move into a Stale state if we have a GET request and a max age
        // We could move into an Empty state if we have a no content
        // We could move into a Cancelled state if we have a cancelled request
        //  - Available & Cancelled are transient states with an imperceptible delay to allow the components to understand the process is complete
        processed: {
          id: "processed",
          initial: "available",
          states: {
            available: {
              after: [
                {
                  delay: 0,
                  target: "empty",
                  cond: "hasNoContent",
                },
                {
                  delay: 0,
                  target: "cached",
                  cond: "isCachable",
                },
                {
                  delay: "wait",
                  target: "#complete",
                },
              ],
            },
            cancelled: {
              after: {
                wait: "#complete", // automatically move to complete after  max age
              },
            },
            empty: {},
            cached: {
              after: { maxAge: "stale" }, // automatically move to stale after max age
              on: {
                CANCEL: { target: "#complete" },
                REFRESH: { target: "#processing" },
              },
            },
            stale: {
              on: {
                REFRESH: { target: "#processing" },
                CANCEL: { target: "#complete" },
              },
            },
          },
        },

        // Handle errors
        error: {
          id: "error",
          initial: "loading",

          states: {
            // detrmine the error type and move to the appropriate state
            // this may kick off a sub state/service to handle the error
            loading: {
              always: [
                {
                  target: "#processed.cancelled",
                  cond: "hasRetried",
                },
                {
                  target: "unauthorized",
                  cond: "isUnauthorized",
                },
                {
                  target: "forbidden",
                  cond: "isForbidden",
                },
                {
                  target: "notFound",
                  cond: "isNotFound",
                },
                {
                  target: "conflict",
                  cond: "hasConflict",
                },
                {
                  target: "tooManyRequests",
                  cond: "hasTooManyRequests",
                },
                { target: "unknown" }, // automatically move to complete after  max age
              ],
            },
            // this is for errors we don't know how to handle
            unknown: {},
            // if we are unauthorized, we need to attempt to refresh the token
            unauthorized: {},
            forbidden: {},
            notFound: {},
            conflict: {},
            tooManyRequests: {},
          },

          on: {
            RETRY: {
              target: "processing",
              actions: [],
            },
            CANCEL: { target: "#complete" },
          },
        },

        // Handle completion, stop the machine and prevent further requests
        // also send a message to the parent machine to remove the request
        complete: {
          id: "complete",
          entry: ["sendClearRequest"],
          type: "final",
        },
      },
    },
    {
      actions: {
        setResponse: assign({
          // @ts-ignore
          response: (context, { data }) => data,
          // @ts-ignore
          completed: () => Date.now(),
        }),

        clearResponse: assign({ response: undefined, completed: undefined }),

        sendClearRequest: sendParent(({ hash }) => ({
          type: "REMOVE",
          data: { hash },
        })),

        setError: assign({
          // @ts-ignore
          error: (context, { data }) => data,
        }),

        // escalateError: escalate(_context, ({ data }) => data),

        clearError: assign({ error: undefined }),

        incrementAttempts: assign({
          attempts: ({ attempts }) => toNumber(attempts) + 1,
        }),

        setAuthHeader: assign({
          init: ({ init }: any) => {
            const token = getTokenfromStorage();
            set(init, "headers.Authorization", `Bearer ${token?.access_token}`);
            return init;
          },
        }),
      },
      // @ts-ignore
      services: machineServices,
      guards: {
        hasRequest: ({ hash, url, init }) => !!hash && !!url && !!init,
        hasRetried: ({ attempts }) => toNumber(attempts) > 1,
        // ---
        // NB: we cannot authorise oauth requests and we can only try once
        canAuthorize: ({ url, attempts }, { data }: any) => {
          const isAuth = includes(url?.pathname, "oauth");
          const isUnauthorized = data?.status === responseCodes.Unauthorized;
          const value = !isAuth && isUnauthorized && toNumber(attempts) <= 1;

          // console.debug("request", "canAuthorize", {
          //   isAuth,
          //   isUnauthorized,
          //   attempts: context?.attempts,
          //   canAuthorize: value
          // });
          return value;
        },
        // ---
        isUnauthorized: ({ error }: RequestContext) =>
          error?.status === responseCodes.Unauthorized,
        isForbidden: ({ error }: RequestContext) =>
          error?.status === responseCodes.Forbidden,
        isNotFound: ({ error }: RequestContext) =>
          error?.status === responseCodes.Not_Found,
        hasConflict: ({ error }: RequestContext) =>
          error?.status === responseCodes.Conflict,
        hasTooManyRequests: ({ error }: RequestContext) =>
          error?.status === responseCodes.Too_Many_Requests,
        hasNoContent: ({ response }: RequestContext) =>
          response?.status === responseCodes.No_Content,
        isCachable: ({ init, useCache }: RequestContext) =>
          init?.method === FetchMethods.GET && !!useCache,
      },
      delays: {
        // @ts-ignore
        maxAge: ({ maxAge }) => maxAge, // this allows us to override the max age in the context
        error: () => useTime().ERROR,
        wait: () => useTime().WAIT,
      },
    }
  );
