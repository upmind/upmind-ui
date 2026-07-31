/** @internal */
import parsePhoneNumber, { type CountryCode } from "libphonenumber-js";
import { useFeedback } from "../feedback";
import { useQuery, invalidateQueryByKey } from "../query";
import { ScopeActorTypes } from "../scope";
import { useActiveSession } from "../session-store";
import { useSystem } from "../system";
import { useI18n } from "../system-localisation";
import { mapIPhone, mapPhone, mapPhones } from "./client-phone-dry.mappers";
import { createStaffClientPhoneDryServices } from "./client-phone-dry.services.staff";
import { CLIENT_PHONE_DRY_QUERY_KEY_BASE } from "./client-phone-dry.types";
import {
  useTime,
  ErrorOrigin,
  useValidation,
  DetailedError,
  responseCodes,
  useCollection,
  useModelParser,
  NotAuthenticatedError,
  DEBOUNCE_DELAY
} from "../../utils";
import { get, isEmpty, omitBy, isArray } from "lodash-es";
import type { QueryParams } from "../query";
import type { ScopeContext } from "../scope";
import type {
  Phone,
  PhoneModel,
  PhoneFormContext,
  ClientPhoneDryServices,
  MutationErrorLike
} from "./client-phone-dry.types";
import type { ICountry, IPhone } from "@upmind-automation/types";

// -----------------------------------------------------------------------------
/**
 * @internal
 * @module client-phone-dry/services
 * @description `client-phone-dry` TanStack Query services (list + mutations).
 * Shared = Cell A (`.as('self')`, `clients/{sessionClientId}/phones`, active
 * session token). Cell B (staff `.for('client', id)`) is the `staff` arm
 * (`client-phone-dry.services.staff.ts`) — D1.
 *
 * WARNING: do not import directly. Resolve via `useClientPhonesDry.ts` only.
 */
// -----------------------------------------------------------------------------
// Shared services — Cell A (client/self)

/**
 * Re-exported so a caller of this file keeps the conventional `queryKey`
 * name; the base value itself lives in `client-phone-dry.types.ts` to keep
 * this file <-> `client-phone-dry.services.staff.ts` import-cycle-free (both
 * import the base from `.types.ts`, neither imports the other for it).
 */
export const queryKey = CLIENT_PHONE_DRY_QUERY_KEY_BASE;

/** D4 — `with_staged_imports=1` on every list read (shared, both cells). */
function loadList(
  params: Partial<QueryParams<IPhone[], Phone[]>> = { pagination: { limit: 0 } }
) {
  const { isAuthenticated } = useActiveSession().useMeta();
  const { activeUser: client } = useActiveSession().useContext();
  const { list, useUrl } = useQuery();

  return list<IPhone[], Phone[]>({
    ...params,
    queryKey: [...queryKey, { client: client.value?.id }],
    url: useUrl(`clients/${client.value?.id}/phones`, {
      with_staged_imports: 1
    }),
    withAccessToken: true,
    guard: async () =>
      new Promise((resolve, reject) => {
        if (isAuthenticated.value && !!client.value?.id) {
          resolve(true);
        } else {
          reject(new NotAuthenticatedError());
        }
      }),
    select: mapPhones,
    staleTime: useTime().DAY,
    retryDelay: DEBOUNCE_DELAY,
    enabled: () => isAuthenticated.value && !!client.value?.id
  });
}

function add(data: PhoneModel): Promise<IPhone | undefined> {
  const { activeUser: client } = useActiveSession().useContext();
  const { post, useUrl } = useQuery();

  return post<IPhone>({
    mutationKey: ["client-phone-dry", "phones", "add"],
    url: useUrl(`clients/${client.value?.id}/phones`),
    data: mapIPhone(data),
    withAccessToken: true
  }).then(invalidateQueryByKey(queryKey, { exact: false }));
}

function update(
  id: Phone["id"],
  data: PhoneModel
): Promise<IPhone | undefined> {
  const { activeUser: client } = useActiveSession().useContext();
  const { put, useUrl } = useQuery();

  return put<IPhone>({
    mutationKey: ["client-phone-dry", "phones", id],
    url: useUrl(`clients/${client.value?.id}/phones/${id}`),
    data: mapIPhone(data),
    withAccessToken: true
  }).then(invalidateQueryByKey(queryKey, { exact: false }));
}

function remove(phoneId: Phone["id"]) {
  const { t } = useI18n();
  const { activeUser: client } = useActiveSession().useContext();
  const { mutate, useUrl } = useQuery();

  return mutate<null>("DELETE", {
    url: useUrl(`clients/${client.value?.id}/phones/${phoneId}`),
    onError(error: unknown) {
      const err = error as MutationErrorLike | undefined;
      useFeedback().addError({
        title: err?.title || t("error.client_phone_delete_failed"),
        copy: err?.message,
        data: err?.data
      });
    },
    onSuccess(data) {
      invalidateQueryByKey(queryKey, { exact: false })(data);
      useFeedback().addSuccess(t("confirm.phone_removed"));
    },
    withAccessToken: true
  });
}

