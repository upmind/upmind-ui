import { ref } from "vue";
import { createScopedComposable } from "../scope";
import { createClientCustomFieldsServices } from "./client-custom-fields.services";
import { CLIENT_CUSTOM_FIELDS_SCOPE_MATRIX } from "./client-custom-fields.types";
import { createClientCustomFieldsActions } from "./useClientCustomFields.actions";
import { createClientCustomFieldsContext } from "./useClientCustomFields.context";
import { createClientCustomFieldsInternals } from "./useClientCustomFields.internals";
import { createClientCustomFieldsMeta } from "./useClientCustomFields.meta";
import type {
  ClientCustomFieldsScopeMatrix,
  CustomField
} from "./client-custom-fields.types";
import type {
  ScopeBuilder,
  ScopeConfig,
  ScopeKey,
  ScopedComposable
} from "../scope";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-custom-fields/useClientCustomFields
 * @description Scoped, query-backed collection of a client's brand's custom
 * field definitions: one TanStack list query per concrete `(actor, context)`
 * scope, minted once at construction so it survives component lifecycles.
 * Its sibling is `useClientCustomFieldImage` — a second scoped composable
 * registered under the SAME `name` string (`"client-custom-fields"`, passed
 * to `createScopedComposable` by BOTH files below). `generateScopeKey`
 * (`scope.utils.ts`) builds `name:actor[:context.type:context.id][:brand]
 * [:fresh]` from that `name` — the CALLING COMPOSABLE's own function name is
 * not part of the key at all, so it carries no differentiation between the
 * two. What keeps their registry entries apart in practice is that each
 * composable's OWN context-type enum differs
 * (`ClientCustomFieldsContextTypes.VALUES` here vs
 * `ClientCustomFieldContextTypes.FIELD` in the image editor) and lands in
 * the key ONLY when a context is supplied via `.for()`. This is latent, not
 * structurally guaranteed: a bare `.as(actor)` call with NO `.for()` on
 * either composable produces the identical key for that actor (no context
 * segment on either side) — safe here only because `useClientCustomFieldImage`
 * has no consumer that calls it bare (it addresses a single field and is
 * meaningless without `.for('field', id)`), never because the platform
 * enforces it.
 *
 * @doctrine clause 1 (uniform four-layer default).
 * @doctrine clause 4 — `config.actor` arriving here is ALREADY a concrete
 * actor; the scope builder resolves SELF before this factory runs.
 */
function createClientCustomFieldsForScope(
  config: ScopeConfig,
  scopeKey: ScopeKey
) {
  const actorScope = config.actor as ScopeActorTypes;

  /**
   * ONE services instance for this scope. `config.context` goes in here and
   * nowhere else, so every request the collection issues resolves the same
   * target client.
   */
  const service = createClientCustomFieldsServices(actorScope, config.context);

  // Mint the list query ONCE per scope — a `service.loadList()` inside a
  // layer factory mints a second query, with its own refs, key and effect
  // scope.
  const query = service.loadList();

  /**
   * The client-SIDE narrowing mapping (AC-8) — never touches the query's own
   * `filters`/key, so applying it issues no new request. Minted once here so
   * the actions layer's SETTER and the context layer's narrowed `data` share
   * the one ref. Widened to accept an array per ruling R3 (see the
   * `@decision` on `narrowBy`, `useClientCustomFields.actions.ts`).
   */
  const narrowing = ref<Partial<CustomField> | Partial<CustomField>[]>({});

  /**
   * ONE actions instance per scope, not one per `useActions()` call: the
   * collection's applied `filters` live in that factory. The stateless
   * layers below stay lazy. Mirrors `useClientEmails`.
   */
  const actions = createClientCustomFieldsActions(
    actorScope,
    service,
    query,
    scopeKey,
    narrowing
  );

  return {
    // --- Sub-composables (no direct props — clause 1 four-layer return)
    /** Sub-composable for collection actions (readiness, refresh, filters). */
    useActions: () => actions,

    /** Sub-composable for collection context (reactive list + lookups). */
    useContext: () =>
      createClientCustomFieldsContext(actorScope, service, query, narrowing),

    /** Sub-composable for advanced debugging and internal access. */
    useInternals: () => createClientCustomFieldsInternals(actorScope, query),

    /** Sub-composable for collection meta (state flags). */
    useMeta: () => createClientCustomFieldsMeta(actorScope, service, query)
  };
}
// -----------------------------------------------------------------------------
/**
 * @decision defer the `createScopedComposable` REGISTRATION call to first
 * invocation, rather than performing it at module-evaluation time.
 * what:    `useClientCustomFields` is a plain function with the SAME call
 *          signature and return type `createScopedComposable(...)` itself
 *          produces (`() => ScopeBuilder<T, TMatrix>`) — no barrel or
 *          consumer changes. On first call it registers via
 *          `createScopedComposable` and caches the returned builder-factory;
 *          every call (first or not) then delegates to that cached factory.
 * why:     `client-email`'s own composable (the R7 reference idiom) performs
 *          this registration EAGERLY, at module top level. That is provably
 *          fatal here: `useClientCustomFields.ts:2` imports `createScopedComposable`
 *          from `../scope`, whose own dependency chain
 *          (`scope.builder.ts:2` -> `scope.utils.ts:3` -> `session-store/index.ts:2`
 *          -> `useActiveSession.ts:1` -> `useSession.actions.ts:2` ->
 *          `system-localisation/index.ts` -> `useLocalisation.ts:3` ->
 *          `useI18n.ts:2` -> `brand/index.ts:1` -> `useBrand.ts:10` ->
 *          `query/index.ts:1` -> `useQuery.ts:10` -> `basket/index.ts:5` -> ... ->
 *          `basket-billing/unified/schemas.ts:6` ->
 *          `basket-fields/basket-fields.services.ts:3`
 *          (`import { mapCustomField } from "../client-custom-fields"`))
 *          reaches back into THIS module's own barrel while `../scope` is
 *          still mid-evaluation. An eager top-level call re-enters `../scope`
 *          before `scope.builder.ts` has hoisted `createScopedComposable`,
 *          throwing `TypeError: createScopedComposable is not a function`.
 *          Deferring the call to first USE (well after the whole module
 *          graph has settled, since real consumers run during Vue `setup()`
 *          or a test body — never during module evaluation) means nothing
 *          ever dereferences `../scope` while it is still initialising; the
 *          cycle stays in the import GRAPH but stops being fatal.
 * rejected: reordering this file's own imports (services-chain before
 *          `../scope`) — tried and reverted: it only changes WHICH module
 *          wins the race to be the fresh entrant, and traded this module's
 *          green for `client-email`'s (proven: `client-email.mappers.test.ts`
 *          then crashed inside `useClientCustomFields.ts` instead). Editing
 *          `scope.utils.ts`'s eager `session-store` import, or
 *          `basket-fields.services.ts`'s eager `client-custom-fields` import
 *          — both rejected: forbidden/shared core, outside this module's
 *          contract, and not this repair's call to make unilaterally.
 * @example
 * ```ts
 * const fields = useClientCustomFields().as('client')
 * const { data } = fields.useContext()
 * await fields.useActions().isReady()
 * ```
 */
