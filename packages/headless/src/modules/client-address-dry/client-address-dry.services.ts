/** @internal */
import { BrandConfigKeys } from "@upmind-automation/types";
import { useBrand } from "../brand";
import { useFeedback } from "../feedback";
import { useQuery, invalidateQueryByKey } from "../query";
import { ScopeActorTypes } from "../scope";
import { useActiveSession } from "../session-store";
import { useSystem } from "../system";
import { useI18n } from "../system-localisation";
import {
  mapAddress,
  mapAddresses,
  mapIAddressData
} from "./client-address-dry.mappers";
import { createStaffClientAddressDryServices } from "./client-address-dry.services.staff";
import {
  CLIENT_ADDRESS_DRY_QUERY_KEY_BASE,
  DEFAULT_ADDRESS_TYPE
} from "./client-address-dry.types";
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
import { get, find, some, isEmpty, omitBy, isArray } from "lodash-es";
import type { QueryParams } from "../query";
import type { ScopeContext } from "../scope";
import type {
  Address,
  AddressModel,
  AddressFormContext,
  ClientAddressDryServices,
  MutationErrorLike
} from "./client-address-dry.types";
import type { IAddress } from "@upmind-automation/types";

// -----------------------------------------------------------------------------
/**
 * @internal
 * @module client-address-dry/services
 * @description `client-address-dry` TanStack Query services (list +
 * mutations + form lookups). Shared = Cell 1 (`.as('self')`,
 * `clients/{sessionClientId}/addresses`, active session token) AND Cell 3
 * (`.as('self')` under impersonation — the SAME code path, D-ADDR-2). Cell 2
 * (staff `.for('client', id)`) is the `staff` arm
 * (`client-address-dry.services.staff.ts`) — D-ADDR-1.
 *
 * WARNING: do not import directly. Resolve via `useClientAddressesDry.ts` only.
 */
// -----------------------------------------------------------------------------
// Shared services — Cell 1/3 (client/self, incl. impersonation)

/**
 * Re-exported so a caller of this file keeps the conventional `queryKey`
 * name; the base value itself lives in `client-address-dry.types.ts` to keep
 * this file <-> `client-address-dry.services.staff.ts` import-cycle-free
 * (both import the base from `.types.ts`, neither imports the other for it).
 */
export const queryKey = CLIENT_ADDRESS_DRY_QUERY_KEY_BASE;

/**
 * @decision
 * what: every shared (self-path, Cell 1/3) call below sources
 *   `withAccessToken` from `useActiveSession().useContext().session` (the
 *   active session's own token), never bare `withAccessToken: true`. This
 *   block governs `loadList`/`add`/`update`/`remove`/`setDefault` uniformly —
 *   all five apply the identical substitution.
 * why: bare `true` routes through `useQuery` -> `getTokenFromStorage()`,
 *   which with no `actor_type` falls back to `staffCookie || clientCookie ||
 *   guestCookie` (staff-first). Under impersonation the staff session stays
 *   cached, so the staff cookie wins even though `resolveActiveSession`
 *   already makes the impersonated client the ACTIVE session
 *   (`activeActor = CLIENT`, `activeSessionId = impersonatedClientId`,
 *   `session-store`). `useActiveSession().useContext().session` is that same
 *   active session's token — the correct "who am I right now" — and this
 *   mirrors the pattern the staff arm already uses
 *   (`getStaffToken()?.access_token` in `client-address-dry.services.staff.ts`),
 *   just sourced from the active session rather than `staffSessions`.
 * rejected: bare `withAccessToken: true` (cookie-order fallback, staff-first,
 *   mis-selects under a cached-staff impersonation session — the Cell 3 red);
 *   editing `getTokenFromStorage`/session-store core to change cookie order —
 *   protected core, and impersonation already resolves as self here, so no
 *   arm is earned by this fix.
 */
