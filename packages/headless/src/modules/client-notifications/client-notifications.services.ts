/** @internal */
// -----------------------------------------------------------------------------
/**
 * @module client-notifications/client-notifications.services
 * @description The one services file both halves consume — the collection's
 * three reads (topics, channels, opt-outs) and the manager's full-set PUT,
 * plus the shared `dataManagerMachine` services adapter. All three reads use
 * `list()`, never `query()`: `query()` cannot send `limit: 0` to the wire, so
 * a truncated opt-out set would render missing rows as enabled.
 *
 * WARNING: do not import directly from another module — resolve via
 * `useClientNotifications.ts` / `useClientNotificationsManager.ts`
 * (`@internal/no-cross-module-imports`).
 */

import { computed } from "vue";
import { invalidateQueryByKey, useQuery } from "../query";
import { resolveClientId, useActiveSession } from "../session-store";
import { useI18n } from "../system-localisation";
import {
  getLockedTopicIds,
  isTopicFullySelected,
  mapChannels,
  mapOptOuts,
  mapTopics,
  preferenceKey,
  SELECT_ALL_CHANNEL_ID,
  toOptOutRequestRows,
  toPreferencesModel
} from "./client-notifications.mappers";
import { useQuerySchema } from "./client-notifications.schemas";
import {
  DEBOUNCE_DELAY,
  DetailedError,
  ErrorOrigin,
  NotAuthenticatedError,
  responseCodes,
  useModelParser,
  useTime,
  useValidation
} from "../../utils";
import { each, isEmpty } from "lodash-es";
import type {
  NotificationChannel,
  NotificationsContext,
  NotificationsLookups,
  NotificationsManagerMachineServices,
  NotificationsModel,
  NotificationsServices,
  NotificationTopic,
  OptOut,
  OptOutRequestRow
} from "./client-notifications.types";
import type { ScopeActorTypes, ScopeConfig } from "../scope";
import type {
  INotificationChannel,
  INotificationTopic,
  IOptOut
} from "@upmind-automation/types";
import type { ComputedRef } from "vue";
import type { AnyEventObject } from "xstate";
// -----------------------------------------------------------------------------
// Cache keys — one per resource. `topics` and `channels` are brand-agnostic
// reference data, shared unsalted. `opt-outs` is per-identity and MUST be
// salted on both `client` and `token`: the scope key namespaces the composable
// registry, not the TanStack cache, which serves on queryKey equality alone —
// unsalted, one identity would be served another's opt-out set. Both limbs are
// needed: `client` alone collides token-vs-token on `undefined`, `token` alone
// collides two signed-in clients on absent.

/**
 * Exported for `useClientNotifications.internals.ts`'s diagnostic `query`
 * projection ONLY (`design.md` §D14). Deliberately the STABLE PREFIX, never
 * the identity-salted key `loadOptOuts` actually queries on — the salt
 * carries the link token, and a diagnostic surface must not become a
 * second door the token reaches (AC-18, `design.md` §D19).
 */
export const TOPICS_QUERY_KEY = ["notifications", "topics"] as const;
export const CHANNELS_QUERY_KEY = ["notifications", "channels"] as const;
export const OPT_OUTS_QUERY_KEY = ["notifications", "opt-outs"] as const;

/**
 * The one actor-blind addressability predicate — resolved by `config.id` (the
 * link token) or an authenticated `clientId`, never by `actorScope`. `clientId`
 * is the one identity seam's resolved ref (`resolveClientId`), never a second
 * session read.
 */
function useIsAddressable(
  token: string | undefined,
  clientId: ComputedRef<string | undefined>
) {
  const { isAuthenticated } = useActiveSession().useMeta();

  return computed(() => !!token || (isAuthenticated.value && !!clientId.value));
}

/**
 * COLLECTION + MANAGER — the full topic list. `limit: 0` via the shared
 * criteria schema (ruling B); gated by the shared addressability predicate so
 * an unauthenticated client with no link reads nothing (AC-8's guard scenario).
 */
