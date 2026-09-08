/** @internal */
import { useQuery as vueUseQuery } from "@tanstack/vue-query";
import { computed, effectScope, getCurrentScope, ref } from "vue";
import { BrandConfigKeys } from "@upmind-automation/types";
import { useBrand } from "../brand";
import { invalidateQueryByKey, useQuery } from "../query";
import { useActiveSession } from "../session-store";
import { useI18n } from "../system-localisation";
import {
  mapBillingSettings,
  mapIBillingSettingsFields
} from "./client-billing-settings.mappers";
import { useSchema } from "./client-billing-settings.schemas";
import { ClientBillingSettingsContextTypes } from "./client-billing-settings.types";
import {
  ErrorOrigin,
  useTime,
  useValidation,
  DetailedError,
  responseCodes,
  useModelParser,
  NotAuthenticatedError
} from "../../utils";
import { get, isEmpty } from "lodash-es";
import type { ScopeContext } from "../scope";
import type {
  BillingSettingsContext,
  BillingSettingsModel,
  BillingSettingsRecord,
  ClientBillingSettingsManagerMachineServices,
  ClientBillingSettingsRecordQuery,
  ClientBillingSettingsServices
} from "./client-billing-settings.types";
import type { ResponseError } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { DefaultError, QueryKey } from "@tanstack/vue-query";
import type { IClient } from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @module client-billing-settings/client-billing-settings.services
 * @description The ONE services file both halves consume — the read half's
 * reactive settings query, the manager's lookups/parse/validate/update, and
 * the XState services adapter the shared `dataManagerMachine` invokes. One
 * factory on purpose: one identity seam, one cache key, one arm-resolution
 * switch.
 *
 * Nothing here raises feedback. A failure rejects for the caller and lands
 * in the scope's own error state, which the composables expose.
 *
 * WARNING: Do not import directly from another module. Resolve via
 * `useBillingSettings.ts` / `useBillingSettingsManager.ts` only
 * (`@internal/no-cross-module-imports`).
 */
// -----------------------------------------------------------------------------

/** The module's base cache key prefix. */
export const queryKey: QueryKey = ["client"];

/**
 * The last segment of the shared client-record key. MUST stay byte-identical
 * to `client-personal-details.services.ts`'s own private
 * `RECORD_QUERY_KEY_SEGMENT` and `client-custom-fields.services.ts`'s own —
 * this module resolves the SAME `clients/{id}?with=custom_fields,custom_fields.field`
 * resource under the SAME key, so all three dedupe onto one request. Not
 * imported from either sibling's `@internal` services file (their own module
 * boundary refuses it) — mirrored as a literal, exactly as they mirror it
 * from each other.
 */
const RECORD_QUERY_KEY_SEGMENT = "record" as const;

/** Builds the shared client-record key for a resolved id. */
function recordQueryKey(clientId?: string): QueryKey {
  return ["client", clientId, RECORD_QUERY_KEY_SEGMENT];
}

/** The five model keys, in wire-diff order. */
const MODEL_KEYS = [
  "enabled",
  "baseRule",
  "dayOfWeek",
  "dateOfMonthDay",
  "dueDateDay"
] as const;

/**
 * Derives the target client id from the RESOLVED scope — the ONE seam every
 * request-issuing function in this file shares. A `SETTINGS` context names
 * the settings being addressed, which IS the owning client's id; with none it
 * falls back to the active session's own client (the self case). Both halves
 * share this one seam, which is what makes AC1's read-back (read and write
 * resolve the SAME id) executable, and is the guard against the FE-2824
 * defect shape (a services file that hardwires the session id and drops
 * `.for('client', id)`).
 */
function resolveClientId(scopeContext?: ScopeContext) {
  const { activeUser } = useActiveSession().useContext();

  return computed(() =>
    scopeContext?.type === ClientBillingSettingsContextTypes.SETTINGS
      ? scopeContext.id
      : activeUser.value?.id
  );
}

/**
 * Resolves true only for an authenticated session with an addressable
 * client. The module's ONE addressability predicate — every request gate
 * here calls it.
 */
