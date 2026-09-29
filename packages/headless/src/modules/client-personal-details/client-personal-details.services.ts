/** @internal */
import { useQuery as vueUseQuery } from "@tanstack/vue-query";
import { computed, effectScope, getCurrentScope, ref } from "vue";
import { useBrand } from "../brand";
// A's contract (A-8/A-9, R2) — consumed here, never re-derived locally (AC-59).
import {
  ClientCustomFieldsContextTypes,
  mapCustomFieldValues,
  useClientCustomFields
} from "../client-custom-fields";
import { invalidateQueryByKey, useQuery } from "../query";
import { ScopeActorTypes } from "../scope/scope.types";
import { useActiveSession } from "../session-store";
import { useI18n, useLocale } from "../system-localisation";
import {
  mapIProfileFields,
  mapProfile
} from "./client-personal-details.mappers";
import { useSchema } from "./client-personal-details.schemas";
import { ClientPersonalDetailsContextTypes } from "./client-personal-details.types";
import {
  recordQueryKey,
  restoreClearedFields,
  RECORD_QUERY_KEY_SEGMENT
} from "./client-personal-details.utils";
import {
  ErrorOrigin,
  useTime,
  compactDeep,
  useValidation,
  DetailedError,
  responseCodes,
  useModelParser,
  mapToHeadlessError,
  NotAuthenticatedError
} from "../../utils";
import { get, isEmpty } from "lodash-es";
import type { ScopeContext } from "../scope";
import type {
  ClientPersonalDetailsManagerMachineServices,
  ClientPersonalDetailsRecordQuery,
  ClientPersonalDetailsServices,
  ProfileContext,
  ProfileModel,
  ProfileRecord
} from "./client-personal-details.types";
import type { ResponseError } from "../../utils";
import type { DefaultError, QueryKey } from "@tanstack/vue-query";
import type { IClient } from "@upmind-automation/types";
import type { Ref } from "vue";
// -----------------------------------------------------------------------------
/**
 * @module client-personal-details/client-personal-details.services
 * @description The ONE services file both halves consume — the read half's
 * reactive profile query, the manager's lookups/parse/validate/update, and
 * the XState services adapter the shared `dataManagerMachine` invokes. One
 * factory on purpose: one identity seam, one cache key, one arm-resolution
 * switch.
 *
 * Nothing here raises feedback. A failure rejects for the caller and lands
 * in the scope's own error state, which the composables expose.
 *
 * WARNING: Do not import directly from another module. Resolve via
 * `usePersonalDetails.ts` / `usePersonalDetailsManager.ts` only
 * (`@internal/no-cross-module-imports`).
 */
// -----------------------------------------------------------------------------

/** The module's base cache key prefix. */
export const queryKey: QueryKey = ["client"];

/**
 * Derives the target client id from the RESOLVED scope — the ONE seam every
 * request-issuing function in this file shares. A `.for('client', id)` context
 * names the client being addressed; with none it falls back to the active
 * session's own client (the self case). This compares the CONTEXT the scope
 * builder resolved, never the actor, so it is not a branch on
 * `ScopeActorTypes.SELF`. Both halves share this one seam, which is what makes
 * AC-30's read-back (read and write resolve the SAME id) executable, and is the
 * guard against the FE-2824 defect shape (a services file that hardwires the
 * session id and drops the retarget). ADR-001 amendment 2026-09-15: the client
 * retarget rides in a `.for()` context; `.withId()` carries a record id, never
 * the owner.
 *
 * The `&& scopeContext.id` is load-bearing: the context id became OPTIONAL in
 * FE-3239, so an id-less context of this type would otherwise resolve
 * `undefined` AS the identity instead of falling through. The guard now holds
 * what the type used to hold.
 */
function resolveClientId(scopeContext?: ScopeContext) {
  const { activeUser } = useActiveSession().useContext();

  return computed(() =>
    scopeContext?.type === ClientPersonalDetailsContextTypes.CLIENT &&
    scopeContext.id
      ? scopeContext.id
      : activeUser.value?.id
  );
}

/**
 * Resolves true only for an authenticated session with an addressable
 * client. The module's ONE addressability predicate — every request gate
 * here calls it, and `createClientPersonalDetailsServices` exposes its
 * reactive form as `service.isAvailable`.
 */
function isAddressable(clientId?: string): boolean {
  const { isAuthenticated } = useActiveSession().useMeta();

  return isAuthenticated.value && !!clientId;
}

