import { computed, ref } from "vue";
import { createScopedComposable } from "../scope";
import { useI18n } from "../system-localisation";
import { useQuerySchema } from "./client-email.schemas";
import createClientEmailServices from "./client-email.services";
import { createClientEmailsActions } from "./useClientEmails.actions";
import { createClientEmailsContext } from "./useClientEmails.context";
import { createClientEmailsInternals } from "./useClientEmails.internals";
import { createClientEmailsMeta } from "./useClientEmails.meta";
import {
  compactDeep,
  DetailedError,
  ErrorOrigin,
  mapToHeadlessError,
  responseCodes,
  useModelParser,
  useValidation
} from "../../utils";
import { isEmpty } from "lodash-es";
import type { ClientEmailsScopeMatrix, QueryModel } from "./client-email.types";
import type { ResponseError } from "../../utils";
import type { ScopeConfig, ScopeKey } from "../scope";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { ComputedRef } from "vue";
// -----------------------------------------------------------------------------
/**
 * @module client-email/useClientEmails
 * @description Scoped, query-backed collection of a client's email addresses:
 * one TanStack list query per concrete `(actor, context)` scope, minted once at
 * construction so it survives component lifecycles. Its sibling is
 * `useClientEmailManager` — a second scoped composable in the same module,
 * registered under the SAME module name; the composable name and the scope key
 * carry the differentiation.
 *
 * @doctrine clause 1 (uniform four-layer default).
 * @doctrine clause 4 — `config.actor` arriving here is ALREADY a concrete
 * actor; the scope builder resolves SELF before this factory runs.
 */
function createClientEmailsForScope(config: ScopeConfig, scopeKey: ScopeKey) {
  const actorScope = config.actor as ScopeActorTypes;

  /**
   * ONE services instance for this scope. `config.context` goes in here and
   * nowhere else, so every request the collection issues resolves the same
   * target client.
   */
  const service = createClientEmailServices(actorScope, config.context);

  /**
   * ONE query model per scope (S-D9): the user's INTENT in a ref, and the
   * derived read-only model the wire is built from — compact → parse → validate.
   *
   * COMPACT FIRST, then parse: the parser reads `sort`'s schema `default` only
   * when the key is ABSENT, and TanStack's third header click leaves an empty
   * array behind. Compacting with `preserveContainers: false` strips it, so the
   * parse refills the default order.
   */
  const querySchema = useQuerySchema();
  const queryIntent = ref<QueryModel>({});
  const queryModel: ComputedRef<QueryModel> = computed(() =>
    useModelParser<QueryModel>(
      querySchema,
      compactDeep(queryIntent.value, { preserveContainers: false }),
      {},
      { allowExtraProps: false, preserveContainers: false }
    )
  );

  /**
   * The derived model's validation failure, as the scope's error state — never
   * swallowed and never silently reverted. Carries the ajv errors as `data`,
   * exactly as the form half's `service.validate` does, and reaches the consumer
   * on `useContext().error`.
   */
  const queryError = computed<ResponseError | undefined>(() => {
    const errors = useValidation().validate(querySchema, queryModel.value);
    if (isEmpty(errors)) return undefined;

    return mapToHeadlessError(
      new DetailedError(
        useI18n().t("error.client_email_validation_failed"),
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless,
        errors
      )
    );
  });

  // Mint the list query ONCE per scope — a `service.loadList()` inside a layer
  // factory mints a second query, with its own refs, key and effect scope. The
  // translator seeds the initial fetch from the parsed default order; runtime
  // changes reach the wire through `filterBy` / `sortBy`.
  const query = service.loadList({
    pagination: { limit: 0 },
    queryModel: queryModel.value
  });

  /**
   * ONE actions instance per scope, not one per `useActions()` call: the
   * collection's query intent lives here, so a factory minted per call gives
   * every handle its own filter/sort state — one handle's `filterBy()` would be
   * invisible to the next. The stateless layers below stay lazy. Mirrors the
   * manager half.
   */
  const actions = createClientEmailsActions(
    actorScope,
    service,
    query,
    scopeKey,
    queryIntent,
    queryModel
  );

  return {
    // --- Sub-composables (no direct props — clause 1 four-layer return)
    /** Sub-composable for collection actions (row mutations, lifecycle). */
    useActions: () => actions,

    /** Sub-composable for collection context (reactive list + lookups). */
    useContext: () =>
      createClientEmailsContext(
        actorScope,
        service,
        query,
        queryModel,
        queryError
      ),

    /** Sub-composable for advanced debugging and internal access. */
    useInternals: () => createClientEmailsInternals(actorScope, query),

    /** Sub-composable for collection meta (state flags). */
    useMeta: () => createClientEmailsMeta(actorScope, service, query)
  };
}
// -----------------------------------------------------------------------------
/**
 * Scoped composable for a client's own email collection.
 *
 * @example
 * ```ts
 * const emails = useClientEmails().as('self')
 * const { data, default: defaultEmail } = emails.useContext()
 * await emails.useActions().isReady()
 * await emails.useActions().setDefault(id)
 * ```
 */
export const useClientEmails = createScopedComposable<
  ReturnType<typeof createClientEmailsForScope>,
  ClientEmailsScopeMatrix
>("client-email", createClientEmailsForScope);

// Type export for consumers
export type UseClientEmails = ReturnType<typeof useClientEmails>;