function loadTopics(isAddressable: ReturnType<typeof useIsAddressable>) {
  const { list, useUrl } = useQuery();

  return list<INotificationTopic[], NotificationTopic[]>({
    criteria: { schema: useQuerySchema() },
    queryKey: [...TOPICS_QUERY_KEY],
    url: useUrl("notifications/topics"),
    guard: async () => {
      if (!isAddressable.value) throw new NotAuthenticatedError();
      return true;
    },
    withAccessToken: true,
    select: mapTopics,
    staleTime: useTime().DAY,
    retryDelay: DEBOUNCE_DELAY,
    enabled: () => isAddressable.value
  });
}

/**
 * COLLECTION + MANAGER — the full client-recipient channel list. The
 * recipient-type filter is a SERVER-FIXED constant, so it rides `useUrl`'s
 * params — URL scoping, never criteria (§D2a); a server-fixed constant is not
 * request state a consumer can change.
 */
function loadChannels(isAddressable: ReturnType<typeof useIsAddressable>) {
  const { list, useUrl } = useQuery();

  return list<INotificationChannel[], NotificationChannel[]>({
    criteria: { schema: useQuerySchema() },
    queryKey: [...CHANNELS_QUERY_KEY],
    url: useUrl("notifications/channels", {
      "filter[recipient_types.code]": "client"
    }),
    guard: async () => {
      if (!isAddressable.value) throw new NotAuthenticatedError();
      return true;
    },
    withAccessToken: true,
    select: mapChannels,
    staleTime: useTime().DAY,
    retryDelay: DEBOUNCE_DELAY,
    enabled: () => isAddressable.value
  });
}

/**
 * COLLECTION + MANAGER — the full opt-out set (defect F5 fix — the oracle
 * passes no pagination here at all). The link token rides the URL, off
 * `config.id` (§D4); `withAccessToken: !token` is the oracle's own transport
 * split (AC-8).
 */
function loadOptOuts(
  isAddressable: ReturnType<typeof useIsAddressable>,
  clientId: NotificationsServices["clientId"],
  token?: string
) {
  const { list, useUrl } = useQuery();
  const url = useUrl("notifications/opt-outs");
  if (token) url.searchParams.set("token", token);

  return list<IOptOut[], OptOut[]>({
    criteria: { schema: useQuerySchema() },
    queryKey: [...OPT_OUTS_QUERY_KEY, { client: clientId, token }],
    url,
    guard: async () => {
      if (!isAddressable.value) throw new NotAuthenticatedError();
      return true;
    },
    withAccessToken: !token,
    select: mapOptOuts,
    staleTime: useTime().DAY,
    retryDelay: DEBOUNCE_DELAY,
    enabled: () => isAddressable.value
  });
}

/**
 * MANAGER — the full-set PUT (AC-3). Carries EVERY currently-opted-out row,
 * never a diff — the oracle's own write shape. Takes the wire body's OWN row
 * type directly: the boolean-record -> wire-row projection has already run
 * (`writeOptOuts`, defect F2, `design.md` §D13). Token transport mirrors the
 * read (§D4, AC-8).
 */
async function update(
  rows: OptOutRequestRow[],
  clientId: NotificationsServices["clientId"],
  token?: string
): Promise<void> {
  const { put, useUrl } = useQuery();
  const url = useUrl("notifications/opt-outs");
  if (token) url.searchParams.set("token", token);

  await put({
    mutationKey: [...OPT_OUTS_QUERY_KEY, { client: clientId, token }],
    url,
    data: { opt_outs: rows },
    withAccessToken: !token
  });
}

/**
 * SHARED — invalidates THIS identity's opt-outs entry so the collection
 * refetches. Salted to match the read: an unsalted prefix invalidation would
 * evict every other identity's entry too and stampede their refetches.
 */
async function refresh(
  clientId: NotificationsServices["clientId"],
  token?: string
): Promise<void> {
  await invalidateQueryByKey(
    [...OPT_OUTS_QUERY_KEY, { client: clientId, token }],
    {
      exact: false
    }
  )(undefined);
}