/**
 * READ HALF — the reactive single-record query, minted once per scope.
 *
 * @decision hand-rolled directly against `@tanstack/vue-query`'s own
 * `useQuery`, never through this platform's `useQuery().query()` wrapper.
 * what:    builds `queryKey: ["client", clientId, "record"]` and calls
 *          `vueUseQuery` directly, wrapped in a detached `effectScope` (the
 *          same survives-the-caller's-unmount technique `query()`/`list()`
 *          use internally).
 * why:     the shared key with A (above) must be byte-identical so the two
 *          dedupe onto one request. `query()` ALWAYS appends its own
 *          `{ sort, filters, locale? }` reactiveKeys object as the key's
 *          last element (`query/useQuery.ts`) and never strips it, so a key
 *          built through it can never collapse to exactly `["client", id,
 *          "record"]` — a different hash, a second request. `get()` (the
 *          one-shot async fetcher `loadLookups` below uses) DOES strip an
 *          empty reactiveKeys suffix via `cleanQueryKey`, which is why it
 *          can safely go through the wrapper while this reactive read cannot.
 * rejected: going through `query()` and accepting the extra key segment —
 *          rejected outright, it defeats the one-request goal this key
 *          exists for.
 */
function loadProfile(
  scopeContext?: ScopeContext
): ClientPersonalDetailsRecordQuery {
  const { request, useUrl, queryClient } = useQuery();
  const clientId = resolveClientId(scopeContext);

  const targetUrl = () =>
    useUrl(`clients/${clientId.value}`, {
      with: "custom_fields,custom_fields.field"
    });
  const url = targetUrl();

  const currentScope = getCurrentScope();
  const scope = currentScope?.active ? currentScope : effectScope(true);

  const response = scope.run(() =>
    vueUseQuery<IClient, DefaultError, ProfileRecord>(
      {
        queryKey: ["client", clientId, RECORD_QUERY_KEY_SEGMENT],
        queryFn: async () => {
          if (!isAddressable(clientId.value)) {
            throw new NotAuthenticatedError();
          }
          url.pathname = targetUrl().pathname;
          return request<IClient>({ url, withAccessToken: true }).then(
            r => r.data as IClient
          );
        },
        select: mapProfile,
        enabled: () => isAddressable(clientId.value),
        staleTime: useTime().DAY
      },
      queryClient
    )
  );

  return {
    ...response,
    data: computed(
      (): ProfileRecord => response?.data?.value ?? ({} as ProfileRecord)
    )
  } as ClientPersonalDetailsRecordQuery;
}

/**
 * One-shot read of the SAME resource A's `loadClientBrandId` reads, for the
 * MANAGER's `loadLookups` — but NOT through `queryClient`/the shared
 * `["client", clientId, "record"]` cache entry (F5).
 *
 * @decision bypass the TanStack cache for this one call — raw `request()`,
 * never `useQuery().get()`.
 * what:    fetches `clients/{id}?with=custom_fields,custom_fields.field`
 *          directly via `request()` and returns the raw record, instead of going
 *          through `get()` (`query.services.ts`'s `getRequest`) under the
 *          shared `recordQueryKey`.
 * why:     `get()` BAKES its `select` INSIDE `queryFn` — the value `select`
 *          produces is what `queryClient` stores under the key, not the raw
 *          response. `getRequest`'s own `queryClient.fetchQuery` skips
 *          re-invoking `queryFn` (and therefore never re-applies EITHER
 *          side's `select`) whenever an existing cache entry for that key
 *          is still within `staleTime` — confirmed empirically: two
 *          `fetchQuery` calls against one key, each baking a DIFFERENT
 *          select into its own `queryFn`, and the second call — regardless
 *          of which one it is — receives the FIRST call's already-selected
 *          value verbatim, never running its own `queryFn`/`select` at all.
 *          A's `loadClientBrandId` (`client-custom-fields.services.ts`,
 *          closed/read-only) ALSO reads this exact URL under this exact key
 *          via `get()`, with `select: data => data?.brand_id`. `loadLookups`
 *          awaits A's collection readiness (which triggers
 *          `loadClientBrandId`) CONCURRENTLY with this fetch
 *          (`Promise.all`) — so whichever of the two `getRequest` calls'
 *          `queryFn` actually executes first "wins" the cache entry for the
 *          full `staleTime: DAY` window, and the OTHER caller — no matter
 *          which one it is — silently receives that shape instead of its
 *          own. Observed: A's brand lookup wins in practice, so this
 *          function was receiving `IClient["brand_id"]` (a bare string) and
 *          mapping it as if it were the whole `IClient` — every field
 *          `undefined`, `compactDeep` then strips them all, leaving
 *          `baseModel === { customFields: {} }` — exactly F5's symptom.
 *          Reordering (`await` this before `isReady()`) does not fix it
 *          either — it just inverts which side gets poisoned, and THAT
 *          side is A's brand resolution, a regression this run must not
 *          cause. The only route that protects BOTH readers without
 *          touching A or the shared query platform is for this one-shot
 *          read to never register under, or read from, the contested key.
 * cost:    this call always hits the network fresh — it can no longer
 *          dedupe with A's brand lookup or with `usePersonalDetails`'s own
 *          reactive read under the shared key. `usePersonalDetails.ts`'s
 *          OWN read (the observable "query-backed read under
 *          `["client", clientId, "record"]`") is UNCHANGED — this fix is
 *          scoped to the manager's internal one-shot lookup only.
 * rejected: sequencing `fetchProfileOnce` before `isReady()` so THIS call's
 *          `queryFn` wins the race instead — rejected, it only moves the
 *          poisoning onto A's `loadClientBrandId`, corrupting `brand_id`
 *          for AC-1/AC-2's definitions request instead of `baseModel` here.
 */
