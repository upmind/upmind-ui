/** @internal */
import { useFeedback } from "../feedback";
import { useQuery, invalidateQueryByKey } from "../query";
import { useI18n } from "../system-localisation";
import { mapIPhone, mapPhones } from "./client-phone-dry.mappers";
import { CLIENT_PHONE_DRY_QUERY_KEY_BASE } from "./client-phone-dry.types";
import { getStaffToken } from "./client-phone-dry.utils";
import { useTime, NotAuthenticatedError, DEBOUNCE_DELAY } from "../../utils";
import type { QueryParams } from "../query";
import type { ScopeContext } from "../scope";
import type {
  Phone,
  PhoneModel,
  ClientPhoneDryServices,
  MutationErrorLike
} from "./client-phone-dry.types";
import type { IPhone } from "@upmind-automation/types";

// -----------------------------------------------------------------------------
/**
 * @module client-phone-dry/services.staff
 * @description Staff-on-behalf-of retarget (D1, design.md §3) — Cell B
 * overrides the shared client-path list + every mutation to the legacy admin
 * endpoint, authenticated with the STAFF session token (never the
 * active-session default, never an acting-as header — the admin URL path IS
 * the identity transport in this codebase).
 *
 * WARNING: do not import directly. Resolve via `client-phone-dry.services.ts`
 * only.
 */

/** Extends the shared base key — never a parallel one (queryKey collision). */
const staffQueryKey = [...CLIENT_PHONE_DRY_QUERY_KEY_BASE, "admin"];

function targetId(scopeContext?: ScopeContext): string | undefined {
  return scopeContext?.id;
}

/**
 * OVERRIDING MEMBER — same key as `client-phone-dry.services.ts`'s shared
 * `loadList`.
 * @decision
 * what: this arm reads `admin/clients/{scopeContext.id}/phones` (the
 *   `.for('client', id)` TARGET, never `useActiveSession()`'s own client id)
 *   and authenticates with the STAFF session token selected from
 *   `staffSessions`, not the active-session default.
 * why: legacy sends staff to a distinct admin endpoint keyed on the target
 *   client (`vue-app/src/store/modules/data/clients/phones.ts:17`); headless
 *   already transports staff-target this way
 *   (`auth/auth.services.staff.ts:62`); under multi-session the active
 *   session may be a client session, so the active-default token would
 *   silently authenticate as the wrong actor. Shared does A (`clients/{id}` +
 *   active token); this arm does A's shape with B's target + identity
 *   (admin path + staff token) — the FE-2824 drop this smoke test closes.
 * rejected: the query template's shared same-`clients/{id}` resolution
 *   (`templates/query/{module}.services.ts:68-77`) — legacy uses a different
 *   endpoint + token for staff, so a shared read cannot express Cell B
 *   without a clause-4 branch (design.md §3.3).
 */
function loadList(
  params: Partial<QueryParams<IPhone[], Phone[]>> = {
    pagination: { limit: 0 }
  },
  scopeContext?: ScopeContext
) {
  const { list, useUrl } = useQuery();
  const id = targetId(scopeContext);
  const token = getStaffToken();

  return list<IPhone[], Phone[]>({
    ...params,
    queryKey: [...staffQueryKey, { client: id }],
    // D4 — `with_staged_imports=1` carried here too: this arm re-authors
    // `loadList` entirely, so the shared list's own param is not inherited
    // for free (design.md §4).
    url: useUrl(`admin/clients/${id}/phones`, { with_staged_imports: 1 }),
    withAccessToken: token?.access_token,
    guard: async () =>
      new Promise((resolve, reject) => {
        if (token?.access_token && id) {
          resolve(true);
        } else {
          reject(new NotAuthenticatedError());
        }
      }),
    select: mapPhones,
    staleTime: useTime().DAY,
    retryDelay: DEBOUNCE_DELAY,
    enabled: () => !!token?.access_token && !!id
  });
}

/**
 * OVERRIDING MEMBER — same key as the shared `add`.
 * @decision
 * what: posts to `admin/clients/{scopeContext.id}/phones` with the staff
 *   token.
 * why: same retarget as `loadList` — a create issued as staff must land on
 *   the target client's record via the admin path, under the staff identity.
 * rejected: same as `loadList` above.
 */