// -----------------------------------------------------------------------------
// Services Factory — armless (§D10): no `.{actor}.ts` sibling, no
// `scopedServices()` actor `case`. The token/session divergence keys on
// `config.id` (the link token), never on `actorScope`.

/**
 * Services factory — serves both halves. `config.id` carries the link token;
 * `clientId` resolves through the shared `resolveClientId` seam, never
 * a direct `activeUser` read. This module declares no context, so `.for()`
 * stays unspellable and the predicate stays actor-blind.
 */
export const createClientNotificationsServices = (
  _actorScope: ScopeActorTypes,
  config: ScopeConfig
): NotificationsServices => {
  const token = config.id;
  const clientId = resolveClientId(config.context);
  const isAddressable = useIsAddressable(token, clientId);

  return {
    clientId,
    /** Sibling contract name (`parity.yaml` row `predicate-naming`) — the LOCAL `isAddressable` unchanged. */
    isAvailable: isAddressable,
    loadTopics: () => loadTopics(isAddressable),
    loadChannels: () => loadChannels(isAddressable),
    loadOptOuts: () => loadOptOuts(isAddressable, clientId, token),
    update: rows => update(rows, clientId, token),
    refresh: () => refresh(clientId, token)
  };
};

export default createClientNotificationsServices;

// -----------------------------------------------------------------------------
// Machine-Ready Services (manager half)

/**
 * Rejects when the aggregate has no model to write — never reachable in
 * normal operation (the machine only invokes `add`/`update` once `validate`
 * has resolved a model), kept only because a rejected model must never reach
 * `service.update` silently.
 */
function requireModel(context: NotificationsContext): NotificationsModel {
  if (isEmpty(context.model)) {
    throw new DetailedError(
      "Notification preferences not available",
      responseCodes.No_Content,
      ErrorOrigin.Headless,
      { model: context.model }
    );
  }
  return context.model as NotificationsModel;
}

/**
 * The full-set PUT then a cache invalidation, resolving the just-saved model
 * (never `void`) so `setModel`'s onDone keeps the persisted value rather than
 * reverting to the stale `baseModel`. Projects the flat boolean record to the
 * wire body here, two-sided against `baseModel`: a locked-topic row already
 * held server-side survives, a newly-flipped one never reaches the wire.
 */
async function writeOptOuts(
  context: NotificationsContext,
  service: NotificationsServices
): Promise<NotificationsModel> {
  const model = requireModel(context);
  const lockedTopicIds = getLockedTopicIds(context.lookups?.topics);
  const baseModel = context.baseModel as NotificationsModel | undefined;
  await service.update(
    toOptOutRequestRows(
      model.preferences,
      lockedTopicIds,
      baseModel?.preferences
    )
  );
  await service.refresh();
  return model;
}

/**
 * Adapts the ALREADY-SCOPED services object into the XState services map the
 * shared `dataManagerMachine` invokes. The adapter takes `service` as an
 * argument rather than minting its own — the scope (and therefore the link
 * token or the session's own client) is resolved ONCE in
 * `useClientNotificationsManager.ts` and threaded in.
 * @internal
 */