async function fetchProfileOnce(clientId?: string): Promise<IClient> {
  if (!isAddressable(clientId)) {
    return Promise.reject(new NotAuthenticatedError());
  }

  const { request, useUrl } = useQuery();

  return request<IClient>({
    url: useUrl(`clients/${clientId}`, {
      with: "custom_fields,custom_fields.field"
    }),
    withAccessToken: true
  }).then(response => response.data as IClient);
}

/**
 * MANAGER — `loading`'s context patch. Consumes A's bounded, error-settling
 * readiness (`isReady()`, safe to await inside this XState-invoked service
 * ONLY because that readiness is bounded — an unbounded wait here would hang
 * the whole manager in `loading` forever) plus A-8/A-9 for the base model's
 * `customFields` branch. `languages` stays `useBrand()`'s session list: for
 * the ONLY resolving cell (`client x self`) the session brand IS the target
 * client's brand (parity.yaml D11), so no per-client brand-settings fetch is
 * needed or built. The raw record lands in `record` — the merge base
 * `update()` writes the `meta` bag back against.
 */
async function loadLookups(
  context: ProfileContext,
  scopeContext: ScopeContext | undefined,
  record: Ref<IClient | undefined>
): Promise<Partial<ProfileContext>> {
  const clientId = resolveClientId(scopeContext);

  if (!isAddressable(clientId.value)) {
    return Promise.reject(new NotAuthenticatedError());
  }

  const { languages } = useBrand();
  // Threaded from THIS seam's own resolved id, not left to fall back to the
  // session client — every other call in this file derives its target the
  // same way; this is the one that didn't (review finding #6).
  const customFieldsScope = useClientCustomFields()
    .as(ScopeActorTypes.CLIENT)
    .for(ClientCustomFieldsContextTypes.CLIENT, clientId.value as string);
  const { isReady } = customFieldsScope.useActions();
  const { data: definitions } = customFieldsScope.useContext();

  const [, raw] = await Promise.all([
    isReady(),
    fetchProfileOnce(clientId.value)
  ]);
  record.value = raw;
  const profile = mapProfile(raw);

  /**
   * @decision `baseModel` is compacted here, the same way `parse()`'s final
   * `useModelParser(..., {allowExtraProps:false})` step compacts `model` —
   * amended: the ORIGINAL version of this block described `compactDeep` as
   * stripping only "null/undefined leaves". That was true but incomplete —
   * corrected below, because the omitted half is Blocker 1's own root
   * cause.
   * what:    `compactDeep(baseModel, {preserveContainers:true})` — drops
   *          any leaf `isMeaningful()` (`utils/isDeepEmpty.ts`) calls
   *          non-meaningful: `null`/`undefined` (an unset native field, a
   *          custom-field code with no stored value) AND an empty string
   *          `""` — before this is ever assigned to `context.baseModel`.
   * why:     AC-50 (G-12): `revert()` is `input(baseModel)` (R6 — no
   *          `REVERT` event), which round-trips `baseModel` through THIS
   *          SAME `useModelParser({allowExtraProps:false})` pipeline in
   *          `parse()`. That pipeline's own final step ALWAYS runs this
   *          compaction — on BOTH `allowExtraProps` branches, not only the
   *          `false` one this file passes — so an UNCOMPACTED `baseModel`
   *          (a plain object literal always carrying all four native keys,
   *          `undefined`-valued or not) can never be `isEqual` to the
   *          freshly round-tripped, compacted `model` a revert produces,
   *          even when nothing meaningful differs. `isDirty`
   *          (`usePersonalDetailsManager.meta.ts`) compares `model` to
   *          `baseModel` by value, so this mismatch pins `isDirty` true
   *          forever after any revert (and, for any client with an unset
   *          native field, immediately after load too).
   *          The SAME compaction step is why a field cleared to `""` during
   *          editing vanished from `model` entirely rather than surviving
   *          as `""`/`null` — Blocker 1, AC-46/AC-47's own defect, fixed at
   *          `parse()`'s `restoreClearedFields` below, NOT here: this
   *          compaction runs once, at the SEED, over the SERVER's OWN
   *          values (which this run never clears), while Blocker 1 is about
   *          the CALLER'S clear intent surviving the SAME pipeline on every
   *          subsequent edit. Two different inputs hitting one shared
   *          platform behaviour — not one bug, two call sites needing the
   *          same accommodation.
   * rejected: comparing via `isDirty()` (`utils/isDeepEmpty.ts`, which
   *          itself compacts both sides before comparing) instead of fixing
   *          the seed — rejected: that would leave `context.baseModel`
   *          itself inconsistent with what every subsequent `parse()` cycle
   *          produces, which is the actual defect: the SEED, not the
   *          comparison.
   */
  const baseModel = compactDeep(
    {
      firstName: profile.firstName,
      lastName: profile.lastName,
      publicName: profile.publicName,
      language: profile.language,
      // `useModelParser` casts an unset boolean to `false` on every parse
      // (`useValidation.ts` — "we dont want null or undefined for booleans"),
      // so the diff floor must hold the same value or the toggle reads dirty
      // on load and every unrelated save carries a `meta` bag.
      excludeDelegatedProducts: profile.excludeDelegatedProducts ?? false,
      customFields: mapCustomFieldValues(
        profile.customFieldValues,
        definitions.value
      )
    },
    { preserveContainers: true }
  ) as ProfileModel;

  return {
    model: baseModel,
    baseModel,
    lookups: {
      ...context.lookups,
      fields: definitions.value,
      languages: languages.value
    }
  };
}