function isAddressable(clientId?: string): boolean {
  const { isAuthenticated } = useActiveSession().useMeta();

  return isAuthenticated.value && !!clientId;
}

/**
 * READ HALF — the reactive single-record query, minted once per scope.
 *
 * @decision Share the client-record cache key and URL with
 * `client-personal-details` and `client-custom-fields`, and read it ONLY
 * through a reactive `vueUseQuery` with a module-local `select:`.
 * what:    queryKey `["client", clientId, "record"]`; URL
 *          `clients/{id}?with=custom_fields,custom_fields.field`; a reactive
 *          `vueUseQuery` + `select: mapBillingSettings`. The `"record"`
 *          segment is mirrored as a local literal, NOT imported — the
 *          sibling modules refuse that same import across their own module
 *          boundaries, and this module refuses it for the same reason.
 * why:     `vueUseQuery` (a REACTIVE observer, unlike `useQuery().get()`)
 *          stores the RAW `IClient` and applies `select` PER OBSERVER —
 *          true in ISOLATION. A third reactive observer on this key
 *          therefore gets its own projection at ZERO extra requests, and
 *          cannot change what the other two see. The URL must be shared
 *          too: a bare `clients/{id}` under the same key would race the
 *          `with=` variant and strip custom fields from the sibling's
 *          projection.
 * residual-risk: this module's own reads never poison the entry, but a
 *          CO-OWNER can poison it BEFORE this observer ever mounts.
 *          `client-custom-fields.services.ts:205-213`'s `loadClientBrandId`
 *          reads this SAME key via `getOne()` (`useQuery().get()`) with
 *          `select: data => data?.brand_id` — the exact `get()` hazard
 *          `rejected: (2)` below diagnoses, self-inflicted by a sibling
 *          this module does not control. If that call's `queryFn` wins the
 *          race for the entry (observed in practice at
 *          `client-personal-details.services.ts:199-218`), the cache holds
 *          a bare `brand_id` string for the full `staleTime: DAY` window;
 *          this module's `vueUseQuery` observer then mounts against that
 *          already-poisoned entry, does not refetch within `staleTime`, and
 *          runs `mapBillingSettings` over a string — every field
 *          `undefined`, so the read half silently reports no preference.
 *          Not fixed here: the fix belongs to whichever of the two
 *          `get()`-based readers stops registering under this key
 *          (`client-custom-fields`/`client-personal-details`'s own
 *          write lanes), not to this module's reactive read.
 * rejected: (1) Mint a private key `["client", clientId, "billing-settings"]`
 *          — doubles the request count for data already cached, for no
 *          isolation benefit that `select` does not already give.
 *          (2) Read this key with `useQuery().get()` — POISONS it. `get()`
 *          bakes `select` INSIDE `queryFn`, so the SELECTED value is what
 *          gets stored; a second `fetchQuery` within `staleTime` then
 *          returns the FIRST caller's shape. This is documented at
 *          `client-personal-details.services.ts:184-215` and is why this
 *          module's own `fetchSettingsOnce` (below) bypasses the wrapper
 *          with a raw `request()` instead of calling `get()`.
 *
 * Hard rule: `useQuery().get()` must never be called on this key.
 */
function loadSettings(
  scopeContext?: ScopeContext
): ClientBillingSettingsRecordQuery {
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
    vueUseQuery<IClient, DefaultError, BillingSettingsRecord>(
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
        select: mapBillingSettings,
        enabled: () => isAddressable(clientId.value),
        staleTime: useTime().DAY
      },
      queryClient
    )
  );

  return {
    ...response,
    data: computed(
      (): BillingSettingsRecord =>
        response?.data?.value ?? ({} as BillingSettingsRecord)
    )
  } as ClientBillingSettingsRecordQuery;
}

/**
 * One-shot read of the SAME resource `loadSettings` reads, for the
 * MANAGER's `loadLookups` and `update`'s own staged-import check — NOT
 * through `queryClient`/the shared `["client", clientId, "record"]` cache
 * entry, for the same reason `client-personal-details.services.ts:184-215`
 * bypasses the wrapper: `useQuery().get()` bakes `select` inside `queryFn`
 * and poisons the entry for the other owners of this key.
 */
