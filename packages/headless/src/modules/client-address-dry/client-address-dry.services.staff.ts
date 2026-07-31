/** @internal */
import { useFeedback } from "../feedback";
import { useQuery, invalidateQueryByKey } from "../query";
import { useI18n } from "../system-localisation";
import { mapAddresses, mapIAddressData } from "./client-address-dry.mappers";
import { CLIENT_ADDRESS_DRY_QUERY_KEY_BASE } from "./client-address-dry.types";
import { getStaffToken } from "./client-address-dry.utils";
import { useTime, NotAuthenticatedError, DEBOUNCE_DELAY } from "../../utils";
import type { QueryParams } from "../query";
import type { ScopeContext } from "../scope";
import type {
  Address,
  AddressModel,
  ClientAddressDryServices,
  MutationErrorLike
} from "./client-address-dry.types";
import type { IAddress } from "@upmind-automation/types";

// -----------------------------------------------------------------------------
/**
 * @module client-address-dry/services.staff
 * @description Staff-on-behalf-of retarget (D-ADDR-1, design.md §3.1) — Cell
 * 2 overrides the shared client-path list + every mutation to the legacy
 * admin endpoint, authenticated with the STAFF session token (never the
 * active-session default, never an acting-as header — the admin URL path IS
 * the identity transport in this codebase). Mirrors the shipped
 * `client-phone-dry.services.staff.ts`.
 *
 * WARNING: do not import directly. Resolve via `client-address-dry.services.ts`
 * only.
 */

/** Extends the shared base key — never a parallel one (queryKey collision). */
const staffQueryKey = [...CLIENT_ADDRESS_DRY_QUERY_KEY_BASE, "admin"];

function targetId(scopeContext?: ScopeContext): string | undefined {
  return scopeContext?.id;
}

/**
 * OVERRIDING MEMBER — same key as `client-address-dry.services.ts`'s shared
 * `loadList`.
 * @decision
 * what: this arm reads `admin/clients/{scopeContext.id}/addresses` (the
 *   `.for('client', id)` TARGET, never `useActiveSession()`'s own client id)
 *   and authenticates with the STAFF session token selected from
 *   `staffSessions`, not the active-session default.
 * why: legacy sends staff to a distinct admin endpoint keyed on the target
 *   client (`vue-app/src/store/modules/data/clients/addresses.ts:17,20`);
 *   headless already transports staff-target this way
 *   (`auth/auth.services.staff.ts:62`, and the shipped
 *   `client-phone-dry.services.staff.ts`); under multi-session the active
 *   session may be a client session, so the active-default token would
 *   silently authenticate as the wrong actor. Shared does A (`clients/{id}` +
 *   active token); this arm does A's shape with B's target + identity (admin
 *   path + staff token) — the FE-2824 drop this smoke test closes.
 * rejected: the query template's shared same-`clients/{id}` resolution
 *   (`templates/query/{module}.services.ts`) — legacy uses a different
 *   endpoint + token for staff, so a shared read cannot express Cell 2
 *   without a clause-4 branch (design.md §3.3).
 */
function loadList(
  params: Partial<QueryParams<IAddress[], Address[]>> = {
    pagination: { limit: 0 }
  },
  scopeContext?: ScopeContext
) {
  const { list, useUrl } = useQuery();
  const id = targetId(scopeContext);
  const token = getStaffToken();

  return list<IAddress[], Address[]>({
    ...params,
    queryKey: [...staffQueryKey, { client: id }],
    // D-ADDR-4 — `with_staged_imports=1` carried here too: this arm
    // re-authors `loadList` entirely, so the shared list's own param is not
    // inherited for free (design.md §4).
    url: useUrl(`admin/clients/${id}/addresses`, {
      with: ["region", "country"].join(),
      with_staged_imports: 1
    }),
    withAccessToken: token?.access_token,
    guard: async () =>
      new Promise((resolve, reject) => {
        if (token?.access_token && id) {
          resolve(true);
        } else {
          reject(new NotAuthenticatedError());
        }
      }),
    select: mapAddresses,
    staleTime: useTime().DAY,
    retryDelay: DEBOUNCE_DELAY,
    enabled: () => !!token?.access_token && !!id
  });
}

