/** @internal */
import { assign } from "xstate";
import { useSchema, useUischema } from "./client-notes.schemas";
import { useClientNoteManagerServices } from "./client-notes.services";
import { useModelParser } from "../../utils";
import { head } from "lodash-es";
import type { dataManagerMachine } from "../data-manager";
import type {
  ClientNoteServices,
  ProductLookupService,
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
  service: ClientNoteServices,
  productLookup: ProductLookupService
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
       * neither (`@decision` D7). The schema is a plain nullable string for
       * `contract_product_id` (no embedded list); the async lookup rides the
       * uischema control's `options.lookup.service` as the threaded thunk, and
       * `options.lookup.current` is seeded from `lookups.currentProduct` (AC7)
       * — read straight off context, which `loading`'s `setContext` merges in
       * BEFORE `setSchemas` runs in the same `onDone` actions array.
       */
      setSchemas: assign({
        schema: ({ model }: VaultAssetContext) =>
          useSchema({ encrypted: model?.encrypted }),
        uischema: ({ model, id, lookups }: VaultAssetContext) =>
          useUischema({
            encrypted: model?.encrypted,
            isNew: !(model?.id ?? id),
            lookupService: productLookup,
            currentProduct: head(lookups?.currentProduct)
          })
      }),

      /**
       * @decision D18 (R5 — replaces a prose-only comment)
       * what: assigns `context.id`, not only `context.model.id` —
       *   `id: ({id}, {data}) => id || data?.id`.
       * why: the SHARED machine's own `isNew` guard
       *   (`data-manager.machine.ts:269`, `({id}) => !id`) reads `context.id`
       *   alone. `setModel` is wired to THREE transitions in the shared
       *   machine, not one — `subscribing.on.SET`, `processing.adding.onDone`
       *   AND `processing.updating.onDone` (an earlier version of this
       *   comment claimed `processing.adding.onDone` was the only invoker;
       *   that claim was FALSE and is corrected here, not merely tagged). A
       *   `.fresh()` draft has no `id` at construction, so leaving this
       *   assignment to `model` only left `context.id` permanently unset
       *   after a create — `isNew` stayed true, and a second `update()` on
       *   the same (now-persisted) draft re-entered `adding` and POSTed a
       *   duplicate (B2). `id ||` keeps an already-resolved id (the
       *   `updating` path, and any id `subscribing.on.SET` seeded) untouched;
       *   `data?.id` is the created record's id on the `adding` path.
       * rejected: three separate action names, one per wiring — the shared
       *   machine names exactly one `setModel` action for all three
       *   transitions; splitting it would require a shared-core change,
       *   which is out of this module's write lane.
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
       * @decision (R2 / row M10 / AC-35)
       * what: overrides the shared machine's `clearModel` — for THIS scoped
       *   instance only, via `.withConfig`, never editing
       *   `data-manager.machine.ts` itself — to clear `context.id` alongside
       *   `context.model`.
       * why: the shared `clearModel` is `assign({ model: undefined })` —
       *   `model` ONLY, not `id` or `baseModel` (this module's OWN `setModel`
       *   override above reads `context.id`, an asymmetry the shared
       *   `clearModel` has no way to know about). Left sticky, a `clear()`
       *   after an existing-asset edit still carried the PREVIOUS record's
       *   id, so the next `update()` PUT over that record instead of
       *   POSTing a fresh draft.
       * rejected: extending `baseModel` into this clear too — a DIFFERENT,
       *   unrelated defect (R6 / D16) explicitly prohibits widening
       *   `clearModel` to touch `baseModel`; this override touches `id`
       *   only, and `baseModel` keeps whatever R6/D16's own mechanism
       *   requires.
       */
      clearModel: assign({
        id: (_context: VaultAssetContext) => undefined,
        model: (_context: VaultAssetContext) => undefined
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

/**
 * @decision D19 (R6 — the logout-only context clear; see
 *   `useClientNoteManager.actions.ts` `@decision` D16 for the full account of
 *   what this replaces and why)
 * what: mutates `context.model` and `context.baseModel` to `undefined` IN
 *   PLACE on the retained actor's LIVE context object. Deliberately NOT an
 *   `assign(...)` entry in `createClientNoteManagerMachineConfig`'s `actions`
 *   map, and never dispatched through `send()`.
 * why: `.withConfig` can only override the IMPLEMENTATION behind an action
 *   NAME the shared `dataManagerMachine` already lists inside a transition's
 *   fixed action array (`data-manager.machine.ts`) — it cannot ADD a new
 *   name to that array, and adding one means editing that file, which is
 *   protected core and out of this module's write lane. Every name this
 *   module IS free to override sits on a transition with a side effect worse
 *   than the leak it would be fixing: the root-level `REFRESH` targets
 *   `loading`, re-invoking `loadLookups` — which can replay a live `decrypt`
 *   call and hand the plaintext straight back; `available`'s `SET` targets
 *   `.checking`, starting an async `parse`/`validate` cycle that a
 *   synchronous `destroy()` right after would abandon mid-flight rather than
 *   let settle cleanly; `CLEAR`/`clearModel` is the one name explicitly
 *   prohibited from touching `baseModel` (see D16). A direct, synchronous
 *   mutation triggers none of these.
 *
 *   This is safe BECAUSE `actor.state` (the `Ref<AnyState>` `@xstate/vue`'s
 *   `useActor` returns to every sub-composable factory) and
 *   `machineService.state` share the SAME context object reference until the
 *   next transition — mutating it here is visible through both the raw
 *   interpreter snapshot AND every subsequent `useContext()` call. This
 *   module's `useContext: () => createClientNoteManagerContext(...)` factory
 *   (`useClientNoteManager.ts`, clause 1) mints brand-new `computed()`s on
 *   EVERY call, so there is no stale Vue cache to invalidate — a fresh read
 *   always re-derives from the live object this function just emptied.
 * rejected: an `assign({ model: () => undefined, baseModel: () => undefined
 *   })` entry in the `.withConfig` payload — reads as idiomatic XState but is
 *   INERT unless some transition's fixed action array already names it; none
 *   does, and this module cannot add one.
 * @internal
 */
export function clearManagerContextOnLogout(context: VaultAssetContext): void {
  context.model = undefined;
  context.baseModel = undefined;
}