async function fetchSettingsOnce(
  clientId?: string
): Promise<BillingSettingsRecord | undefined> {
  if (!isAddressable(clientId)) {
    return Promise.reject(new NotAuthenticatedError());
  }

  const { request, useUrl } = useQuery();

  return request<IClient>({
    url: useUrl(`clients/${clientId}`, {
      with: "custom_fields,custom_fields.field"
    }),
    withAccessToken: true
  }).then(response => mapBillingSettings(response.data as IClient));
}

/**
 * Row O8's brand gate. Consumes `useBrand().ensureConfig()`'s OWN settled
 * return value directly, rather than re-reading it afterward through
 * `useBrand().getConfigValue()`'s reactive computed.
 *
 * @decision never re-read the value via `useBrand().getConfigValue()`.
 * what:    `ensureConfig()` resolves once ITS OWN fresh fetch settles;
 *          `getConfigValue()` instead reads `brandConfig.value`, which is
 *          fed by `useBrand()`'s module-singleton query
 *          (`brandConfigQuery ??= services.fetchBrandConfig()`, `useBrand.ts:69`).
 *          That singleton fetches once, on whichever call FIRST constructs
 *          `useBrand()` anywhere in the running app, and never re-fetches
 *          afterward — so a caller reading `getConfigValue()` after
 *          `ensureConfig()` resolves can still observe whatever value an
 *          EARLIER, unrelated `useBrand()` construction happened to see.
 * why:     row O8's default is HIDDEN (design.md §8.2); a stale read that
 *          resolves to the wrong polarity exposes a surface the brand never
 *          opted clients into — exactly the failure AC17 exists to catch.
 *          Consuming `ensureConfig()`'s own settled value sidesteps the
 *          singleton's staleness entirely, for both halves of this module.
 * rejected: keep reading `useBrand().getConfigValue()` and instead call
 *          `useBrand().ensureConfig()` earlier / more eagerly — rejected:
 *          the singleton this reads (`brandConfigQuery`) is shared with the
 *          WHOLE app and is out of this module's write lane
 *          (`packages/headless/src/modules/brand/`); no earlier call site
 *          this module owns can guarantee it wins the race against another
 *          consumer's own `useBrand()` construction.
 */
async function loadVisibility(): Promise<boolean | undefined> {
  const result = await useBrand().ensureConfig(
    BrandConfigKeys.INVOICE_CONSOLIDATION_RESTRICT_TO_STAFF
  );
  return get(
    result,
    BrandConfigKeys.INVOICE_CONSOLIDATION_RESTRICT_TO_STAFF
  ) as boolean | undefined;
}

/**
 * MANAGER — `loading`'s context patch. Reads the settings record once (the
 * base model) and the brand's `restrict_to_staff` gate (row O8), stored in
 * the machine's own `context.config` — the field `DataManagerContext`
 * already declares for exactly this shape (`Record<BrandConfigKeys, boolean>`).
 */
async function loadLookups(
  context: BillingSettingsContext,
  scopeContext?: ScopeContext
): Promise<Partial<BillingSettingsContext>> {
  const clientId = resolveClientId(scopeContext);

  if (!isAddressable(clientId.value)) {
    return Promise.reject(new NotAuthenticatedError());
  }

  const [record, restrictToStaff] = await Promise.all([
    fetchSettingsOnce(clientId.value),
    loadVisibility()
  ]);

  const baseModel: BillingSettingsModel = {
    enabled: record?.enabled,
    baseRule: record?.baseRule,
    dayOfWeek: record?.dayOfWeek,
    dateOfMonthDay: record?.dateOfMonthDay,
    dueDateDay: record?.dueDateDay
  };

  return {
    model: baseModel,
    baseModel,
    lookups: {
      ...context.lookups,
      // Array-wrapped — `DataManagerContext.lookups` is typed
      // `Record<string, any[]>` (every other consumer stores a genuine
      // collection there); this is the one scalar this module threads
      // through it, so it travels as a single-element array rather than
      // widening the shared, protected type.
      isStaged: [!!record?.isStaged]
    },
    config: {
      ...context.config,
      // Tri-state preserved: an absent brand key must stay absent, not
      // collapse to a literal `false` — the oracle's `!(config[KEY] ?? true)`
      // (comp:72-79) only shows the surface for an EXPLICIT `false`; a
      // collapsed-to-`false` absent key would otherwise read downstream as
      // that same explicit opt-in.
      ...(restrictToStaff !== undefined && {
        [BrandConfigKeys.INVOICE_CONSOLIDATION_RESTRICT_TO_STAFF]:
          restrictToStaff
      })
    } as Record<BrandConfigKeys, boolean>
  };
}