function setDefault(phoneId: Phone["id"]) {
  const { t } = useI18n();
  const { activeUser: client } = useActiveSession().useContext();
  const { mutate, useUrl } = useQuery();

  return mutate<IPhone>("PUT", {
    url: useUrl(`clients/${client.value?.id}/phones/${phoneId}`),
    data: { default: true },
    onError(error: unknown) {
      const err = error as MutationErrorLike | undefined;
      useFeedback().addError({
        title: err?.title || t("error.client_phone_set_default_failed"),
        copy: err?.message,
        data: err?.data
      });
    },
    onSuccess(data) {
      invalidateQueryByKey(queryKey, { exact: false })(data);
      useFeedback().addSuccess(t("confirm.phone_set_default"));
    },
    withAccessToken: true
  });
}

/**
 * Find-or-create — composed over WHICHEVER `loadList`/`add` won for this
 * scope (shared or staff-arm-overridden), never over the shared free
 * functions directly. Wired at the end of `createClientPhoneDryServices`,
 * after the arm's `...overrides` spread has resolved, so a staff `ensure()`
 * ensures against the admin endpoint rather than silently falling through to
 * the client one (the FE-2824 drop class this module is a smoke test for).
 */
async function ensure(
  model: PhoneModel,
  resolvedLoadList: ClientPhoneDryServices["loadList"],
  resolvedAdd: ClientPhoneDryServices["add"]
): Promise<Phone> {
  const { t } = useI18n();
  const { data, promise } = resolvedLoadList();
  await promise.value.finally();
  const { findOne } = useCollection<Phone>(
    isArray(data.value) ? data.value : []
  );

  const mapping = omitBy(model, isEmpty);
  const found = findOne(mapping);
  if (found) return Promise.resolve(found);

  return resolvedAdd(model).then(raw => {
    if (!raw || isEmpty(raw))
      throw new DetailedError(
        t("error.client_phone_not_available"),
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless,
        { model }
      );
    return mapPhone(raw);
  });
}

async function parse(
  { schema, country }: Pick<PhoneFormContext, "schema" | "country">,
  data: unknown
): Promise<{ model?: PhoneModel; country?: ICountry }> {
  const safeModel = useModelParser<PhoneModel, Phone>(
    schema,
    get(data, "model", data) as Partial<PhoneModel> | undefined
  );

  if (!safeModel) return Promise.resolve({ model: safeModel, country });

  const phoneNumber =
    (safeModel?.phone?.number || safeModel?.phone?.nationalNumber) ?? "";

  const countryCode: CountryCode = (safeModel?.phone?.country ||
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

  let resolvedCountry = country;
  if (
    !!safeModel?.phone?.country &&
    safeModel.phone.country !== country?.code
  ) {
    const { getCountry } = useSystem();
    resolvedCountry = getCountry(safeModel.phone.country);
  }

  return Promise.resolve({ model: safeModel, country: resolvedCountry });
}

async function validate({
  schema,
  model
}: Pick<PhoneFormContext, "schema" | "model">): Promise<
  PhoneModel | undefined
> {
  const { t } = useI18n();
  if (!schema) return Promise.resolve(model);

  const { validate: doValidate } = useValidation();
  const errors = doValidate(schema, model);

  if (errors?.length) {
    return Promise.reject(
      new DetailedError(
        t("error.client_phone_validation_failed"),
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless,
        errors
      )
    );
  }
  return Promise.resolve(model);
}

// -----------------------------------------------------------------------------
// Service Factory

/**
 * Service matrix: maps scopeActor types to their service implementations.
 * The shape is the same armed or armless — armless resolves only the
 * `default:` case.
 */
function scopedServices(
  scopeActor: ScopeActorTypes,
  scopeContext?: ScopeContext
): Partial<ClientPhoneDryServices> {
  switch (scopeActor) {
    case ScopeActorTypes.STAFF:
      return createStaffClientPhoneDryServices(scopeContext);
    default:
      return {};
  }
}

/**
 * Services factory — the concrete actor and the context it acts upon arrive
 * first, at construction, and `useClientPhonesDry.ts` calls it once.
 */
export const createClientPhoneDryServices = (
  scopeActor: ScopeActorTypes,
  scopeContext?: ScopeContext
): ClientPhoneDryServices => {
  const overrides = scopedServices(scopeActor, scopeContext);
  const resolvedLoadList = overrides.loadList ?? (params => loadList(params));
  const resolvedAdd = overrides.add ?? (model => add(model));

  return {
    queryKey,
    loadList: resolvedLoadList,
    add: resolvedAdd,
    update: (id, model) => update(id, model),
    remove: phoneId => remove(phoneId),
    setDefault: phoneId => setDefault(phoneId),
    ensure: model => ensure(model, resolvedLoadList, resolvedAdd),
    parse,
    validate,
    ...overrides
  };
};

export default createClientPhoneDryServices;
