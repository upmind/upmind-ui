/** @internal */
import { computed, ref } from "vue";
import { BrandConfigKeys, type IAddress } from "@upmind-automation/types";
import { useBrand } from "../brand";
import { useFeedback } from "../feedback";
import { invalidateQueryByKey, useQuery } from "../query";
import { useActiveSession } from "../session-store";
import { useSystem } from "../system";
import { useI18n } from "../system-localisation";
import {
  mapAddress,
  mapAddresses,
  mapIAddressData,
  mapIAddressDataDiff
} from "./client-address.mappers";
import { useSchema } from "./client-address.schemas";
import { ClientAddressesContextTypes } from "./client-address.types";
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
  find,
  first,
  get,
  isArray,
  isEmpty,
  isString,
  pick,
  some
} from "lodash-es";
import type { QueryParams } from "../query";
import type { ScopeContext } from "../scope";
import type {
  Address,
  AddressContext,
  AddressModel,
  ClientAddressErrorCapture,
  ClientAddressListQuery,
  ClientAddressManagerMachineServices,
  ClientAddressServices
} from "./client-address.types";
import type { ResponseError } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { QueryKey } from "@tanstack/vue-query";
import type { ICountry } from "@upmind-automation/types";
import type { AnyEventObject } from "xstate";
// -----------------------------------------------------------------------------
/**
 * @module client-address/client-address.services
 * @description The ONE services file both halves consume — the collection's
 * `loadList`, the manager's per-address read and writes, and the XState
 * services adapter the shared `dataManagerMachine` invokes. One factory on
 * purpose: one identity seam, one cache key, one arm-resolution switch.
 *
 * This module DOES raise feedback on `remove` / `setDefault`, deliberately and
 * against the `client-company` reference's placement — operator ruling R10:
 * both oracles raise it in the data layer, so relocating it to eight consumers
 * would be a behaviour change against the oracle wearing a refactor's clothes
 * (`design.md` D-14, `parity.yaml` F1/F2, AC-40).
 *
 * WARNING: Do not import directly from another module. Resolve via
 * `useClientAddresses.ts` / `useClientAddressManager.ts` only
 * (`@internal/no-cross-module-imports`).
 */
// -----------------------------------------------------------------------------

/**
 * The module's base cache key. The manager's writes invalidate it; that, and
 * nothing else, is how a save refreshes the collection.
 */
export const queryKey: QueryKey = ["client", "addresses"];

/**
 * Derives the target client id from the RESOLVED scope — the ONE seam every
 * request-issuing function in this file shares, and the fix for a services
 * layer where five call sites each re-read the session independently
 * (`loadList`, `add`, `update`, `remove`, `setDefault` on the pre-conversion
 * file) while the manager's `clientId` PARAMETER never reached a URL at all
 * (`parity.yaml` W12/L10 — the module's live FE-2824).
 *
 * A `.for('client', id)` context names the client being addressed; with none it
 * falls back to the active session's own client (the self case). This compares
 * the CONTEXT the scope builder resolved, never the actor, so it is not a
 * branch on `ScopeActorTypes.SELF`. The manager's context names the ADDRESS,
 * not its owner, so it falls through to the session.
 *
 * Called ONCE per services instance; every request function below takes the
 * resulting ref rather than re-deriving its own. A second derivation is a
 * second seam, which is the defect this replaces.
 *
 * @param pin - PINS the first resolution for the lifetime of the instance. The
 * editor's target client is fixed the moment its scope resolves: a session that
 * later moves to another client must not move an open form's save (AC-30). The
 * `??=` is what makes the first NON-EMPTY resolution the pin, so a scope built
 * before the session has settled still pins the right client rather than
 * freezing `undefined`.
 */
function resolveClientId(scopeContext?: ScopeContext, pin = false) {
  const { activeUser } = useActiveSession().useContext();
  const pinned = ref<string | undefined>(undefined);

  return computed(() => {
    const live =
      scopeContext?.type === ClientAddressesContextTypes.CLIENT
        ? scopeContext.id
        : activeUser.value?.id;

    if (!pin) return live;

    pinned.value ??= live;
    return pinned.value;
  });
}