// D-ADDR-4 — `with_staged_imports=1` on every list read (shared, all cells).
function loadList(
  params: Partial<QueryParams<IAddress[], Address[]>> = {
    pagination: { limit: 0 }
  }
) {
  const { isAuthenticated } = useActiveSession().useMeta();
  const { activeUser: client, session } = useActiveSession().useContext();
  const { list, useUrl } = useQuery();

  return list<IAddress[], Address[]>({
    ...params,
    queryKey: [...queryKey, { client: client.value?.id }],
    url: useUrl(`clients/${client.value?.id}/addresses`, {
      with: ["region", "country"].join(),
      with_staged_imports: 1
    }),
    withAccessToken: session.value?.access_token,
    guard: async () =>
      new Promise((resolve, reject) => {
        if (isAuthenticated.value && !!client.value?.id) {
          resolve(true);
        } else {
          reject(new NotAuthenticatedError());
        }
      }),
    select: mapAddresses,
    staleTime: useTime().DAY,
    retryDelay: DEBOUNCE_DELAY,
    enabled: () => isAuthenticated.value && !!client.value?.id
  });
}

function add(data: AddressModel): Promise<IAddress | undefined> {
  const { activeUser: client, session } = useActiveSession().useContext();
  const { post, useUrl } = useQuery();

  return post<IAddress>({
    mutationKey: ["client-address-dry", "addresses", "add"],
    url: useUrl(`clients/${client.value?.id}/addresses`),
    data: mapIAddressData(data),
    withAccessToken: session.value?.access_token
  }).then(invalidateQueryByKey(queryKey, { exact: false }));
}

function update(
  id: Address["id"],
  data: AddressModel
): Promise<IAddress | undefined> {
  const { activeUser: client, session } = useActiveSession().useContext();
  const { put, useUrl } = useQuery();

  return put<IAddress>({
    mutationKey: ["client-address-dry", "addresses", id],
    url: useUrl(`clients/${client.value?.id}/addresses/${id}`),
    data: mapIAddressData(data),
    withAccessToken: session.value?.access_token
  }).then(invalidateQueryByKey(queryKey, { exact: false }));
}

function remove(addressId: Address["id"]) {
  const { t } = useI18n();
  const { activeUser: client, session } = useActiveSession().useContext();
  const { mutate, useUrl } = useQuery();

  return mutate<null>("DELETE", {
    url: useUrl(`clients/${client.value?.id}/addresses/${addressId}`),
    onError(error: unknown) {
      const err = error as MutationErrorLike | undefined;
      useFeedback().addError({
        title: err?.title || t("error.client_address_update_failed"),
        copy: err?.message,
        data: err?.data
      });
    },
    onSuccess(data) {
      invalidateQueryByKey(queryKey, { exact: false })(data);
      useFeedback().addSuccess(t("confirm.address_removed"));
    },
    withAccessToken: session.value?.access_token
  });
}

function setDefault(addressId: Address["id"]) {
  const { t } = useI18n();
  const { activeUser: client, session } = useActiveSession().useContext();
  const { mutate, useUrl } = useQuery();

  return mutate<IAddress>("PUT", {
    url: useUrl(`clients/${client.value?.id}/addresses/${addressId}`),
    data: { default: true },
    onError(error: unknown) {
      const err = error as MutationErrorLike | undefined;
      useFeedback().addError({
        title: err?.title || t("error.client_address_set_default_failed"),
        copy: err?.message,
        data: err?.data
      });
    },
    onSuccess(data) {
      invalidateQueryByKey(queryKey, { exact: false })(data);
      useFeedback().addSuccess(t("confirm.address_set_default"));
    },
    withAccessToken: session.value?.access_token
  });
}

/**
 * Find-or-create — composed over WHICHEVER `loadList`/`add` won for this
 * scope (shared or staff-arm-overridden), never over the shared free
 * functions directly. Wired at the end of `createClientAddressDryServices`,
 * after the arm's `...overrides` spread has resolved, so a staff `ensure()`
 * ensures against the admin endpoint rather than silently falling through to
 * the client one (the FE-2824 drop class this module is a smoke test for).
 */
async function ensure(
  model: AddressModel,
  resolvedLoadList: ClientAddressDryServices["loadList"],
  resolvedAdd: ClientAddressDryServices["add"]
): Promise<Address> {
  const { t } = useI18n();
  const { data, promise } = resolvedLoadList();
  await promise.value.finally();
  const { findOne } = useCollection<Address>(
    isArray(data.value) ? data.value : []
  );

  const mapping = omitBy({ id: model.id }, isEmpty);
  const found = isEmpty(mapping) ? undefined : findOne(mapping);
  if (found) return Promise.resolve(found);

  return resolvedAdd(model).then(raw => {
    if (!raw || isEmpty(raw))
      throw new DetailedError(
        t("error.client_address_not_available"),
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless,
        { model }
      );
    return mapAddress(raw);
  });
}

