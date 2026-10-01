/** @internal */
import { computed } from "vue";
import { AccessRoleTypes, BrandConfigKeys } from "@upmind-automation/types";
import { useBrand } from "../brand";
import { mapClientRecord } from "../client";
import { invalidateQueryByKey, resetQueryByKey, useQuery } from "../query";
import { useActiveSession, useSessionStore } from "../session-store";
import { useI18n } from "../system-localisation";
import {
  emptyToNull,
  mapIAccountCurrencyFields,
  mapIBillingSettingsFields,
  mapPersistedBillingModel
} from "./client-billing-settings.mappers";
import { useSchema } from "./client-billing-settings.schemas";
import { ClientBillingSettingsContextTypes } from "./client-billing-settings.types";
import { combineCurrencyOptions } from "./client-billing-settings.utils";
import {
  ErrorOrigin,
  useValidation,
  DetailedError,
  responseCodes,
  useModelParser,
  NotAuthenticatedError,
  useTime
} from "../../utils";
import { cloneDeep, get, isEmpty } from "lodash-es";
import type {
  BillingSettingsContext,
  BillingSettingsModel,
  BrandConsolidationDefaults,
  ClientBillingSettingsMachineServices,
  ClientBillingSettingsServices
} from "./client-billing-settings.types";
import type { ClientRecord } from "../client";
import type { ScopeContext } from "../scope";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { QueryKey } from "@tanstack/vue-query";
import type { IAccount, IClient } from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @module client-billing-settings/client-billing-settings.services
 * @description Services for the editor's lookups/parse/validate/update and the
 * XState adapter `dataManagerMachine` invokes. This module owns its own client
 * read — `clients/{id}?with=accounts,accounts.currency` under its own key,
 * mapped by the one `client` mapper — the account slice only, never a sibling's
 * fields. This file keeps no private `select`, no raw `request()` bypass, and
 * no reactive state.
 *
 * WARNING: Do not import directly from another module. Resolve via
 * `useBillingSettings.ts` / the barrel only (`@internal/no-cross-module-imports`).
 */
// -----------------------------------------------------------------------------

/** The module's base cache key prefix. */
export const queryKey: QueryKey = ["client"];

/** This module's own client-record read key — its account slice, never shared with a sibling. */
function accountsQueryKey(clientId?: string): QueryKey {
  return ["client", clientId, "accounts"];
}

/** This module's own client-record read — the account slice only, mapped by the one client mapper. */
function loadBillingRecord(clientId: string): Promise<ClientRecord> {
  const { get: getRecord, useUrl } = useQuery();

  return getRecord<IClient, ClientRecord>({
    url: useUrl(`clients/${clientId}`, { with: "accounts,accounts.currency" }),
    queryKey: accountsQueryKey(clientId),
    select: mapClientRecord,
    withAccessToken: true,
    withoutLocale: true,
    staleTime: useTime().DAY
  });
}

/** Derives the target client id from the resolved scope, or the session's own client. */
function resolveClientId(scopeContext?: ScopeContext) {
  const { activeUser } = useActiveSession().useContext();

  return computed(() =>
    scopeContext?.type === ClientBillingSettingsContextTypes.CLIENT &&
    scopeContext.id
      ? scopeContext.id
      : activeUser.value?.id
  );
}

/** Resolves true only for an authenticated session with an addressable client. */
function isAddressable(clientId?: string): boolean {
  const { isAuthenticated } = useActiveSession().useMeta();

  return isAuthenticated.value && !!clientId;
}