/**
 * `available.checking.parsing` — schema-parses whatever the SET event
 * carried, floored against `baseModel`. `allowExtraProps: false` is what
 * makes this real work rather than a no-op (AC-53): an out-of-schema key in
 * the incoming data is dropped, not silently re-merged back in.
 */
async function parse(
  context: ProfileContext,
  data?: unknown
): Promise<Partial<ProfileContext>> {
  const incoming = get(data, "model", data) as Partial<ProfileModel>;

  const safeModel = restoreClearedFields(
    useModelParser<ProfileModel>(context.schema, incoming, context.baseModel, {
      allowExtraProps: false
    }),
    incoming
  );

  return { model: safeModel };
}

/** Schema validation, typed against `ProfileContext` (never `Partial<any>`). */
async function validate(
  context: ProfileContext
): Promise<ProfileModel | undefined> {
  const { t } = useI18n();
  const schema = useSchema(context);
  const { validate: validateAgainstSchema } = useValidation();

  return new Promise((resolve, reject) => {
    const errors = validateAgainstSchema(schema, context.model);
    if (errors?.length) {
      reject(
        new DetailedError(
          t("error.client_profile_validation_failed"),
          responseCodes.Unprocessable_Entity,
          ErrorOrigin.Headless,
          errors
        )
      );
    } else {
      resolve(context.model);
    }
  });
}

/**
 * Diff-only PUT (AC-45..AC-49). `mapIProfileFields` returns `undefined` for
 * an empty diff, which this short-circuits into a zero-request resolve —
 * legacy's own `_.isEmpty(this.formValues)` guard. A `meta` diff is merged
 * over the held record's bag — the PUT replaces the bag wholesale, so the
 * other UI keys must ride along (section 8.5); with no record held it
 * rejects rather than send a bare one-key bag.
 */
