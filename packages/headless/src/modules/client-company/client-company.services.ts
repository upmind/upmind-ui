/** @internal */
import { computed, ref } from "vue";
import { BrandConfigKeys, type ICompany } from "@upmind-automation/types";
import { useBrand } from "../brand";
import {
  useClientAddresses,
  useClientAddressServices
} from "../client-address";
import { useClientEmails } from "../client-email";
import { useClientPhones, useClientPhoneServices } from "../client-phone";
import { RequestSortDirection, invalidateQueryByKey, useQuery } from "../query";
import { ScopeActorTypes } from "../scope/scope.types";
import { useActiveSession } from "../session-store";
import { useSystem } from "../system";
import { useI18n } from "../system-localisation";
import {
  mapCompanies,
  mapCompany,
  mapICompany
} from "./client-company.mappers";
import { useSchema } from "./client-company.schemas";
import { ClientCompaniesContextTypes } from "./client-company.types";
import {
  useTime,
  ErrorOrigin,
  useValidation,
  DetailedError,
  responseCodes,
  useCollection,
  useModelParser,
  mapToHeadlessError,
  NotAuthenticatedError,
  DEBOUNCE_DELAY
} from "../../utils";
import { find, get, isArray, isEmpty, isEqual, pick, some } from "lodash-es";
import type { AddressModel } from "../client-address";
import type { EmailModel } from "../client-email";
import type { PhoneModel } from "../client-phone";
import type { QueryParams } from "../query";
import type { ScopeContext } from "../scope";
import type {
  ClientCompanyErrorCapture,
  ClientCompanyListQuery,
  ClientCompanyManagerMachineServices,
  ClientCompanyServices,
  Company,
  CompanyContext,
  CompanyModel
} from "./client-company.types";
import type { ResponseError } from "../../utils";
import type { QueryKey } from "@tanstack/vue-query";
import type { AnyEventObject } from "xstate";
// -----------------------------------------------------------------------------
/**
 * @module client-company/client-company.services
 * @description The ONE services file both halves consume — the collection's
 * `loadList`, the manager's per-company read and writes, and the XState
 * services adapter the shared `dataManagerMachine` invokes. One factory on
 * purpose: one identity seam, one cache key, one arm-resolution switch.
 *
 * Nothing here raises feedback. A failure rejects for the caller and lands in
 * the scope's own error state, which the composables expose.
 *
 * WARNING: Do not import directly from another module. Resolve via
 * `useClientCompanies.ts` / `useClientCompanyManager.ts` only
 * (`@internal/no-cross-module-imports`).
 */
// -----------------------------------------------------------------------------

/**
 * The module's base cache key. The manager's writes invalidate it; that, and
 * nothing else, is how a save refreshes the collection.
 */
export const queryKey: QueryKey = ["client", "companies"];

/**
 * Derives the target client id from the RESOLVED scope — the ONE seam every
 * request-issuing function in this file shares, and the fix for a services
 * layer that hardwired the session's client for every call (five separate
 * `useActiveSession().useContext().sessionId` reads, `client-company.services.ts`
 * L52, L159, L177, L222, L256 on the pre-conversion file).
 *
 * A `.for('client', id)` context names the client being addressed; with none
 * it falls back to the active session's own client (the self case). This
 * compares the CONTEXT the scope builder resolved, never the actor, so it is
 * not a branch on `ScopeActorTypes.SELF`. The manager's context names the
 * COMPANY, not its owner, so it falls through to the session — the same
 * documented fall-through `client-email.services.ts` L76-84 uses.
 */
function resolveClientId(scopeContext?: ScopeContext) {
  const { activeUser } = useActiveSession().useContext();

  return computed(() =>
    scopeContext?.type === ClientCompaniesContextTypes.CLIENT
      ? scopeContext.id
      : activeUser.value?.id
  );
}

/**
 * Resolves true only for an authenticated session with an addressable client.
 *
 * The module's ONE addressability predicate (operator ruling R3 fixes the two
 * call sites that used to write this expression inverted). Every request gate
 * here calls it, and `createClientCompanyServices` exposes its reactive form
 * as `service.isAvailable` so the composable layers READ this function rather
 * than re-deriving the expression.
 */