/** The brand gates plus the brand's consolidation defaults, read in one call. */
async function loadBrandGates(): Promise<{
  restrictToStaff: boolean | undefined;
  differentCurrencyPayment: boolean | undefined;
  defaults: BrandConsolidationDefaults;
}> {
  const keys = [
    BrandConfigKeys.INVOICE_CONSOLIDATION_RESTRICT_TO_STAFF,
    BrandConfigKeys.BILLING_DIFFERENT_CURRENCY_PAYMENT_ENABLED,
    BrandConfigKeys.INVOICE_CONSOLIDATION_ENABLED,
    BrandConfigKeys.INVOICE_CONSOLIDATION_BASE_RULE,
    BrandConfigKeys.INVOICE_CONSOLIDATION_WEEK_DAY,
    BrandConfigKeys.INVOICE_CONSOLIDATION_DATE
  ];

  const result = await useBrand().ensureConfig(keys);

  return {
    // Consumed as "visible only on explicit `false`".
    restrictToStaff: get(
      result,
      BrandConfigKeys.INVOICE_CONSOLIDATION_RESTRICT_TO_STAFF
    ),
    // Consumed as `!!value`: offered only on an explicit truthy.
    differentCurrencyPayment: get(
      result,
      BrandConfigKeys.BILLING_DIFFERENT_CURRENCY_PAYMENT_ENABLED
    ),
    defaults: {
      enabled: !!get(result, BrandConfigKeys.INVOICE_CONSOLIDATION_ENABLED),
      baseRule: emptyToNull(
        get(result, BrandConfigKeys.INVOICE_CONSOLIDATION_BASE_RULE)
      ),
      dayOfWeek: emptyToNull(
        get(result, BrandConfigKeys.INVOICE_CONSOLIDATION_WEEK_DAY)
      ),
      dateOfMonthDay: get(result, BrandConfigKeys.INVOICE_CONSOLIDATION_DATE)
    }
  };
}

/** MANAGER — `loading`'s context patch: the base model, brand gates, and lookups. */
async function loadLookups(
  context: BillingSettingsContext,
  scopeContext?: ScopeContext
): Promise<Partial<BillingSettingsContext>> {
  const clientId = resolveClientId(scopeContext);

  if (!isAddressable(clientId.value)) {
    return Promise.reject(new NotAuthenticatedError());
  }

  const [record, brandGates] = await Promise.all([
    loadBillingRecord(clientId.value as string),
    loadBrandGates()
  ]);
  const account = record.account;

  // Client-managed only on an explicit `restrict_to_staff === false`.
  const consolidationVisible = brandGates.restrictToStaff === false;

  // The append-account-currency helper lives in `*.utils.ts`; the schema's
  // pick-lists read this seeded list, and `useContext` publishes it.
  const currencies = combineCurrencyOptions(
    useBrand().currencies.value,
    account?.currency
  );

  const seed: BillingSettingsModel = {
    ...(consolidationVisible && {
      enabled: record.enabled,
      baseRule: record.baseRule,
      dayOfWeek: record.dayOfWeek,
      dateOfMonthDay: record.dateOfMonthDay,
      dueDateDay: record.dueDateDay
    }),
    brand: brandGates.defaults,
    neverSuspend: record.neverSuspend,
    ...(account?.currencyId !== undefined && {
      currencyId: account.currencyId
    }),
    // Seeded only on an explicit truthy brand opt-in.
    ...(brandGates.differentCurrencyPayment && account
      ? { preferredPaymentCurrencyId: account.preferredPaymentCurrencyId }
      : {})
  };

  // `context.schema` is not set yet at this point in the machine's lifecycle
  // (`setSchemas` runs once THIS invoke's promise resolves), so the base model
  // is parsed through the SAME schema every later `parse()` re-derives `model`
  // with — two shapes for the same values would read as a phantom `isDirty`.
  // Mirrors `client-address.services.ts:loadLookups`.
  const safeSchema =
    context.schema ??
    useSchema({ ...context, lookups: { ...context.lookups, currencies } });
  const baseModel = useModelParser<BillingSettingsModel>(
    safeSchema,
    seed,
    undefined,
    { allowExtraProps: false }
  );

  return {
    model: baseModel,
    baseModel,
    lookups: {
      ...context.lookups,
      currencies
    }
  };
}

