/** @internal */
import { useQuery as vueUseQuery } from "@tanstack/vue-query";
import { computed, effectScope, getCurrentScope, ref } from "vue";
import { AccessRoleTypes, BrandConfigKeys } from "@upmind-automation/types";
import { useBrand } from "../brand";
import { invalidateQueryByKey, useQuery } from "../query";
import { useActiveSession, useSessionStore } from "../session-store";
import { useI18n } from "../system-localisation";
import {
  mapIAccountCurrencyFields,
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
import {
  cloneDeep,
  concat,
  first,
  get,
  isEmpty,
  orderBy,
  some
} from "lodash-es";
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
import type { IAccount, ICurrency, IClient } from "@upmind-automation/types";
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

/**
 * The seven model keys, in wire-diff order — the five consolidation keys plus
 * the two account-currency keys folded in 2026-09-09 (hazard H5b, row X5).
 */
const MODEL_KEYS = [
  "enabled",
  "baseRule",
  "dayOfWeek",
  "dateOfMonthDay",
  "dueDateDay",
  "currencyId",
  "preferredPaymentCurrencyId"
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
 * Derives the account this slice addresses — the SECOND identity seam in
 * this file, and the one every account-currency read and write shares.
 *
 * Resolves to the account ONLY when the scope-resolved client is the
 * session's OWN client. When they differ it resolves to `undefined`, which
 * withholds the whole slice (row X7 / AC25) rather than serving the session
 * client's account under another client's id.
 *
 * @decision read the account off the session's already-loaded account list,
 * never off a read of this module's own.
 * what:    `useActiveSession().useContext().activeUser.value?.accounts?.[0]`,
 *          guarded on `clientId === activeUser.id`. Zero requests. No cache
 *          key of this module's own. The shared client-record key's key,
 *          URL and `with=` set are untouched (row X4).
 * why:     the value is ALREADY in the app, on a read the app already
 *          issues, mapped by code already shipped, backed by a capture this
 *          module's own harness already replays, and consumed in production
 *          by `basket-currency.utils.ts:171` (`first(activeUser.value?.accounts)`,
 *          verbatim — the SAME landed pattern, not a new one).
 * rejected: (1) widen the shared `with=` to carry `accounts` — changes the
 *          SHARED key's URL, which `client-personal-details` and
 *          `client-custom-fields` both resolve under (row X2), and operator
 *          ruling r1 forbids modifying either. Not proposed, because it is
 *          not needed: the value arrives without it. (2) mint a private key
 *          and read `GET accounts/{accountId}` — the `accountId` would
 *          STILL have to come from the session, so it buys no independence;
 *          it costs a request for data already in memory; the oracle never
 *          issues such a read (`basicForm:143-145` takes `accounts` off the
 *          client prop); and it would leave row X6 unsolved, because the
 *          app-wide consumer reads `activeUser.accounts`, not a query key.
 *          (3) drop the `clientId === activeUser.id` guard and just take
 *          `accounts[0]` — the FE-2824 defect verbatim: the right surface
 *          addressing the wrong entity, silently.
 */
function resolveAccount(scopeContext?: ScopeContext) {
  const { activeUser } = useActiveSession().useContext();
  const clientId = resolveClientId(scopeContext);

  return computed(() =>
    clientId.value && clientId.value === activeUser.value?.id
      ? first(activeUser.value?.accounts)
      : undefined
  );
}

/**
 * The currencies both account-currency controls offer. The brand's
 * supported set, ordered by NAME (the oracle's order), plus the account's
 * own currency when the brand list omits it (row B3) so a client on a
 * non-brand currency can still see and keep it.
 *
 * @decision expose the currency options as a reactive computed, NEVER as an
 * awaited entry in `loadLookups`.
 * what:    a module-local computed over `useBrand().currencies`, re-ordered
 *          by `name` and appended with the account's own `currency` relation
 *          when absent. `loadLookups` is NOT extended for it.
 * why:     there is no awaitable settle channel for brand SETTINGS this
 *          module may call — `useBrand().isReady()` is an uncapped 100ms
 *          `setInterval` poll over a module-singleton query, the known
 *          shared-readiness stall shape this module's own `@decision` above
 *          already refuses. A computed needs no settle: it re-derives when
 *          the singleton's query lands.
 * rejected: (1) `await useBrand().isReady()` inside `loadLookups` — the
 *          stall shape above. (2) `useQuery().get()` on `["brand","settings"]`
 *          — poisons the key (row X2 `rejected:(2)` reason), and worse here:
 *          `staleTime` is `"static"` with a localStorage persister, so a
 *          poisoned entry never recovers. (3) ship `useBrand().currencies`
 *          unchanged — it sorts by CODE, not name, and does not append the
 *          account's own currency; both are oracle behaviours (row B3).
 */
function currencyOptions(scopeContext?: ScopeContext) {
  const account = resolveAccount(scopeContext);

  return computed(() => {
    const brandCurrencies = useBrand().currencies.value;
    const own = account.value?.currency;
    const list =
      own && !some(brandCurrencies, { id: own.id })
        ? concat(brandCurrencies, own)
        : brandCurrencies;

    return orderBy(list, ["name"], ["asc"]) as ICurrency[];
  });
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
 * Row O8's AND row B6's brand gates, read in ONE call and returned as TWO
 * separately-named values. A RAW, uncached `request()` — never
 * `useBrand().ensureConfig()` — for the same reason `fetchSettingsOnce`
 * above bypasses `useQuery().get()`.
 *
 * @decision one raw `request()` call carrying both keys; two
 * separately-named readers, each indexing the FLAT response object
 * directly; never a shared helper, default or `??` fallback between them.
 * what:    `GET config/brand/values?keys=<O8>,<B6>` issued directly through
 *          `useQuery().request()`, bypassing `useBrand()` entirely.
 * why:     `useBrand().ensureConfig()` resolves through
 *          `fetchBrandConfig()` (`brand.services.ts`), whose query is
 *          registered with `staleTime: "static"` AND a `localStorage`
 *          persister. Proven live (2026-09-09 repair): once ANY caller
 *          resolves that query for this file's two-key set, every LATER
 *          call — even a brand-new `effectScope`, even after
 *          `queryClient.clear()` — is served the SAME persisted value
 *          instead of a fresh fetch, because `.clear()` empties the
 *          in-memory cache but not the persister's own store, and
 *          `"static"` never re-triggers a background refetch. Confirmed by
 *          instrumenting `loadBrandGates` directly: `differentCurrencyPayment`
 *          logged `true` for a dozen consecutive calls across DIFFERENT
 *          MSW overrides before this fix, including the two `it.each` cases
 *          this AC23 failure names. `restrict_to_staff` (O8) "resolved
 *          correctly" only because this file's OWN test cases never vary
 *          IT across calls, so the identical staleness bug never showed —
 *          it is not a difference in mechanism between the two keys, only
 *          in which key this file's fixtures happen to move. A raw
 *          `request()` has no query cache and no persister: every call is
 *          a genuine network round-trip, so a fresh test always sees its
 *          own installed handler. `useBrand()`'s shared singleton
 *          (`brandConfigQuery`) is out of this module's write lane
 *          (`packages/headless/src/modules/brand/`) regardless, so the fix
 *          stays entirely inside this module.
 * rejected: (1) keep `ensureConfig()` and call it earlier/more eagerly —
 *          does not touch the persister; the staleness survives regardless
 *          of when the call happens. (2) clear `queryClient` more
 *          aggressively from this module — the persisted entry lives
 *          outside `queryClient`'s own cache and this module has no
 *          access to (and no business owning) `brand`'s persister
 *          instance. (3) a shared `isGateOpen(key)` helper over the raw
 *          response — the conflation vector this module has refused since
 *          its first draft; each key is still read by its own `get()` call
 *          below, unchanged. (4) collapsing an absent B6 key to a literal
 *          `false` at the LOAD site — the exact mistake O8's tri-state
 *          comment below exists to prevent; the raw response's absence is
 *          preserved exactly as `ensureConfig()`'s was.
 */
async function loadBrandGates(): Promise<{
  restrictToStaff: boolean | undefined;
  differentCurrencyPayment: boolean | undefined;
}> {
  const { request, useUrl } = useQuery();
  const keys = [
    BrandConfigKeys.INVOICE_CONSOLIDATION_RESTRICT_TO_STAFF,
    BrandConfigKeys.BILLING_DIFFERENT_CURRENCY_PAYMENT_ENABLED
  ];

  const response = await request<Record<BrandConfigKeys, boolean>>({
    url: useUrl("config/brand/values", { keys: keys.join(",") }),
    withAccessToken: true
  });

  const result = response.data as Record<BrandConfigKeys, boolean> | undefined;

  // Bracket access, never `get()`/`set()` — the wire's own keys ARE the
  // dotted `BrandConfigKeys` strings, flat, not a nested path (verified
  // against the recorded envelope's own `data` shape). A path-reading helper
  // would split the dots into nested segments and find nothing at either key.
  return {
    // Row O8 / AC17 — TRI-STATE PRESERVED. Consumed downstream as
    // `!(value ?? true)`: visible ONLY on an explicit `false`.
    restrictToStaff:
      result?.[BrandConfigKeys.INVOICE_CONSOLIDATION_RESTRICT_TO_STAFF],
    // Row B6 / AC23 — OPPOSITE POLARITY. Consumed downstream as `!!value`:
    // offered ONLY on an explicit truthy. Absent means NOT offered. NEVER
    // share a default or a `??` fallback with `restrictToStaff` above.
    differentCurrencyPayment:
      result?.[BrandConfigKeys.BILLING_DIFFERENT_CURRENCY_PAYMENT_ENABLED]
  };
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

  const account = resolveAccount(scopeContext);

  const [record, brandGates] = await Promise.all([
    fetchSettingsOnce(clientId.value),
    loadBrandGates()
  ]);

  const baseModel: BillingSettingsModel = {
    enabled: record?.enabled,
    baseRule: record?.baseRule,
    dayOfWeek: record?.dayOfWeek,
    dateOfMonthDay: record?.dateOfMonthDay,
    dueDateDay: record?.dueDateDay,
    // Row X7 — absent, never substituted, for a non-self addressed client.
    // Row B5 — always seeded (unconditional; the oracle never `v-if`-gates it).
    ...(account.value?.currencyId !== undefined && {
      currencyId: account.value.currencyId
    }),
    // Row B6 / AC23 — seeded ONLY on an explicit truthy brand opt-in.
    // Absence, not disablement, withholds it entirely from the model.
    ...(brandGates.differentCurrencyPayment && account.value
      ? { preferredPaymentCurrencyId: account.value.preferredPaymentCurrencyId }
      : {})
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
      ...(brandGates.restrictToStaff !== undefined && {
        [BrandConfigKeys.INVOICE_CONSOLIDATION_RESTRICT_TO_STAFF]:
          brandGates.restrictToStaff
      }),
      // Row B6 — the SAME tri-state-preserving treatment at the LOAD site,
      // even though its CONSUME site (schemas.ts/context.ts) reads it as
      // `!!value` — one absence rule at this site for BOTH keys, never two.
      ...(brandGates.differentCurrencyPayment !== undefined && {
        [BrandConfigKeys.BILLING_DIFFERENT_CURRENCY_PAYMENT_ENABLED]:
          brandGates.differentCurrencyPayment
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

/**
 * After the account-currency PUT resolves — patches the written leaf(s) onto
 * the session's OWN `activeUser.accounts[0]` via the session-store's public
 * action, then invalidates the session query key so the next genuine
 * `/self` refetch is fresh. NEVER a direct mutation, and NEVER a
 * `session-store/` source edit (row X6, AC26).
 *
 * @decision reconcile the session's user AND invalidate the session key;
 * neither alone is sufficient.
 * what:    the shape `account.services.ts:100-111` already uses for this
 *          exact problem — patch the written value onto `activeUser`
 *          through `useSessionStore().useActions().updateUser(...)`, then
 *          `queryClient.invalidateQueries(["session", CLIENT, sessionId])`.
 * why:     the `/self` read is issued with `get()` (a `fetchQuery`, NOT a
 *          reactive observer) and `activeUser` lives in the session STORE,
 *          not the query cache — invalidating the key alone refreshes
 *          NOTHING observable, and `updateUser` alone leaves the cache
 *          stale for the next genuine refetch. Both, and this is why. The
 *          consumer this matters for is `basket-currency.utils.ts:166-180`,
 *          which resolves currency precedence off this very account list.
 * rejected: (1) invalidate only — refreshes nothing, per the above. (2)
 *          re-fetch `/self` eagerly — a full nine-relation session read
 *          after a one-field save. (3) give the account slice its own query
 *          key so it can self-invalidate — leaves the APP-WIDE consumer
 *          stale, which is the half that actually matters, and adds the
 *          request `resolveAccount`'s own `@decision` already refuses.
 */
function reconcileSessionAccount(
  written: IAccount,
  queryClient: ReturnType<typeof useQuery>["queryClient"]
): void {
  const store = useSessionStore();
  const { activeSessionId, activeUser } = store.useContext();
  const sessionId = activeSessionId.value;
  const user = activeUser.value;

  if (!sessionId || !user?.accounts?.length) return;

  const updated = cloneDeep(user);
  updated.accounts![0] = {
    ...updated.accounts![0],
    currencyId: written.currency_id,
    preferredPaymentCurrencyId: written.preferred_payment_currency_id,
    ...(written.currency && { currency: written.currency })
  };

  store.useActions().updateUser(AccessRoleTypes.CLIENT, sessionId, updated);
  void queryClient.invalidateQueries({
    queryKey: ["session", AccessRoleTypes.CLIENT, sessionId]
  });
}

/**
 * Diff-only `PUT accounts/{accountId}` (rows B4/B5/B9). Mirrors `update()`'s
 * shape and reuses its staged-import refusal (row C14 covers this form too —
 * `basicForm:191-193` is the same `!!client.staged_import` predicate) and its
 * `NotAuthenticatedError` gate.
 *
 * Refuses BEFORE any request when: the addressed client is not the
 * session's own (row X7 — `resolveAccount` resolves `undefined`); or when
 * the diff carries `preferred_payment_currency_id` while row B6's gate is
 * closed (AC23 — "can never be written", not merely disabled).
 */
async function updateAccountCurrencies(
  model: BillingSettingsModel,
  baseModel: BillingSettingsModel = {},
  scopeContext?: ScopeContext
): Promise<IAccount> {
  const { put, useUrl, queryClient } = useQuery();
  const clientId = resolveClientId(scopeContext);

  if (!isAddressable(clientId.value)) {
    return Promise.reject(new NotAuthenticatedError());
  }

  const account = resolveAccount(scopeContext).value;
  if (!account) {
    return Promise.reject(new NotAuthenticatedError());
  }

  const diff = mapIAccountCurrencyFields(model, baseModel);
  if (diff === undefined) return {} as IAccount;

  if (
    "preferred_payment_currency_id" in diff &&
    !(await loadBrandGates()).differentCurrencyPayment
  ) {
    return Promise.reject(
      new DetailedError(
        useI18n().t(
          "error.client_billing_settings_payment_currency_not_available"
        ),
        responseCodes.Forbidden,
        ErrorOrigin.Headless
      )
    );
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

  return put<IAccount>({
    mutationKey: ["client", clientId.value, "account", account.id],
    url: useUrl(`accounts/${account.id}`),
    data: diff,
    withAccessToken: true,
    withoutLocale: true
  }).then(response => {
    reconcileSessionAccount(response, queryClient);
    return response;
  });
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
  const account = resolveAccount(scopeContext);

  return {
    queryKey,
    clientId,
    isAvailable: computed(() => isAddressable(clientId.value)),
    error: computed(() => mutationError.value),
    accountId: computed(() => account.value?.id),
    currencyId: computed(() => account.value?.currencyId),
    preferredPaymentCurrencyId: computed(
      () => account.value?.preferredPaymentCurrencyId
    ),
    currencyOptions: currencyOptions(scopeContext),
    loadSettings: () => loadSettings(scopeContext),
    loadLookups: context => loadLookups(context, scopeContext),
    loadBrandGates,
    parse: (context, data) => parse(context, data),
    validate,
    update: (model, baseModel) => update(model, baseModel, scopeContext),
    updateAccountCurrencies: (model, baseModel) =>
      updateAccountCurrencies(model, baseModel, scopeContext),
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

  /**
   * `processing.updating` — issues BOTH writes this module owns: the
   * consolidation diff (`PUT clients/{id}`) and the account-currency diff
   * (`PUT accounts/{accountId}`, folded in 2026-09-09). Each mapper reads
   * only its OWN keys and short-circuits to a zero-request resolve when its
   * own diff is empty (rows B9/C-11), so a save touching only one entity
   * issues exactly one request — never two, never the wrong one.
   */
  update: ({ model, baseModel }: BillingSettingsContext) =>
    !isEmpty(model)
      ? Promise.all([
          service.update(model as BillingSettingsModel, baseModel),
          service.updateAccountCurrencies(
            model as BillingSettingsModel,
            baseModel
          )
        ]).then(() => ({ ...baseModel, ...model }) as BillingSettingsModel)
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