export const useClientNotificationsManagerServices = (
  service: NotificationsServices,
  topicsQuery: ReturnType<NotificationsServices["loadTopics"]>,
  channelsQuery: ReturnType<NotificationsServices["loadChannels"]>,
  optOutsQuery: ReturnType<NotificationsServices["loadOptOuts"]>
): NotificationsManagerMachineServices => ({
  /**
   * `loading` — awaits all three reads settled, then seeds `lookups` and
   * seeds `model`/`baseModel` from the opt-out set so `isDirty` reads false
   * from the first tick. The queries are threaded in already minted, never
   * minted here: `loading` is re-entered on every `REFRESH`, and re-minting a
   * query observer each time is an uncapped-observer stall. A fetched query is
   * refetched; a pending one is awaited on its own `promise`.
   */
  loadLookups: async (): Promise<Partial<NotificationsContext>> => {
    await Promise.all([
      topicsQuery.isFetched.value
        ? topicsQuery.refetch()
        : topicsQuery.promise.value,
      channelsQuery.isFetched.value
        ? channelsQuery.refetch()
        : channelsQuery.promise.value,
      optOutsQuery.isFetched.value
        ? optOutsQuery.refetch()
        : optOutsQuery.promise.value
    ]);

    const topics = topicsQuery.data.value ?? [];
    const channels = channelsQuery.data.value ?? [];
    const optOuts = optOutsQuery.data.value ?? [];
    const model = toPreferencesModel(topics, channels, optOuts);

    return { lookups: { topics, channels }, model, baseModel: model };
  },

  /**
   * `available.checking.parsing` — schema-parse the SET payload, falling back
   * to `baseModel` as the value when the event carries no data.
   *
   * @decision
   * what:     `data?.model ?? data ?? baseModel` is `useModelParser`'s
   *           `values`; `baseModel` is never the merged third argument.
   * why:      Re-entered with no event data; without the fallback the empty
   *           payload parses to the schema default instead of the saved state.
   *           Every `SET` already carries every key, so nothing needs merging.
   * rejected: The third-argument merge — needless, and could reintroduce a
   *           stale key if the field set changed shape.
   *
   * @decision
   * what:     Each topic's bulk sentinel is recomputed from
   *           `isTopicFullySelected`, overwriting the payload value.
   * why:      Keeps the `isAllSelected` readout honest across a per-channel
   *           toggle that never touches the sentinel key.
   * rejected: Trusting the payload's sentinel — stale once a channel toggles.
   */
  parse: async (
    { schema, baseModel, lookups }: NotificationsContext,
    { data }: AnyEventObject
  ): Promise<Partial<NotificationsContext>> => {
    const parsed = useModelParser<NotificationsModel>(
      schema,
      data?.model ?? data ?? baseModel
    );
    const { topics = [], channels = [] } =
      (lookups as NotificationsLookups | undefined) ?? {};
    const preferences = { ...parsed.preferences };
    each(topics, topic => {
      preferences[preferenceKey(topic.id, SELECT_ALL_CHANNEL_ID)] =
        isTopicFullySelected(preferences, channels, topic.id);
    });

    return { model: { ...parsed, preferences } };
  },

  /**
   * `available.checking.validating` + `processing.validating` — schema
   * validation only: reject with a `DetailedError` carrying the AJV errors,
   * resolve otherwise.
   *
   * @decision
   * what:     Schema validation only, NOT the locked-topic guard.
   * why:      Both invoke sites' `onDone` carry no `actions`, so the machine
   *           consults this function's settlement, never its value — a filter
   *           returned here never reaches `writeOptOuts`. The guard lives at
   *           `useClientNotificationsManager.actions.ts`'s `update()`.
   * rejected: A dead filter documented as a defence the machine never consults.
   */
  validate: async ({
    schema,
    model
  }: NotificationsContext): Promise<NotificationsModel | undefined> => {
    if (!schema) return model;

    const { t } = useI18n();
    const { validate: validateAgainstSchema } = useValidation();

    return new Promise((resolve, reject) => {
      const errors = validateAgainstSchema(schema, model);
      if (errors?.length) {
        reject(
          new DetailedError(
            t("error.client_notifications_validation_failed"),
            responseCodes.Unprocessable_Entity,
            ErrorOrigin.Headless,
            errors
          )
        );
      } else {
        resolve(model);
      }
    });
  },

  /**
   * `processing.adding` — unreachable in normal operation (§D3 delta 2 seeds
   * `id: OPT_OUTS_AGGREGATE_ID`, so `isNew` is always false). Delegates to the
   * same PUT as `update` only because the shared machine's services map
   * requires the key to exist.
   */
  add: (context: NotificationsContext) => writeOptOuts(context, service),

  /** `processing.updating` — always reached (§D3 delta 2). The full-set PUT. */
  update: (context: NotificationsContext) => writeOptOuts(context, service)
});