let registeredUseClientCustomFields:
  | (() => ScopeBuilder<
      ReturnType<typeof createClientCustomFieldsForScope>,
      ClientCustomFieldsScopeMatrix
    >)
  | undefined;

export function useClientCustomFields(): ScopeBuilder<
  ReturnType<typeof createClientCustomFieldsForScope>,
  ClientCustomFieldsScopeMatrix
> {
  if (!registeredUseClientCustomFields) {
    registeredUseClientCustomFields = createScopedComposable<
      ReturnType<typeof createClientCustomFieldsForScope>,
      ClientCustomFieldsScopeMatrix
    >(
      "client-custom-fields",
      createClientCustomFieldsForScope,
      CLIENT_CUSTOM_FIELDS_SCOPE_MATRIX
    );
  }
  return registeredUseClientCustomFields();
}

/**
 * @decision publish `scopeMatrix` on the EXPORTED wrapper, not only on the
 * deferred inner registration.
 * what: assigns `.scopeMatrix` onto `useClientCustomFields` itself, reading
 *   the already-imported `CLIENT_CUSTOM_FIELDS_SCOPE_MATRIX` constant — no
 *   `createScopedComposable` call, so none of the import-cycle risk the
 *   deferral above exists to avoid.
 * why: `createScopedComposable` attaches `.scopeMatrix` to the composable IT
 *   returns (`scope.builder.ts` — `composable.scopeMatrix = scopeMatrix`),
 *   but that composable is the deferred `registeredUseClientCustomFields`,
 *   never the exported symbol consumers hold. `useModulePort.ts` reads
 *   `composable.scopeMatrix` off the EXPORTED reference a page declaration
 *   names, BEFORE ever invoking it (`servesActor(composable.scopeMatrix,
 *   actor)` runs ahead of `composable()`), so without this line the
 *   property is `undefined` there — and `servesActor` (`scope-utils.ts`)
 *   treats an absent matrix as "no refusal", so the playground offers every
 *   actor regardless of the matrix's `never` pins (AC-37).
 * rejected: setting `.scopeMatrix` inside the `if (!registered...)` branch,
 *   copied off `registeredUseClientCustomFields` — still `undefined` until
 *   the first call, and `useModulePort` reads it before any call happens.
 */
(
  useClientCustomFields as ScopedComposable<
    ReturnType<typeof createClientCustomFieldsForScope>,
    ClientCustomFieldsScopeMatrix
  >
).scopeMatrix = CLIENT_CUSTOM_FIELDS_SCOPE_MATRIX;

// Type export for consumers
export type UseClientCustomFields = ReturnType<typeof useClientCustomFields>;
