/** @internal */
import parsePhoneNumber, { type CountryCode } from "libphonenumber-js";
import { computed, ref } from "vue";
import { useFeedback } from "../feedback";
import { useQuery, invalidateQueryByKey } from "../query";
import { useActiveSession } from "../session-store";
import { useSystem } from "../system";
import { useI18n } from "../system-localisation";
import { mapIPhone, mapPhone, mapPhones } from "./client-phone.mappers";
import { useQuerySchema } from "./client-phone.schemas";
import { ClientPhonesContextTypes } from "./client-phone.types";
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
import {
  get,
  isString,
  isArray,
  isEmpty,
  omitBy,
  defaultsDeep
} from "lodash-es";
import type { ScopeContext } from "../scope";
import type {
  ClientPhoneErrorCapture,
  ClientPhoneListQuery,
  ClientPhoneManagerMachineServices,
  ClientPhoneServices,
  Phone,
  PhoneContext,
  PhoneModel,
  QueryModel
} from "./client-phone.types";
import type { ResponseError } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { QueryKey } from "@tanstack/vue-query";
import type { IPhone } from "@upmind-automation/types";
import type { AnyEventObject } from "xstate";
// -----------------------------------------------------------------------------
/**
 * @module client-phone/client-phone.services
 * @description The ONE services file both halves consume — the collection's
 * `loadList`, the manager's per-phone read and writes, the lookups/parse/
 * validate trio the shared `dataManagerMachine` invokes, and the XState
 * services adapter for the two members (`add`/`update`) that need re-shaping.
 * One factory on purpose: one identity seam, one cache key, one
 * arm-resolution switch.
 *
 * `remove` / `setDefault` raise feedback AND land their failure in the
 * scope's captured error state (row W6 — the oracle raises feedback on
 * exactly these two mutations, a deliberate divergence from the client-email
 * reference, which raises none anywhere). No other member here raises
 * feedback; a failure elsewhere rejects for the caller.
 *
 * WARNING: Do not import directly from another module. Resolve via
 * `useClientPhones.ts` / `useClientPhoneManager.ts` only
 * (`@internal/no-cross-module-imports`).
 */
// -----------------------------------------------------------------------------

/**
 * The module's base cache key. A row mutation or a manager save invalidates
 * it; that, and nothing else, is how a save refreshes the collection.
 */
export const queryKey: QueryKey = ["client", "phones"];

/**
 * Derives the target client id from the RESOLVED scope — the ONE seam every
 * request-issuing function in this file shares.
 *
 * A `.for('client', id)` context names the client being addressed; with none
 * it falls back to the active session's own client (the self case). This
 * compares the CONTEXT the scope builder resolved, never the actor, so it is
 * not a branch on `ScopeActorTypes.SELF`. A manager scoped `.for('phone', id)`
 * falls through to the session — correct, because a phone context names the
 * entity, not its owner.
 *
 * Under operator ruling 1 (2026-08-08) the `CLIENT` branch is currently
 * unreachable from any live matrix cell — both matrices set `STAFF` to
 * `null as never` — and is kept anyway: it is the single point every request
 * gate reads, and restoring a staff cell (parity rows S1-S7) becomes a matrix
 * edit rather than a rewrite of this seam.
 */
function resolveClientId(scopeContext?: ScopeContext) {
  const { activeUser } = useActiveSession().useContext();

  return computed(() =>
    scopeContext?.type === ClientPhonesContextTypes.CLIENT
      ? scopeContext.id
      : activeUser.value?.id
  );
}

/**
 * Resolves true only for an authenticated session with an addressable client.
 *
 * The module's ONE addressability predicate. Every request gate here calls
 * it, and `createClientPhoneServices` exposes its reactive form as
 * `service.isAvailable` so the composable layers READ this function rather
 * than re-deriving the expression. Replaces the pre-conversion `remove` /
 * `setDefault` guards' `isAuthenticated.value || !client.value?.id` — an `||`
 * where every other guard in the same file used `&&`, which resolved TRUE for
 * an unauthenticated session with no client id (decision D-2, row W5).
 */
function isAddressable(clientId?: string): boolean {
  const { isAuthenticated } = useActiveSession().useMeta();

  return isAuthenticated.value && !!clientId;
}