/** `available.checking.parsing` — schema-parses the SET payload, floored against `baseModel`. */
async function parse(
  context: BillingSettingsContext,
  data?: unknown
): Promise<Partial<BillingSettingsContext>> {
  const incoming = get(data, "model", data) as Partial<BillingSettingsModel>;

  const safeModel = useModelParser<BillingSettingsModel>(
    context.schema,
    incoming,
    context.baseModel,
    { allowExtraProps: false }
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

/** Diff-only PUT; an empty diff short-circuits. Refuses unless the brand opts clients in. */
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

  const diff = mapIBillingSettingsFields(model, baseModel);
  if (diff === undefined) return {} as IClient;

  if ((await loadBrandGates()).restrictToStaff !== false) {
    return Promise.reject(
      new DetailedError(
        useI18n().t("error.client_billing_settings_not_available"),
        responseCodes.Forbidden,
        ErrorOrigin.Headless
      )
    );
  }

  return put<IClient>({
    mutationKey: accountsQueryKey(clientId.value),
    url: useUrl(`clients/${clientId.value}`),
    data: diff,
    withAccessToken: true,
    withoutLocale: true
  }).then(
    invalidateQueryByKey(accountsQueryKey(clientId.value), { exact: false })
  ) as Promise<IClient>;
}

/**
 * After the account-currency PUT — patches the written leaves onto the session's own
 * account via the session-store action, then invalidates the session key.
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
 * Diff-only `PUT accounts/{accountId}`. Resolves the account off the shared
 * account query. Refuses a `preferred_payment_currency_id` diff while the
 * currency gate is closed.
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

  const account = (await loadBillingRecord(clientId.value as string)).account;
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

  return put<IAccount>({
    mutationKey: ["client", clientId.value, "account", account.id],
    url: useUrl(`accounts/${account.id}`),
    data: diff,
    withAccessToken: true,
    withoutLocale: true
  }).then(response => {
    reconcileSessionAccount(response, queryClient);
    void queryClient.invalidateQueries({
      queryKey: accountsQueryKey(clientId.value),
      exact: false
    });
    return response;
  });
}

/** Invalidates this scope's own cache key so the read refetches. */
async function refresh(scopeContext?: ScopeContext): Promise<void> {
  const clientId = resolveClientId(scopeContext);
  await invalidateQueryByKey(accountsQueryKey(clientId.value), {
    exact: false
  })(undefined);
}

// -----------------------------------------------------------------------------
// Service Factory

/** Service matrix by scopeActor. This module is armless — only the `default:` case. */
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

/** Services factory — the actor and its context arrive at construction, once per scope. */
export const createClientBillingSettingsServices = (
  scopeActor: ScopeActorTypes,
  scopeContext?: ScopeContext
): ClientBillingSettingsServices => {
  const clientId = resolveClientId(scopeContext);

  return {
    queryKey,
    clientId,
    isAvailable: computed(() => isAddressable(clientId.value)),
    loadLookups: context => loadLookups(context, scopeContext),
    loadBrandGates,
    parse: (context, data) => parse(context, data),
    validate,
    update: (model, baseModel) => update(model, baseModel, scopeContext),
    updateAccountCurrencies: (model, baseModel) =>
      updateAccountCurrencies(model, baseModel, scopeContext),
    refresh: () => refresh(scopeContext),
    invalidate: () =>
      invalidateQueryByKey(accountsQueryKey(clientId.value), {
        exact: false
      })(),
    reset: () =>
      useBrand()
        .refresh()
        .then(() => resetQueryByKey(accountsQueryKey(clientId.value))()),
    ...scopedServices(scopeActor, scopeContext)
  };
};

// -----------------------------------------------------------------------------
// Machine-Ready Services (manager half)

/**
 * Adapts the already-scoped services object into the XState services map the shared
 * `dataManagerMachine` invokes.
 * @internal
 */
export const useClientBillingSettingsServices = (
  service: ClientBillingSettingsServices
): ClientBillingSettingsMachineServices => ({
  loadLookups: context => service.loadLookups(context),

  parse: (context, event) => service.parse(context, get(event, "data")),

  validate: context => service.validate(context),

  /** `processing.adding` — never reached; a defensive rejection if the guard is ever wrong. */
  add: () =>
    Promise.reject(
      new DetailedError(
        useI18n().t("error.client_billing_settings_not_available"),
        responseCodes.No_Content,
        ErrorOrigin.Headless
      )
    ),

  /** `processing.updating` — issues both writes; each mapper short-circuits an empty diff. */
  update: ({ model, baseModel }: BillingSettingsContext) =>
    !isEmpty(model)
      ? Promise.all([
          service.update(model as BillingSettingsModel, baseModel),
          service.updateAccountCurrencies(
            model as BillingSettingsModel,
            baseModel
          )
        ]).then(([client, account]) =>
          mapPersistedBillingModel(
            baseModel as BillingSettingsModel,
            client,
            account
          )
        )
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