/** `true` for any value the caller explicitly set — `undefined` alone means "untouched". */
function isMeaningfulLeaf(value: unknown): boolean {
  return value !== undefined;
}

/**
 * Re-instates every key the caller explicitly set (`0`, `null`, or any other
 * value `useModelParser`'s own final `compactDeep` step dropped) — hazard H5
 * / row X3, the numeric twin of `client-personal-details.services.ts:426-454`
 * `restoreClearedFields`.
 *
 * @decision restore the INCOMING value verbatim, never a fixed placeholder.
 * what:    for every one of the five `MODEL_KEYS` that `incoming` carries a
 *          meaningful (non-`undefined`) value for, but `parsed` dropped,
 *          restore `parsed[key] = incoming[key]` exactly — `0` stays `0`,
 *          `null` stays `null`. A key `incoming` never mentions is left
 *          alone; this never invents a value, only preserves one the caller
 *          already stated.
 * why:     every cleared field in this module's model represents "follow the
 *          brand" as a literal `null` (design.md §4.2) — not `""` as the
 *          string-half exemplar restores — so the restoration target is the
 *          caller's own value, not a fixed shape. `InvoiceConsolidationTypes.DISABLED`
 *          is `0`, which is ALREADY meaningful under `isMeaningful()`
 *          (`utils/isDeepEmpty.ts` treats every number, including `0`, as
 *          meaningful) — this restore is the defensive twin that also
 *          survives a future compaction-rule change, and is what carries the
 *          four nullable fields' `null` clear (which `compactDeep` DOES
 *          strip today) all the way through.
 * rejected: restoring only the nullable four and skipping `enabled` —
 *          rejected: hazard H5 is explicitly the run's highest-risk defect,
 *          and a restore that omits the one field the hazard names would be
 *          decorative, not load-bearing.
 */
function restoreCompactedFields(
  parsed: BillingSettingsModel,
  incoming?: Partial<BillingSettingsModel>
): BillingSettingsModel {
  if (!incoming) return parsed;

  const restored: BillingSettingsModel = { ...parsed };

  for (const key of MODEL_KEYS) {
    if (isMeaningfulLeaf(incoming[key]) && !(key in restored)) {
      restored[key] = incoming[key] as never;
    }
  }

  return restored;
}

/**
 * `available.checking.parsing` — schema-parses whatever the SET event
 * carried, floored against `baseModel`. `allowExtraProps: false` drops an
 * out-of-schema key rather than silently re-merging it back in.
 */
async function parse(
  context: BillingSettingsContext,
  data?: unknown
): Promise<Partial<BillingSettingsContext>> {
  const incoming = get(data, "model", data) as Partial<BillingSettingsModel>;

  const safeModel = restoreCompactedFields(
    useModelParser<BillingSettingsModel>(
      context.schema,
      incoming,
      context.baseModel,
      { allowExtraProps: false }
    ),
    incoming
  );

  return { model: safeModel };
}