function isAddressable(clientId?: string): boolean {
  const { isAuthenticated } = useActiveSession().useMeta();

  return isAuthenticated.value && !!clientId;
}

/**
 * COLLECTION — the reactive list query, minted once per scope.
 *
 * Adds two params the oracle has and the pre-conversion headless lacked:
 * `with_staged_imports: 1` (legacy `companies.ts` L44-49, in-cell gap G1) and
 * an ascending `created_at` order (legacy `billableEntitiesProvider.vue`
 * L71-79, in-cell gap G2) — both through the platform's existing `useUrl` /
 * `sort` channel, no platform change (NFR-5).
 */
function loadList(
  params: Partial<QueryParams<ICompany[], Company[]>> = {
    pagination: { limit: 0 }
  },
  scopeContext?: ScopeContext
): ClientCompanyListQuery {
  const { list, useUrl } = useQuery();
  const { ensureConfig } = useBrand();
  const clientId = resolveClientId(scopeContext);
  const targetUrl = () =>
    useUrl(`clients/${clientId.value}/companies`, {
      with: ["address", "address.country", "address.region"].join(),
      with_staged_imports: 1
    });
  const url = targetUrl();

  return list<ICompany[], Company[]>({
    sort: [RequestSortDirection.ASC, "created_at"],
    ...params,
    queryKey: [...queryKey, { client: clientId }],
    url,
    // `enabled:` only stops the query starting; this rejects a forced
    // `refetch()` on a dead or unaddressable session with the typed error
    // instead of a raw 401. Must stay an `async` function — `list()` detects a
    // guard by `isPromise`, which tests for an AsyncFunction.
    guard: async () => {
      if (!isAddressable(clientId.value)) {
        return Promise.reject(new NotAuthenticatedError());
      }
      // Fetched here, ahead of the mapper: `mapCompany`'s `hasTaxValidation`
      // READS the brand config synchronously, and a read with nothing having
      // FETCHED it is whatever the brand store happens to hold (in-cell gap
      // G4, `parity.yaml` C7).
      await ensureConfig([BrandConfigKeys.TAX_NUMBER_VALIDATION_ENABLED]);
      url.pathname = targetUrl().pathname;
      return true;
    },
    withAccessToken: true,
    select: mapCompanies,
    staleTime: useTime().DAY,
    retryDelay: DEBOUNCE_DELAY,
    enabled: () => isAddressable(clientId.value)
  });
}

/**
 * MANAGER — per-company read. A one-shot promise rather than a reactive
 * query: the manager holds a machine, and its `loading` state awaits this
 * when no model has already been supplied.
 */
async function loadOne(
  id?: Company["id"],
  scopeContext?: ScopeContext
): Promise<Company | undefined> {
  if (!id) return undefined;

  const { get: getOne, useUrl } = useQuery();
  const clientId = resolveClientId(scopeContext);

  if (!isAddressable(clientId.value)) {
    return Promise.reject(new NotAuthenticatedError());
  }

  return getOne<ICompany, Company>({
    queryKey: [...queryKey, { client: clientId.value }, id],
    url: useUrl(`clients/${clientId.value}/companies/${id}`, {
      with: ["address", "address.country", "address.region"].join()
    }),
    select: mapCompany,
    withAccessToken: true
  });
}

/**
 * Resolves a brand-new address, email or phone supplied INLINE into an id,
 * reusing an existing one already selected by id. The legacy modal had no
 * inline-create path at all (`parity.yaml` C26) — kept because
 * `basket-billing/unified` depends on it for the checkout inline-address case.
 */