function add(
  data: PhoneModel,
  scopeContext?: ScopeContext
): Promise<IPhone | undefined> {
  const { post, useUrl } = useQuery();
  const id = targetId(scopeContext);

  return post<IPhone>({
    mutationKey: ["client-phone-dry", "phones", "admin", "add"],
    url: useUrl(`admin/clients/${id}/phones`),
    data: mapIPhone(data),
    withAccessToken: getStaffToken()?.access_token
  }).then(invalidateQueryByKey(staffQueryKey, { exact: false }));
}

/**
 * OVERRIDING MEMBER — same key as the shared `update`.
 * @decision
 * what: puts to `admin/clients/{scopeContext.id}/phones/{id}` with the staff
 *   token.
 * why: same retarget as `loadList`/`add`.
 * rejected: same as `loadList` above.
 */
function update(
  id: Phone["id"],
  data: PhoneModel,
  scopeContext?: ScopeContext
): Promise<IPhone | undefined> {
  const { put, useUrl } = useQuery();
  const clientId = targetId(scopeContext);

  return put<IPhone>({
    mutationKey: ["client-phone-dry", "phones", "admin", id],
    url: useUrl(`admin/clients/${clientId}/phones/${id}`),
    data: mapIPhone(data),
    withAccessToken: getStaffToken()?.access_token
  }).then(invalidateQueryByKey(staffQueryKey, { exact: false }));
}

/**
 * OVERRIDING MEMBER — same key as the shared `remove`.
 * @decision
 * what: deletes `admin/clients/{scopeContext.id}/phones/{phoneId}` with the
 *   staff token.
 * why: same retarget as `loadList`/`add`/`update`.
 * rejected: same as `loadList` above.
 */
function remove(phoneId: Phone["id"], scopeContext?: ScopeContext) {
  const { t } = useI18n();
  const { mutate, useUrl } = useQuery();
  const clientId = targetId(scopeContext);

  return mutate<null>("DELETE", {
    url: useUrl(`admin/clients/${clientId}/phones/${phoneId}`),
    onError(error: unknown) {
      const err = error as MutationErrorLike | undefined;
      useFeedback().addError({
        title: err?.title || t("error.client_phone_delete_failed"),
        copy: err?.message,
        data: err?.data
      });
    },
    onSuccess(data) {
      invalidateQueryByKey(staffQueryKey, { exact: false })(data);
      useFeedback().addSuccess(t("confirm.phone_removed"));
    },
    withAccessToken: getStaffToken()?.access_token
  });
}

/**
 * OVERRIDING MEMBER — same key as the shared `setDefault`.
 * @decision
 * what: puts `admin/clients/{scopeContext.id}/phones/{phoneId}` with the
 *   staff token.
 * why: same retarget as the other mutations.
 * rejected: same as `loadList` above.
 */
function setDefault(phoneId: Phone["id"], scopeContext?: ScopeContext) {
  const { t } = useI18n();
  const { mutate, useUrl } = useQuery();
  const clientId = targetId(scopeContext);

  return mutate<IPhone>("PUT", {
    url: useUrl(`admin/clients/${clientId}/phones/${phoneId}`),
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
      invalidateQueryByKey(staffQueryKey, { exact: false })(data);
      useFeedback().addSuccess(t("confirm.phone_set_default"));
    },
    withAccessToken: getStaffToken()?.access_token
  });
}

// -----------------------------------------------------------------------------
// Factory Export

export function createStaffClientPhoneDryServices(
  scopeContext?: ScopeContext
): Partial<ClientPhoneDryServices> {
  return {
    loadList: params => loadList(params, scopeContext),
    add: model => add(model, scopeContext),
    update: (id, model) => update(id, model, scopeContext),
    remove: phoneId => remove(phoneId, scopeContext),
    setDefault: phoneId => setDefault(phoneId, scopeContext)
  };
}

export type StaffClientPhoneDryServices = ReturnType<
  typeof createStaffClientPhoneDryServices
>;
