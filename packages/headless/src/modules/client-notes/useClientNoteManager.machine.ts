/** @internal */
import { assign } from "xstate";
import { useSchema, useUischema } from "./client-notes.schemas";
import { useClientNoteManagerServices } from "./client-notes.services";
import { useModelParser } from "../../utils";
import { head } from "lodash-es";
import type { dataManagerMachine } from "../data-manager";
import type {
  ClientNoteServices,
  VaultAssetContext,
  VaultAssetModel
} from "./client-notes.types";
import type { AnyEventObject } from "xstate";
// -----------------------------------------------------------------------------
/**
 * @internal
 * @module client-notes/useClientNoteManager.machine
 * @description Builds the ONE typed `.withConfig(...)` payload — actions,
 * guards and the services adapter — for a single scoped `service` instance of
 * the shared `dataManagerMachine`. The module owns no machine of its own
 * (`@decision` D3).
 *
 * Every key below is one the SHARED machine references. Read
 * `data-manager/data-manager.machine.ts` before adding or removing one: an
 * action/guard/service the machine names but this payload omits either falls
 * back to the machine's own no-op default or crashes on entering its state.
 * Neither is a type error.
 *
 * @decision D3
 * what: the manager configures the SHARED `dataManagerMachine` through this
 *   config factory, typed `Parameters<typeof dataManagerMachine.withConfig>[0]`.
 *   No `client-notes.machine.ts` exists.
 * why: `NOT-APPLICABLE.md` — a second composable backed by a shared machine
 *   carries no machine file of its own; the pinned return type type-checks
 *   every `assign` updater and guard against the real context.
 * rejected: a module-owned `createMachine` — duplicates a battle-hardened
 *   shared machine and puts this module's editor on a different lifecycle
 *   from every sibling's.
 */

/**
 * Builds the `dataManagerMachine.withConfig(...)` payload for one scoped
 * `service` instance. The return type is pinned to the shared machine's own
 * config parameter, which type-checks every `assign` updater and guard
 * against the real context. NEVER widen it back.
 * @internal
 */
export function createClientNoteManagerMachineConfig(
  service: ClientNoteServices
): Parameters<typeof dataManagerMachine.withConfig>[0] {
  return {
    actions: {
      /**
       * Display strings for the asset being edited. Plain context fields the
       * manager's `useContext()` re-exposes — never rendered as feedback.
       *
       * `title` is the asset's label, or the note's FIRST LINE
       * (`useClientNoteManager.context.ts`'s own doc for this field) — not
       * the whole body, which a multi-line note previously returned in full.
       */
      setMeta: assign({
        title: ({ model }: VaultAssetContext) =>
          model?.label || head(model?.note?.split("\n")),
        description: ({ model }: VaultAssetContext) =>
          model?.encrypted ? "Secret" : "Note"
      }),

      /**
       * The schema/uischema PAIR — always assigned together, and re-derived
       * from `model.encrypted` so the form's contract follows the flag (row
       * M7 / AC-24 — "one entity, a flag decides which", made observable).
       * This is the ONLY place they enter the system; they travel to
       * consumers through machine context, which is why `index.ts` exports
       * neither (`@decision` D7).
       */
      setSchemas: assign({
        schema: ({ model }: VaultAssetContext) =>
          useSchema({ encrypted: model?.encrypted }),
        uischema: ({ model }: VaultAssetContext) =>
          useUischema({ encrypted: model?.encrypted })
      }),

      /**
       * `context.id`, not only `context.model.id` — the SHARED machine's own
       * `isNew` guard (`data-manager.machine.ts`) reads `context.id` alone,
       * and this is the ONLY action `processing.adding.onDone` invokes. A
       * `.fresh()` draft has no `id` at construction, so leaving this
       * assignment to `model` only left `context.id` permanently unset after
       * a create — `isNew` stayed true, and a second `update()` on the same
       * (now-persisted) draft re-entered `adding` and POSTed a duplicate
       * (B2). `id ||` keeps an already-resolved id (the `updating` path)
       * untouched; `data?.id` is the created record's id on the `adding`
       * path.
       */
      setModel: assign({
        id: ({ id }: VaultAssetContext, { data }: AnyEventObject) =>
          id || data?.id,
        model: (
          { schema, baseModel }: VaultAssetContext,
          { data }: AnyEventObject
        ) => useModelParser<VaultAssetModel>(schema, data, baseModel)
      }),

      /**
       * Folds a REFRESH payload into context WITHOUT overwriting a value the
       * scope already resolved — `clientId ||` is load-bearing: the manager
       * seeds the scope-resolved client at construction, and a later
       * session-derived REFRESH must not clobber it.
       */
      refreshContext: assign({
        clientId: ({ clientId }: VaultAssetContext, { data }: AnyEventObject) =>
          clientId || data?.clientId
      })
    },

    guards: {
      /**
       * Gates the machine out of `subscribing` into `loading`. The shared
       * machine's default returns true unconditionally; overriding it is what
       * makes the form wait for an addressable client instead of firing an
       * unaddressed request.
       */
      hasSubscription: (
        { clientId }: VaultAssetContext,
        _event: AnyEventObject
      ) => !!clientId
    },

    /**
     * The services adapter for this scoped instance. The ALREADY-SCOPED
     * `service` is threaded in, so every machine-invoked request inherits the
     * same resolved target client as the rest of the module.
     */
    services: useClientNoteManagerServices(service)
  };
}

// Type export for consumers
export type ClientNoteManagerMachineConfig = ReturnType<
  typeof createClientNoteManagerMachineConfig
>;