/**
 * COLLECTION — the reactive list query, minted once per scope.
 *
 * Minted once, but the target client can resolve AFTER construction — an
 * authenticated cold boot carries no `activeUser` until `/self` lands — so
 * neither half of the request may snapshot the id at mint time.
 *
 * The KEY carries the REF: vue-query deep-unwraps refs inside a query key, so
 * a late id re-derives the options into a DIFFERENT cache entry. `enabled` and
 * `guard` hold the unaddressable entry shut, so a late arrival cannot inherit
 * a poisoned one. The URL is re-pointed in the `guard` — the last hook before
 * `list()` builds the request — so this is what targets the id resolved at
 * FIRE time.
 *
 * Adds `with_staged_imports: 1` (legacy `phones.ts:44`, in-cell gap) through
 * the platform's existing `useUrl` channel — URL scoping, not criteria, so it
 * never enters the query schema (`client-company.services.ts:130` sibling
 * precedent for the identical construct).
 *
 * The whole request state is the DECLARED query schema: `list()` builds the
 * criteria from it and publishes filters/sort/pagination back on the handle.
 * Takes no params — there is no back door beside the schema.
 */
function loadList(scopeContext?: ScopeContext): ClientPhoneListQuery {
  const { list, useUrl } = useQuery();
  const clientId = resolveClientId(scopeContext);
  const targetUrl = () =>
    useUrl(`clients/${clientId.value}/phones`, { with_staged_imports: 1 });
  const url = targetUrl();

  return list<IPhone[], Phone[], QueryModel>({
    criteria: { schema: useQuerySchema() },
    queryKey: [...queryKey, { client: clientId }],
    url,
    // Must stay an `async` function — `list()` detects a guard by `isPromise`,
    // which tests for an AsyncFunction.
    guard: async () =>
      new Promise((resolve, reject) => {
        if (!isAddressable(clientId.value)) {
          reject(new NotAuthenticatedError());
          return;
        }
        url.pathname = targetUrl().pathname;
        resolve(true);
      }),
    withAccessToken: true,
    select: mapPhones,
    staleTime: useTime().DAY,
    retryDelay: DEBOUNCE_DELAY,
    enabled: () => isAddressable(clientId.value)
  });
}

/**
 * MANAGER — per-record read. A one-shot promise rather than a reactive query:
 * the manager holds a machine, and its `loading` state awaits this.
 */
async function loadOne(
  id?: IPhone["id"],
  scopeContext?: ScopeContext
): Promise<Phone | undefined> {
  if (!id) return undefined;

  const { get: getOne, useUrl } = useQuery();
  const clientId = resolveClientId(scopeContext);

  if (!isAddressable(clientId.value)) {
    return Promise.reject(new NotAuthenticatedError());
  }

  return getOne<IPhone, Phone>({
    queryKey: [...queryKey, { client: clientId.value }, id],
    url: useUrl(`clients/${clientId.value}/phones/${id}`),
    select: mapPhone,
    withAccessToken: true
  });
}

/** MANAGER — create, then invalidate the shared key so the list refetches. */
async function add(
  model: PhoneModel,
  scopeContext?: ScopeContext
): Promise<IPhone | undefined> {
  const { post, useUrl } = useQuery();
  const clientId = resolveClientId(scopeContext);

  if (!isAddressable(clientId.value)) {
    return Promise.reject(new NotAuthenticatedError());
  }

  return post<IPhone>({
    mutationKey: [...queryKey, "add"],
    url: useUrl(`clients/${clientId.value}/phones`),
    data: mapIPhone(model),
    withAccessToken: true
  }).then(invalidateQueryByKey(queryKey, { exact: false }));
}

/** MANAGER — update, then invalidate the shared key so the list refetches. */
async function update(
  id: IPhone["id"],
  model: PhoneModel,
  scopeContext?: ScopeContext
): Promise<IPhone | undefined> {
  const { put, useUrl } = useQuery();
  const clientId = resolveClientId(scopeContext);

  if (!isAddressable(clientId.value)) {
    return Promise.reject(new NotAuthenticatedError());
  }

  return put<IPhone>({
    mutationKey: [...queryKey, id],
    url: useUrl(`clients/${clientId.value}/phones/${id}`),
    data: mapIPhone(model),
    withAccessToken: true
  }).then(invalidateQueryByKey(queryKey, { exact: false }));
}