async function ensureDependencies(data: CompanyModel): Promise<CompanyModel> {
  const { t } = useI18n();

  if (isEmpty(data)) {
    return Promise.reject(
      new DetailedError(
        t("error.client_company_not_available"),
        responseCodes.Not_Found,
        ErrorOrigin.Headless
      )
    );
  }

  const { ensure: ensureEmail } = useClientEmails()
    .as(ScopeActorTypes.SELF)
    .useActions();
  const { ensure: ensurePhone } = useClientPhoneServices();
  const { ensure: ensureAddress } = useClientAddressServices();

  return Promise.all([
    !data?.email && !data?.emailId
      ? Promise.resolve(null)
      : ensureEmail(
          (data?.email
            ? { email: data.email }
            : { id: data?.emailId }) as unknown as EmailModel
        ),

    !data?.phone?.number && !data?.phoneId
      ? Promise.resolve(null)
      : ensurePhone({
          model: (data?.phone
            ? { phone: data.phone }
            : { id: data?.phoneId }) as PhoneModel
        }),

    ensureAddress({
      model: (data?.address
        ? { address: data.address }
        : { id: data?.addressId }) as AddressModel
    })
  ])
    .then(([email, phone, address]) => ({
      id: data.id,
      addressId: address?.id,
      phoneId: phone?.id,
      emailId: email?.id,
      name: data.name,
      regNumber: data.regNumber,
      tax: data.tax
    }))
    .catch(errors => {
      throw new DetailedError(
        t("error.client_company_ensure_dependencies_failed"),
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless,
        errors
      );
    });
}

/**
 * Diffs a dependency-resolved model against its persisted baseline, returning
 * ONLY the keys that changed as own properties — `mapICompany` maps exactly
 * what it is handed, so this is what makes an edit of one field send only
 * that field (in-cell gap G3, `parity.yaml` C24).
 */
const DIFFABLE_MODEL_KEYS = [
  "name",
  "addressId",
  "phoneId",
  "emailId",
  "regNumber",
  "tax"
] as const satisfies readonly (keyof CompanyModel)[];

function diffCompanyModel(
  model: CompanyModel,
  baseModel?: CompanyModel
): Partial<CompanyModel> {
  const changes: Partial<CompanyModel> = {};

  DIFFABLE_MODEL_KEYS.forEach(key => {
    if (!isEqual(model[key], baseModel?.[key])) {
      changes[key] = model[key] as never;
    }
  });

  return changes;
}

/** Raw POST — the dependency-resolved model is ALWAYS sent whole (a create has no prior state to diff against). */
async function postCompany(
  model: Partial<CompanyModel>,
  scopeContext: ScopeContext | undefined
): Promise<ICompany | undefined> {
  const { post, useUrl } = useQuery();
  const clientId = resolveClientId(scopeContext);

  return post<ICompany>({
    mutationKey: [...queryKey, "add"],
    url: useUrl(`clients/${clientId.value}/companies`),
    data: mapICompany(model),
    withAccessToken: true
  }).then(invalidateQueryByKey(queryKey, { exact: false }));
}

/** Raw PUT — sent whatever `model` it is handed; the CALLER decides full vs diffed. */
async function putCompany(
  id: Company["id"],
  model: Partial<CompanyModel>,
  scopeContext: ScopeContext | undefined
): Promise<ICompany | undefined> {
  const { put, useUrl } = useQuery();
  const clientId = resolveClientId(scopeContext);

  return put<ICompany>({
    mutationKey: [...queryKey, id],
    url: useUrl(`clients/${clientId.value}/companies/${id}`),
    data: mapICompany(model),
    withAccessToken: true
  }).then(invalidateQueryByKey(queryKey, { exact: false }));
}

/**
 * MANAGER — create, as its own operation (in-cell gap G5, `parity.yaml` C23):
 * the pre-conversion headless reached `add` only through `ensure()`'s
 * find-or-create. `ensure` stays (checkout depends on it) but is no longer the
 * only route.
 */
async function add(
  model: CompanyModel,
  scopeContext?: ScopeContext
): Promise<ICompany | undefined> {
  const clientId = resolveClientId(scopeContext);

  if (!isAddressable(clientId.value)) {
    return Promise.reject(new NotAuthenticatedError());
  }

  return ensureDependencies(model).then(ensured =>
    postCompany(ensured, scopeContext)
  );
}