/**
 * R11/R12 — region/country lookups + brand config, seeding the form model.
 * SHARED across all three cells (design.md §7).
 */
async function loadLookups({
  model,
  schema
}: Pick<AddressFormContext, "model" | "schema">): Promise<
  Pick<
    AddressFormContext,
    "regions" | "country" | "countries" | "config" | "model" | "baseModel"
  >
> {
  const { t } = useI18n();
  const { isReady, ensureCountries, fetchRegions, getCountry } = useSystem();

  await isReady().catch(error =>
    Promise.reject(
      new DetailedError(
        t("error.system_not_available"),
        responseCodes.Unauthorized,
        ErrorOrigin.Headless,
        error
      )
    )
  );

  const countries = await ensureCountries();
  const country = getCountry(model?.address?.countryId);
  const regions = await fetchRegions(model?.address?.countryId || country?.id);

  const { ensureConfig } = useBrand();
  const config = await ensureConfig([
    BrandConfigKeys.REQUIRE_REGION_IN_ADDRESS
  ]);

  if (!countries || !regions) {
    const message = !countries
      ? t("error.countries_not_available")
      : t("error.regions_not_available");

    return Promise.reject(
      new DetailedError(message, responseCodes.No_Content, ErrorOrigin.Headless)
    );
  }

  const baseModel: AddressModel = {
    address: {
      countryId: country?.id,
      address1: null,
      city: null,
      postcode: null
    },
    type: DEFAULT_ADDRESS_TYPE
  };

  const safeModel = useModelParser<AddressModel>(schema, model, baseModel);

  return Promise.resolve({
    regions,
    country,
    countries,
    config,
    model: safeModel,
    baseModel: safeModel
  });
}

async function parse(
  {
    regions,
    country,
    schema
  }: Pick<AddressFormContext, "schema" | "regions" | "country">,
  data: unknown
): Promise<Pick<AddressFormContext, "model" | "regions" | "country">> {
  const { fetchRegions, getCountry } = useSystem();

  const safeModel = useModelParser<AddressModel>(
    schema,
    get(data, "model", data) as Partial<AddressModel> | undefined
  );

  if (!safeModel)
    return Promise.resolve({ model: safeModel, regions, country });

  country = getCountry(safeModel.address?.countryId);
  safeModel.address.countryId = country.id;

  if (!some(regions, ["country_id", safeModel?.address?.countryId])) {
    regions = await fetchRegions(safeModel.address.countryId);
    country = getCountry(safeModel.address.countryId);
  }

  const region = find(regions, ["id", safeModel?.address?.regionId]);
  safeModel.address.regionId = get(region, "id");

  return Promise.resolve({ model: safeModel, regions, country });
}

async function validate({
  schema,
  model
}: Pick<AddressFormContext, "schema" | "model">): Promise<
  AddressModel | undefined
> {
  const { t } = useI18n();
  if (!schema) return Promise.resolve(model);

  const { validate: doValidate } = useValidation();
  const errors = doValidate(schema, model);

  if (errors?.length) {
    return Promise.reject(
      new DetailedError(
        t("error.client_address_validation_failed"),
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
): Partial<ClientAddressDryServices> {
  switch (scopeActor) {
    case ScopeActorTypes.STAFF:
      return createStaffClientAddressDryServices(scopeContext);
    default:
      return {};
  }
}

/**
 * Services factory — the concrete actor and the context it acts upon arrive
 * first, at construction, and `useClientAddressesDry.ts` calls it once.
 */
export const createClientAddressDryServices = (
  scopeActor: ScopeActorTypes,
  scopeContext?: ScopeContext
): ClientAddressDryServices => {
  const overrides = scopedServices(scopeActor, scopeContext);
  const resolvedLoadList = overrides.loadList ?? (params => loadList(params));
  const resolvedAdd = overrides.add ?? (model => add(model));

  return {
    queryKey,
    loadList: resolvedLoadList,
    add: resolvedAdd,
    update: (id, model) => update(id, model),
    remove: addressId => remove(addressId),
    setDefault: addressId => setDefault(addressId),
    ensure: model => ensure(model, resolvedLoadList, resolvedAdd),
    loadLookups,
    parse,
    validate,
    ...overrides
  };
};

export default createClientAddressDryServices;