/**
 * Find-or-create. ONE body, two call sites: the collection's `ensure` action
 * and the machine's `add` service both resolve here, so a form save and a
 * programmatic add cannot drift. Carried verbatim from the pre-conversion
 * `ensure` (row X1) — matches on the model's non-empty members via the same
 * whole-object equality `useCollection().findOne` has always used.
 */
async function ensure(
  model: PhoneModel,
  scopeContext?: ScopeContext
): Promise<Phone> {
  const { t } = useI18n();
  const clientId = resolveClientId(scopeContext);

  if (!isAddressable(clientId.value)) {
    return Promise.reject(new NotAuthenticatedError());
  }

  const query = loadList(scopeContext);
  await query.promise.value.finally();

  const { findOne } = useCollection<Phone>(
    isArray(query.data.value) ? query.data.value : []
  );

  const mapping = omitBy(model, isEmpty) as Partial<Phone>;
  const found = findOne(mapping);
  if (found) return found;

  return add(model, scopeContext).then(raw => {
    if (isEmpty(raw)) {
      throw new DetailedError(
        t("error.client_phone_not_available"),
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless,
        { model }
      );
    }
    return mapPhone(raw as IPhone);
  });
}

/**
 * COLLECTION — delete a deletable phone.
 *
 * Row W6 (deliberate divergence from the reference): the oracle raises
 * feedback on this mutation, so it is kept — `onSuccess` the confirmation,
 * `onError` the failure message — ALONGSIDE capturing the failure into state
 * (row C10) so `useContext().error` / `useMeta().hasError` also see it.
 */
async function remove(
  id: IPhone["id"],
  scopeContext: ScopeContext | undefined,
  captureError: ClientPhoneErrorCapture
): Promise<void> {
  const { t } = useI18n();
  const { del, useUrl } = useQuery();
  const clientId = resolveClientId(scopeContext);

  if (!isAddressable(clientId.value)) {
    return Promise.reject(new NotAuthenticatedError());
  }

  return del<null>({
    mutationKey: [...queryKey, id, "remove"],
    url: useUrl(`clients/${clientId.value}/phones/${id}`),
    withAccessToken: true
  })
    .then(invalidateQueryByKey(queryKey, { exact: false }))
    .then(() => {
      useFeedback().addSuccess(t("confirm.phone_removed"));
    })
    .catch(error => {
      captureError(error);
      useFeedback().addError({
        title: isString(error)
          ? error
          : error?.title || t("error.client_phone_delete_failed"),
        copy: error?.message,
        data: error?.data
      });
      throw error;
    });
}

/**
 * COLLECTION — promote a phone to the client's default.
 *
 * Row W6 (deliberate divergence from the reference — see {@link remove}).
 * The request BODY is the capability: `{ default: true }` and nothing else.
 */
async function setDefault(
  id: IPhone["id"],
  scopeContext: ScopeContext | undefined,
  captureError: ClientPhoneErrorCapture
): Promise<IPhone | undefined> {
  const { t } = useI18n();
  const { put, useUrl } = useQuery();
  const clientId = resolveClientId(scopeContext);

  if (!isAddressable(clientId.value)) {
    return Promise.reject(new NotAuthenticatedError());
  }

  return put<IPhone>({
    mutationKey: [...queryKey, id, "default"],
    url: useUrl(`clients/${clientId.value}/phones/${id}`),
    data: { default: true },
    withAccessToken: true
  })
    .then(invalidateQueryByKey(queryKey, { exact: false }))
    .then(result => {
      useFeedback().addSuccess(t("confirm.phone_set_default"));
      return result;
    })
    .catch(error => {
      captureError(error);
      useFeedback().addError({
        title: isString(error)
          ? error
          : error?.title || t("error.client_phone_set_default_failed"),
        copy: error?.message,
        data: error?.data
      });
      throw error;
    });
}

/**
 * `useModelParser`'s trailing `compactDeep` unconditionally strips every
 * null leaf — including the `phone.{number,nationalNumber,countryCallingCode}`
 * placeholders `PhoneModel` mandates as `null`, not absent. Restores exactly
 * those (and only those — `defaultsDeep` never touches a key the parser
 * actually resolved) from a neutral null-shaped template, never from a real
 * previously-loaded record, so an intentionally-cleared field is never
 * resurrected.
 */
function withPhonePlaceholders(
  model: PhoneModel,
  template: PhoneModel
): PhoneModel {
  return defaultsDeep(model, template);
}