/**
 * MANAGER — update. Sends the FULL dependency-resolved model — a generic
 * caller with no baseline to diff against. The machine adapter's own `update`
 * (below) diffs against `context.baseModel` before calling `putCompany`
 * directly, which is what delivers the partial-update capability without
 * changing this function's contract.
 */
async function update(
  id: Company["id"],
  model: CompanyModel,
  scopeContext?: ScopeContext
): Promise<ICompany | undefined> {
  const clientId = resolveClientId(scopeContext);

  if (!isAddressable(clientId.value)) {
    return Promise.reject(new NotAuthenticatedError());
  }

  return ensureDependencies(model).then(ensured =>
    putCompany(id, ensured, scopeContext)
  );
}

/**
 * Find-or-create by id. ONE body, two call sites: the collection's `ensure`
 * action and the machine's `add` service both resolve here.
 */
async function ensure(
  model: CompanyModel,
  scopeContext: ScopeContext | undefined,
  captureError: ClientCompanyErrorCapture
): Promise<Company> {
  const { t } = useI18n();
  const clientId = resolveClientId(scopeContext);

  if (!isAddressable(clientId.value)) {
    return Promise.reject(new NotAuthenticatedError());
  }

  const query = loadList(undefined, scopeContext);
  await query.promise.value.finally();

  const { findOne } = useCollection<Company>(
    isArray(query.data.value) ? query.data.value : []
  );

  const mapping = pick(model, "id");
  const found = isEmpty(mapping) ? undefined : findOne(mapping);
  if (found) return found;

  return add(model, scopeContext)
    .then(raw => {
      if (isEmpty(raw)) {
        throw new DetailedError(
          t("error.client_company_not_available"),
          responseCodes.Unprocessable_Entity,
          ErrorOrigin.Headless,
          { model }
        );
      }
      return mapCompany(raw as ICompany);
    })
    .catch(error => {
      captureError(error);
      throw error;
    });
}

/**
 * COLLECTION — delete a deletable company.
 *
 * The auth precondition is checked here rather than passed as `guard:`, which
 * `useQuery().mutate()` accepts but never awaits (only `list()` honours it) —
 * a guard handed to a mutation issues the request anyway. Both this and
 * `setDefault` used to write the addressability check INVERTED
 * (`isAuthenticated.value || !clientId.value`, operator ruling R3) — an
 * unauthenticated session with no clientId satisfied the second disjunct and
 * issued `DELETE clients/undefined/companies/{id}`. Both now call the ONE
 * shared predicate.
 */
async function remove(
  id: Company["id"],
  scopeContext: ScopeContext | undefined,
  captureError: ClientCompanyErrorCapture
): Promise<void> {
  const { del, useUrl } = useQuery();
  const clientId = resolveClientId(scopeContext);

  if (!isAddressable(clientId.value)) {
    return Promise.reject(new NotAuthenticatedError());
  }

  return del<null>({
    mutationKey: [...queryKey, id, "remove"],
    url: useUrl(`clients/${clientId.value}/companies/${id}`),
    withAccessToken: true
  })
    .then(invalidateQueryByKey(queryKey, { exact: false }))
    .then(() => undefined)
    .catch(error => {
      captureError(error);
      throw error;
    });
}

/** COLLECTION — promote a company to the client's default. See `remove`'s note on R3. */
async function setDefault(
  id: Company["id"],
  scopeContext: ScopeContext | undefined,
  captureError: ClientCompanyErrorCapture
): Promise<ICompany | undefined> {
  const { put, useUrl } = useQuery();
  const clientId = resolveClientId(scopeContext);

  if (!isAddressable(clientId.value)) {
    return Promise.reject(new NotAuthenticatedError());
  }

  return put<ICompany>({
    mutationKey: [...queryKey, id, "default"],
    url: useUrl(`clients/${clientId.value}/companies/${id}`),
    data: { default: true },
    withAccessToken: true
  })
    .then(invalidateQueryByKey(queryKey, { exact: false }))
    .catch(error => {
      captureError(error);
      throw error;
    });
}