/**
 * Resolves the country a form should sit on, from the model's own id and
 * falling back to the brand's.
 *
 * `useSystem().getCountry` is TYPED `ICountry` but resolves `undefined` whenever
 * neither the model nor the brand names a country the fetched list actually
 * carries. Dereferencing that lie is what wedged the create path: the `parse`
 * service threw, and the shared machine's `available.checking.parsing` has no
 * `onError`, so the editor sat in `parsing` forever — `update()` never settled
 * and no `POST` was ever issued (AC-24). The last-resort fall back to the first
 * country the API returned keeps a draft's country control populated with a
 * REAL, selectable country instead of blank (AC-16).
 */
function resolveCountry(
  countries?: ICountry[],
  countryId?: string | null
): ICountry | undefined {
  const { getCountry } = useSystem();

  return getCountry(countryId) ?? first(countries);
}

/**
 * Resolves true only for an authenticated session with an addressable client.
 *
 * The module's ONE addressability predicate. `remove` and `setDefault` used to
 * write it INVERTED — `isAuthenticated.value || !clientId.value` resolved
 * `true` for an unauthenticated session with NO client id and the request went
 * out at `clients/undefined/addresses/{id}` (`parity.yaml` L1, ruling R8a).
 * They also passed it as `guard:` to `useQuery().mutate()`, which ACCEPTS a
 * guard and never awaits one — only `list()` honours it — so the check could
 * not have stopped the request even written correctly. Both now call this
 * predicate as a precondition, which is what makes AC-11 / AC-13's empty
 * capture log reachable at all.
 */
function isAddressable(clientId?: string): boolean {
  const { isAuthenticated } = useActiveSession().useMeta();

  return isAuthenticated.value && !!clientId;
}

/**
 * Shapes a rejected mutation into the feedback store's error payload, keeping
 * the pre-conversion precedence exactly: a raw string IS the title, otherwise
 * the error's own `title`, otherwise the supplied fallback key.
 */
function toFeedbackError(error: unknown, fallbackTitle: string) {
  return {
    title: isString(error) ? error : get(error, "title") || fallbackTitle,
    copy: get(error, "message") as string | undefined,
    data: get(error, "data")
  };
}

// -----------------------------------------------------------------------------
// QUERIES

/** COLLECTION — the reactive list query, minted once per scope. */
function loadList(
  params: Partial<QueryParams<IAddress[], Address[]>> = {
    pagination: { limit: 0 }
  },
  clientId: ClientAddressServices["clientId"]
): ClientAddressListQuery {
  const { list, useUrl } = useQuery();
  const targetUrl = () =>
    useUrl(`clients/${clientId.value}/addresses`, {
      with: ["region", "country"].join()
    });
  const url = targetUrl();

  return list<IAddress[], Address[]>({
    ...params,
    queryKey: [...queryKey, { client: clientId }],
    url,
    // `enabled:` only stops the query starting; this rejects a forced
    // `refetch()` on a dead or unaddressable session with the typed error
    // instead of a raw 401. Must stay an `async` function — `list()` detects a
    // guard by `isPromise`, which tests for an AsyncFunction. Re-deriving the
    // pathname here is what lets a client id that resolves AFTER construction
    // still address the right client instead of `clients/undefined/...`.
    guard: async () => {
      if (!isAddressable(clientId.value)) {
        return Promise.reject(new NotAuthenticatedError());
      }
      url.pathname = targetUrl().pathname;
      return true;
    },
    withAccessToken: true,
    // --- options
    select: mapAddresses,
    staleTime: useTime().DAY,
    retryDelay: DEBOUNCE_DELAY,
    enabled: () => isAddressable(clientId.value)
  });
}

/**
 * MANAGER — per-address read. A one-shot promise rather than a reactive query:
 * the manager holds a machine, and its `loading` state awaits this when no
 * model has already been supplied, so an editor opened by
 * `.for('address', id)` no longer depends on the collection being loaded.
 *
 * @decision
 * what: the editor resolves its own row by id, accepting a request family the
 *   oracle never issued — `GET clients/{id}/addresses/{id}` appears 5x in the
 *   post-migration e2e trace and 0x in the pre-migration recording. Intended,
 *   not accidental.
 * why: the oracle read the row out of the already-loaded `clientScope` params
 *   (`addEditClientAddressModal.vue:94-99`), so an editor could only be opened
 *   once the collection had been fetched. `.for(ADDRESS, id)` has no such
 *   precondition, which is the capability AC-17 / `parity.yaml` W8 specify;
 *   the read is what pays for it. It is purely ADDITIVE — nothing the oracle
 *   did is dropped, and `.fresh()` still issues none (AC-16). AC-38's
 *   "exactly as before" governs the seeding flow, which uses `.fresh()`; this
 *   is the edit path.
 * rejected: seeding the editor from the collection's cached row to keep the
 *   trace byte-identical — it reinstates the collection-loaded precondition
 *   this conversion removes, and would make `.for(ADDRESS, id)` silently
 *   resolve an empty form for any consumer that never listed first.
 */