/**
 * `loading` — resolves the country, floors the base model at it, and seeds
 * the form's starting model. Carried verbatim from the pre-conversion
 * services module (row M2) — also absorbs the legacy brand-country default
 * (row L8): the capability is "the form opens on a sensible dial country";
 * only the SOURCE moves from `brand.country_id` to `useSystem().getCountry`.
 *
 * Seeds from the existing record when one is being edited and no model has
 * been resolved yet — the manager's per-record read, mirroring the
 * `client-email` reference's `loadLookups` (design.md §5).
 */
async function loadLookups(
  { id, model, schema }: PhoneContext,
  scopeContext?: ScopeContext
): Promise<Partial<PhoneContext>> {
  const { t } = useI18n();
  const { ensureCountries, getCountry } = useSystem();

  // `ensureCountries()` is the data-returning path — it awaits brand
  // readiness and the countries query's own settled promise internally.
  // NEVER gate this on `useSystem().isReady()`: that polls ALL of the
  // system module's active singleton queries (including ones unrelated to
  // this lookup, e.g. billing cycles activated by another consumer earlier
  // in the same session) via an uncapped `setInterval`, so a session that
  // has already touched the system module once can hang here indefinitely.
  const countries = await ensureCountries().catch(error =>
    Promise.reject(
      new DetailedError(
        t("error.system_not_available"),
        responseCodes.Unauthorized,
        ErrorOrigin.Headless,
        error
      )
    )
  );

  const seed = isEmpty(model) ? await loadOne(id, scopeContext) : model;
  const country = getCountry(seed?.phone?.country);

  if (!countries || !country) {
    return Promise.reject(
      new DetailedError(
        t("error.countries_load_failed"),
        responseCodes.No_Content,
        ErrorOrigin.Headless
      )
    );
  }

  const baseModel: PhoneModel = {
    phone: {
      number: null,
      nationalNumber: null,
      countryCallingCode: null,
      country: country.code
    }
  };

  const safeModel = withPhonePlaceholders(
    useModelParser<PhoneModel, Phone>(schema, seed, baseModel),
    baseModel
  );

  return { country, model: safeModel, baseModel: safeModel };
}

/**
 * `available.checking.parsing` — libphonenumber-js parse against the
 * resolved country, with the oracle's fallback chain: parsed value, else the
 * prior model value, else the event's country, else the context's country.
 * Carried verbatim (row M4, `Direct`) — each `||` exists because a
 * partially-parseable number must not lose the component the previous parse
 * established. The `parse-fallback.must-fail.patch` negative control targets
 * the `|| safeModel.phone.nationalNumber` line below.
 */
async function parse(
  { schema, country }: PhoneContext,
  { data }: AnyEventObject
): Promise<Partial<PhoneContext>> {
  const parsedModel = useModelParser<PhoneModel, Phone>(
    schema,
    get(data, "model", data)
  );

  if (!parsedModel) return { model: parsedModel, country };

  const safeModel = withPhonePlaceholders(parsedModel, {
    phone: {
      number: null,
      nationalNumber: null,
      countryCallingCode: null,
      country: null
    }
  });

  const phoneNumber =
    (safeModel?.phone?.number || safeModel?.phone?.nationalNumber) ?? "";

  const countryCode: CountryCode = (safeModel?.phone?.country ||
    data?.country?.code ||
    country?.code ||
    "") as CountryCode;

  const phone = parsePhoneNumber(phoneNumber, countryCode);

  safeModel.phone.number = phone?.number || safeModel?.phone?.number;

  safeModel.phone.nationalNumber =
    phone?.nationalNumber || safeModel?.phone?.nationalNumber;

  safeModel.phone.countryCallingCode =
    phone?.countryCallingCode || safeModel?.phone?.countryCallingCode;

  safeModel.phone.country =
    phone?.country || safeModel?.phone?.country || country?.code || null;

  if (
    !!safeModel?.phone?.country &&
    safeModel.phone.country !== country?.code
  ) {
    const { getCountry } = useSystem();
    // the form's country changed under the parse — re-resolve to the new one
    country = getCountry(safeModel.phone.country);
  }

  return { model: safeModel, country };
}

/**
 * `available.checking.validating` and `processing.validating`. Rejects with a
 * `DetailedError` carrying the AJV errors as `data`; the shared machine's
 * `setError` lands that in context, where the manager exposes it as
 * `validationErrors`. Nothing here raises feedback.
 */