/**
 * MANAGER — loads everything the form needs to be fillable: the client's
 * addresses, emails and phones, the country list, and the brand's address
 * rules, then pre-selects their defaults. Seeds the model from `loadOne` when
 * none has been supplied yet — the manager no longer depends on the
 * collection already being loaded.
 */
async function loadLookups(
  { id, model }: CompanyContext,
  scopeContext?: ScopeContext
): Promise<Partial<CompanyContext>> {
  const clientId = resolveClientId(scopeContext);

  if (!isAddressable(clientId.value)) {
    return Promise.reject(new NotAuthenticatedError());
  }

  const {
    isReady: getPhones,
    default: defaultPhone,
    data: phones
  } = useClientPhones();

  const clientEmails = useClientEmails().as(ScopeActorTypes.SELF);
  const { isReady: getEmails } = clientEmails.useActions();
  const { default: defaultEmail, data: emails } = clientEmails.useContext();

  const {
    isReady: getAddresses,
    default: defaultAddress,
    data: addresses
  } = useClientAddresses();

  const { isReady, ensureCountries, fetchRegions, getCountry } = useSystem();

  const { ensureConfig } = useBrand();

  await isReady().catch(error => Promise.reject(error));

  const seed = isEmpty(model) ? await loadOne(id, scopeContext) : model;

  const [countries, config] = await Promise.all([
    ensureCountries(),
    ensureConfig([BrandConfigKeys.REQUIRE_REGION_IN_ADDRESS]),
    getPhones(),
    getEmails(),
    getAddresses()
  ]);

  // `seed` is either a `Company` (from `loadOne`, id/addressId only — never an
  // inline `address`) or a `CompanyModel` still carrying an unsaved inline
  // address; `get` reads the latter's shape without narrowing the former out.
  const seedCountryId = get(seed, "address.countryId") as string | undefined;
  const country = getCountry(seedCountryId);
  const regions = await fetchRegions(seedCountryId || country?.id);

  // An empty REGION list is expected whenever no country has resolved yet —
  // neither `Company` (`loadOne`) nor a fresh `CompanyModel` carries a nested
  // country of its own, so this is the normal state for the common case
  // (a brand-new company, or one whose linked address has none inline). The
  // shared `dataManagerMachine` has no `onError` transition off this service
  // (NFR-4, protected core), so rejecting here would hang the machine forever
  // instead of settling `available`. Only a genuinely failed `countries`
  // fetch is worth rejecting on.
  if (isEmpty(countries)) {
    return Promise.reject(
      new DetailedError(
        "Failed to load countries and regions",
        responseCodes.Service_Unavailable,
        ErrorOrigin.Headless
      )
    );
  }

  const baseSeed: CompanyModel = {
    id: seed?.id,
    name: seed?.name,
    regNumber: seed?.regNumber,
    tax: seed?.tax,
    // --- one of
    addressId: seed?.addressId ?? defaultAddress()?.id,
    address:
      !seed?.addressId && !defaultAddress()?.id
        ? ({ countryId: country?.id } as CompanyModel["address"])
        : undefined,
    // ---
    emailId: seed?.emailId ?? defaultEmail()?.id,
    // ---
    phoneId: seed?.phoneId ?? defaultPhone()?.id,
    phone:
      !seed?.phoneId && !defaultPhone()?.phone
        ? ({ country: country?.id } as CompanyModel["phone"])
        : undefined
  };

  // `context.schema` is not set yet at this point in the machine's lifecycle
  // (`setSchemas` only runs once THIS invoke's promise resolves), so parsing
  // `baseSeed` against the missing schema previously skipped ALL schema-based
  // shaping (`useModelParser` returns its input verbatim when `schema` is
  // undefined). That left `baseModel` a raw, unparsed object while every
  // later `parse()` cycle re-derives `model` through the REAL schema —
  // two different shapes for the same persisted values (extra/missing keys,
  // e.g. an empty `tax: {}` container vs a bare `tax: undefined`), which
  // `isDirty`'s `isEqual` reads as a change that never happened (AC-22).
  // `useSchema` only branches on `baseSeed.addressId`, already resolved
  // above, so it is safe to compute here ahead of the machine's own
  // `setSchemas`.
  const schema = useSchema({ countries, regions, baseModel: baseSeed, config });
  const safeModel = useModelParser<CompanyModel>(schema, baseSeed);

  return Promise.resolve({
    addresses: addresses.value || [],
    emails: emails.value || [],
    phones: phones.value || [],
    country,
    countries,
    regions,
    config,
    model: safeModel,
    baseModel: safeModel
  });
}

