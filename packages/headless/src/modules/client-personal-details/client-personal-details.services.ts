/** @internal */
import { computed, ref } from "vue";
import { useBrand } from "../brand";
import { mapClientRecord } from "../client";
import {
  ClientCustomFieldsContextTypes,
  mapCustomFieldValues,
  useClientCustomFields
} from "../client-custom-fields";
import { invalidateQueryByKey, resetQueryByKey, useQuery } from "../query";
import { ScopeActorTypes } from "../scope/scope.types";
import { useActiveSession } from "../session-store";
import { useI18n, useLocale } from "../system-localisation";
import { mapIProfileFields } from "./client-personal-details.mappers";
import { useSchema } from "./client-personal-details.schemas";
import { ClientPersonalDetailsContextTypes } from "./client-personal-details.types";
import {
  ErrorOrigin,
  compactDeep,
  useValidation,
  DetailedError,
  responseCodes,
  useModelParser,
  mapToHeadlessError,
  NotAuthenticatedError,
  useTime
} from "../../utils";
import { get, isEmpty } from "lodash-es";
import type { ScopeContext } from "../scope";
import type {
  ClientPersonalDetailsMachineServices,
  ClientPersonalDetailsServices,
  ProfileContext,
  ProfileModel
} from "./client-personal-details.types";
import type { ClientRecord } from "../client";
import type { QueryKey } from "@tanstack/vue-query";
import type { IClient } from "@upmind-automation/types";
import type { Ref } from "vue";
// -----------------------------------------------------------------------------
/**
 * @module client-personal-details/client-personal-details.services
 * @description The editor's lookups/parse/validate/update and the XState
 * adapter the shared `dataManagerMachine` invokes. This module owns its own
 * client read — `clients/{id}?with=custom_fields,custom_fields.field` under its
 * own key, mapped by the one `client` mapper — the custom-field slice only,
 * never a sibling's fields. No private `select`, no raw `request()` bypass.
 *
 * WARNING: Do not import directly from another module. Resolve via
 * `usePersonalDetails.ts` / the barrel only (`@internal/no-cross-module-imports`).
 */
// -----------------------------------------------------------------------------

/** The module's base cache key prefix. */
export const queryKey: QueryKey = ["client"];

/** This module's own client-record read key — its custom-field slice, never shared with a sibling. */
function recordQueryKey(clientId?: string): QueryKey {
  return ["client", clientId, "record"];
}

/** This module's own client-record read — the custom-field slice, mapped by the one client mapper. */
function loadProfileRecord(clientId: string): Promise<ClientRecord> {
  const { get: getRecord, useUrl } = useQuery();

  return getRecord<IClient, ClientRecord>({
    url: useUrl(`clients/${clientId}`, {
      with: "custom_fields,custom_fields.field"
    }),
    queryKey: recordQueryKey(clientId),
    select: mapClientRecord,
    withAccessToken: true,
    withoutLocale: true,
    staleTime: useTime().DAY
  });
}

/**
 * Derives the target client id from the RESOLVED scope — the ONE seam every
 * request-issuing function in this file shares. A `.for('client', id)` context
 * names the client being addressed; with none it falls back to the active
 * session's own client (the self case).
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

/** Resolves true only for an authenticated session with an addressable client. */
function isAddressable(clientId?: string): boolean {
  const { isAuthenticated } = useActiveSession().useMeta();

  return isAuthenticated.value && !!clientId;
}

/**
 * MANAGER — `loading`'s context patch. Awaits A's bounded, error-settling
 * readiness for the custom-field definitions and the `client` module's shared
 * record read for the native/custom values. The record lands in `record` — the
 * merge base `update()` writes the `meta` bag back against.
 */