async function update(
  model: ProfileModel,
  baseModel: ProfileModel = {},
  scopeContext: ScopeContext | undefined,
  record: Ref<IClient | undefined>
): Promise<IClient> {
  const { put, useUrl } = useQuery();
  const clientId = resolveClientId(scopeContext);

  if (!isAddressable(clientId.value)) {
    return Promise.reject(new NotAuthenticatedError());
  }

  const diff = mapIProfileFields(model, baseModel);
  if (diff === undefined) return {} as IClient;

  if (diff.meta) {
    if (!record.value) {
      return Promise.reject(
        new DetailedError(
          useI18n().t("error.client_personal_details_update_failed"),
          responseCodes.Conflict,
          ErrorOrigin.Headless,
          { meta: diff.meta }
        )
      );
    }
    diff.meta = { ...record.value.meta, ...diff.meta };
  }

  return put<IClient>({
    mutationKey: recordQueryKey(clientId.value),
    url: useUrl(`clients/${clientId.value}`),
    data: diff,
    withAccessToken: true,
    withoutLocale: true
  })
    .then(
      invalidateQueryByKey(recordQueryKey(clientId.value), { exact: false })
    )
    .then(client => {
      const saved = client as IClient | undefined;
      if (saved?.id) record.value = saved;
      // The save already succeeded — this locale refresh is a follow-on
      // side effect, not part of the transaction. `setLocale` throws when
      // no i18n instance is registered (`system-localisation/useI18n.ts`);
      // caught here, not fixed there, since that throw is the wrapper's own
      // contract for every OTHER caller. Never awaited into the return
      // chain either, so a slow/failed locale load cannot delay or fail a
      // save that has already landed.
      if (saved?.interface_language_code) {
        useLocale()
          .setLocale(saved.interface_language_code)
          .catch(() => undefined);
      }
      return (saved ?? {}) as IClient;
    });
}

/** Invalidates this scope's own cache key so the read refetches (AC-52). */
async function refresh(scopeContext?: ScopeContext): Promise<void> {
  const clientId = resolveClientId(scopeContext);
  await invalidateQueryByKey(recordQueryKey(clientId.value), {
    exact: false
  })(undefined);
}

// -----------------------------------------------------------------------------
// Service Factory

/**
 * Service matrix: maps scopeActor types to their service implementations.
 * The shape is the same armed or armless — an armless module has only the
 * `default:` case.
 */
function scopedServices(
  scopeActor: ScopeActorTypes,
  _scopeContext?: ScopeContext
): Partial<ClientPersonalDetailsServices> {
  switch (scopeActor) {
    default:
      return {};
  }
}

// -----------------------------------------------------------------------------
// Scope-Ready Services

/**
 * Services factory — the concrete actor and the context it acts upon arrive
 * first, at construction. `usePersonalDetails.ts` calls it once and so does
 * `usePersonalDetailsManager.ts`, each with ITS OWN resolved scope.
 */
export const createClientPersonalDetailsServices = (
  scopeActor: ScopeActorTypes,
  scopeContext?: ScopeContext
): ClientPersonalDetailsServices => {
  const mutationError = ref<ResponseError | undefined>(undefined);
  const record = ref<IClient | undefined>(undefined);
  const clientId = resolveClientId(scopeContext);

  return {
    queryKey,
    clientId,
    isAvailable: computed(() => isAddressable(clientId.value)),
    error: computed(() => mutationError.value),
    loadProfile: () => loadProfile(scopeContext),
    loadLookups: context => loadLookups(context, scopeContext, record),
    parse: (context, data) => parse(context, data),
    validate,
    update: (model, baseModel) =>
      update(model, baseModel, scopeContext, record),
    refresh: () => refresh(scopeContext),
    ...scopedServices(scopeActor, scopeContext)
  };
};

// -----------------------------------------------------------------------------
// Machine-Ready Services (manager half)

/**
 * Adapts the ALREADY-SCOPED services object into the XState services map the
 * shared `dataManagerMachine` invokes. Takes `service` as an argument rather
 * than minting its own — the scope, and therefore the target client, is
 * resolved ONCE in `usePersonalDetailsManager.ts` and threaded in.
 * @internal
 */
export const useClientPersonalDetailsManagerServices = (
  service: ClientPersonalDetailsServices
): ClientPersonalDetailsManagerMachineServices => ({
  loadLookups: context => service.loadLookups(context),

  parse: (context, event) => service.parse(context, get(event, "data")),

  validate: context => service.validate(context),

  /**
   * `processing.adding` — never reached (see the type's own docstring); a
   * defensive rejection rather than a silent no-op if the guard is ever
   * wrong.
   */
  add: () =>
    Promise.reject(
      new DetailedError(
        useI18n().t("error.client_personal_details_not_available"),
        responseCodes.No_Content,
        ErrorOrigin.Headless
      )
    ),

  update: ({ model, baseModel }: ProfileContext) =>
    !isEmpty(model)
      ? service
          .update(model as ProfileModel, baseModel)
          .then(() => ({ ...baseModel, ...model }) as ProfileModel)
          .catch(error => {
            throw mapToHeadlessError(error);
          })
      : Promise.reject(
          new DetailedError(
            useI18n().t("error.client_personal_details_not_available"),
            responseCodes.No_Content,
            ErrorOrigin.Headless,
            { model }
          )
        )
});

export default createClientPersonalDetailsServices;