/**
 * OVERRIDING MEMBER — same key as the shared `add`.
 * @decision
 * what: posts to `admin/clients/{scopeContext.id}/addresses` with the staff
 *   token.
 * why: same retarget as `loadList` — a create issued as staff must land on
 *   the target client's record via the admin path, under the staff identity.
 * rejected: same as `loadList` above.
 */
function add(
  data: AddressModel,
  scopeContext?: ScopeContext
): Promise<IAddress | undefined> {
  const { post, useUrl } = useQuery();
  const id = targetId(scopeContext);

  return post<IAddress>({
    mutationKey: ["client-address-dry", "addresses", "admin", "add"],
    url: useUrl(`admin/clients/${id}/addresses`),
    data: mapIAddressData(data),
    withAccessToken: getStaffToken()?.access_token
  }).then(invalidateQueryByKey(staffQueryKey, { exact: false }));
}

/**
 * OVERRIDING MEMBER — same key as the shared `update`.
 * @decision
 * what: puts to `admin/clients/{scopeContext.id}/addresses/{id}` with the
 *   staff token.
 * why: same retarget as `loadList`/`add`.
 * rejected: same as `loadList` above.
 */
function update(
  id: Address["id"],
  data: AddressModel,
  scopeContext?: ScopeContext
): Promise<IAddress | undefined> {
  const { put, useUrl } = useQuery();
  const clientId = targetId(scopeContext);

  return put<IAddress>({
    mutationKey: ["client-address-dry", "addresses", "admin", id],
    url: useUrl(`admin/clients/${clientId}/addresses/${id}`),
    data: mapIAddressData(data),
    withAccessToken: getStaffToken()?.access_token
  }).then(invalidateQueryByKey(staffQueryKey, { exact: false }));
}

/**
 * OVERRIDING MEMBER — same key as the shared `remove`.
 * @decision
 * what: deletes `admin/clients/{scopeContext.id}/addresses/{addressId}` with
 *   the staff token.
 * why: same retarget as `loadList`/`add`/`update`.
 * rejected: same as `loadList` above.
 */
function remove(addressId: Address["id"], scopeContext?: ScopeContext) {
  const { t } = useI18n();
  const { mutate, useUrl } = useQuery();
  const clientId = targetId(scopeContext);

  return mutate<null>("DELETE", {
    url: useUrl(`admin/clients/${clientId}/addresses/${addressId}`),
    onError(error: unknown) {
      const err = error as MutationErrorLike | undefined;
      useFeedback().addError({
        title: err?.title || t("error.client_address_update_failed"),
        copy: err?.message,
        data: err?.data
      });
    },
    onSuccess(data) {
      invalidateQueryByKey(staffQueryKey, { exact: false })(data);
      useFeedback().addSuccess(t("confirm.address_removed"));
    },
    withAccessToken: getStaffToken()?.access_token
  });
}

/**
 * OVERRIDING MEMBER — same key as the shared `setDefault`.
 * @decision
 * what: puts `admin/clients/{scopeContext.id}/addresses/{addressId}` with the
 *   staff token.
 * why: same retarget as the other mutations.
 * rejected: same as `loadList` above.
 */
function setDefault(addressId: Address["id"], scopeContext?: ScopeContext) {
  const { t } = useI18n();
  const { mutate, useUrl } = useQuery();
  const clientId = targetId(scopeContext);

  return mutate<IAddress>("PUT", {
    url: useUrl(`admin/clients/${clientId}/addresses/${addressId}`),
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
      invalidateQueryByKey(staffQueryKey, { exact: false })(data);
      useFeedback().addSuccess(t("confirm.address_set_default"));
    },
    withAccessToken: getStaffToken()?.access_token
  });
}

// -----------------------------------------------------------------------------
// Factory Export

export function createStaffClientAddressDryServices(
  scopeContext?: ScopeContext
): Partial<ClientAddressDryServices> {
  return {
    loadList: params => loadList(params, scopeContext),
    add: model => add(model, scopeContext),
    update: (id, model) => update(id, model, scopeContext),
    remove: addressId => remove(addressId, scopeContext),
    setDefault: addressId => setDefault(addressId, scopeContext)
  };
}

export type StaffClientAddressDryServices = ReturnType<
  typeof createStaffClientAddressDryServices
>;