async function loadLookups(
  context: ProfileContext,
  scopeContext: ScopeContext | undefined,
  record: Ref<ClientRecord | undefined>
): Promise<Partial<ProfileContext>> {
  const clientId = resolveClientId(scopeContext);

  if (!isAddressable(clientId.value)) {
    return Promise.reject(new NotAuthenticatedError());
  }

  const { languages } = useBrand();
  const customFieldsScope = useClientCustomFields()
    .as(ScopeActorTypes.CLIENT)
    .for(ClientCustomFieldsContextTypes.CLIENT, clientId.value as string);
  const { isReady } = customFieldsScope.useActions();
  const { data: definitions } = customFieldsScope.useContext();

  const [, clientRecord] = await Promise.all([
    isReady(),
    loadProfileRecord(clientId.value as string)
  ]);
  record.value = clientRecord;

  // Compacted the same way `parse()`'s `useModelParser` compacts `model`, so a
  // revert (which round-trips `baseModel` through that same pipeline) stays
  // `isEqual` and `isDirty` reads false on load.
  const baseModel = compactDeep(
    {
      firstName: clientRecord.firstName,
      lastName: clientRecord.lastName,
      publicName: clientRecord.publicName,
      language: clientRecord.language,
      // `useModelParser` casts an unset boolean to `false` on every parse, so
      // the diff floor must hold the same value or the toggle reads dirty.
      excludeDelegatedProducts: clientRecord.excludeDelegatedProducts ?? false,
      customFields: mapCustomFieldValues(
        clientRecord.customFieldValues,
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
 * `available.checking.parsing` — schema-parses the SET payload, floored against
 * `baseModel`. `allowExtraProps: false` drops out-of-schema keys.
 */
async function parse(
  context: ProfileContext,
  data?: unknown
): Promise<Partial<ProfileContext>> {
  const incoming = get(data, "model", data) as Partial<ProfileModel>;

  const safeModel = useModelParser<ProfileModel>(
    context.schema,
    incoming,
    context.baseModel,
    { allowExtraProps: false }
  );

  return { model: safeModel };
}

/** Schema validation, typed against `ProfileContext`. */
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
 * Diff-only PUT. `mapIProfileFields` returns `undefined` for an empty diff. A
 * `meta` diff is merged over the held record's bag — the PUT replaces the bag
 * wholesale, so the other UI keys must ride along; with no record held it
 * rejects rather than send a bare one-key bag.
 */
async function update(
  model: ProfileModel,
  baseModel: ProfileModel = {},
  scopeContext: ScopeContext | undefined,
  record: Ref<ClientRecord | undefined>
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
      if (saved?.id) record.value = mapClientRecord(saved);
      // Follow-on side effect, never awaited into the return chain.
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

/**
 * Drops this scope's record cache AND the custom-field definitions the schema
 * validates against. The labs force handle clears only THIS module's own
 * `reset` (`useForcedState`: forcing learns no key, so the booted module hands
 * its own in), and the schema's `required` list is A's catalogue — cached under
 * A's own `["client", "customFields", …]` key, outside this module's record key.
 * Resetting the record alone leaves the live-boot catalogue standing, so an
 * armed transport's required field never reaches validation. Delegates to A's
 * own `reset` action rather than reaching into its key.
 */
function reset(scopeContext?: ScopeContext): Promise<void> {
  const clientId = resolveClientId(scopeContext);
  const { reset: resetDefinitions } = useClientCustomFields()
    .as(ScopeActorTypes.CLIENT)
    .for(ClientCustomFieldsContextTypes.CLIENT, clientId.value as string)
    .useActions();

  // `useBrand().languages` feeds the schema, so re-read the brand too.
  return Promise.all([
    resetQueryByKey(recordQueryKey(clientId.value))(),
    resetDefinitions(),
    useBrand().refresh()
  ]).then(() => undefined);
}

// -----------------------------------------------------------------------------
// Service Factory

/** Service matrix by scopeActor. This module is armless — only the `default:` case. */
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

/** Services factory — the actor and its context arrive at construction, once per scope. */
export const createClientPersonalDetailsServices = (
  scopeActor: ScopeActorTypes,
  scopeContext?: ScopeContext
): ClientPersonalDetailsServices => {
  const record = ref<ClientRecord | undefined>(undefined);
  const clientId = resolveClientId(scopeContext);

  return {
    queryKey,
    clientId,
    isAvailable: computed(() => isAddressable(clientId.value)),
    loadLookups: context => loadLookups(context, scopeContext, record),
    parse: (context, data) => parse(context, data),
    validate,
    update: (model, baseModel) =>
      update(model, baseModel, scopeContext, record),
    refresh: () => refresh(scopeContext),
    invalidate: () =>
      invalidateQueryByKey(recordQueryKey(clientId.value), { exact: false })(),
    reset: () => reset(scopeContext),
    ...scopedServices(scopeActor, scopeContext)
  };
};

// -----------------------------------------------------------------------------
// Machine-Ready Services (manager half)

/**
 * Adapts the already-scoped services object into the XState services map the
 * shared `dataManagerMachine` invokes.
 * @internal
 */
export const useClientPersonalDetailsServices = (
  service: ClientPersonalDetailsServices
): ClientPersonalDetailsMachineServices => ({
  loadLookups: context => service.loadLookups(context),

  parse: (context, event) => service.parse(context, get(event, "data")),

  validate: context => service.validate(context),

  /** `processing.adding` — never reached; a defensive rejection if the guard is ever wrong. */
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
