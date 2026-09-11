/** @internal */
// -----------------------------------------------------------------------------
/**
 * @internal
 * @module client-notifications/useClientNotificationsManager.machine
 * @description Builds the one typed `.withConfig(...)` payload — actions,
 * guards, services adapter — for a scoped instance of the shared
 * `dataManagerMachine`. This module owns no machine; it configures the shared
 * one. Every key below is one the shared machine references — read
 * `data-manager/data-manager.machine.ts` before adding or removing one.
 */

import { assign } from "xstate";
import { createClientNotificationsSchemas } from "./client-notifications.schemas";
import { useClientNotificationsManagerServices } from "./client-notifications.services";
import { useModelParser } from "../../utils";
import type { dataManagerMachine } from "../data-manager";
import type {
  NotificationsContext,
  NotificationsLookups,
  NotificationsModel,
  NotificationsServices
} from "./client-notifications.types";
import type { ScopeActorTypes } from "../scope";
import type { AnyEventObject } from "xstate";
// -----------------------------------------------------------------------------

/**
 * Builds the `dataManagerMachine.withConfig(...)` payload for one scoped
 * `service` instance. Pinned to the shared machine's config parameter, so every
 * `assign` updater and guard is type-checked against the real context.
 * @internal
 */
export function createClientNotificationsManagerMachineConfig(
  actorScope: ScopeActorTypes,
  service: NotificationsServices,
  token: string | undefined,
  topicsQuery: ReturnType<NotificationsServices["loadTopics"]>,
  channelsQuery: ReturnType<NotificationsServices["loadChannels"]>,
  optOutsQuery: ReturnType<NotificationsServices["loadOptOuts"]>
): Parameters<typeof dataManagerMachine.withConfig>[0] {
  return {
    actions: {
      /**
       * The schema/uischema pair — always assigned together, derived from
       * `context.lookups`. `loadLookups`'s `onDone` runs `setContext` before
       * `setSchemas`, so `context.lookups` is already populated here.
       */
      setSchemas: assign((context: NotificationsContext) => {
        const { useSchema, useUischema } =
          createClientNotificationsSchemas(actorScope);
        // `DataManagerContext.lookups` is the SHARED, PROTECTED machine's
        // generic `Record<string, any[]>` (never edited here — `code-xstate.md`);
        // this module's own `loadLookups` is the only writer, and it always
        // resolves the `{ topics, channels }` shape (`design.md` §D13).
        const lookups = (context.lookups as
          | NotificationsLookups
          | undefined) ?? {
          topics: [],
          channels: []
        };
        return { schema: useSchema(lookups), uischema: useUischema(lookups) };
      }),

      /**
       * Refreshes `baseModel` to the same resolved value as `model`, not just
       * `model`: otherwise `isDirty` stays true after a save, `revert()`
       * restores the stale pre-save baseline, and the data-less parse re-entry
       * fills from a stale baseline.
       *
       * @decision
       * what:     `data ?? baseModel` supplies `useModelParser`'s `values`;
       *           `baseModel` is never the merged third argument.
       * why:      Both callers' `data` is always the full next model, so
       *           nothing needs filling.
       * rejected: The third-argument merge — buys nothing here.
       */
      setModel: assign(
        (
          { schema, baseModel }: NotificationsContext,
          { data }: AnyEventObject
        ) => {
          const model = useModelParser<NotificationsModel>(
            schema,
            data ?? baseModel
          );
          return { model, baseModel: model };
        }
      ),

      /**
       * Folds a REFRESH event's payload into context WITHOUT overwriting a
       * value already resolved — `clientId ||` is load-bearing: a token-only
       * scope (`token` set, `clientId` absent) must not have a later
       * session-derived REFRESH clobber the fact that it is addressed by
       * token, not by client.
       */
      refreshContext: assign({
        clientId: (
          { clientId }: NotificationsContext,
          { data }: AnyEventObject
        ) => clientId || data?.clientId
      })
    },

    guards: {
      /**
       * @decision
       * what:     `hasSubscription` reads `!!clientId || !!token`, not
       *           `!!clientId` alone; `token` reads the closure, not context.
       * why:      A token-only client has no `clientId` — its identity is the
       *           link token — so `!!clientId` alone strands it in `subscribing`
       *           forever and the editor never reaches `available`.
       * rejected: The unconditional `true` default — fires an unaddressed
       *           request before addressability is known.
       */
      hasSubscription: ({ clientId }: NotificationsContext) =>
        !!clientId || !!token
    },

    /**
     * The services adapter for this scoped instance. The ALREADY-SCOPED
     * `service` is threaded in, so every machine-invoked request inherits the
     * same resolved link token / session client as the rest of the module.
     * The three queries are threaded in ALREADY MINTED (`useClientNotificationsManager.ts`)
     * so `loadLookups` never mints its own (`design.md` §D20).
     */
    services: useClientNotificationsManagerServices(
      service,
      topicsQuery,
      channelsQuery,
      optOutsQuery
    )
  };
}

// Type export for consumers
export type ClientNotificationsManagerMachineConfig = ReturnType<
  typeof createClientNotificationsManagerMachineConfig
>;