/**
 * MANAGER — re-resolves the country from `address.countryId`, refetches
 * regions on a country change, and nulls a `regionId` not in the new list.
 */
async function parse(
  { schema, baseModel, regions, country, autoupdate }: CompanyContext,
  { data }: AnyEventObject
): Promise<Partial<CompanyContext>> {
  const { fetchRegions, getCountry } = useSystem();

  // `baseModel` MUST be threaded through here, exactly as `setModel`
  // (`useClientCompanyManager.machine.ts`) already does: `useModelParser`'s
  // `defaultsDeep(values, baseModel)` is what fills in every key a PARTIAL
  // `SET` payload omits from the persisted baseline. Without it, a one-field
  // `update({ name })` re-parses against nothing but that field, nulling out
  // every untouched sibling (AC-19/G3 — the partial-update clobber).
  const safeModel = useModelParser<CompanyModel>(
    schema,
    get(data, "model", data),
    baseModel
  );

  if (safeModel.address) {
    country = getCountry(safeModel.address.countryId);
    safeModel.address!.countryId = country.id;

    if (!some(regions, ["countryId", safeModel.address?.countryId])) {
      regions = await fetchRegions(safeModel.address!.countryId);
    }

    const region = find(regions, ["id", safeModel.address?.regionId]);
    safeModel.address!.regionId = get(region, "id");
  }

  return Promise.resolve({
    model: safeModel,
    regions,
    country,
    autoupdate
  });
}

/**
 * Schema validation. Rejects with a `DetailedError` carrying the AJV errors as
 * `data`; the shared machine's `setError` lands that in context, where the
 * manager exposes it as `validationErrors`. Nothing here raises feedback.
 *
 * Unlike `client-email`'s static schema, the company schema is
 * CONTEXT-shaped — it branches on `baseModel.addressId` (`client-company.schemas.ts`)
 * — so validation needs the schema CURRENTLY in context, not a schema this
 * function mints itself. `schema` is `undefined` only for a caller with no
 * context of its own, and mirrors the schema-less fallthrough (resolve as-is).
 */
async function validate(
  schema: CompanyContext["schema"],
  model?: CompanyModel
): Promise<CompanyModel | undefined> {
  const { t } = useI18n();
  if (!schema) return Promise.resolve(model);

  const { validate: validateAgainstSchema } = useValidation();

  return new Promise((resolve, reject) => {
    const errors = validateAgainstSchema(schema, model);

    if (errors?.length) {
      reject(
        new DetailedError(
          t("error.client_company_validation_failed"),
          responseCodes.Unprocessable_Entity,
          ErrorOrigin.Headless,
          errors
        )
      );
    } else {
      resolve(model);
    }
  });
}

/**
 * Invalidates this module's cache key so the collection refetches. The manager
 * calls it after a settled save rather than reaching into the collection
 * composable's query instance, which belongs to a different scope key and may
 * not exist in this consumer at all.
 */
async function refresh(): Promise<void> {
  await invalidateQueryByKey(queryKey, { exact: false })(undefined);
}

// -----------------------------------------------------------------------------
// Service Factory

/**
 * Service matrix: maps scopeActor types to their service implementations. The
 * shape is the same armed or armless — an armless module has only the
 * `default:` case, so nothing here or downstream changes when an arm is
 * earned. The oracle's per-actor ROUTE variance (`api/admin/clients/{id}/…`
 * vs `api/clients/{id}/…`) belongs entirely to `parity.yaml` C38 (dropped
 * under operator ruling R1) — with one resolving actor there is no actor to
 * switch on. If C38 is ever taken, THIS is the layer that earns
 * `client-company.services.staff.ts` (`design.md` D8).
 */