async function loadOne(
  id: Address["id"] | undefined,
  clientId: ClientAddressServices["clientId"]
): Promise<Address | undefined> {
  if (!id) return undefined;

  const { get: getOne, useUrl } = useQuery();

  if (!isAddressable(clientId.value)) {
    return Promise.reject(new NotAuthenticatedError());
  }

  return getOne<IAddress, Address>({
    queryKey: [...queryKey, { client: clientId.value }, id],
    url: useUrl(`clients/${clientId.value}/addresses/${id}`, {
      with: ["region", "country"].join()
    }),
    select: mapAddress,
    withAccessToken: true
  });
}

/**
 * MANAGER — loads everything the form needs to be fillable: the country list,
 * the regions for the model's country, and the brand's address rules, then
 * seeds the base model.
 *
 * `CLIENT_ALLOW_ADDRESS_UPDATE` joins the config key list here (ruling R8d,
 * `parity.yaml` W11/L4): it is the key legacy reads to lock the country on an
 * existing address, and the pre-conversion module fetched only
 * `REQUIRE_REGION_IN_ADDRESS`, so the uischema had nothing to gate on.
 */
async function loadLookups(
  { id, model, schema }: AddressContext,
  clientId: ClientAddressServices["clientId"]
): Promise<Partial<AddressContext>> {
  const { t } = useI18n();
  const { isReady, ensureCountries, fetchRegions } = useSystem();
  const { ensureConfig } = useBrand();

  // we have to do this synchronously as we need the values to be available for the model
  // these could/should be cached in the system machine, so there's no worry about performance
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

  const seed = isEmpty(model) ? await loadOne(id, clientId) : model;

  const countries = await ensureCountries();
  const country = resolveCountry(countries, seed?.address?.countryId);
  const regions = await fetchRegions(seed?.address?.countryId || country?.id);

  const config = await ensureConfig([
    BrandConfigKeys.REQUIRE_REGION_IN_ADDRESS,
    BrandConfigKeys.CLIENT_ALLOW_ADDRESS_UPDATE
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
    id: seed?.id ?? id,
    name: seed?.name,
    type: seed?.type,
    address: {
      // Cast, not `!`: `resolveCountry` reports honestly that a brand naming no
      // country and an empty country list leave a draft with none to seed. The
      // model type calls it required because the schema does; a blank draft
      // under that (unreachable in practice) condition is invalid, not a crash.
      countryId: (seed?.address?.countryId ??
        country?.id) as AddressModel["address"]["countryId"],
      address1: seed?.address?.address1 ?? null,
      address2: seed?.address?.address2,
      city: seed?.address?.city ?? null,
      postcode: seed?.address?.postcode ?? null,
      regionId: seed?.address?.regionId,
      state: seed?.address?.state
    }
  };

  // `context.schema` is not set yet at this point in the machine's lifecycle
  // (`setSchemas` runs once THIS invoke's promise resolves), so parsing against
  // it skipped all schema shaping and left `baseModel` a raw object while every
  // later `parse()` re-derives `model` through the REAL schema — two shapes for
  // the same values, which `isDirty`'s `isEqual` reads as a change that never
  // happened.
  const safeSchema =
    schema ?? useSchema({ id, countries, regions, config, baseModel });
  const safeModel = useModelParser<AddressModel>(safeSchema, baseModel);

  return Promise.resolve({
    regions,
    country,
    countries,
    config,
    // ---
    model: safeModel,
    baseModel: safeModel
  });
}

// -----------------------------------------------------------------------------
// MUTATIONS

/** MANAGER — create. The model is always sent whole; a create has no prior state to diff against. */
async function add(
  data: AddressModel,
  clientId: ClientAddressServices["clientId"]
): Promise<IAddress | undefined> {
  const { post, useUrl } = useQuery();

  if (!isAddressable(clientId.value)) {
    return Promise.reject(new NotAuthenticatedError());
  }

  return post<IAddress>({
    mutationKey: [...queryKey, "add"],
    url: useUrl(`clients/${clientId.value}/addresses`),
    data: mapIAddressData(data),
    withAccessToken: true
  }).then(invalidateQueryByKey(queryKey, { exact: false }));
}

/**
 * MANAGER — update. Sends only the fields that changed when a `baseModel` is
 * supplied, exactly as legacy does (`parity.yaml` L3 / AC-23); a caller with no
 * baseline to diff against still sends the full payload.
 */
async function update(
  id: Address["id"],
  data: AddressModel,
  baseData: AddressModel | undefined,
  clientId: ClientAddressServices["clientId"]
): Promise<IAddress | undefined> {
  const { put, useUrl } = useQuery();

  if (!isAddressable(clientId.value)) {
    return Promise.reject(new NotAuthenticatedError());
  }

  return put<IAddress>({
    mutationKey: [...queryKey, id],
    url: useUrl(`clients/${clientId.value}/addresses/${id}`),
    data: mapIAddressDataDiff(data, baseData),
    withAccessToken: true
  }).then(invalidateQueryByKey(queryKey, { exact: false }));
}

/**
 * Find-or-create by id. ONE body, two call sites: the collection's `ensure`
 * action and the machine's `add` service both resolve here.
 */
async function ensure(
  model: AddressModel,
  clientId: ClientAddressServices["clientId"],
  captureError: ClientAddressErrorCapture
): Promise<Address> {
  const { t } = useI18n();

  if (!isAddressable(clientId.value)) {
    return Promise.reject(new NotAuthenticatedError());
  }

  const query = loadList(undefined, clientId);
  await query.promise.value.finally();

  const { findOne } = useCollection<Address>(
    isArray(query.data.value) ? query.data.value : []
  );

  // We only need to check if we have an address with the matching id
  const mapping = pick(model, "id");
  const found = isEmpty(mapping) ? undefined : findOne(mapping);
  if (found) return found;

  return add(model, clientId)
    .then(raw => {
      if (isEmpty(raw)) {
        throw new DetailedError(
          t("error.client_address_not_available"),
          responseCodes.Unprocessable_Entity,
          ErrorOrigin.Headless,
          { model }
        );
      }
      return mapAddress(raw as IAddress);
    })
    .catch(error => {
      captureError(error);
      throw error;
    });
}

/**
 * COLLECTION — delete an address.
 *
 * The user-facing feedback stays HERE (operator ruling R10): both oracles raise
 * it in the data layer, and a failed delete is REPORTED, never thrown at the
 * consumer — the returned promise settles either way (AC-14, AC-40). An
 * unaddressable session is the one rejection, and it rejects WITHOUT issuing a
 * request (AC-11).
 */
async function remove(
  addressId: Address["id"],
  clientId: ClientAddressServices["clientId"],
  captureError: ClientAddressErrorCapture
): Promise<void> {
  const { t } = useI18n();
  const { del, useUrl } = useQuery();

  if (!isAddressable(clientId.value)) {
    return Promise.reject(new NotAuthenticatedError());
  }

  return del<null>({
    mutationKey: [...queryKey, addressId, "remove"],
    url: useUrl(`clients/${clientId.value}/addresses/${addressId}`),
    withAccessToken: true
  })
    .then(data => {
      invalidateQueryByKey(queryKey, { exact: false })(data);
      useFeedback().addSuccess(t("confirm.address_removed"));
    })
    .catch((error: unknown) => {
      captureError(error);
      useFeedback().addError(
        toFeedbackError(error, t("error.client_address_update_failed"))
      );
    });
}

/** COLLECTION — promote an address to the client's default. See `remove`'s note on R10 and AC-13. */
async function setDefault(
  addressId: Address["id"],
  clientId: ClientAddressServices["clientId"],
  captureError: ClientAddressErrorCapture
): Promise<void> {
  const { t } = useI18n();
  const { put, useUrl } = useQuery();

  if (!isAddressable(clientId.value)) {
    return Promise.reject(new NotAuthenticatedError());
  }

  return put<IAddress>({
    mutationKey: [...queryKey, addressId, "default"],
    url: useUrl(`clients/${clientId.value}/addresses/${addressId}`),
    data: { default: true },
    withAccessToken: true
  })
    .then(data => {
      invalidateQueryByKey(queryKey, { exact: false })(data);
      useFeedback().addSuccess(t("confirm.address_set_default"));
    })
    .catch((error: unknown) => {
      captureError(error);
      useFeedback().addError(
        toFeedbackError(error, t("error.client_address_set_default_failed"))
      );
    });
}

// -----------------------------------------------------------------------------
//  SIDE EFFECTS

/**
 * MANAGER — re-resolves the country from `address.countryId`, refetches regions
 * on a country change, and nulls a `regionId` not in the new list
 * (`parity.yaml` L9 / AC-19).
 */
async function parse(
  { schema, baseModel, regions, country, countries }: AddressContext,
  { data }: AnyEventObject
): Promise<Partial<AddressContext>> {
  // We need to check and potentially update the region list based on the selected country (if it's changed)
  const { fetchRegions } = useSystem();

  // sometimes the machine can return the full context as data, so we check to see if we have a model
  // if not, then we assume the data is the model.
  // `baseModel` is threaded through for the same reason `setModel` threads it:
  // `useModelParser`'s `defaultsDeep(values, baseModel)` is what fills in every
  // key a PARTIAL `SET` payload omits. Without it a one-field `input({ address:
  // { countryId } })` re-parses against that field alone and nulls every
  // untouched sibling — which the diff-only update (L3) would then send.
  const safeModel = useModelParser<AddressModel>(
    schema,
    get(data, "model", data),
    baseModel
  );

  // first let's check we have a valid country,
  // fallback to the default country if not set or invalid.
  // The guard is load-bearing, not defensive noise: an unresolvable country
  // used to throw here, and the shared machine's `available.checking.parsing`
  // carries no `onError`, so the editor wedged in `parsing` for good.
  const resolved = resolveCountry(countries, safeModel.address?.countryId);
  if (resolved) {
    country = resolved;
    safeModel.address.countryId = resolved.id;
  }

  // let's check if the country has changed, i.e.: the regions don't match
  // if so, then we need to fetch the regions for the new country
  // AND update our 'default' country to match the country from the address
  // TODO: Regions should be mapped to camelcase, e.g country_id => countryId
  if (!some(regions, ["country_id", safeModel?.address?.countryId])) {
    regions = await fetchRegions(safeModel.address.countryId);
    country = resolveCountry(countries, safeModel.address.countryId) ?? country;
  }

  // now let's check our region list to see if we have a match
  // if so, then we need to update the safeModel with the new region id
  // otherwise the regionId is reset to null
  //
  // `?? null` is the whole clearance, not a style choice: `get` yields
  // `undefined` for a region the new country's list does not carry, and the
  // diff payload KEEPS a changed-to-undefined key (`isEqual(old, undefined)`
  // is false) only for `JSON.stringify` to drop it again — so a US → UK change
  // sent `country_id` with no `region_id` and the server kept the stale US
  // region on a UK address. An explicit `null` survives serialisation and
  // clears it (AC-19).
  const region = find(regions, ["id", safeModel?.address?.regionId]);
  safeModel.address.regionId = get(region, "id") ?? null;

  return Promise.resolve({ model: safeModel, regions, country });
}

/**
 * Schema validation. Rejects with a `DetailedError` carrying the AJV errors as
 * `data`; the shared machine's `setError` lands that in context, where the
 * manager exposes it as `validationErrors`. Nothing here raises feedback.
 */
async function validate(
  schema: AddressContext["schema"],
  model?: AddressModel
): Promise<AddressModel | undefined> {
  const { t } = useI18n();
  if (!schema) return Promise.resolve(model);

  // Now validate the model as per normal
  const { validate: validateAgainstSchema } = useValidation();

  return new Promise((resolve, reject) => {
    const errors = validateAgainstSchema(schema, model);
    if (errors?.length) {
      reject(
        new DetailedError(
          t("error.client_address_validation_failed"),
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
 * earned. The oracle's per-actor ROUTE variance (`api/admin/clients/{id}/…` vs
 * `api/clients/{id}/…`) belongs entirely to `parity.yaml` D1, dropped under
 * operator ruling R2 — with one resolving actor there is no actor to switch
 * on. If D1 is ever taken, THIS is the layer that earns
 * `client-address.services.staff.ts` (`design.md` D-8).
 */
function scopedServices(
  _scopeActor: ScopeActorTypes,
  _scopeContext?: ScopeContext
): Partial<ClientAddressServices> {
  switch (_scopeActor) {
    default:
      return {};
  }
}

// -----------------------------------------------------------------------------
// Scope-Ready Services

/**
 * Services factory — the concrete actor and the context it acts upon arrive
 * first, at construction. `useClientAddresses.ts` calls it once and so does
 * `useClientAddressManager.ts`, each with ITS OWN resolved scope, so the two
 * instances share no mutable state.
 *
 * @param options.pinClient - pins the resolved client for the instance's
 * lifetime. The MANAGER passes it: an open editor addresses the account it was
 * opened for, whatever the session does next (AC-30). The collection does not —
 * a list follows its session, exactly as the merged sibling modules' do.
 */
export const createClientAddressServices = (
  scopeActor: ScopeActorTypes,
  scopeContext?: ScopeContext,
  options: { pinClient?: boolean } = {}
): ClientAddressServices => {
  const mutationError = ref<ResponseError | undefined>(undefined);
  const clientId = resolveClientId(scopeContext, options.pinClient);

  const captureError: ClientAddressErrorCapture = error => {
    mutationError.value = mapToHeadlessError(error);
  };

  return {
    queryKey,
    clientId,
    isAvailable: computed(() => isAddressable(clientId.value)),
    error: computed(() => mutationError.value),
    loadList: params => loadList(params, clientId),
    loadOne: id => loadOne(id, clientId),
    add: model => add(model, clientId),
    update: (id, model) => update(id, model, undefined, clientId),
    ensure: model => ensure(model, clientId, captureError),
    remove: id => remove(id, clientId, captureError),
    setDefault: id => setDefault(id, clientId, captureError),
    validate,
    refresh,
    loadLookups: context => loadLookups(context, clientId),
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
 * `useClientAddressManager.ts` and threaded in. `update` diffs `context.model`
 * against `context.baseModel` — the clone taken when the form opened — which
 * is what delivers the diff-only body legacy sends (`parity.yaml` L3), and
 * addresses `service.clientId` — the instance's PINNED client — so the save
 * goes where the form was opened rather than wherever the session has since
 * moved (AC-30).
 * @internal
 */
export const useClientAddressManagerServices = (
  service: ClientAddressServices
): ClientAddressManagerMachineServices => ({
  loadLookups: service.loadLookups,

  parse: service.parse,

  validate: ({ schema, model }: AddressContext) => validate(schema, model),

  /**
   * `processing.adding` — entered when the machine's `isNew` guard passes.
   * Wired to find-or-create, so saving an address the collection already holds
   * resolves the existing record instead of creating a duplicate.
   */
  add: ({ model }: AddressContext) =>
    model
      ? service.ensure(model)
      : Promise.reject(
          new DetailedError(
            useI18n().t("error.client_address_not_available"),
            responseCodes.No_Content,
            ErrorOrigin.Headless,
            { model }
          )
        ),

  /**
   * `processing.updating` — entered when the context already carries an id.
   *
   * The `mapAddress` hop is what makes the two `processing` limbs SYMMETRIC.
   * Both resolve into the shared machine's `setModel`, which re-parses the
   * resolved value through `useModelParser(schema, data, baseModel)`; the
   * `add:` limb above resolves a camelCase `Address` (via `service.ensure`),
   * so without this the update limb handed `setModel` a raw snake_case
   * `IAddress` with no `address` key at all — `defaultsDeep` then refilled
   * `address` from the FORM-OPEN snapshot and a successful save silently
   * reverted the model to its pre-edit values.
   */
  update: ({ id, model, baseModel }: AddressContext) =>
    id && model
      ? update(id, model, baseModel, service.clientId).then(raw =>
          raw ? mapAddress(raw) : undefined
        )
      : Promise.reject(
          new DetailedError(
            useI18n().t("error.client_address_not_available"),
            responseCodes.No_Content,
            ErrorOrigin.Headless,
            { id, model }
          )
        )
});

export default createClientAddressServices;