async function validate({ schema, model }: Partial<PhoneContext> = {}): Promise<
  PhoneModel | undefined
> {
  const { t } = useI18n();
  if (!schema) return model;

  const { validate: validateAgainstSchema } = useValidation();

  return new Promise((resolve, reject) => {
    const errors = validateAgainstSchema(schema, model);
    if (errors?.length) {
      reject(
        new DetailedError(
          t("error.client_phone_validation_failed"),
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
 * Invalidates this module's cache key so the collection refetches. The
 * manager calls it after a settled save rather than reaching into the
 * collection composable's query instance, which belongs to a different scope
 * key and may not exist in this consumer at all (row M9, decision — never
 * mint a fresh services instance here, which would drop the scope's resolved
 * client).
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
 * earned (design.md §7 — the arms determination; every candidate row is a
 * `Dropped-with-Linear-issue` staff row, S1-S7).
 */
function scopedServices(
  scopeActor: ScopeActorTypes,
  _scopeContext?: ScopeContext
): Partial<ClientPhoneServices> {
  switch (scopeActor) {
    default:
      return {};
  }
}

// -----------------------------------------------------------------------------
// Scope-Ready Services

/**
 * Services factory — the concrete actor and the context it acts upon arrive
 * first, at construction. `useClientPhones.ts` calls it once and so does
 * `useClientPhoneManager.ts`, each with ITS OWN resolved scope, so the two
 * instances share no mutable state.
 */
export const createClientPhoneServices = (
  scopeActor: ScopeActorTypes,
  scopeContext?: ScopeContext
): ClientPhoneServices => {
  const mutationError = ref<ResponseError | undefined>(undefined);
  const clientId = resolveClientId(scopeContext);

  const captureError: ClientPhoneErrorCapture = error => {
    mutationError.value = mapToHeadlessError(error);
  };

  return {
    queryKey,
    clientId,
    isAvailable: computed(() => isAddressable(clientId.value)),
    error: computed(() => mutationError.value),
    loadList: () => loadList(scopeContext),
    loadOne: id => loadOne(id, scopeContext),
    add: model => add(model, scopeContext),
    update: (id, model) => update(id, model, scopeContext),
    ensure: model => ensure(model, scopeContext),
    remove: id => remove(id, scopeContext, captureError),
    setDefault: id => setDefault(id, scopeContext, captureError),
    loadLookups: context => loadLookups(context, scopeContext),
    parse,
    validate,
    refresh,
    ...scopedServices(scopeActor, scopeContext)
  };
};

export default createClientPhoneServices;

// -----------------------------------------------------------------------------
// Machine-Ready Services (manager half)

/**
 * Adapts the ALREADY-SCOPED services object into the two members of the
 * XState services map the shared `dataManagerMachine` invokes that need
 * re-shaping — `add` / `update` take a `PhoneModel`, not a `PhoneContext`.
 * `loadLookups` / `parse` / `validate` pass straight through: their
 * signatures already match what the machine invokes.
 *
 * The adapter takes `service` as an argument rather than minting its own: the
 * scope, and therefore the target client, is resolved ONCE in
 * `useClientPhoneManager.ts` and threaded in. An adapter that built its own
 * services instance would silently drop the scope's retarget.
 * @internal
 */
export const useClientPhoneManagerServices = (
  service: ClientPhoneServices
): ClientPhoneManagerMachineServices => ({
  loadLookups: service.loadLookups,
  parse: service.parse,
  validate: service.validate,

  /**
   * `processing.adding` — entered when the machine's `isNew` guard passes.
   * Wired to find-or-create, so saving a number the collection already holds
   * resolves the existing record instead of creating a duplicate.
   */
  add: ({ model }: PhoneContext) => {
    if (isEmpty(model)) {
      return Promise.reject(
        new DetailedError(
          useI18n().t("error.client_phone_not_available"),
          responseCodes.No_Content,
          ErrorOrigin.Headless,
          { model }
        )
      );
    }
    return service.ensure(model);
  },

  /** `processing.updating` — entered when the context already carries an id. */
  update: ({ id, model }: PhoneContext) => {
    if (!id || isEmpty(model)) {
      return Promise.reject(
        new DetailedError(
          useI18n().t("error.client_phone_not_available"),
          responseCodes.No_Content,
          ErrorOrigin.Headless,
          { id, model }
        )
      );
    }
    return service.update(id, model);
  }
});
