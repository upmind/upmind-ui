import { computed, toRaw, unref, type MaybeRef, type Ref } from "vue";
import {
  useQuerySchema,
  useQueryUischema,
  useSortUischema
} from "./client-notes.schemas";
import { mapToHeadlessError, useCollection } from "../../utils";
import {
  every,
  get,
  has,
  isArray,
  isEqual,
  isMatch,
  isPlainObject,
  isString,
  map
} from "lodash-es";
import type {
  ClientNoteListQuery,
  ClientNoteServices,
  ProductLookupService,
  VaultAsset
} from "./client-notes.types";
import type { ResponseError } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-notes/useClientNotes.context
 * @description Collection context — the reactive list, its lookup helpers,
 * and the revealed-secret map. Query-backed: data is mapped in
 * `client-notes.services.ts` via `select`, never here.
 *
 * ERRORS ARE STATE, NOT EVENTS. `error` is the scope's captured failure — the
 * last rejected row mutation, else the list query's own — exposed for the
 * consumer to render. This layer never raises it.
 *
 * @doctrine clause 2 — shared-only (armless).
 */
export function createClientNotesContext(
  _actorScope: ScopeActorTypes,
  service: ClientNoteServices,
  query: ClientNoteListQuery,
  revealed: Ref<Record<string, string>>,
  productLookup: ProductLookupService
) {
  const { findOne: findOneByValue, getOne } = useCollection<VaultAsset>(
    query.data
  );

  // `useCollection().findOne` matches each mapped key with `isEqual`, so a
  // nested partial (e.g. `{ meta: { isPinned } }`) never matches the full
  // mapped `meta` object. Deep-partial-match nested plain-object values
  // instead — a full match is the degenerate case of a partial one.
  function findOne(
    mapping: string | Partial<VaultAsset>,
    data: MaybeRef<VaultAsset[] | null | undefined> = query.data,
    searchableProps: string[] = []
  ) {
    if (isString(mapping)) {
      return findOneByValue(mapping, data, searchableProps);
    }

    const rows = unref(toRaw(data));
    return (isArray(rows) ? rows : []).find(item =>
      every(mapping, (value, key) => {
        if (key === "id") return get(item, "id") == value;
        const modelValue = get(item, key);
        return isPlainObject(value) && isPlainObject(modelValue)
          ? isMatch(modelValue as object, value as object)
          : isEqual(modelValue, value);
      })
    );
  }

  // `castArray(undefined)` yields a phantom element, so the empty case is
  // spelled out rather than cast.
  //
  // A revealed secret's plaintext is merged into its row's `note` here, and
  // `meta.isRevealed` is flipped to `true`. The mapper blanks an encrypted
  // row's `note` to `""` (the ciphertext envelope never renders) and defaults
  // `isRevealed` to `false`; the plaintext lives only in `revealed`. Without
  // this merge a revealed row has nothing to draw — `reveal` appears to do
  // nothing — and `reveal`/`hide` cannot tell the two states apart.
  const data = computed(() => {
    const rows = isArray(query.data.value) ? query.data.value : [];
    const plaintext = revealed.value;
    return map(rows, row =>
      has(plaintext, row.id)
        ? {
            ...row,
            note: plaintext[row.id],
            meta: { ...row.meta, isRevealed: true }
          }
        : row
    );
  });

  const error = computed<ResponseError | undefined>(
    () =>
      query.criteriaError.value ??
      service.error.value ??
      (query.error.value ? mapToHeadlessError(query.error.value) : undefined)
  );

  // --- actor-specific context: none earned yet (clause 2). When a scope
  // earns one, add `useClientNotes.context.{actor}.ts` and spread it LAST.

  return {
    /** The reactive list of this scope's vault assets — notes and secrets alike (always an array). */
    data,

    /** The scope's captured error — read, never raised. */
    error,

    /** Finds a single vault asset by a partial mapping. */
    findOne,

    /** Finds a single vault asset by id. */
    getOne,

    /** Reactive pagination descriptor for the list query. */
    pagination: query.pagination,

    /**
     * This scope's ACTIVE request state — `{ filters, sort, pagination }`,
     * the query's own published criteria rather than a copy of it;
     * read-only, write through `useActions().filterBy` / `.sortBy` /
     * `.setCriteria`.
     */
    query: query.criteria,

    /**
     * The revealed-secret map — `{ assetId: plaintext }`, read-only here.
     * Written by `useActions().reveal` / `.hide`, minted once per scope so it
     * survives every `useContext()` call. NEVER cached or persisted (row
     * C11).
     */
    revealed: computed(() => revealed.value),

    /**
     * The module's schema family, plain JSON so it survives the renderer
     * port's `JSON` round-trip. The renderer's only door to it is
     * `useContext()`. `filters.encrypted.eq` renders as a control here — the
     * JTBD's third no-template-slot capability.
     */
    schemas: {
      query: {
        schema: useQuerySchema(),
        uischema: useQueryUischema(productLookup),
        sortUischema: useSortUischema()
      }
    }

    // The arm merges in HERE, last.
  };
}

// Type export for consumers
export type UseClientNotesContext = ReturnType<typeof createClientNotesContext>;
