// --- external
import { createMachine, assign, spawn, InterpreterStatus } from "xstate";

// --- internal
import { authSubscription } from "../session";
import { querySubscription } from "../query/useQuerySubscription";

// --- utils
import {
  every,
  find,
  forEach,
  isEmpty,
  isEqual,
  isString,
  some,
} from "lodash-es";

// - --types
import type { ActorRef, AnyEventObject } from "xstate";
import type { ClientListingsContext } from "./types";
import type { QueryCacheNotifyEvent, QuerySubscriptionFilter } from "../query";

// -----------------------------------------------------------------------------

export default createMachine(
  {
    //tsTypes: {} as import("./listings.machine.typegen").Typegen0,
    id: "clientListingsManager",
    predictableActionArguments: true,
    initial: "subscribing",
    context: {
      raw: [], // spawned actors
      items: [], // filtered actors
      filters: undefined,
      selected: undefined,
      // ---
      error: undefined,
      queryKeys: ["phones", "emails", "addresses", "companies"],
    } as ClientListingsContext,
    states: {
      // Subscribe to changes in auth and listen for a valid Authenticated client,
      // we will also wait for a session before we can continue
      subscribing: {
        entry: ["setAuthHelper"],
        on: {
          SESSION: { target: "checking" },
        },
      },

      checking: {
        invoke: {
          src: "isAuthenticated",
          onDone: {
            target: "available",
            actions: ["setClient", "setQueryHelper"],
          },
          onError: { target: "unavailable", actions: ["clearClient"] },
        },
      },

      unavailable: {
        on: {
          AUTHENTICATED: { target: "available" },
        },
      },

      available: {
        initial: "loading",
        states: {
          loading: {
            id: "loading",
            entry: ["clearError", "clearItems", "resetFiltered"],
            invoke: {
              src: "load",
              onDone: [
                {
                  target: "processing",
                  actions: ["setItems", "resetFiltered", "setInitial"],
                  cond: (_context, { data }) => data,
                },
                {
                  target: "idle",
                  actions: ["setItems", "resetFiltered"],
                },
              ],
              onError: {
                target: "#error",
                actions: ["setError", "clearSelected"],
              },
            },
          },

          idle: {
            always: [{ target: "empty", cond: "hasNoItems" }],
            on: {
              SELECT: {
                actions: ["setSelected"],
              },
            },
          },

          processing: {
            always: [{ target: "idle", cond: "isNotProcessing" }],
          },

          empty: {
            always: [{ target: "idle", cond: "hasItems" }],
          },

          filtering: {
            invoke: {
              src: "filter",
              onDone: {
                target: "filtered",
                actions: ["setFiltered"],
              },
              onError: {
                target: "filtered",
                actions: ["resetFiltered"],
              },
            },
          },

          filtered: {
            initial: "empty",
            states: {
              empty: {
                always: [
                  {
                    target: "available",
                    cond: "hasFilteredItems",
                  },
                ],
              },
              available: {
                always: [
                  {
                    target: "empty",
                    cond: "hasNoFilteredItems",
                  },
                ],
              },
            },
            on: {
              SELECT: {
                actions: ["setSelected"],
              },
            },
          },

          adding: {},
          editing: {},
        },
        on: {
          REFRESH: {
            target: "available.loading",
            actions: ["setInitial"],
          },

          FILTER: [{ target: "available.filtering", actions: ["setFilters"] }],

          ADD: {
            target: "available.adding",
            actions: ["add"],
          },

          EDIT: {
            target: "available.editing",
            actions: ["setSelected"],
          },
        },
      },

      error: { id: "error" },
      complete: {
        type: "final",
      },
    },
    on: {
      STOP: {
        target: "complete",
      },

      UNAUTHENTICATED: {
        target: "unavailable",
        actions: ["clearError", "clearItems"],
      },

      AUTHENTICATED: {
        target: "checking",
        actions: ["clearError", "clearItems"],
      },

      "QUERY.SUCCESS": {
        target: "available.loading",
      },
    },
  },
  {
    actions: {
      setAuthHelper: assign({
        authHelper: (
          { authHelper }: ClientListingsContext,
          _event: AnyEventObject
        ) => authHelper ?? spawn(authSubscription),
      }),

      setQueryHelper: assign({
        queryHelper: (
          { queryHelper, queryKeys, client }: ClientListingsContext,
          _event: AnyEventObject
        ) => {
          // spawn a new query helper and set up the filter to only listen to brand events
          if (!queryHelper) {
            queryHelper = spawn(querySubscription);

            const queryFilter: QuerySubscriptionFilter = (
              event: QueryCacheNotifyEvent
            ) =>
              some(queryKeys, (queryKey: string) =>
                isEqual(event.query.queryKey, ["clients", queryKey])
              );
            queryHelper.send({
              type: "FILTER",
              filter: queryFilter,
            });
          }
          return queryHelper;
        },
      }),

      setClient: assign({
        client: (_context, { data }: AnyEventObject) => data,
      }),

      clearClient: assign({
        client: undefined,
      }),

      add: assign({
        //  should be provided withConfig
      }),

      setItems: assign({
        //  should be provided withConfig
      }),

      resetFiltered: assign({
        items: ({ raw }, _event) => raw,
        filters: undefined,
      }),

      setFiltered: assign({
        items: (_context, { data }: AnyEventObject) => data,
      }),

      setFilters: assign({
        filters: (_context, { data }: AnyEventObject) => data,
      }),
      // --------------------------------------------

      clearItems: assign({
        raw: ({ raw }, _event) => {
          forEach(raw, (actor: ActorRef<any>) => {
            if (actor.getSnapshot().states == InterpreterStatus.Running)
              actor?.stop && actor.stop();
          });
          return [];
        },
        items: [],
        filters: undefined,
        selected: undefined,
      }),

      setInitial: assign({
        initial: (
          { raw, initial }: ClientListingsContext,
          { data }: AnyEventObject
        ) => {
          if (isString(data) && !isEmpty(data)) return data; // if weve explicitly been given an id, use it. eg when we add a new item and its not yet in the raw list
          // otherwise use our existing initial value or the default
          return initial ?? find(raw, "state.context.model.default")?.id;
        },
        selected: (
          { raw, initial }: ClientListingsContext,
          { data }: AnyEventObject
        ) => {
          // mimic above as we may have a new initial value
          if (isString(data) && !isEmpty(data)) initial = data;

          const id = initial ?? find(raw, "state.context.model.default")?.id;
          const selectedItem = find(raw, ["id", id]);
          return selectedItem ? (selectedItem as ActorRef<any>) : undefined;
        },
      }),

      setSelected: assign({
        initial: ({ selected, initial }: ClientListingsContext) =>
          selected?.id || initial,
        // filters: undefined,
        // items: ({ raw }, _event) => raw,
        selected: (
          { raw }: ClientListingsContext,
          { data }: AnyEventObject
        ) => {
          const id = data as string;
          return find(raw, ["id", id]) || undefined; // || find(raw, "state.context.model.default")
        },
      }),

      clearSelected: assign({
        initial: undefined,
        filters: undefined,
        items: ({ raw }, _event) => raw,
        selected: undefined,
      }),

      // ---
      setError: assign({
        error: (_context, { data }: any) => {
          const error = data?.error;
          return error || data;
        },
      }),

      clearError: assign({ error: null }),
    },
    guards: {
      isNotProcessing: ({ raw }) => {
        return every(
          raw,
          (item: ActorRef<any>) => !item?.getSnapshot().matches("loading")
        );
      },
      hasItems: ({ raw }) => !isEmpty(raw),
      hasNoItems: ({ raw }) => isEmpty(raw),
      hasFilteredItems: ({ items }) => !isEmpty(items),
      hasNoFilteredItems: ({ items }) => isEmpty(items),
    },
  }
);