function scopedServices(
  _scopeActor: ScopeActorTypes,
  _scopeContext?: ScopeContext
): Partial<ClientCompanyServices> {
  switch (_scopeActor) {
    default:
      return {};
  }
}

// -----------------------------------------------------------------------------
// Scope-Ready Services

/**
 * Services factory — the concrete actor and the context it acts upon arrive
 * first, at construction. `useClientCompanies.ts` calls it once and so does
 * `useClientCompanyManager.ts`, each with ITS OWN resolved scope, so the two
 * instances share no mutable state.
 */
export const createClientCompanyServices = (
  scopeActor: ScopeActorTypes,
  scopeContext?: ScopeContext
): ClientCompanyServices => {
  const mutationError = ref<ResponseError | undefined>(undefined);
  const clientId = resolveClientId(scopeContext);

  const captureError: ClientCompanyErrorCapture = error => {
    mutationError.value = mapToHeadlessError(error);
  };

  return {
    queryKey,
    clientId,
    isAvailable: computed(() => isAddressable(clientId.value)),
    error: computed(() => mutationError.value),
    loadList: params => loadList(params, scopeContext),
    loadOne: id => loadOne(id, scopeContext),
    add: model => add(model, scopeContext),
    update: (id, model) => update(id, model, scopeContext),
    ensure: model => ensure(model, scopeContext, captureError),
    remove: id => remove(id, scopeContext, captureError),
    setDefault: id => setDefault(id, scopeContext, captureError),
    validate: model => validate(undefined, model),
    refresh,
    loadLookups: context => loadLookups(context, scopeContext),
    parse,
    ...scopedServices(scopeActor, scopeContext)
  };
};

// -----------------------------------------------------------------------------
// Machine-Ready Services (manager half)

/**
 * Adapts the ALREADY-SCOPED services object into the XState services map the
 * shared `dataManagerMachine` invokes.
 *
 * The adapter takes `service` as an argument rather than minting its own: the
 * scope, and therefore the target client, is resolved ONCE in
 * `useClientCompanyManager.ts` and threaded in. `update` diffs
 * `context.model` against `context.baseModel` and calls `putCompany` DIRECTLY
 * — bypassing `service.update`'s own full-payload path — which is what
 * delivers the partial-update capability (in-cell gap G3).
 * @internal
 */
export const useClientCompanyManagerServices = (
  service: ClientCompanyServices,
  scopeContext?: ScopeContext
): ClientCompanyManagerMachineServices => ({
  loadLookups: service.loadLookups,

  parse: service.parse,

  validate: ({ schema, model }: CompanyContext) => validate(schema, model),

  /**
   * `processing.adding` — entered when the machine's `isNew` guard passes.
   * Wired to find-or-create, so saving a company the collection already holds
   * resolves the existing record instead of creating a duplicate.
   */
  add: ({ model }: CompanyContext) =>
    model
      ? service.ensure(model)
      : Promise.reject(
          new DetailedError(
            useI18n().t("error.client_company_not_available"),
            responseCodes.No_Content,
            ErrorOrigin.Headless,
            { model }
          )
        ),

  /**
   * `processing.updating` — entered when the context already carries an id.
   * Dependencies are resolved against the FULL current model (a partial diff
   * cannot resolve an inline address/email/phone on its own — the id it needs
   * to compare against a diff might not even be in the diff), then diffed
   * against `baseModel` before the wire payload is built.
   */
  update: ({ id, model, baseModel }: CompanyContext) =>
    id && model
      ? ensureDependencies(model).then(ensured =>
          putCompany(id, diffCompanyModel(ensured, baseModel), scopeContext)
        )
      : Promise.reject(
          new DetailedError(
            useI18n().t("error.client_company_not_available"),
            responseCodes.No_Content,
            ErrorOrigin.Headless,
            { id, model }
          )
        )
});

export default createClientCompanyServices;