/** Schema validation, typed against `BillingSettingsContext`. */
async function validate(
  context: BillingSettingsContext
): Promise<BillingSettingsModel | undefined> {
  const { t } = useI18n();
  const schema = useSchema(context);
  const { validate: validateAgainstSchema } = useValidation();

  return new Promise((resolve, reject) => {
    const errors = validateAgainstSchema(schema, context.model);
    if (errors?.length) {
      reject(
        new DetailedError(
          t("error.client_billing_settings_validation_failed"),
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
 * Diff-only PUT (AC11, AC12, AC18). `mapIBillingSettingsFields` returns
 * `undefined` for an empty diff, which this short-circuits into a
 * zero-request resolve — legacy's own `formIsChanged` guard (`form:303`).
 * Refuses BEFORE the diff or any request when the record is a staged import
 * (row C14) — checked independently of the machine's own `isEditable` gate,
 * so a direct `service.update()` call cannot bypass the lockout.
 */
async function update(
  model: BillingSettingsModel,
  baseModel: BillingSettingsModel = {},
  scopeContext?: ScopeContext
): Promise<IClient> {
  const { put, useUrl } = useQuery();
  const clientId = resolveClientId(scopeContext);

  if (!isAddressable(clientId.value)) {
    return Promise.reject(new NotAuthenticatedError());
  }

  const current = await fetchSettingsOnce(clientId.value);
  if (current?.isStaged) {
    return Promise.reject(
      new DetailedError(
        useI18n().t("error.client_billing_settings_staged_import"),
        responseCodes.Forbidden,
        ErrorOrigin.Headless
      )
    );
  }

  const diff = mapIBillingSettingsFields(model, baseModel);
  if (diff === undefined) return {} as IClient;

  return put<IClient>({
    mutationKey: recordQueryKey(clientId.value),
    url: useUrl(`clients/${clientId.value}`),
    data: diff,
    withAccessToken: true,
    withoutLocale: true
  }).then(
    invalidateQueryByKey(recordQueryKey(clientId.value), { exact: false })
  ) as Promise<IClient>;
}

/** Invalidates this scope's own cache key so the read refetches. */
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
 * `default:` case. This module's arms determination is `none` at every layer
 * (`parity.yaml`'s `arms:` block, independently re-derived at Code) — the
 * ONLY resolving actor is `client`, so clause 3's comparative test never
 * fires.
 */
function scopedServices(
  scopeActor: ScopeActorTypes,
  _scopeContext?: ScopeContext
): Partial<ClientBillingSettingsServices> {
  switch (scopeActor) {
    default:
      return {};
  }
}

// -----------------------------------------------------------------------------
// Scope-Ready Services

/**
 * Services factory — the concrete actor and the context it acts upon arrive
 * first, at construction. `useBillingSettings.ts` calls it once and so does
 * `useBillingSettingsManager.ts`, each with ITS OWN resolved scope.
 */
export const createClientBillingSettingsServices = (
  scopeActor: ScopeActorTypes,
  scopeContext?: ScopeContext
): ClientBillingSettingsServices => {
  const mutationError = ref<ResponseError | undefined>(undefined);
  const clientId = resolveClientId(scopeContext);

  return {
    queryKey,
    clientId,
    isAvailable: computed(() => isAddressable(clientId.value)),
    error: computed(() => mutationError.value),
    loadSettings: () => loadSettings(scopeContext),
    loadLookups: context => loadLookups(context, scopeContext),
    loadVisibility,
    parse: (context, data) => parse(context, data),
    validate,
    update: (model, baseModel) => update(model, baseModel, scopeContext),
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
 * resolved ONCE in `useBillingSettingsManager.ts` and threaded in.
 * @internal
 */
export const useClientBillingSettingsManagerServices = (
  service: ClientBillingSettingsServices
): ClientBillingSettingsManagerMachineServices => ({
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
        useI18n().t("error.client_billing_settings_not_available"),
        responseCodes.No_Content,
        ErrorOrigin.Headless
      )
    ),

  update: ({ model, baseModel }: BillingSettingsContext) =>
    !isEmpty(model)
      ? service
          .update(model as BillingSettingsModel, baseModel)
          .then(() => ({ ...baseModel, ...model }) as BillingSettingsModel)
      : Promise.reject(
          new DetailedError(
            useI18n().t("error.client_billing_settings_not_available"),
            responseCodes.No_Content,
            ErrorOrigin.Headless,
            { model }
          )
        )
});

export default createClientBillingSettingsServices;
